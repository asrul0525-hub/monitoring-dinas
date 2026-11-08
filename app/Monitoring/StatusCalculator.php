<?php

namespace App\Monitoring;

use App\Enums\Status;
use Carbon\CarbonInterface;

class StatusCalculator
{
    public static function isCheckOnline(?int $httpCode, ?string $error = null): bool
    {
        if ($httpCode === 200) {
            return $error === null;
        }

        return $httpCode === 403;
    }

    public static function classify(
        ?int $httpCode,
        ?CarbonInterface $contentDate,
        CarbonInterface $now,
        int $freshnessDays = 30,
        ?string $error = null
    ): Status {
        if (! self::isCheckOnline($httpCode, $error)) {
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
