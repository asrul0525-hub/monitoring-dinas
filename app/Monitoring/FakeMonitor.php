<?php

namespace App\Monitoring;

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

class FakeMonitor implements Monitor
{
    public function check(Instansi $instansi, ?CarbonInterface $at = null): Check
    {
        $checkedAt = $at ? CarbonImmutable::instance($at) : CarbonImmutable::now();
        $freshnessDays = (int) Setting::get('freshness_days', 30);

        $seed = crc32($instansi->url.'|'.$checkedAt->format('Y-m-d-H'));
        $bucket = abs((int) crc32($instansi->url)) % 10;

        // ~70% active-leaning (0..6), ~20% stale-leaning (7..8), ~10% down-leaning (9)
        $roll = abs($seed) % 100;

        $isDown = match (true) {
            $bucket === 9 => $roll < 65,
            $bucket >= 7 => $roll < 6,
            default => $roll < 3,
        };

        $source = $this->resolveSource($instansi);

        if ($isDown) {
            $downModes = [
                ['code' => null, 'error' => 'Timeout 30 detik'],
                ['code' => 502, 'error' => 'HTTP 502 Bad Gateway'],
                ['code' => 500, 'error' => 'HTTP 500 Internal Server Error'],
                ['code' => 404, 'error' => 'HTTP 404 Not Found'],
            ];
            $picked = $downModes[abs($seed) % count($downModes)];
            $httpCode = $picked['code'];
            $responseMs = null;
            $contentDate = $instansi->last_content_at;
            $error = $picked['error'];
        } else {
            $httpCode = 200;
            $baseMs = 150 + (abs((int) crc32($instansi->nama)) % 380);
            $jitter = (abs($seed) % 180) - 60;
            $responseMs = max(150, min(3000, $baseMs + $jitter));
            $error = null;

            if ($bucket >= 7) {
                $staleDays = 35 + (abs((int) crc32($instansi->url)) % 155);
                $contentDate = $checkedAt->subDays($staleDays);
            } else {
                $freshDays = abs((int) crc32($instansi->url.$checkedAt->format('Y-W'))) % max(1, min(25, $freshnessDays));
                $contentDate = $checkedAt->subDays($freshDays);
            }
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

    private function resolveSource(Instansi $instansi): ContentSource
    {
        if ($instansi->feed_url) {
            return str_contains(strtolower($instansi->feed_url), 'rss') || str_contains(strtolower($instansi->feed_url), 'feed')
                ? ContentSource::Rss
                : ContentSource::Sitemap;
        }

        return ContentSource::Dom;
    }
}
