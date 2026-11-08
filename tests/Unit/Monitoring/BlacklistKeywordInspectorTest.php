<?php

use App\Monitoring\Inspectors\BlacklistKeywordInspector;
use Tests\TestCase;

uses(TestCase::class);

it('BlacklistKeywordInspector mendeteksi kalimat situs ditutup (This site has been closed)', function () {
    $html = '<html><head><title>Sorry, site has been closed</title></head><body><h1>Sorry! This site has been closed by administrator! Please contact administrator!</h1></body></html>';

    $reason = BlacklistKeywordInspector::inspect($html);

    expect($reason)->not->toBeNull()
        ->and($reason)->toContain('Situs Ditutup');
});

it('BlacklistKeywordInspector mendeteksi halaman Account Suspended dan Domain Expired', function () {
    $htmlSuspended = '<html><head><title>Account Suspended</title></head><body>This Account has been suspended.</body></html>';
    $htmlExpired = '<html><body><h1>Domain Expired</h1><p>Masa aktif domain telah habis.</p></body></html>';

    expect(BlacklistKeywordInspector::inspect($htmlSuspended))->toContain('Hosting Disuspend')
        ->and(BlacklistKeywordInspector::inspect($htmlExpired))->toContain('Domain Kedaluwarsa');
});

it('BlacklistKeywordInspector mendeteksi halaman Under Maintenance / Website sedang dalam perbaikan', function () {
    $htmlMaint = '<html><head><title>Under Maintenance</title></head><body><p>Website sedang dalam perbaikan. Silakan kembali nanti.</p></body></html>';

    expect(BlacklistKeywordInspector::inspect($htmlMaint))->not->toBeNull()
        ->and(BlacklistKeywordInspector::inspect($htmlMaint))->toContain('Perbaikan');
});

it('BlacklistKeywordInspector tidak salah menandai portal berita panjang yang memuat berita perbaikan jalan', function () {
    $longArticle = str_repeat('Pemerintah Kabupaten Hulu Sungai Utara melaksanakan kegiatan pembangunan daerah secara berkelanjutan. ', 30);
    $htmlNormal = "<html><head><title>Portal Resmi Dinas PUPR HSU</title></head><body><h1>Berita Terkini</h1><p>{$longArticle}</p><p>Kegiatan website sedang dalam perbaikan sistem jaringan jalan raya di Kecamatan Amuntai Tengah berjalan lancar.</p></body></html>";

    expect(BlacklistKeywordInspector::inspect($htmlNormal))->toBeNull();
});
