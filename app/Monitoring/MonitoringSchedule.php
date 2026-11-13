<?php

namespace App\Monitoring;

use App\Models\Setting;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Cron\CronExpression;
use Illuminate\Support\Facades\Schema;
use Throwable;

class MonitoringSchedule
{
    /** @var array<int, int> */
    public const ALLOWED_INTERVALS = [1, 3, 6, 12];

    public const DEFAULT_INTERVAL_HOURS = 6;

    public const TIMEZONE = 'Asia/Makassar';

    public const HEARTBEAT_KEY = 'scheduler_last_heartbeat_at';

    public static function normalizeInterval(int $hours): int
    {
        return in_array($hours, self::ALLOWED_INTERVALS, true)
            ? $hours
            : self::DEFAULT_INTERVAL_HOURS;
    }

    public static function cronExpressionForInterval(int $hours): string
    {
        return match (self::normalizeInterval($hours)) {
            1 => '0 * * * *',
            3 => '0 2,5,8,11,14,17,20,23 * * *',
            12 => '0 8,20 * * *',
            default => '0 2,8,14,20 * * *',
        };
    }

    public static function descriptionForInterval(int $hours): string
    {
        return match (self::normalizeInterval($hours)) {
            1 => 'Berjalan setiap jam pada menit :00 WITA (24 kali sehari)',
            3 => 'Berjalan pada pukul 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, dan 23:00 WITA',
            12 => 'Berjalan pada pukul 08:00 dan 20:00 WITA',
            default => 'Berjalan pada pukul 02:00, 08:00, 14:00, dan 20:00 WITA',
        };
    }

    public static function configuredIntervalHours(): int
    {
        try {
            if (! Schema::hasTable('settings')) {
                return self::DEFAULT_INTERVAL_HOURS;
            }

            return self::normalizeInterval((int) Setting::get('check_interval_hours', self::DEFAULT_INTERVAL_HOURS));
        } catch (Throwable) {
            return self::DEFAULT_INTERVAL_HOURS;
        }
    }

    public static function nextRunAt(?int $intervalHours = null, ?CarbonInterface $now = null): CarbonImmutable
    {
        $hours = self::normalizeInterval($intervalHours ?? self::configuredIntervalHours());
        $reference = ($now ? CarbonImmutable::instance($now) : CarbonImmutable::now())
            ->setTimezone(self::TIMEZONE);

        $cron = new CronExpression(self::cronExpressionForInterval($hours));
        $nextDate = $cron->getNextRunDate($reference->toDateTime(), 0, false, self::TIMEZONE);

        return CarbonImmutable::instance($nextDate)->setTimezone(config('app.timezone', 'UTC'));
    }

    public static function recordHeartbeat(?CarbonInterface $at = null): void
    {
        $timestamp = ($at ? CarbonImmutable::instance($at) : CarbonImmutable::now())
            ->setTimezone(config('app.timezone', 'UTC'))
            ->toIso8601String();

        Setting::put(self::HEARTBEAT_KEY, $timestamp);
    }

    public static function lastHeartbeatAt(): ?string
    {
        try {
            if (! Schema::hasTable('settings')) {
                return null;
            }

            $raw = Setting::get(self::HEARTBEAT_KEY);

            return is_string($raw) && trim($raw) !== '' ? $raw : null;
        } catch (Throwable) {
            return null;
        }
    }

    public static function isSchedulerActive(?CarbonInterface $now = null, int $maxStaleMinutes = 3): bool
    {
        $raw = self::lastHeartbeatAt();
        if ($raw === null) {
            return false;
        }

        try {
            $last = CarbonImmutable::parse($raw);
            $reference = $now ? CarbonImmutable::instance($now) : CarbonImmutable::now();

            return $last->greaterThanOrEqualTo($reference->subMinutes($maxStaleMinutes));
        } catch (Throwable) {
            return false;
        }
    }
}
