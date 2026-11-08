<?php

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use App\Models\User;
use App\Monitoring\RecalculateStatuses;
use Illuminate\Support\Facades\Http;

it('mengarahkan tamu ke login saat memanggil cek-semua', function () {
    $this->post('/cek-semua')->assertRedirect('/login');
});

it('POST /instansi/{id}/cek membuat tepat 1 Check baru dan memperbarui last_checked_at', function () {
    Http::fake([
        '*' => Http::response(
            '<html><head><meta property="article:published_time" content="'.now()->subDays(2)->toIso8601String().'"></head></html>',
            200
        ),
    ]);

    $user = User::factory()->create();
    $instansi = Instansi::factory()->create([
        'status' => null,
        'last_checked_at' => null,
    ]);

    $response = $this->actingAs($user)
        ->from('/instansi')
        ->post("/instansi/{$instansi->id}/cek");

    $response->assertRedirect('/instansi');
    expect(Check::where('instansi_id', $instansi->id)->count())->toBe(1);

    $instansi->refresh();
    expect($instansi->last_checked_at)->not->toBeNull()
        ->and($instansi->status)->toBeInstanceOf(Status::class);
});

it('POST /cek-semua mengecek seluruh instansi', function () {
    Http::fake([
        '*' => Http::response(
            '<html><head><meta property="article:published_time" content="'.now()->subDays(2)->toIso8601String().'"></head></html>',
            200
        ),
    ]);

    $user = User::factory()->create();
    Instansi::factory()->count(3)->create(['status' => null, 'last_checked_at' => null]);

    $this->actingAs($user)->from('/')->post('/cek-semua')->assertRedirect('/');
    expect(Check::count())->toBe(3);
});

it('mengisi down_since saat berubah ke tidak-aktif dan mengosongkannya saat pulih', function () {
    $downAt = now()->subHours(6);
    $instansi = Instansi::factory()->create([
        'status' => Status::Aktif,
        'down_since' => null,
    ]);

    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => $downAt,
        'http_code' => 502,
        'response_ms' => null,
        'content_date' => null,
        'status' => Status::TidakAktif,
        'error' => 'HTTP 502 Bad Gateway',
    ]);

    app(RecalculateStatuses::class)();
    $instansi->refresh();
    expect($instansi->status)->toBe(Status::TidakAktif)
        ->and($instansi->down_since?->timestamp)->toBe($downAt->timestamp);

    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => now(),
        'http_code' => 200,
        'response_ms' => 210,
        'content_date' => now()->subDays(2),
        'content_source' => ContentSource::Sitemap,
        'status' => Status::Aktif,
        'error' => null,
    ]);

    app(RecalculateStatuses::class)();
    $instansi->refresh();
    expect($instansi->status)->toBe(Status::Aktif)
        ->and($instansi->down_since)->toBeNull();
});

it('RecalculateStatuses mengubah instansi berkonten 10 hari menjadi kurang-aktif saat freshness_days diubah ke 7', function () {
    $checkedAt = now()->subHour();
    $instansi = Instansi::factory()->create([
        'status' => Status::Aktif,
        'last_checked_at' => $checkedAt,
        'last_content_at' => $checkedAt->copy()->subDays(10),
        'last_http_code' => 200,
    ]);

    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => $checkedAt,
        'http_code' => 200,
        'response_ms' => 200,
        'content_date' => $checkedAt->copy()->subDays(10),
        'content_source' => ContentSource::Sitemap,
        'status' => Status::Aktif,
    ]);

    Setting::put('freshness_days', 7);
    app(RecalculateStatuses::class)();

    $instansi->refresh();
    expect($instansi->status)->toBe(Status::KurangAktif);
});
