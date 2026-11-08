<?php

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

it('memfilter hasil=gagal (non-200 dan timeout) serta mengurutkan dari yang terbaru', function () {
    $user = User::factory()->create();
    $instansiA = Instansi::factory()->create(['nama' => 'Dinas Contoh 01']);
    $instansiB = Instansi::factory()->create(['nama' => 'Dinas Contoh 02']);

    $checkSuccess = Check::factory()->create([
        'instansi_id' => $instansiA->id,
        'checked_at' => CarbonImmutable::parse('2026-11-01T08:00:00Z'),
        'http_code' => 200,
        'response_ms' => 150,
        'status' => Status::Aktif,
        'error' => null,
    ]);

    $checkError500 = Check::factory()->create([
        'instansi_id' => $instansiA->id,
        'checked_at' => CarbonImmutable::parse('2026-11-01T10:00:00Z'),
        'http_code' => 500,
        'response_ms' => 450,
        'status' => Status::TidakAktif,
        'error' => 'HTTP 500 Internal Server Error',
    ]);

    $checkTimeout = Check::factory()->create([
        'instansi_id' => $instansiB->id,
        'checked_at' => CarbonImmutable::parse('2026-11-01T12:00:00Z'),
        'http_code' => null,
        'response_ms' => null,
        'status' => Status::TidakAktif,
        'error' => 'cURL error 28: Operation timed out after 30000 milliseconds',
    ]);

    $this->actingAs($user)
        ->get('/log?hasil=gagal')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Log')
            ->where('filters.hasil', 'gagal')
            ->where('filters.instansi', null)
            ->has('rows.data', 2)
            ->where('rows.data.0.id', $checkTimeout->id)
            ->where('rows.data.0.httpCode', null)
            ->where('rows.data.0.error', 'cURL error 28: Operation timed out after 30000 milliseconds')
            ->where('rows.data.1.id', $checkError500->id)
            ->where('rows.data.1.httpCode', 500)
        );
});

it('memfilter log berdasarkan instansi dan hasil=sukses', function () {
    $user = User::factory()->create();
    $instansiA = Instansi::factory()->create(['nama' => 'Dinas Contoh 01']);
    $instansiB = Instansi::factory()->create(['nama' => 'Dinas Contoh 02']);

    Check::factory()->create([
        'instansi_id' => $instansiA->id,
        'checked_at' => CarbonImmutable::parse('2026-11-01T08:00:00Z'),
        'http_code' => 200,
        'response_ms' => 150,
        'status' => Status::Aktif,
    ]);

    Check::factory()->create([
        'instansi_id' => $instansiB->id,
        'checked_at' => CarbonImmutable::parse('2026-11-01T09:00:00Z'),
        'http_code' => 200,
        'response_ms' => 180,
        'status' => Status::Aktif,
    ]);

    $this->actingAs($user)
        ->get("/log?instansi={$instansiA->id}&hasil=sukses")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Log')
            ->where('filters.instansi', $instansiA->id)
            ->where('filters.hasil', 'sukses')
            ->has('rows.data', 1)
            ->where('rows.data.0.instansi.id', $instansiA->id)
        );
});

it('memfilter log berdasarkan kategori instansi', function () {
    $user = User::factory()->create();
    $instansiKec = Instansi::factory()->create(['nama' => 'Kecamatan Contoh', 'kategori' => 'kec_kel_pkm']);
    $instansiDinas = Instansi::factory()->create(['nama' => 'Dinas Contoh', 'kategori' => 'dinas']);

    Check::factory()->create(['instansi_id' => $instansiKec->id]);
    Check::factory()->create(['instansi_id' => $instansiDinas->id]);

    $this->actingAs($user)
        ->get('/log?kategori=kec_kel_pkm')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Log')
            ->where('filters.kategori', 'kec_kel_pkm')
            ->has('rows.data', 1)
            ->where('rows.data.0.instansi.id', $instansiKec->id)
        );
});

