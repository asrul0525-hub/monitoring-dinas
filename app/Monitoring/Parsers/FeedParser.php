<?php

namespace App\Monitoring\Parsers;

use Carbon\CarbonImmutable;
use Throwable;

class FeedParser
{
    public static function parse(string $xml): ?CarbonImmutable
    {
        $trimmed = trim($xml);
        if ($trimmed === '' || ! str_contains($trimmed, '<')) {
            return null;
        }

        $candidates = [];

        // Regex extraction for <pubDate>, <updated>, <published>, <dc:date>
        if (preg_match_all('/<(?:pubDate|updated|published|dc:date)[^>]*>([^<]+)<\/(?:pubDate|updated|published|dc:date)>/i', $trimmed, $matches)) {
            foreach ($matches[1] as $rawDate) {
                $parsed = self::tryParseDate(trim(html_entity_decode($rawDate, ENT_QUOTES | ENT_XML1, 'UTF-8')));
                if ($parsed !== null) {
                    $candidates[] = $parsed;
                }
            }
        }

        return self::latestValidDate($candidates);
    }

    public static function tryParseDate(string $value): ?CarbonImmutable
    {
        $clean = trim($value);
        if ($clean === '' || strlen($clean) < 8) {
            return null;
        }

        // Strip leading weekday prefix (e.g. "Wed, ") so calendar date is never shifted by mismatched weekday
        $withoutWeekday = preg_replace(
            '/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Senin|Selasa|Rabu|Kamis|Jum\'?at|Sabtu|Minggu)[a-z]*,\s*/i',
            '',
            $clean
        ) ?? $clean;

        // Normalize common Indonesian month names if present
        $indonesianMonths = [
            'Januari' => 'January',
            'Februari' => 'February',
            'Maret' => 'March',
            'April' => 'April',
            'Mei' => 'May',
            'Juni' => 'June',
            'Juli' => 'July',
            'Agustus' => 'August',
            'September' => 'September',
            'Oktober' => 'October',
            'November' => 'November',
            'Desember' => 'December',
            'Ags' => 'Aug',
            'Agu' => 'Aug',
            'Okt' => 'Oct',
            'Des' => 'Dec',
        ];
        $normalized = str_ireplace(array_keys($indonesianMonths), array_values($indonesianMonths), $withoutWeekday);

        try {
            $dt = CarbonImmutable::parse($normalized, 'Asia/Makassar');
            // If input had no explicit time component (00:00:00), anchor at 12:00 WITA so UTC conversion preserves calendar date
            if ($dt->hour === 0 && $dt->minute === 0 && $dt->second === 0 && ! str_contains($normalized, ':')) {
                $dt = $dt->setTime(12, 0, 0);
            }
            // Reject dates before year 2000 or in the future (beyond end of today + 1 day tolerance)
            if ($dt->year < 2000 || $dt->greaterThan(CarbonImmutable::now('Asia/Makassar')->addDay()->endOfDay())) {
                return null;
            }

            return $dt;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @param  array<int, CarbonImmutable>  $dates
     */
    public static function latestValidDate(array $dates): ?CarbonImmutable
    {
        if ($dates === []) {
            return null;
        }

        $latest = null;
        foreach ($dates as $dt) {
            if ($latest === null || $dt->greaterThan($latest)) {
                $latest = $dt;
            }
        }

        return $latest;
    }
}
