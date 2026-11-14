<?php

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Instansi;
use App\Models\Setting;
use App\Monitoring\LiveMonitor;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('LiveMonitor mencatat status Aktif saat HTTP 200 dan feed sitemap memiliki konten mutakhir', function () {
    Setting::put('freshness_days', 30);
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://diskominfo.hsu.go.id' => Http::response('<html><body>Portal Diskominfo HSU</body></html>', 200),
        'https://diskominfo.hsu.go.id/sitemap.xml' => Http::response(
            '<?xml version="1.0"?><urlset><url><loc>https://diskominfo.hsu.go.id/berita/1</loc><lastmod>2026-11-06T09:00:00+08:00</lastmod></url></urlset>',
            200
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Diskominfo HSU',
        'url' => 'https://diskominfo.hsu.go.id',
        'feed_url' => 'https://diskominfo.hsu.go.id/sitemap.xml',
        'status' => null,
    ]);

    $monitor = app(LiveMonitor::class);
    $check = $monitor->check($instansi, $now);

    expect($check->http_code)->toBe(200)
        ->and($check->status)->toBe(Status::Aktif)
        ->and($check->content_source)->toBe(ContentSource::Sitemap)
        ->and($check->content_date?->format('Y-m-d'))->toBe('2026-11-06')
        ->and($check->response_ms)->toBeInt()->toBeGreaterThanOrEqual(0)
        ->and($check->error)->toBeNull();

    $instansi->refresh();
    expect($instansi->status)->toBe(Status::Aktif)
        ->and($instansi->last_http_code)->toBe(200)
        ->and($instansi->down_since)->toBeNull();
});

it('LiveMonitor mengekstrak tanggal dari HTML meta dan menandai Kurang Aktif bila konten lebih tua dari ambang hari', function () {
    Setting::put('freshness_days', 30);
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://bapperida.hsu.go.id' => Http::response(
            '<html><head><meta property="article:published_time" content="2026-08-01T08:00:00+08:00"></head><body></body></html>',
            200
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Bapperida HSU',
        'url' => 'https://bapperida.hsu.go.id',
        'feed_url' => null,
        'status' => null,
    ]);

    $check = app(LiveMonitor::class)->check($instansi, $now);

    expect($check->status)->toBe(Status::KurangAktif)
        ->and($check->content_source)->toBe(ContentSource::Dom)
        ->and($check->content_date?->format('Y-m-d'))->toBe('2026-08-01');
});

it('LiveMonitor mencatat Tidak Aktif dan mengisi down_since saat menerima HTTP 502 atau ConnectionException', function () {
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://dinkes.hsu.go.id' => Http::response('Bad Gateway', 502),
        'https://timeout.hsu.go.id' => fn () => throw new ConnectionException('cURL error 28: Operation timed out after 10000 milliseconds'),
    ]);

    $instansi502 = Instansi::factory()->create([
        'url' => 'https://dinkes.hsu.go.id',
        'status' => Status::Aktif,
        'down_since' => null,
    ]);

    $check502 = app(LiveMonitor::class)->check($instansi502, $now);
    expect($check502->status)->toBe(Status::TidakAktif)
        ->and($check502->http_code)->toBe(502)
        ->and($check502->error)->toContain('502');

    $instansi502->refresh();
    expect($instansi502->status)->toBe(Status::TidakAktif)
        ->and($instansi502->down_since?->timestamp)->toBe($now->timestamp);

    $instansiTimeout = Instansi::factory()->create([
        'url' => 'https://timeout.hsu.go.id',
        'status' => null,
    ]);

    $checkTimeout = app(LiveMonitor::class)->check($instansiTimeout, $now);
    expect($checkTimeout->status)->toBe(Status::TidakAktif)
        ->and($checkTimeout->http_code)->toBeNull()
        ->and($checkTimeout->error)->not->toBeNull();
});

it('LiveMonitor melakukan auto-discovery link RSS feed pada head HTML saat feed_url instansi kosong', function () {
    Setting::put('freshness_days', 30);
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://portal-statis.hsu.go.id' => Http::response(
            '<html><head><link rel="alternate" type="application/rss+xml" href="/feed/" /></head><body>Banner Statis</body></html>',
            200
        ),
        'https://portal-statis.hsu.go.id/feed/' => Http::response(
            '<?xml version="1.0"?><rss version="2.0"><channel><item><pubDate>Fri, 06 Nov 2026 10:00:00 +0800</pubDate></item></channel></rss>',
            200
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Portal Statis HSU',
        'url' => 'https://portal-statis.hsu.go.id',
        'feed_url' => null,
        'status' => null,
    ]);

    $check = app(LiveMonitor::class)->check($instansi, $now);

    expect($check->status)->toBe(Status::Aktif)
        ->and($check->content_source)->toBe(ContentSource::Rss)
        ->and($check->content_date?->format('Y-m-d'))->toBe('2026-11-06')
        ->and($instansi->fresh()->feed_url)->toBe('https://portal-statis.hsu.go.id/feed/');
});

it('LiveMonitor otomatis memperbarui feed_url jika halaman utama memiliki URL RSS feed baru di head HTML', function () {
    Setting::put('freshness_days', 30);
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://portal-statis.hsu.go.id' => Http::response(
            '<html><head><link rel="alternate" type="application/rss+xml" href="/rss-terbaru.xml" /></head><body>Banner Statis</body></html>',
            200
        ),
        'https://portal-statis.hsu.go.id/feed-lama/' => Http::response('Not Found', 404),
        'https://portal-statis.hsu.go.id/rss-terbaru.xml' => Http::response(
            '<?xml version="1.0"?><rss version="2.0"><channel><item><pubDate>Sat, 07 Nov 2026 11:00:00 +0800</pubDate></item></channel></rss>',
            200
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Portal Statis HSU',
        'url' => 'https://portal-statis.hsu.go.id',
        'feed_url' => 'https://portal-statis.hsu.go.id/feed-lama/',
        'status' => Status::KurangAktif,
    ]);

    $check = app(LiveMonitor::class)->check($instansi, $now);

    $instansi->refresh();
    expect($check->status)->toBe(Status::Aktif)
        ->and($check->content_source)->toBe(ContentSource::Rss)
        ->and($check->content_date?->format('Y-m-d'))->toBe('2026-11-07')
        ->and($instansi->feed_url)->toBe('https://portal-statis.hsu.go.id/rss-terbaru.xml');
});

it('LiveMonitor memaksa status Tidak Aktif meskipun HTTP 200 OK jika HTML mengandung kata kunci blacklist (seperti Kejari HSU site closed)', function () {
    Setting::put('freshness_days', 30);
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://kejari.hsu.go.id' => Http::response(
            '<html><head><title>Sorry, site has been closed</title></head><body>Sorry! This site has been closed by administrator! Please contact administrator!</body></html>',
            200,
            ['Last-Modified' => 'Wed, 01 Nov 2017 08:00:00 GMT']
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Kejari HSU',
        'url' => 'https://kejari.hsu.go.id',
        'status' => Status::KurangAktif,
        'last_content_at' => CarbonImmutable::parse('2017-11-01T08:00:00Z'),
        'down_since' => null,
    ]);

    $check = app(LiveMonitor::class)->check($instansi, $now);

    expect($check->http_code)->toBe(200)
        ->and($check->status)->toBe(Status::TidakAktif)
        ->and($check->error)->toContain('Situs Ditutup')
        ->and($check->content_date)->toBeNull();

    $instansi->refresh();
    expect($instansi->status)->toBe(Status::TidakAktif)
        ->and($instansi->last_content_at)->toBeNull()
        ->and($instansi->down_since?->timestamp)->toBe($now->timestamp);
});

it('LiveMonitor tidak menandai Tidak Aktif saat server merespons HTTP 403 WAF Challenge (seperti Pengadilan Agama HSU)', function () {
    Setting::put('freshness_days', 30);
    $now = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');

    Http::fake([
        'https://waf-challenge.hsu.test' => Http::response(
            '<!DOCTYPE html><html><head><title>Checking your browser before accessing. Just a moment...</title></head><body><script src="/hcdn-cgi/jschallenge"></script></body></html>',
            403,
            ['Server' => 'hcdn']
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'Pengadilan Agama HSU',
        'url' => 'https://waf-challenge.hsu.test',
        'status' => Status::TidakAktif,
        'last_content_at' => null,
        'down_since' => $now->subHour(),
    ]);

    $check = app(LiveMonitor::class)->check($instansi, $now);

    expect($check->http_code)->toBe(403)
        ->and($check->status)->toBe(Status::KurangAktif)
        ->and($check->error)->toContain('WAF');

    $instansi->refresh();
    expect($instansi->status)->toBe(Status::KurangAktif)
        ->and($instansi->last_http_code)->toBe(403)
        ->and($instansi->down_since)->toBeNull();
});

it('LiveMonitor menerapkan Opsi B (2-Strike Rule): toleransi 1x gagal 503 atau Timeout pada website sehat, dan baru Tidak Aktif jika gagal 2x berturut-turut', function () {
    Setting::put('freshness_days', 30);
    $t0 = CarbonImmutable::parse('2026-11-08T10:00:00+08:00');
    $t1 = $t0->addMinutes(5);
    $t2 = $t0->addMinutes(10);

    Http::fake([
        'https://pkm-danaupanggang.hsu.go.id' => Http::sequence()
            // Siklus 1: Normal 200 OK
            ->push('<html><head><meta property="article:published_time" content="2026-11-05T08:00:00+08:00"></head></html>', 200)
            // Siklus 2 (Strike 1): Gagal 503 (termasuk saat retry)
            ->push('Service Unavailable', 503)
            ->push('Service Unavailable', 503)
            // Siklus 3 (Strike 2): Gagal 503 lagi untuk ke-2 kalinya berturut-turut
            ->push('Service Unavailable', 503)
            ->push('Service Unavailable', 503),
    ]);

    $instansi = Instansi::factory()->create([
        'nama' => 'PKM Danau Panggang',
        'url' => 'https://pkm-danaupanggang.hsu.go.id',
        'feed_url' => null,
        'status' => null,
        'last_checked_at' => null,
        'last_content_at' => null,
    ]);

    $monitor = app(LiveMonitor::class);

    // 1. Cek pertama berhasil 200 OK -> Aktif
    $check1 = $monitor->check($instansi, $t0);
    $instansi->refresh();
    expect($check1->status)->toBe(Status::Aktif)
        ->and($instansi->status)->toBe(Status::Aktif)
        ->and($instansi->last_http_code)->toBe(200);

    // 2. Strike 1 (503 sesaat): Ditoleransi, status tetap Aktif dan last_http_code tetap 200
    $check2 = $monitor->check($instansi, $t1);
    $instansi->refresh();
    expect($check2->status)->toBe(Status::Aktif)
        ->and($check2->error)->toContain('Toleransi 1x gangguan sesaat')
        ->and($instansi->status)->toBe(Status::Aktif)
        ->and($instansi->last_http_code)->toBe(200)
        ->and($instansi->down_since)->toBeNull();

    // 3. Strike 2 (503 ke-2 berturut-turut): Divonis Tidak Aktif
    $check3 = $monitor->check($instansi, $t2);
    $instansi->refresh();
    expect($check3->status)->toBe(Status::TidakAktif)
        ->and($instansi->status)->toBe(Status::TidakAktif)
        ->and($instansi->last_http_code)->toBe(503)
        ->and($instansi->down_since?->timestamp)->toBe($t2->timestamp);
});



