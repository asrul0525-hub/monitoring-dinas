<?php

namespace App\Monitoring;

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use App\Monitoring\Parsers\ContentFreshnessParser;
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

                if ($instansi->feed_url) {
                    try {
                        $feedResp = $this->httpClient(6)->get($instansi->feed_url);
                        if ($feedResp->successful()) {
                            $feedBody = $feedResp->body();
                        }
                    } catch (Throwable) {
                        // Fallback gracefully to HTML body / headers when feed endpoint fails
                    }
                }
            } else {
                $error = "HTTP {$httpCode}";
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

    public function httpClient(?int $timeoutSeconds = null): PendingRequest
    {
        $timeout = $timeoutSeconds ?? (int) config('monitoring.timeout', 10);
        $connectTimeout = (int) config('monitoring.connect_timeout', 5);
        $verifySsl = (bool) config('monitoring.verify_ssl', false);
        $userAgent = (string) config('monitoring.user_agent', 'Diskominfo-HSU-Monitor/1.0');

        $request = Http::timeout($timeout)
            ->connectTimeout($connectTimeout)
            ->withUserAgent($userAgent)
            ->withHeaders([
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
            $timeout = (int) config('monitoring.timeout', 10);

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
