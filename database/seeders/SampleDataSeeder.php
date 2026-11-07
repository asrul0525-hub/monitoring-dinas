<?php

namespace Database\Seeders;

use App\Models\Instansi;
use App\Models\Setting;
use App\Models\User;
use App\Monitoring\FakeMonitor;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@diskominfo.test'],
            [
                'name' => 'Admin Diskominfo',
                'password' => Hash::make((string) env('ADMIN_PASSWORD', 'password')),
                'email_verified_at' => now(),
                'alerts_seen_at' => now()->subDays(2),
            ]
        );

        Setting::put('freshness_days', 30);
        Setting::put('check_interval_hours', 6);

        $monitor = app(FakeMonitor::class);
        $end = CarbonImmutable::now()->startOfHour();
        $start = $end->subDays(90);

        DB::transaction(function () use ($monitor, $start, $end) {
            for ($i = 1; $i <= 40; $i++) {
                $num = sprintf('%02d', $i);
                $feedUrl = match ($i % 3) {
                    0 => null,
                    1 => "https://dinas-contoh-{$num}.go.id/sitemap.xml",
                    default => "https://dinas-contoh-{$num}.go.id/feed/rss.xml",
                };

                $instansi = Instansi::query()->create([
                    'nama' => "Dinas Contoh {$num}",
                    'url' => "https://dinas-contoh-{$num}.go.id",
                    'feed_url' => $feedUrl,
                    'status' => null,
                ]);

                $cursor = $start;
                while ($cursor->lessThanOrEqualTo($end)) {
                    $monitor->check($instansi, $cursor);
                    $cursor = $cursor->addHours(6);
                }
            }

            for ($i = 41; $i <= 42; $i++) {
                $num = sprintf('%02d', $i);
                Instansi::query()->create([
                    'nama' => "Dinas Contoh {$num}",
                    'url' => "https://dinas-contoh-{$num}.go.id",
                    'feed_url' => "https://dinas-contoh-{$num}.go.id/sitemap.xml",
                    'status' => null,
                ]);
            }
        });
    }
}
