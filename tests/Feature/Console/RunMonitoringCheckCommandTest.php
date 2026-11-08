<?php

use App\Enums\Status;
use App\Models\Instansi;
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
