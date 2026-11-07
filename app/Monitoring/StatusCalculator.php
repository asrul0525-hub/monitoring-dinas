<?php

namespace App\Monitoring;

use App\Enums\Status;
use Carbon\CarbonInterface;

class StatusCalculator
{
    public static function classify(
        ?int $httpCode,
        ?CarbonInterface $contentDate,
        CarbonInterface $now,
        int $freshnessDays = 30
    ): Status {
        if ($httpCode !== 200) {
            return Status::TidakAktif;
        }

        if ($contentDate === null) {
            return Status::KurangAktif;
        }

        $cutoff = $now->copy()->subDays($freshnessDays);

        if ($contentDate->greaterThanOrEqualTo($cutoff)) {
            return Status::Aktif;
        }

        return Status::KurangAktif;
    }
}
