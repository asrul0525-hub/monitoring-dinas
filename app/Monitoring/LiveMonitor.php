<?php

namespace App\Monitoring;

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use App\Monitoring\Inspectors\BlacklistKeywordInspector;
use App\Monitoring\Parsers\ContentFreshnessParser;
use App\Monitoring\Parsers\HtmlMetaParser;
use App\Monitoring\Parsers\NextJsActionExtractor;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

class LiveMonitor implements Monitor
{
    private const TRANSIENT_HTTP_CODES = [
        408, // Request Timeout
        429, // Too Many Requests
        500, // Internal Server Error
        502, // Bad Gateway
        503, // Service Unavailable (LVE / Entry Process limit)
        504, // Gateway Timeout
        520, // Cloudflare Unknown Error
        521, // Cloudflare Web Server Is Down
        522, // Cloudflare Connection Timed Out
        523, // Cloudflare Origin Is Unreachable
        524, // Cloudflare A Timeout Occurred
    ];

    public function check(Instansi $instansi, ?CarbonInterface $at = null): Check
    {
        $checkedAt = ($at ? CarbonImmutable::instance($at) : CarbonImmutable::now())
            ->setTimezone(config('app.timezone', 'UTC'));

        $startMs = (int) round(hrtime(true) / 1_000_000);
        $attempt = $this->performSingleFetch($instansi);
        $elapsedMs = (int) round(hrtime(true) / 1_000_000) - $startMs;

        // Hanya lakukan retry pada klik satuan jika gagal karena kode HTTP transien (misal 503/502)
        // atau kegagalan koneksi cepat (< 4 detik), agar Admin tidak menunggu 2x timeout penuh saat situs mati
        $shouldRetrySingle = self::isTransientFailure($attempt['http_code'], $attempt['error'])
            && ($attempt['http_code'] !== null || $elapsedMs < 4000);

        if ($shouldRetrySingle) {
            self::waitBeforeRetry();
            $retryTimeout = max(10, (int) config('monitoring.timeout', 10));
            $retry = $this->performSingleFetch($instansi, $retryTimeout);

            if ($retry['http_code'] === 200 || $retry['http_code'] === 403 || $attempt['http_code'] === null) {
                $attempt = $retry;
            }
        }

        return $this->recordCheckResult(
            $instansi,
            $attempt['http_code'],
            $attempt['response_ms'],
            $attempt['html_body'],
            $attempt['headers'],
            $attempt['feed_body'],
            $attempt['error'],
            $checkedAt
        );
    }

    /**
     * Ambil halaman utama dan (bila sudah tersimpan) feed_url secara paralel agar waktu tunggu terpangkas separuhnya.
     *
     * @return array{
     *     http_code: ?int,
     *     response_ms: ?int,
     *     html_body: ?string,
     *     headers: array<string, mixed>,
     *     feed_body: ?string,
     *     error: ?string
     * }
     */
    public function performSingleFetch(Instansi $instansi, ?int $timeoutSeconds = null): array
    {
        $startNs = hrtime(true);

        $httpCode = null;
        $responseMs = null;
        $htmlBody = null;
        $headers = [];
        $feedBody = null;
        $error = null;

        $timeout = $timeoutSeconds ?? (int) config('monitoring.timeout', 10);
        $connectTimeout = (int) config('monitoring.connect_timeout', 5);
        $verifySsl = (bool) config('monitoring.verify_ssl', false);
        $userAgent = (string) config(
            'monitoring.user_agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        try {
            if ($instansi->feed_url) {
                $responses = Http::pool(function (Pool $pool) use ($instansi, $timeout, $connectTimeout, $verifySsl, $userAgent) {
                    $mainReq = $pool->as('main')
                        ->timeout($timeout)
                        ->connectTimeout($connectTimeout)
                        ->withUserAgent($userAgent)
                        ->withHeaders(self::defaultBrowserHeaders());

                    $feedReq = $pool->as('feed')
                        ->timeout(min(6, $timeout))
                        ->connectTimeout($connectTimeout)
                        ->withUserAgent($userAgent);

                    if (! $verifySsl) {
                        $mainReq = $mainReq->withoutVerifying();
                        $feedReq = $feedReq->withoutVerifying();
                    }

                    $mainReq->get($instansi->url);
                    $feedReq->get($instansi->feed_url);
                });

                $mainResult = $responses['main'] ?? null;
                $feedResult = $responses['feed'] ?? null;

                if ($mainResult instanceof Throwable) {
                    throw $mainResult;
                }

                if (! ($mainResult instanceof Response)) {
                    throw new \RuntimeException('Koneksi jaringan gagal');
                }

                $response = $mainResult;
                if ($feedResult instanceof Response && $feedResult->successful()) {
                    $feedBody = $feedResult->body();
                }
            } else {
                $response = $this->httpClient($timeout)->get($instansi->url);
            }

            $transferTime = $response->transferStats?->getTransferTime();
            $elapsedMs = $transferTime !== null
                ? (int) round($transferTime * 1000)
                : (int) round((hrtime(true) - $startNs) / 1_000_000);
            $httpCode = $response->status();
            $responseMs = max(1, $elapsedMs);
            $headers = $response->headers();

            if ($httpCode === 200) {
                $htmlBody = $response->body();
            } elseif ($httpCode === 403) {
                // Retry via native curl when WAF blocks default Guzzle fingerprint
                $fallback = NextJsActionExtractor::fetchCleanHtml($instansi->url);
                if ($fallback !== null) {
                    $httpCode = 200;
                    $htmlBody = $fallback;
                    $error = null;
                } else {
                    $error = 'Terproteksi WAF / CDN (HTTP 403)';
                }
            } else {
                $error = "HTTP {$httpCode}";
                $feedBody = null;
            }
        } catch (Throwable $e) {
            $httpCode = null;
            $responseMs = null;
            $error = $this->formatExceptionMessage($e);
        }

        return [
            'http_code' => $httpCode,
            'response_ms' => $responseMs,
            'html_body' => $htmlBody,
            'headers' => $headers,
            'feed_body' => $feedBody,
            'error' => $error,
        ];
    }

    public static function isTransientFailure(?int $httpCode, ?string $error): bool
    {
        if ($httpCode !== null) {
            return in_array($httpCode, self::TRANSIENT_HTTP_CODES, true);
        }

        if ($error !== null && str_contains($error, 'DNS gagal')) {
            return false;
        }

        return true;
    }

    public static function waitBeforeRetry(?int $overrideDelayMs = null): void
    {
        if (app()->runningUnitTests()) {
            return;
        }

        $delayMs = $overrideDelayMs ?? max(0, (int) config('monitoring.retry_delay_ms', 400));
        if ($delayMs > 0) {
            usleep($delayMs * 1000);
        }
    }

    /**
     * @param  array<string, mixed>  $headers
     */
    public function recordCheckResult(
        Instansi $instansi,
        ?int $httpCode,
        ?int $responseMs,
        ?string $htmlBody,
        array $headers,
        ?string $feedBody,
        ?string $error,
        ?CarbonInterface $at = null
    ): Check {
        $checkedAt = ($at ? CarbonImmutable::instance($at) : CarbonImmutable::now())
            ->setTimezone(config('app.timezone', 'UTC'));
        $freshnessDays = (int) Setting::get('freshness_days', 30);

        $contentDate = $instansi->last_content_at ? CarbonImmutable::instance($instansi->last_content_at) : null;
        $source = $instansi->content_source;
        $resolvedFeedUrl = $instansi->feed_url;
        $blacklistReason = null;

        if ($httpCode === 200) {
            $blacklistReason = BlacklistKeywordInspector::inspect($htmlBody);

            if ($blacklistReason !== null) {
                $error = $blacklistReason;
                $contentDate = null;
                $source = null;
            } else {
                $detected = ContentFreshnessParser::detectWithSource(
                    $feedBody,
                    $instansi->feed_url,
                    $htmlBody,
                    $headers
                );

                // Jika HTML halaman utama mengumumkan URL RSS/Atom baru di <head> yang berbeda dari feed_url lama,
                // atau jika belum ada tanggal yang ditemukan, jalankan auto-discovery dan perbarui feed_url otomatis.
                $discoveredInHtml = ($htmlBody !== null && trim($htmlBody) !== '')
                    ? HtmlMetaParser::discoverFeedUrls($htmlBody, $instansi->url)
                    : [];
                $hasNewerFeedUrlInHtml = $discoveredInHtml !== []
                    && $instansi->feed_url !== null
                    && ! in_array($instansi->feed_url, $discoveredInHtml, true);

                if (($detected['date'] === null || $hasNewerFeedUrlInHtml) && $htmlBody !== null && trim($htmlBody) !== '') {
                    $fallback = $this->attemptMultiLayerFallback($instansi, $htmlBody, $discoveredInHtml);
                    if ($fallback['date'] !== null) {
                        $detected = $fallback;
                        if (! empty($fallback['feed_url'])) {
                            $resolvedFeedUrl = $fallback['feed_url'];
                        }
                    }
                }

                if ($detected['date'] !== null) {
                    $contentDate = $detected['date']->setTimezone(config('app.timezone', 'UTC'));
                }
                $source = $detected['source'];
            }
        }

        $status = $blacklistReason !== null
            ? Status::TidakAktif
            : StatusCalculator::classify($httpCode, $contentDate, $checkedAt, $freshnessDays, $blacklistReason);

        $check = Check::create([
            'instansi_id' => $instansi->id,
            'checked_at' => $checkedAt,
            'http_code' => $httpCode,
            'response_ms' => $responseMs,
            'content_date' => $contentDate,
            'content_source' => ($httpCode === 200 && $blacklistReason === null) ? $source : null,
            'status' => $status,
            'error' => $error,
        ]);

        $downSince = $status === Status::TidakAktif
            ? ($instansi->status === Status::TidakAktif && $instansi->down_since !== null ? $instansi->down_since : $checkedAt)
            : null;

        $instansi->update([
            'status' => $status,
            'feed_url' => $resolvedFeedUrl,
            'last_checked_at' => $checkedAt,
            'last_content_at' => $blacklistReason !== null ? null : ($contentDate ?? $instansi->last_content_at),
            'last_response_ms' => $responseMs,
            'last_http_code' => $httpCode,
            'content_source' => $blacklistReason !== null ? null : ($httpCode === 200 ? $source : $instansi->content_source),
            'down_since' => $downSince,
        ]);

        return $check;
    }

    /**
     * @param  ?array<int, string>  $preDiscoveredUrls
     * @return array{date: ?CarbonImmutable, source: ContentSource, feed_url?: ?string}
     */
    private function attemptMultiLayerFallback(Instansi $instansi, string $htmlBody, ?array $preDiscoveredUrls = null): array
    {
        // Layer 3: Auto-discovered <link rel="alternate" type="application/rss+xml"> or sitemap in <head>
        $discoveredUrls = $preDiscoveredUrls ?? HtmlMetaParser::discoverFeedUrls($htmlBody, $instansi->url);
        foreach (array_slice($discoveredUrls, 0, 2) as $discoveredUrl) {
            try {
                $resp = $this->httpClient(4)->get($discoveredUrl);
                if ($resp->successful()) {
                    $detected = ContentFreshnessParser::detectWithSource(
                        $resp->body(),
                        $discoveredUrl,
                        null,
                        []
                    );
                    if ($detected['date'] !== null) {
                        return [
                            'date' => $detected['date'],
                            'source' => $detected['source'],
                            'feed_url' => $discoveredUrl,
                        ];
                    }
                }
            } catch (Throwable) {
                // Continue to next fallback layer
            }
        }

        // Layer 4: Next.js App Router / SPA Server Action extraction (e.g. *.bps.go.id)
        if (NextJsActionExtractor::isNextJsAppRouterPage($htmlBody)) {
            $nextDate = NextJsActionExtractor::extractLatestDate(
                $htmlBody,
                $instansi->url,
                timeout: 5,
                verifySsl: (bool) config('monitoring.verify_ssl', false)
            );
            if ($nextDate !== null) {
                return ['date' => $nextDate, 'source' => ContentSource::Dom, 'feed_url' => null];
            }
        }

        return ['date' => null, 'source' => ContentSource::Dom, 'feed_url' => null];
    }

    /**
     * @return array<string, string>
     */
    public static function defaultBrowserHeaders(): array
    {
        return [
            'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control' => 'no-cache',
            'Pragma' => 'no-cache',
            'Sec-Ch-Ua' => '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
            'Sec-Ch-Ua-Mobile' => '?0',
            'Sec-Ch-Ua-Platform' => '"Windows"',
            'Sec-Fetch-Dest' => 'document',
            'Sec-Fetch-Mode' => 'navigate',
            'Sec-Fetch-Site' => 'none',
            'Sec-Fetch-User' => '?1',
            'Upgrade-Insecure-Requests' => '1',
        ];
    }

    public function httpClient(?int $timeoutSeconds = null): PendingRequest
    {
        $timeout = $timeoutSeconds ?? (int) config('monitoring.timeout', 12);
        $connectTimeout = (int) config('monitoring.connect_timeout', 6);
        $verifySsl = (bool) config('monitoring.verify_ssl', false);
        $userAgent = (string) config(
            'monitoring.user_agent',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        );

        $request = Http::timeout($timeout)
            ->connectTimeout($connectTimeout)
            ->withUserAgent($userAgent)
            ->withHeaders(self::defaultBrowserHeaders());

        if (! $verifySsl) {
            $request = $request->withoutVerifying();
        }

        return $request;
    }

    public function formatExceptionMessage(Throwable $e): string
    {
        $msg = $e->getMessage();
        if (str_contains(strtolower($msg), 'timed out') || str_contains(strtolower($msg), 'timeout')) {
            $timeout = (int) config('monitoring.timeout', 12);

            return "Timeout {$timeout} detik";
        }

        if (str_contains(strtolower($msg), 'could not resolve host')) {
            return 'Domain tidak ditemukan (DNS gagal)';
        }

        if (str_contains(strtolower($msg), 'ssl') || str_contains(strtolower($msg), 'certificate')) {
            return 'Kendala sertifikat SSL/TLS';
        }

        return mb_substr($msg, 0, 190);
    }
}
