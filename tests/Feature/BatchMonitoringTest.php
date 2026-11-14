<?php

use App\Enums\Status;
use App\Jobs\CheckInstansiJob;
use App\Models\Check;
use App\Models\Instansi;
use App\Monitoring\BatchMonitorRunner;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Http;

it('CheckInstansiJob menjalankan pengecekan untuk satu instansi', function () {
    Http::fake([
        'https://diskominfo.hsu.go.id' => Http::response(
            '<html><head><meta property="article:published_time" content="'.now()->subDays(1)->toIso8601String().'"></head></html>',
            200
        ),
    ]);

    $instansi = Instansi::factory()->create([
        'url' => 'https://diskominfo.hsu.go.id',
        'feed_url' => null,
        'status' => null,
    ]);

    CheckInstansiJob::dispatchSync($instansi->id);

    $instansi->refresh();
    expect($instansi->status)->toBe(Status::Aktif)
        ->and(Check::where('instansi_id', $instansi->id)->count())->toBe(1);
});

it('BatchMonitorRunner::runAll secara sinkron mengeksekusi Http::pool konkuren untuk seluruh instansi', function () {
    Http::fake([
        'https://dinas-a.hsu.go.id' => Http::response('<html></html>', 200),
        'https://dinas-a.hsu.go.id/sitemap.xml' => Http::response(
            '<?xml version="1.0"?><urlset><url><lastmod>'.now()->subDays(3)->toIso8601String().'</lastmod></url></urlset>',
            200
        ),
        'https://dinas-b.hsu.go.id' => Http::response('Server Error', 500),
    ]);

    $a = Instansi::factory()->create([
        'url' => 'https://dinas-a.hsu.go.id',
        'feed_url' => 'https://dinas-a.hsu.go.id/sitemap.xml',
        'status' => null,
    ]);
    $b = Instansi::factory()->create([
        'url' => 'https://dinas-b.hsu.go.id',
        'feed_url' => null,
        'status' => null,
    ]);

    $runner = app(BatchMonitorRunner::class);
    $checkedCount = $runner->runAll(async: false);

    expect($checkedCount)->toBe(2)
        ->and($a->fresh()->status)->toBe(Status::Aktif)
        ->and($b->fresh()->status)->toBe(Status::TidakAktif)
        ->and(Check::count())->toBe(2);
});

it('BatchMonitorRunner::runAll dengan async=true mengirim CheckInstansiJob ke antrean', function () {
    Bus::fake();

    Instansi::factory()->count(4)->create();

    $dispatched = app(BatchMonitorRunner::class)->runAll(async: true);

    expect($dispatched)->toBe(4);
    Bus::assertDispatchedTimes(CheckInstansiJob::class, 4);
});

it('BatchMonitorRunner::interleaveIntoWaves menyebarkan subdomain pkm-* ke gelombang berbeda agar tidak menumpuk di satu gelombang', function () {
    $dinas = collect(range(1, 8))->map(fn ($i) => Instansi::factory()->make([
        'id' => $i,
        'kategori' => 'dinas',
        'url' => "https://dinas-{$i}.hsu.go.id",
    ]));

    $pkms = collect(range(9, 12))->map(fn ($i) => Instansi::factory()->make([
        'id' => $i,
        'kategori' => 'kec_kel_pkm',
        'url' => "https://pkm-{$i}.hsu.go.id",
    ]));

    $all = $dinas->concat($pkms);
    $waves = BatchMonitorRunner::interleaveIntoWaves(new \Illuminate\Database\Eloquent\Collection($all->all()), 3);

    expect($waves)->toHaveCount(4);

    // Karena ada 4 PKM dan 4 gelombang, setiap gelombang maksimal hanya berisi 1 PKM
    foreach ($waves as $wave) {
        $pkmCount = $wave->filter(fn (Instansi $item) => str_contains($item->url, 'pkm-'))->count();
        expect($pkmCount)->toBeLessThanOrEqual(1);
    }
});

it('BatchMonitorRunner::runAll melakukan smart verification retry saat website PKM terkena 503 sesaat di Http::pool sehingga tidak salah divonis Tidak Aktif', function () {
    $recentIso = now()->subDays(2)->toIso8601String();

    Http::fake([
        'https://pkm-babirik.hsu.go.id' => Http::sequence()
            ->push('Service Temporarily Unavailable', 503)
            ->push("<html><head><meta property=\"article:published_time\" content=\"{$recentIso}\"></head><body>PKM Babirik</body></html>", 200),
    ]);

    $pkm = Instansi::factory()->create([
        'nama' => 'PKM Babirik',
        'kategori' => 'kec_kel_pkm',
        'url' => 'https://pkm-babirik.hsu.go.id',
        'feed_url' => null,
        'status' => Status::KurangAktif,
    ]);

    $runner = app(BatchMonitorRunner::class);
    $checked = $runner->runAll(async: false);

    $pkm->refresh();
    expect($checked)->toBe(1)
        ->and($pkm->status)->toBe(Status::Aktif)
        ->and($pkm->last_http_code)->toBe(200)
        ->and($pkm->down_since)->toBeNull()
        ->and(Check::where('instansi_id', $pkm->id)->count())->toBe(1);
});
