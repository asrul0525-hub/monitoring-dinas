<?php

use App\Enums\Status;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\Setting;

it('menghapus riwayat saat instansi dihapus', function () {
    $i = Instansi::factory()->has(Check::factory()->count(3))->create();
    $i->delete();
    expect(Check::count())->toBe(0);
});

it('toRow memakai key camelCase dan status null untuk instansi baru', function () {
    $row = Instansi::factory()->create(['status' => null])->toRow();
    expect($row)->toHaveKeys([
        'id',
        'nama',
        'url',
        'feedUrl',
        'status',
        'lastContentAt',
        'lastCheckedAt',
        'lastResponseMs',
        'lastHttpCode',
        'contentSource',
        'downSince',
    ])->and($row['status'])->toBeNull();
});

it('Setting::get mengembalikan default 30 untuk freshness_days dan bisa disimpan', function () {
    expect(Setting::get('freshness_days', 30))->toBe(30);
    Setting::put('freshness_days', 14);
    expect(Setting::get('freshness_days', 30))->toBe(14);
});

it('Status::label mengembalikan label Bahasa Indonesia', function () {
    expect(Status::Aktif->label())->toBe('Aktif')
        ->and(Status::KurangAktif->label())->toBe('Kurang Aktif')
        ->and(Status::TidakAktif->label())->toBe('Tidak Aktif');
});
