<?php

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('menampilkan array kosong dan status 200 saat database kosong', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->where('attention', [])
            ->where('fastest', [])
            ->where('stalest', [])
            ->where('failedLastCycle', 0)
        );
});

it('mengurutkan attention (tidak-aktif terlama dulu lalu kurang-aktif terlama dulu) dan memfilter fastest serta stalest', function () {
    $user = User::factory()->create();

    $downOld = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 01',
        'status' => Status::TidakAktif,
        'down_since' => now()->subHours(12),
        'last_response_ms' => 100,
        'last_http_code' => 502,
    ]);
    $downNew = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 02',
        'status' => Status::TidakAktif,
        'down_since' => now()->subHours(2),
        'last_response_ms' => 110,
        'last_http_code' => null,
    ]);
    $staleOld = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 03',
        'status' => Status::KurangAktif,
        'last_content_at' => now()->subDays(120),
        'last_response_ms' => 310,
        'last_http_code' => 200,
    ]);
    $staleNew = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 04',
        'status' => Status::KurangAktif,
        'last_content_at' => now()->subDays(45),
        'last_response_ms' => 240,
        'last_http_code' => 200,
    ]);
    $fastActive = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 05',
        'status' => Status::Aktif,
        'last_content_at' => now()->subDays(2),
        'last_response_ms' => 180,
        'last_http_code' => 200,
    ]);
    Instansi::factory()->create([
        'nama' => 'Dinas Contoh 06',
        'status' => null,
        'last_checked_at' => null,
        'last_content_at' => null,
        'last_response_ms' => null,
        'last_http_code' => null,
    ]);

    $this->actingAs($user)
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
            ->has('attention', 4)
            ->where('attention.0.id', $downOld->id)
            ->where('attention.1.id', $downNew->id)
            ->where('attention.2.id', $staleOld->id)
            ->where('attention.3.id', $staleNew->id)
            ->has('fastest', 3)
            ->where('fastest.0.id', $fastActive->id)
            ->where('fastest.1.id', $staleNew->id)
            ->where('fastest.2.id', $staleOld->id)
            ->has('stalest', 3)
            ->where('stalest.0.id', $staleOld->id)
            ->where('stalest.1.id', $staleNew->id)
            ->where('stalest.2.id', $fastActive->id)
            ->where('failedLastCycle', 2)
            ->has('kpi')
            ->has('kategoriBreakdown', 5)
        );
});

it('mengirimkan attentionStale dan attentionReasons dari check terbaru untuk tab Perlu Perhatian', function () {
    $user = User::factory()->create();

    $down = Instansi::factory()->create([
        'nama' => 'Instansi Soft-200',
        'status' => Status::TidakAktif,
        'down_since' => now()->subHours(4),
        'last_http_code' => 200,
    ]);
    Check::factory()->create([
        'instansi_id' => $down->id,
        'http_code' => 200,
        'status' => Status::TidakAktif,
        'error' => 'Situs Ditutup (This site has been closed)',
    ]);

    $stale = Instansi::factory()->create([
        'nama' => 'Instansi Usang',
        'status' => Status::KurangAktif,
        'last_content_at' => now()->subDays(90),
    ]);

    $this->actingAs($user)
        ->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('attentionStale', 1)
            ->where('attentionStale.0.id', $stale->id)
            ->where("attentionReasons.{$down->id}", 'Situs Ditutup (This site has been closed)')
        );
});
