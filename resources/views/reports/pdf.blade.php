<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Monitoring Website Dinas</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 18mm 15mm;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10pt;
            color: #000000;
            line-height: 1.4;
        }
        h1 {
            font-size: 15pt;
            margin: 0 0 4px 0;
        }
        .meta {
            font-size: 9pt;
            color: #222222;
            margin-bottom: 14px;
            border-bottom: 1.5px solid #000000;
            padding-bottom: 8px;
        }
        .meta span {
            margin-right: 18px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #000000;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #eeeeee;
            font-weight: bold;
            font-size: 9pt;
        }
        td.num {
            text-align: right;
            font-family: DejaVu Sans Mono, monospace;
        }
        .status-box {
            display: inline-block;
            padding: 2px 6px;
            border: 1px solid #000000;
            font-weight: bold;
            font-size: 8.5pt;
        }
    </style>
</head>
<body>
    <h1>Laporan Rekapitulasi Monitoring Website Dinas</h1>
    <div class="meta">
        <span><strong>Periode:</strong> {{ $filters['dari'] }} s/d {{ $filters['sampai'] }}</span>
        <span><strong>Filter Status:</strong> {{ $filters['status'] ? strtoupper($filters['status']) : 'Semua Status' }}</span>
        <span><strong>Filter Instansi:</strong> {{ count($filters['instansi']) > 0 ? count($filters['instansi']) . ' instansi dipilih' : 'Semua Instansi' }}</span>
        <span><strong>Dicetak pada:</strong> {{ $printedAt }}</span>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 24%;">Nama Instansi</th>
                <th style="width: 22%;">URL Website</th>
                <th style="width: 10%;">Uptime (%)</th>
                <th style="width: 10%;">Jumlah Down</th>
                <th style="width: 12%;">Rata-rata Response Time</th>
                <th style="width: 18%;">Hari Sejak Update / Status Akhir</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $index => $row)
                @php
                    $statusLabel = match ($row['endStatus'] ?? null) {
                        'aktif' => 'AKTIF',
                        'kurang-aktif' => 'KURANG AKTIF',
                        'tidak-aktif' => 'TIDAK AKTIF',
                        default => 'MENUNGGU CEK PERTAMA',
                    };
                @endphp
                <tr>
                    <td class="num">{{ $index + 1 }}</td>
                    <td><strong>{{ $row['nama'] }}</strong></td>
                    <td>{{ $row['url'] }}</td>
                    <td class="num">{{ $row['uptimePct'] !== null ? number_format((float) $row['uptimePct'], 1) . '%' : '—' }}</td>
                    <td class="num">{{ $row['downtimeCount'] }} kali</td>
                    <td class="num">{{ $row['avgResponseMs'] !== null ? $row['avgResponseMs'] . ' ms' : '—' }}</td>
                    <td>
                        <div>Update: {{ $row['daysSinceUpdate'] !== null ? $row['daysSinceUpdate'] . ' hari' : 'Tanggal konten tidak ditemukan' }}</div>
                        <div style="margin-top: 3px;"><span class="status-box">{{ $statusLabel }}</span></div>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" style="text-align: center; padding: 16px;">Tidak ada data</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
