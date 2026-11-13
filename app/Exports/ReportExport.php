<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ReportExport implements FromCollection, ShouldAutoSize, WithHeadings, WithStyles, WithTitle
{
    /**
     * @param  Collection<int, array<string, mixed>>  $rows
     */
    public function __construct(
        private readonly Collection $rows,
    ) {}

    public function title(): string
    {
        return 'RADAR HSU - Monitoring';
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Nama Instansi',
            'Kategori Instansi',
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
                ['Tidak ada data', '', '', '', '', '', '', ''],
            ]);
        }

        return $this->rows->map(function (array $row): array {
            $statusLabel = match ($row['endStatus'] ?? null) {
                'aktif' => 'Aktif',
                'kurang-aktif' => 'Kurang Aktif',
                'tidak-aktif' => 'Tidak Aktif',
                default => 'Menunggu cek pertama',
            };

            $kategoriLabel = match ($row['kategori'] ?? 'dinas') {
                'vertikal' => 'Instansi Vertikal',
                'kec_kel_pkm' => 'Kec/Kel/PKM',
                default => 'Dinas',
            };

            return [
                $row['nama'],
                $kategoriLabel,
                $row['url'],
                $row['uptimePct'] !== null ? number_format((float) $row['uptimePct'], 1) : '—',
                $row['downtimeCount'],
                $row['avgResponseMs'] ?? '—',
                $row['daysSinceUpdate'] ?? 'Tanggal konten tidak ditemukan',
                $statusLabel,
            ];
        });
    }

    public function styles(Worksheet $sheet): array
    {
        $rowCount = max(1, $this->rows->count()) + 1;
        $fullRange = "A1:H{$rowCount}";

        // Header utama bergaya Navy Eksekutif Diskominfo HSU
        $sheet->getStyle('A1:H1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(26);

        // Border halus untuk seluruh sel tabel
        $sheet->getStyle($fullRange)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CBD5E1'],
                ],
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        // Zebra striping dan pewarnaan semantik kolom Status Akhir (Kolom H)
        if ($this->rows->isNotEmpty()) {
            foreach ($this->rows->values() as $idx => $row) {
                $excelRow = $idx + 2;
                $sheet->getRowDimension($excelRow)->setRowHeight(21);

                if ($idx % 2 === 1) {
                    $sheet->getStyle("A{$excelRow}:G{$excelRow}")->applyFromArray([
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'F8FAFC'],
                        ],
                    ]);
                }

                // Perataan angka kanan untuk kolom D, E, F, G
                $sheet->getStyle("D{$excelRow}:G{$excelRow}")
                    ->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                $statusStyle = match ($row['endStatus'] ?? null) {
                    'aktif' => ['bg' => 'ECFDF5', 'fg' => '047857'],
                    'kurang-aktif' => ['bg' => 'FFFBEB', 'fg' => 'B45309'],
                    'tidak-aktif' => ['bg' => 'FEF2F2', 'fg' => 'B91C1C'],
                    default => ['bg' => 'F1F5F9', 'fg' => '475569'],
                };

                $sheet->getStyle("H{$excelRow}")->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => $statusStyle['fg']],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => $statusStyle['bg']],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ]);
            }
        }

        return [];
    }
}
