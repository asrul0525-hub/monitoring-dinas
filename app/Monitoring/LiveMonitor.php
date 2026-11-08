<?php

namespace App\Monitoring;

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use App\Monitoring\Parsers\ContentFreshnessParser;
use App\Monitoring\Parsers\HtmlMetaParser;
use App\Monitoring\Parsers\NextJsActionExtractor;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Throwable;

class LiveMonitor implements Monitor
{
    public function check(Instansi $instansi, ?CarbonInterface $at = null): Check
    {
        $checkedAt = ($at ? CarbonImmutable::instance($at) : CarbonImmutable::now())
            ->setTimezone(config('app.timezone', 'UTC'));
        $startNs = hrtime(true);

        $httpCode = null;
        $responseMs = null;
        $htmlBody = null;
        $headers = [];
        $feedBody = null;
        $error = null;

        try {
            $response = $this->httpClient()->get($instansi->url);
            $elapsedMs = (int) round((hrtime(true) - $startNs) / 1_000_000);
            $httpCode = $response->status();
            $responseMs = max(1, $elapsedMs);
            $headers = $response->headers();

            if ($httpCode === 200) {
                $htmlBody = $response->body();
            } elseif ($httpCode === 403) {
                // Retry via native curl HTTP/2 when WAF blocks default Guzzle fingerprint
                $fallback = NextJsActionExtractor::fetchCleanHtml($instansi->url);
                if ($fallback !== null) {
                    $httpCode = 200;
                    $htmlBody = $fallback;
                    $error = null;
                } else {
                    $error = "HTTP {$httpCode}";
                }
            } else {
                $error = "HTTP {$httpCode}";
            }

            if ($httpCode === 200 && $instansi->feed_url) {
                try {
                    $feedResp = $this->httpClient(6)->get($instansi->feed_url);
                    if ($feedResp->successful()) {
                        $feedBody = $feedResp->body();
                    }
                } catch (Throwable) {
                    // Fallback gracefully to HTML body / headers when feed endpoint fails
                }
            }
        } catch (Throwable $e) {
            $httpCode = null;
            $responseMs = null;
            $error = $this->formatExceptionMessage($e);
        }

        return $this->recordCheckResult(
            $instansi,
            $httpCode,
            $responseMs,
            $htmlBody,
            $headers,
            $feedBody,
            $error,
            $checkedAt
        );
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

        if ($httpCode === 200) {
            $detected = ContentFreshnessParser::detectWithSource(
                $feedBody,
                $instansi->feed_url,
                $htmlBody,
                $headers
            );

            // Multi-layer fallback if static HTML & configured feed did not yield a date
            if ($detected['date'] === null && $htmlBody !== null && trim($htmlBody) !== '') {
                $detected = $this->attemptMultiLayerFallback($instansi, $htmlBody);
            }

            if ($detected['date'] !== null) {
                $contentDate = $detected['date']->setTimezone(config('app.timezone', 'UTC'));
            }
            $source = $detected['source'];
        }

        $status = StatusCalculator::classify($httpCode, $contentDate, $checkedAt, $freshnessDays);

        $check = Check::create([
            'instansi_id' => $instansi->id,
            'checked_at' => $checkedAt,
            'http_code' => $httpCode,
            'response_ms' => $responseMs,
            'content_date' => $contentDate,
            'content_source' => $httpCode === 200 ? $source : null,
            'status' => $status,
            'error' => $error,
        ]);

        $downSince = $status === Status::TidakAktif
            ? ($instansi->status === Status::TidakAktif && $instansi->down_since !== null ? $instansi->down_since : $checkedAt)
            : null;

        $instansi->update([
            'status' => $status,
            'last_checked_at' => $checkedAt,
            'last_content_at' => $contentDate ?? $instansi->last_content_at,
            'last_response_ms' => $responseMs,
            'last_http_code' => $httpCode,
            'content_source' => $httpCode === 200 ? $source : $instansi->content_source,
            'down_since' => $downSince,
        ]);

        return $check;
    }

    /**
     * @return array{date: ?CarbonImmutable, source: ContentSource}
     */
    private function attemptMultiLayerFallback(Instansi $instansi, string $htmlBody): array
    {
        // Layer 3: Auto-discovered <link rel="alternate" type="application/rss+xml"> or sitemap in <head>
        $discoveredUrls = HtmlMetaParser::discoverFeedUrls($htmlBody, $instansi->url);
        foreach (array_slice($discoveredUrls, 0, 2) as $discoveredUrl) {
            try {
                $resp = $this->httpClient(5)->get($discoveredUrl);
                if ($resp->successful()) {
                    $detected = ContentFreshnessParser::detectWithSource(
                        $resp->body(),
                        $discoveredUrl,
                        null,
                        []
                    );
                    if ($detected['date'] !== null) {
                        return $detected;
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
                timeout: 6,
                verifySsl: (bool) config('monitoring.verify_ssl', false)
            );
            if ($nextDate !== null) {
                return ['date' => $nextDate, 'source' => ContentSource::Dom];
            }
        }

        return ['date' => null, 'source' => ContentSource::Dom];
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
            ->withHeaders([
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language' => 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            ]);

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
