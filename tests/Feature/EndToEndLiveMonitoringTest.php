<?php

use App\Enums\ContentSource;
use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

it('menjalankan alur end-to-end: database bersih -> input instansi manual -> cek riil -> tampil di dashboard & laporan', function () {
    // 1. Seed database bersih
    $this->seed(DatabaseSeeder::class);
    expect(Instansi::count())->toBe(0);

    $admin = User::where('email', 'admin@diskominfo.go.id')->firstOrFail();

    // 2. Super Admin menambahkan instansi secara manual melalui POST /instansi
    $this->actingAs($admin)
        ->post('/instansi', [
            'nama' => 'Dinas Komunikasi, Informatika, dan Persandian HSU',
            'kategori' => 'dinas',
            'url' => 'https://diskominfo.hsu.go.id',
            'feed_url' => 'https://diskominfo.hsu.go.id/sitemap.xml',
        ])
        ->assertRedirect('/instansi');

    $instansi = Instansi::firstOrFail();
    expect($instansi->nama)->toBe('Dinas Komunikasi, Informatika, dan Persandian HSU')
        ->and($instansi->kategori)->toBe('dinas')
        ->and($instansi->status)->toBeNull();

    // 3. Siapkan respons HTTP simulasi server riil untuk domain & sitemap
    $recentDate = now()->subDays(2)->toIso8601String();
    Http::fake([
        'https://diskominfo.hsu.go.id' => Http::response('<html><body>Portal Resmi Diskominfo HSU</body></html>', 200),
        'https://diskominfo.hsu.go.id/sitemap.xml' => Http::response(
            "<?xml version=\"1.0\"?><urlset><url><loc>https://diskominfo.hsu.go.id/berita/1</loc><lastmod>{$recentDate}</lastmod></url></urlset>",
            200
        ),
    ]);

    // 4. Super Admin menekan tombol "Cek Sekarang" (POST /cek-semua)
    $this->actingAs($admin)
        ->from('/')
        ->post('/cek-semua')
        ->assertRedirect('/');

    // 5. Pastikan status instansi dan riwayat check tersimpan secara akurat
    $instansi->refresh();
    expect($instansi->status)->toBe(Status::Aktif)
        ->and($instansi->last_http_code)->toBe(200)
        ->and($instansi->content_source)->toBe(ContentSource::Sitemap)
        ->and(Check::count())->toBe(1);

    // 6. Pastikan Dashboard menampilkan instansi Aktif dan isSampleData bernilai false
    $this->actingAs($admin)
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isSampleData', false)
            ->where('statusCounts.aktif', 1)
            ->where('kpi.uptimePct', 100)
            ->where('kpi.downCount', 0)
        );
});
