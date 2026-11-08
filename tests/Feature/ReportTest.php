<?php

use App\Models\Instansi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('menolak rentang tanggal terbalik (dari > sampai)', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/laporan?dari=2026-10-31&sampai=2026-10-01')
        ->assertSessionHasErrors([
            'dari' => 'Tanggal awal harus sebelum tanggal akhir.',
        ]);
});

it('memakai bulan berjalan sebagai default saat diakses tanpa query', function () {
    $user = User::factory()->create();
    Instansi::factory()->create(['nama' => 'Dinas Contoh 01']);

    $expectedDari = now()->startOfMonth()->format('Y-m-d');
    $expectedSampai = now()->endOfMonth()->format('Y-m-d');

    $this->actingAs($user)
        ->get('/laporan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Laporan')
            ->where('filters.dari', $expectedDari)
            ->where('filters.sampai', $expectedSampai)
            ->where('filters.status', null)
            ->where('filters.kategori', null)
            ->has('rows', 1)
        );
});

it('memfilter laporan berdasarkan kategori instansi (vertikal, dinas, kec_kel_pkm)', function () {
    $user = User::factory()->create();
    $vertikal = Instansi::factory()->create(['nama' => 'BPN Contoh', 'kategori' => 'vertikal']);
    Instansi::factory()->create(['nama' => 'Dinas Contoh', 'kategori' => 'dinas']);

    $this->actingAs($user)
        ->get('/laporan?kategori=vertikal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Laporan')
            ->where('filters.kategori', 'vertikal')
            ->has('rows', 1)
            ->where('rows.0.instansiId', $vertikal->id)
        );
});

