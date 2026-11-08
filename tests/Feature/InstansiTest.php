<?php

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('memfilter instansi berdasarkan status dan pencarian nama/url', function () {
    $user = User::factory()->create();

    $match = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 05',
        'url' => 'https://dinas-contoh-05.go.id',
        'status' => Status::KurangAktif,
    ]);
    Instansi::factory()->create([
        'nama' => 'Dinas Contoh 09',
        'url' => 'https://dinas-contoh-09.go.id',
        'status' => Status::KurangAktif,
    ]);
    Instansi::factory()->create([
        'nama' => 'Dinas Contoh 05 Aktif',
        'url' => 'https://dinas-contoh-05-aktif.go.id',
        'status' => Status::Aktif,
    ]);

    $this->actingAs($user)
        ->get('/instansi?status=kurang-aktif&q=05')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Instansi/Index')
            ->where('filters.status', 'kurang-aktif')
            ->where('filters.q', '05')
            ->has('rows.data', 1)
            ->where('rows.data.0.id', $match->id)
        );
});

it('mengabaikan nilai status yang tidak dikenal menjadi null', function () {
    $user = User::factory()->create();
    Instansi::factory()->count(3)->create();

    $this->actingAs($user)
        ->get('/instansi?status=hijau')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.status', null)
            ->has('rows.data', 3)
        );
});

it('menormalisasi url tanpa skema dan menyimpan instansi baru dengan status null', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/instansi', [
            'nama' => 'Dinas Contoh 50',
            'url' => 'dinas-contoh-50.go.id/',
            'feed_url' => 'dinas-contoh-50.go.id/sitemap.xml',
        ])
        ->assertRedirect('/instansi');

    $saved = Instansi::query()->where('nama', 'Dinas Contoh 50')->firstOrFail();
    expect($saved->url)->toBe('https://dinas-contoh-50.go.id')
        ->and($saved->feed_url)->toBe('https://dinas-contoh-50.go.id/sitemap.xml')
        ->and($saved->status)->toBeNull();
});

it('menolak url duplikat dengan pesan Bahasa Indonesia', function () {
    $user = User::factory()->create();
    Instansi::factory()->create(['url' => 'https://dinas-contoh-01.go.id']);

    $this->actingAs($user)
        ->post('/instansi', [
            'nama' => 'Dinas Duplikat',
            'url' => 'dinas-contoh-01.go.id/',
        ])
        ->assertSessionHasErrors([
            'url' => 'URL ini sudah terdaftar.',
        ]);
});

it('mewajibkan nama dan url dengan pesan Bahasa Indonesia', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/instansi', [
            'nama' => '',
            'url' => '',
        ])
        ->assertSessionHasErrors([
            'nama' => 'Nama instansi wajib diisi.',
            'url' => 'URL website wajib diisi.',
        ]);
});

it('mengubah data instansi yang ada', function () {
    $user = User::factory()->create();
    $instansi = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 01',
        'url' => 'https://dinas-contoh-01.go.id',
    ]);

    $this->actingAs($user)
        ->put("/instansi/{$instansi->id}", [
            'nama' => 'Dinas Contoh 01 Baru',
            'url' => 'https://dinas-contoh-01-baru.go.id',
            'feed_url' => '',
        ])
        ->assertRedirect('/instansi');

    $instansi->refresh();
    expect($instansi->nama)->toBe('Dinas Contoh 01 Baru')
        ->and($instansi->url)->toBe('https://dinas-contoh-01-baru.go.id')
        ->and($instansi->feed_url)->toBeNull();
});

it('menghapus instansi beserta riwayatnya dan detailnya menjadi 404', function () {
    $user = User::factory()->create();
    $instansi = Instansi::factory()->has(Check::factory()->count(4))->create();

    $this->actingAs($user)
        ->delete("/instansi/{$instansi->id}")
        ->assertRedirect('/instansi');

    expect(Instansi::find($instansi->id))->toBeNull()
        ->and(Check::where('instansi_id', $instansi->id)->count())->toBe(0);

    $this->actingAs($user)
        ->get("/instansi/{$instansi->id}")
        ->assertNotFound();
});

it('menghitung uptime 7/30 hari dan series 30 hari pada halaman detail instansi', function () {
    $user = User::factory()->create();
    $instansi = Instansi::factory()->create();

    Check::factory()->count(3)->create([
        'instansi_id' => $instansi->id,
        'checked_at' => now()->subDays(2),
        'http_code' => 200,
        'response_ms' => 200,
    ]);
    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => now()->subDay(),
        'http_code' => 502,
        'response_ms' => null,
        'status' => Status::TidakAktif,
    ]);

    $this->actingAs($user)
        ->get("/instansi/{$instansi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Instansi/Show')
            ->where('uptime.d7', 75)
            ->where('uptime.d30', 75)
            ->has('series', 30)
            ->has('checks.data', 4)
        );
});

it('mengembalikan uptime null dan 30 series avgMs null untuk instansi baru tanpa riwayat cek', function () {
    $user = User::factory()->create();
    $instansi = Instansi::factory()->create([
        'status' => null,
        'last_checked_at' => null,
    ]);

    $this->actingAs($user)
        ->get("/instansi/{$instansi->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Instansi/Show')
            ->where('uptime.d7', null)
            ->where('uptime.d30', null)
            ->has('series', 30)
            ->where('series.0.avgMs', null)
            ->where('series.29.avgMs', null)
            ->has('checks.data', 0)
        );
});

it('menyimpan dan memvalidasi kategori instansi (vertikal, dinas, kec_kel_pkm)', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/instansi', [
            'nama' => 'BPN Kota Contoh',
            'url' => 'bpn-contoh.go.id',
            'kategori' => 'vertikal',
        ])
        ->assertRedirect('/instansi');

    $saved = Instansi::query()->where('nama', 'BPN Kota Contoh')->firstOrFail();
    expect($saved->kategori)->toBe('vertikal')
        ->and($saved->toRow()['kategori'])->toBe('vertikal');

    $this->actingAs($user)
        ->post('/instansi', [
            'nama' => 'Instansi Kategori Salah',
            'url' => 'salah-kategori.go.id',
            'kategori' => 'swasta',
        ])
        ->assertSessionHasErrors([
            'kategori' => 'Kategori instansi tidak valid.',
        ]);
});

