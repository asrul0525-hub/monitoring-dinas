<?php

namespace App\Monitoring;

use App\Enums\Status;
use App\Models\Instansi;
use App\Models\Setting;
use Carbon\CarbonImmutable;

class RecalculateStatuses
{
    public function __invoke(): void
    {
        $freshnessDays = (int) Setting::get('freshness_days', 30);

        $instansiList = Instansi::query()
            ->with(['checks' => fn ($q) => $q->orderByDesc('checked_at')->orderByDesc('id')])
            ->get();

        foreach ($instansiList as $instansi) {
            $latest = $instansi->checks->first();

            if ($latest === null) {
                $instansi->update([
                    'status' => null,
                    'down_since' => null,
                ]);

                continue;
            }

            $referenceTime = CarbonImmutable::instance($latest->checked_at);
            $newStatus = StatusCalculator::classify(
                $latest->http_code,
                $latest->content_date,
                $referenceTime,
                $freshnessDays
            );

            if ($latest->status !== $newStatus) {
                $latest->update(['status' => $newStatus]);
            }

            $downSince = null;
            if ($newStatus === Status::TidakAktif) {
                $downSince = $latest->checked_at;
                foreach ($instansi->checks as $check) {
                    if ($check->http_code !== 200) {
                        $downSince = $check->checked_at;
                    } else {
                        break;
                    }
                }
            }

            $instansi->update([
                'status' => $newStatus,
                'last_checked_at' => $latest->checked_at,
                'last_content_at' => $latest->content_date ?? $instansi->last_content_at,
                'last_response_ms' => $latest->response_ms,
                'last_http_code' => $latest->http_code,
                'content_source' => $latest->content_source ?? $instansi->content_source,
                'down_since' => $downSince,
            ]);
        }
    }
}
