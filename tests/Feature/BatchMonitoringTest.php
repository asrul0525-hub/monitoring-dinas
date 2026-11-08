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
