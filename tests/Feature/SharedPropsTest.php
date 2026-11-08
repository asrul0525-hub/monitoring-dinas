<?php

use App\Enums\Status;
use App\Models\Instansi;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('menyediakan statusCounts, isSampleData, schedule, dan alerts pada shared props', function () {
    $user = User::factory()->create([
        'alerts_seen_at' => now()->subHours(3),
    ]);

    Instansi::factory()->count(26)->create(['status' => Status::Aktif, 'down_since' => null]);
    Instansi::factory()->count(9)->create(['status' => Status::KurangAktif, 'down_since' => null]);
    Instansi::factory()->count(3)->create([
        'status' => Status::TidakAktif,
        'down_since' => now()->subHours(5), // before alerts_seen_at
    ]);
    Instansi::factory()->count(2)->create([
        'status' => Status::TidakAktif,
        'down_since' => now()->subHour(), // after alerts_seen_at
    ]);
    Instansi::factory()->count(2)->create([
        'status' => null,
        'last_checked_at' => null,
        'down_since' => null,
    ]);

    $response = $this->actingAs($user)->get('/');

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isSampleData', false)
            ->where('statusCounts.aktif', 26)
            ->where('statusCounts.kurang-aktif', 9)
            ->where('statusCounts.tidak-aktif', 5)
            ->where('statusCounts.menunggu', 2)
            ->where('alerts.count', 2)
            ->has('alerts.items', 2)
            ->has('schedule')
        );
});
