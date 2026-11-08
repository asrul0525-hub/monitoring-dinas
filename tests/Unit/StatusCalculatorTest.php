<?php

use App\Enums\Status;
use App\Monitoring\StatusCalculator;
use Carbon\CarbonImmutable;

function classify(?int $httpCode, ?CarbonImmutable $contentDate, int $freshnessDays = 30): Status
{
    $now = CarbonImmutable::parse('2026-11-07T14:00:00Z');

    return StatusCalculator::classify($httpCode, $contentDate, $now, $freshnessDays);
}

it('aktif bila 200 dan konten 30 hari lalu', function () {
    $now = CarbonImmutable::parse('2026-11-07T14:00:00Z');
    expect(classify(200, $now->subDays(30)))->toBe(Status::Aktif);
});

it('kurang aktif bila 200 dan konten 31 hari lalu', function () {
    $now = CarbonImmutable::parse('2026-11-07T14:00:00Z');
    expect(classify(200, $now->subDays(31)))->toBe(Status::KurangAktif);
});

it('kurang aktif bila 200 dan tanggal konten tidak ditemukan', function () {
    expect(classify(200, null))->toBe(Status::KurangAktif);
});

it('tidak aktif untuk 404, 500, 502, timeout', function (?int $code) {
    $now = CarbonImmutable::parse('2026-11-07T14:00:00Z');
    expect(classify($code, $now))->toBe(Status::TidakAktif);
})->with([404, 500, 502, null]);

it('menganggap HTTP 403 (WAF Challenge) sebagai server aktif: kurang aktif bila tanpa tanggal, aktif bila tanggal mutakhir', function () {
    $now = CarbonImmutable::parse('2026-11-07T14:00:00Z');
    expect(classify(403, null))->toBe(Status::KurangAktif)
        ->and(classify(403, $now->subDays(5)))->toBe(Status::Aktif);
});

it('memakai ambang dari parameter', function () {
    $now = CarbonImmutable::parse('2026-11-07T14:00:00Z');
    expect(classify(200, $now->subDays(10), freshnessDays: 7))->toBe(Status::KurangAktif);
});
