<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CleanProductionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['admin@diskominfo.go.id', 'admin@diskominfo.test'] as $adminEmail) {
            User::query()->updateOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => 'Admin Diskominfo HSU',
                    'password' => Hash::make((string) env('ADMIN_PASSWORD', 'password')),
                    'email_verified_at' => now(),
                    'alerts_seen_at' => now(),
                ]
            );
        }

        Setting::put('freshness_days', 30);
        Setting::put('check_interval_hours', 6);
    }
}
