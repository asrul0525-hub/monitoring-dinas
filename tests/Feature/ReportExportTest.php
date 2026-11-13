<?php

use App\Enums\Status;
use App\Exports\ReportExport;
use App\Models\Check;
use App\Models\Instansi;
use App\Models\User;
use Carbon\CarbonImmutable;
use Maatwebsite\Excel\Facades\Excel;

it('mengunduh file excel sesuai filter yang aktif', function () {
    Excel::fake();

    $user = User::factory()->create();
    $instansi = Instansi::factory()->create(['nama' => 'Dinas Contoh 01']);
    Check::factory()->create([
        'instansi_id' => $instansi->id,
        'checked_at' => CarbonImmutable::parse('2026-10-15T10:00:00Z'),
        'http_code' => 200,
        'response_ms' => 210,
        'content_date' => CarbonImmutable::parse('2026-10-14T00:00:00Z'),
        'status' => Status::Aktif,
    ]);

    $this->actingAs($user)
        ->get('/laporan/export/excel?dari=2026-10-01&sampai=2026-10-31')
        ->assertOk();

    Excel::assertDownloaded(
        'laporan-monitoring-2026-10-01_2026-10-31.xlsx',
        fn (ReportExport $export) => $export->collection()->count() === 1
    );
});

it('mengunduh file pdf dengan content-type application/pdf', function () {
    $user = User::factory()->create();
    Instansi::factory()->create(['nama' => 'Dinas Contoh 01']);

    $response = $this->actingAs($user)
        ->get('/laporan/export/pdf?dari=2026-10-01&sampai=2026-10-31');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});

it('tetap mengembalikan 200 dan menampilkan pesan Tidak ada data saat filter kosong', function () {
    Excel::fake();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/laporan/export/excel?dari=2026-10-01&sampai=2026-10-31&status=tidak-aktif')
        ->assertOk();

    Excel::assertDownloaded(
        'laporan-monitoring-2026-10-01_2026-10-31.xlsx',
        function (ReportExport $export) {
            $rows = $export->collection();

            return $rows->count() === 1 && $rows->first()[0] === 'Tidak ada data';
        }
    );

    $html = view('reports.pdf', [
        'rows' => collect(),
        'filters' => [
            'instansi' => [],
            'dari' => '2026-10-01',
            'sampai' => '2026-10-31',
            'status' => 'tidak-aktif',
        ],
        'printedAt' => '08 Nov 2026 10:00 WITA',
    ])->render();

    expect($html)
        ->toContain('Tidak ada data')
        ->toContain('RADAR HSU')
        ->toContain('Diskominfosandi HSU')
        ->toContain('Pemerintah Kabupaten Hulu Sungai Utara')
        ->toContain('DINAS KOMUNIKASI, INFORMATIKA, DAN PERSANDIAN');
});

it('mengarahkan tamu ke halaman login saat mengakses export', function () {
    $this->get('/laporan/export/pdf')->assertRedirect('/login');
    $this->get('/laporan/export/excel')->assertRedirect('/login');
});
