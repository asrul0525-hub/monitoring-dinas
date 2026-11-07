<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ReportExport implements FromCollection, WithHeadings
{
    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     */
    public function __construct(
        private readonly Collection $rows,
    ) {}

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Nama Instansi',
            'URL Website',
            'Uptime (%)',
            'Jumlah Down',
            'Rata-rata Response Time (ms)',
            'Hari Sejak Update Terakhir',
            'Status Akhir Periode',
        ];
    }

    /**
     * @return Collection<int, array<int, mixed>>
     */
    public function collection(): Collection
    {
        if ($this->rows->isEmpty()) {
            return collect([
                ['Tidak ada data', '', '', '', '', '', ''],
            ]);
        }

        return $this->rows->map(function (array $row): array {
            $statusLabel = match ($row['endStatus'] ?? null) {
                'aktif' => 'Aktif',
                'kurang-aktif' => 'Kurang Aktif',
                'tidak-aktif' => 'Tidak Aktif',
                default => 'Menunggu cek pertama',
            };

            return [
                $row['nama'],
                $row['url'],
                $row['uptimePct'] !== null ? number_format((float) $row['uptimePct'], 1) : '—',
                $row['downtimeCount'],
                $row['avgResponseMs'] ?? '—',
                $row['daysSinceUpdate'] ?? 'Tanggal konten tidak ditemukan',
                $statusLabel,
            ];
        });
    }
}
