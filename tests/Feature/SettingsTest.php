<?php

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

it('menampilkan halaman pengaturan dengan nilai freshness_days dan check_interval_hours', function () {
    $user = User::factory()->create();
    Setting::put('freshness_days', 30);
    Setting::put('check_interval_hours', 6);

    $this->actingAs($user)
        ->get('/pengaturan')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Pengaturan')
            ->where('settings.freshnessDays', 30)
            ->where('settings.checkIntervalHours', 6)
        );
});

it('mengubah freshness_days ke 7 dan menghitung ulang status instansi berkonten 10 hari menjadi kurang-aktif', function () {
    $user = User::factory()->create();
    Setting::put('freshness_days', 30);

    $checkedAt = CarbonImmutable::parse('2026-11-01T12:00:00Z');
    $contentDate = $checkedAt->subDays(10);

    $instansi = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 01',
        'status' => Status::Aktif,
        'last_checked_at' => $checkedAt,
        'last_content_at' => $contentDate,
        'last_http_code' => 200,
    ]);

    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => $checkedAt,
        'http_code' => 200,
        'response_ms' => 180,
        'content_date' => $contentDate,
        'status' => Status::Aktif,
    ]);

    $this->actingAs($user)
        ->put('/pengaturan/monitor', ['freshness_days' => 7])
        ->assertRedirect();

    expect((int) Setting::get('freshness_days'))->toBe(7);
    expect($instansi->fresh()->status)->toBe(Status::KurangAktif);
});

it('mengubah check_interval_hours dari pengaturan dan menolak interval di luar pilihan valid', function () {
    $user = User::factory()->create();
    Setting::put('freshness_days', 30);
    Setting::put('check_interval_hours', 6);

    $this->actingAs($user)
        ->put('/pengaturan/monitor', [
            'freshness_days' => 30,
            'check_interval_hours' => 3,
        ])
        ->assertRedirect();

    expect((int) Setting::get('check_interval_hours'))->toBe(3);

    $this->actingAs($user)
        ->put('/pengaturan/monitor', [
            'freshness_days' => 30,
            'check_interval_hours' => 5,
        ])
        ->assertSessionHasErrors('check_interval_hours');
});

it('menolak nilai freshness_days di luar rentang 1 sampai 365 (0 dan 400)', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put('/pengaturan/monitor', ['freshness_days' => 0])
        ->assertSessionHasErrors('freshness_days');

    $this->actingAs($user)
        ->put('/pengaturan/monitor', ['freshness_days' => 400])
        ->assertSessionHasErrors('freshness_days');
});

it('menolak ganti password jika password lama salah dan menerima jika benar', function () {
    $user = User::factory()->create([
        'password' => Hash::make('password-lama'),
    ]);

    $this->actingAs($user)
        ->from('/pengaturan')
        ->put('/password', [
            'current_password' => 'salah-password',
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])
        ->assertRedirect('/pengaturan')
        ->assertSessionHasErrors('current_password');

    $this->actingAs($user)
        ->from('/pengaturan')
        ->put('/password', [
            'current_password' => 'password-lama',
            'password' => 'PasswordBaru123!',
            'password_confirmation' => 'PasswordBaru123!',
        ])
        ->assertRedirect('/pengaturan')
        ->assertSessionHasNoErrors();

    expect(Hash::check('PasswordBaru123!', $user->fresh()->password))->toBeTrue();
});

it('POST /notifikasi/dibaca mengatur alerts.count menjadi 0 pada request berikutnya', function () {
    $user = User::factory()->create([
        'alerts_seen_at' => now()->subHours(5),
    ]);

    Instansi::factory()->create([
        'nama' => 'Dinas Down Baru',
        'status' => Status::TidakAktif,
        'down_since' => now()->subHours(2),
    ]);

    $this->actingAs($user)
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page
            ->where('alerts.count', 1)
        );

    $this->actingAs($user)
        ->post('/notifikasi/dibaca')
        ->assertRedirect();

    $this->actingAs($user)
        ->get('/')
        ->assertInertia(fn (Assert $page) => $page
            ->where('alerts.count', 0)
        );
});
