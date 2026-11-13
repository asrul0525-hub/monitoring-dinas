<?php

use App\Enums\Status;
use App\Models\Instansi;
use App\Models\Setting;
use App\Monitoring\MonitoringSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Http;

it('perintah artisan monitor:run mengecek seluruh instansi yang terdaftar', function () {
    Http::fake([
        '*' => Http::response(
            '<html><head><meta property="article:published_time" content="'.now()->subDays(2)->toIso8601String().'"></head></html>',
            200
        ),
    ]);

    Instansi::factory()->count(2)->create(['status' => null]);

    $this->artisan('monitor:run')
        ->assertExitCode(0);

    expect(Instansi::where('status', Status::Aktif)->count())->toBe(2);
});

it('perintah artisan monitor:check {id} mengecek satu instansi spesifik', function () {
    Http::fake([
        'https://diskominfo.hsu.go.id' => Http::response(
            '<html><head><meta property="article:published_time" content="'.now()->subDays(1)->toIso8601String().'"></head></html>',
            200
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Diskominfo HSU',
        'url' => 'https://diskominfo.hsu.go.id',
        'status' => null,
    ]);

    $this->artisan("monitor:check {$instansi->id}")
        ->assertExitCode(0);

    expect($instansi->fresh()->status)->toBe(Status::Aktif);
});

it('mendaftarkan jadwal otomatis monitor:run pada pukul 02:00, 08:00, 14:00, dan 20:00 WITA', function () {
    $schedule = app(Schedule::class);
    $events = collect($schedule->events())->filter(
        fn ($event) => str_contains((string) $event->command, 'monitor:run')
    );

    expect($events)->not->toBeEmpty();
    $event = $events->first();
    expect($event->expression)->toBe('0 2,8,14,20 * * *')
        ->and((string) $event->timezone)->toBe('Asia/Makassar');
});

it('MonitoringSchedule menghitung nextRunAt akurat sesuai interval cron WITA dan mencatat heartbeat scheduler', function () {
    $nowWita = CarbonImmutable::parse('2026-11-13 18:15:00', 'Asia/Makassar');

    expect(MonitoringSchedule::cronExpressionForInterval(1))->toBe('0 * * * *')
        ->and(MonitoringSchedule::cronExpressionForInterval(3))->toBe('0 2,5,8,11,14,17,20,23 * * *')
        ->and(MonitoringSchedule::cronExpressionForInterval(6))->toBe('0 2,8,14,20 * * *')
        ->and(MonitoringSchedule::cronExpressionForInterval(12))->toBe('0 8,20 * * *');

    $next6h = MonitoringSchedule::nextRunAt(6, $nowWita)->setTimezone('Asia/Makassar');
    expect($next6h->format('Y-m-d H:i'))->toBe('2026-11-13 20:00');

    $next3h = MonitoringSchedule::nextRunAt(3, $nowWita)->setTimezone('Asia/Makassar');
    expect($next3h->format('Y-m-d H:i'))->toBe('2026-11-13 20:00');

    expect(MonitoringSchedule::isSchedulerActive($nowWita))->toBeFalse();
    MonitoringSchedule::recordHeartbeat($nowWita->subMinute());
    expect(MonitoringSchedule::isSchedulerActive($nowWita))->toBeTrue();

    Setting::put('scheduler_last_heartbeat_at', $nowWita->subMinutes(10)->toIso8601String());
    expect(MonitoringSchedule::isSchedulerActive($nowWita))->toBeFalse();
});
