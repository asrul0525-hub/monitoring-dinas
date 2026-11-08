<?php

use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\CleanProductionSeeder;
use Database\Seeders\DatabaseSeeder;

it('CleanProductionSeeder membuat akun Super Admin dan pengaturan default tanpa data instansi contoh', function () {
    $this->seed(CleanProductionSeeder::class);

    expect(User::where('email', 'admin@diskominfo.go.id')->exists())->toBeTrue()
        ->and(User::where('email', 'admin@diskominfo.test')->exists())->toBeTrue()
        ->and(Setting::get('freshness_days'))->toBe(30)
        ->and(Setting::get('check_interval_hours'))->toBe(6)
        ->and(Instansi::count())->toBe(0)
        ->and(Check::count())->toBe(0);
});

it('DatabaseSeeder secara default menjalankan CleanProductionSeeder sehingga tabel instansi kosong bersih', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Instansi::count())->toBe(0)
        ->and(Check::count())->toBe(0)
        ->and(User::where('email', 'admin@diskominfo.go.id')->exists())->toBeTrue();
});
