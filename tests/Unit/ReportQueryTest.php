<?php

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Reports\ReportQuery;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('menghitung uptimePct, downtimeCount, endStatus dalam periode, dan memfilter endStatus', function () {
    $dari = CarbonImmutable::parse('2026-10-01T00:00:00Z');
    $sampai = CarbonImmutable::parse('2026-10-31T23:59:59Z');

    $instansi = Instansi::factory()->create([
        'nama' => 'Dinas Contoh 01',
        'status' => Status::TidakAktif, // current status outside period is TidakAktif
    ]);

    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => CarbonImmutable::parse('2026-10-05T10:00:00Z'),
        'http_code' => null,
        'response_ms' => null,
        'content_date' => null,
        'status' => Status::TidakAktif,
    ]);
    Check::factory()->count(3)->create([
        'instansi_id' => $instansi->id,
        'checked_at' => CarbonImmutable::parse('2026-10-20T10:00:00Z'),
        'http_code' => 200,
        'response_ms' => 300,
        'content_date' => CarbonImmutable::parse('2026-10-19T00:00:00Z'),
        'status' => Status::Aktif,
    ]);

    // Check outside period (November) that flipped current status to TidakAktif
    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => CarbonImmutable::parse('2026-11-05T10:00:00Z'),
        'http_code' => 502,
        'response_ms' => null,
        'status' => Status::TidakAktif,
    ]);

    $rows = ReportQuery::summarize([], $dari, $sampai, null);
    expect($rows)->toHaveCount(1);

    $row = $rows->first();
    expect($row['uptimePct'])->toBe(75.0)
        ->and($row['downtimeCount'])->toBe(1)
        ->and($row['avgResponseMs'])->toBe(300)
        ->and($row['endStatus'])->toBe('aktif')
        ->and($row['daysSinceUpdate'])->toBe(12);

    $filteredDown = ReportQuery::summarize([], $dari, $sampai, Status::TidakAktif);
    expect($filteredDown)->toHaveCount(0);
});
