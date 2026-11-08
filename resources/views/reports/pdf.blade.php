<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Monitoring Website Dinas — Diskominfo Kab. Hulu Sungai Utara</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 14mm 14mm 16mm 14mm;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9.5pt;
            color: #0F172A;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        /* Kop Resmi Pemerintah Kabupaten Hulu Sungai Utara */
        .header-card {
            border-bottom: 2.5px solid #1E293B;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .header-layout {
            width: 100%;
            border-collapse: collapse;
        }
        .header-layout td {
            border: none;
            padding: 0;
            vertical-align: middle;
        }
        .emblem-box {
            width: 54px;
            padding-right: 12px;
        }
        .emblem-badge {
            width: 46px;
            height: 46px;
            background-color: #1E293B;
            color: #FFFFFF;
            border-radius: 8px;
            text-align: center;
            line-height: 46px;
            font-weight: bold;
            font-size: 13pt;
            letter-spacing: 0.5px;
        }
        .gov-kicker {
            font-size: 8.5pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            color: #334155;
            text-transform: uppercase;
            margin: 0;
        }
        .gov-agency {
            font-size: 13pt;
            font-weight: bold;
            color: #0F172A;
            margin: 1px 0 2px 0;
            letter-spacing: 0.2px;
        }
        .gov-sub {
            font-size: 8pt;
            color: #475569;
            margin: 0;
        }
        .doc-badge-cell {
            text-align: right;
            vertical-align: top;
        }
        .doc-title-pill {
            display: inline-block;
            background-color: #EFF6FF;
            border: 1px solid #BFDBFE;
            color: #1D4ED8;
            font-size: 8pt;
            font-weight: bold;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-meta-right {
            font-size: 8pt;
            color: #475569;
            margin-top: 4px;
        }

        /* Bar Informasi Filter */
        .meta-strip {
            width: 100%;
            border-collapse: collapse;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            margin-bottom: 12px;
        }
        .meta-strip td {
            border: none;
            padding: 6px 10px;
            font-size: 8.5pt;
            color: #334155;
        }
        .meta-strip strong {
            color: #0F172A;
        }

        /* Executive Summary Cards */
        .summary-grid {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin: 0 -8px 14px -8px;
        }
        .summary-card {
            width: 25%;
            background-color: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-top: 3px solid #1E293B;
            padding: 7px 10px;
            vertical-align: top;
        }
        .summary-card--aktif {
            border-top-color: #059669;
        }
        .summary-card--kurang {
            border-top-color: #D97706;
        }
        .summary-card--tidak {
            border-top-color: #DC2626;
        }
        .summary-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #64748B;
            font-weight: bold;
        }
        .summary-value {
            font-size: 13pt;
            font-weight: bold;
            color: #0F172A;
            margin-top: 2px;
            font-family: DejaVu Sans Mono, monospace;
        }

        /* Tabel Data Utama */
        table.data-table {
            width: 100%;
            border-collapse: collapse;
        }
        table.data-table th {
            background-color: #1E293B;
            color: #FFFFFF;
            font-weight: bold;
            font-size: 8.5pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding: 7px 8px;
            border: 1px solid #1E293B;
            text-align: left;
        }
        table.data-table th.num {
            text-align: right;
        }
        table.data-table td {
            border: 1px solid #CBD5E1;
            padding: 6px 8px;
            vertical-align: middle;
            font-size: 8.8pt;
            color: #1E293B;
        }
        table.data-table tr.row-even td {
            background-color: #F8FAFC;
        }
        table.data-table td.num {
            text-align: right;
            font-family: DejaVu Sans Mono, monospace;
            font-size: 8.5pt;
        }
        .instansi-name {
            font-weight: bold;
            color: #0F172A;
        }
        .kategori-pill {
            display: inline-block;
            padding: 2px 6px;
            font-size: 7.5pt;
            font-weight: bold;
            background-color: #F1F5F9;
            color: #334155;
            border: 1px solid #CBD5E1;
            border-radius: 3px;
        }
        .url-text {
            font-family: DejaVu Sans Mono, monospace;
            font-size: 8pt;
            color: #2563EB;
        }

        /* Semantic Status Badges */
        .status-badge {
            display: inline-block;
            padding: 2px 7px;
            font-weight: bold;
            font-size: 7.5pt;
            border-radius: 3px;
            letter-spacing: 0.3px;
        }
        .status-aktif {
            background-color: #ECFDF5;
            color: #047857;
            border: 1px solid #A7F3D0;
        }
        .status-kurang {
            background-color: #FFFBEB;
            color: #B45309;
            border: 1px solid #FDE68A;
        }
        .status-tidak {
            background-color: #FEF2F2;
            color: #B91C1C;
            border: 1px solid #FECACA;
        }
        .status-pending {
            background-color: #F1F5F9;
            color: #475569;
            border: 1px solid #CBD5E1;
        }

        /* Footer & Pengesahan */
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
        }
        .footer-table td {
            border: none;
            padding: 0;
            vertical-align: top;
            font-size: 8.5pt;
            color: #475569;
        }
        .signature-box {
            text-align: right;
        }
        .signature-title {
            font-weight: bold;
            color: #0F172A;
            margin-top: 2px;
        }
        .signature-space {
            height: 36px;
        }
        .signature-line {
            font-weight: bold;
            color: #0F172A;
            text-decoration: underline;
        }
    </style>
</head>
<body>
    @php
        $totalInstansi = $rows->count();
        $uptimeValues = $rows->pluck('uptimePct')->filter(fn ($v) => $v !== null);
        $avgUptime = $uptimeValues->isNotEmpty() ? round((float) $uptimeValues->avg(), 1) : null;
        $totalDown = (int) $rows->sum('downtimeCount');
        $endDownCount = $rows->where('endStatus', 'tidak-aktif')->count();

        $kategoriFilterLabel = match ($filters['kategori'] ?? null) {
            'vertikal' => 'Instansi Vertikal',
            'dinas' => 'Dinas',
            'kec_kel_pkm' => 'Kec/Kel/PKM',
            default => null,
        };
    @endphp

    <!-- Kop Laporan Resmi Diskominfo HSU (Amuntai) -->
    <div class="header-card">
        <table class="header-layout">
            <tr>
                <td class="emblem-box">
                    <div class="emblem-badge">HSU</div>
                </td>
                <td>
                    <p class="gov-kicker">Pemerintah Kabupaten Hulu Sungai Utara</p>
                    <p class="gov-agency">DINAS KOMUNIKASI, INFORMATIKA, DAN PERSANDIAN</p>
                    <p class="gov-sub">Pusat Observasi &amp; Monitoring Website Layanan Publik Daerah · Amuntai, Kalimantan Selatan</p>
                </td>
                <td class="doc-badge-cell">
                    <span class="doc-title-pill">Laporan Eksekutif Monitoring</span>
                    <div class="doc-meta-right">Dicetak: {{ $printedAt }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Parameter Filter Laporan -->
    <table class="meta-strip">
        <tr>
            <td><strong>Periode Evaluasi:</strong> {{ $filters['dari'] }} s/d {{ $filters['sampai'] }}</td>
            <td><strong>Cakupan Instansi:</strong>
                @if (count($filters['instansi']) > 0)
                    {{ count($filters['instansi']) }} Instansi Terpilih
                @elseif ($kategoriFilterLabel)
                    Kategori {{ $kategoriFilterLabel }}
                @else
                    Semua Instansi
                @endif
            </td>
            <td><strong>Filter Status Akhir:</strong> {{ $filters['status'] ? strtoupper($filters['status']) : 'SEMUA STATUS' }}</td>
        </tr>
    </table>

    <!-- 4 Kartu Ringkasan Eksekutif -->
    <table class="summary-grid">
        <tr>
            <td class="summary-card">
                <div class="summary-label">Total Website Dipantau</div>
                <div class="summary-value">{{ $totalInstansi }} Unit</div>
            </td>
            <td class="summary-card summary-card--aktif">
                <div class="summary-label">Rata-rata Uptime Periode</div>
                <div class="summary-value">{{ $avgUptime !== null ? number_format($avgUptime, 1) . '%' : '—' }}</div>
            </td>
            <td class="summary-card summary-card--kurang">
                <div class="summary-label">Total Kejadian Gangguan (Down)</div>
                <div class="summary-value">{{ $totalDown }} Kali</div>
            </td>
            <td class="summary-card summary-card--tidak">
                <div class="summary-label">Tidak Aktif di Akhir Periode</div>
                <div class="summary-value">{{ $endDownCount }} Unit</div>
            </td>
        </tr>
    </table>

    <!-- Tabel Rekapitulasi Data -->
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 4%;" class="num">No</th>
                <th style="width: 21%;">Nama Instansi</th>
                <th style="width: 13%;">Kategori</th>
                <th style="width: 20%;">URL Website</th>
                <th style="width: 9%;" class="num">Uptime (%)</th>
                <th style="width: 9%;" class="num">Insiden Down</th>
                <th style="width: 10%;" class="num">Rata-rata Latensi</th>
                <th style="width: 14%;">Pembaruan &amp; Status Akhir</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $index => $row)
                @php
                    $statusKey = $row['endStatus'] ?? null;
                    $statusLabel = match ($statusKey) {
                        'aktif' => 'AKTIF',
                        'kurang-aktif' => 'KURANG AKTIF',
                        'tidak-aktif' => 'TIDAK AKTIF',
                        default => 'MENUNGGU CEK PERTAMA',
                    };
                    $statusClass = match ($statusKey) {
                        'aktif' => 'status-aktif',
                        'kurang-aktif' => 'status-kurang',
                        'tidak-aktif' => 'status-tidak',
                        default => 'status-pending',
                    };
                    $kategoriLabel = match ($row['kategori'] ?? 'dinas') {
                        'vertikal' => 'Instansi Vertikal',
                        'kec_kel_pkm' => 'Kec/Kel/PKM',
                        default => 'Dinas',
                    };
                @endphp
                <tr class="{{ $index % 2 === 1 ? 'row-even' : '' }}">
                    <td class="num">{{ $index + 1 }}</td>
                    <td><span class="instansi-name">{{ $row['nama'] }}</span></td>
                    <td><span class="kategori-pill">{{ $kategoriLabel }}</span></td>
                    <td><span class="url-text">{{ $row['url'] }}</span></td>
                    <td class="num">{{ $row['uptimePct'] !== null ? number_format((float) $row['uptimePct'], 1) . '%' : '—' }}</td>
                    <td class="num">{{ $row['downtimeCount'] }} kali</td>
                    <td class="num">{{ $row['avgResponseMs'] !== null ? $row['avgResponseMs'] . ' ms' : '—' }}</td>
                    <td>
                        <div style="font-size: 8pt; color: #475569; margin-bottom: 3px;">
                            Update: {{ $row['daysSinceUpdate'] !== null ? $row['daysSinceUpdate'] . ' hari lalu' : 'Tidak terdeteksi' }}
                        </div>
                        <span class="status-badge {{ $statusClass }}">{{ $statusLabel }}</span>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align: center; padding: 18px; color: #64748B;">Tidak ada data</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Catatan Metodologi & Blok Verifikasi -->
    <table class="footer-table">
        <tr>
            <td style="width: 62%;">
                <strong>Catatan Metodologi Evaluasi:</strong><br>
                1. Status <strong>AKTIF</strong>: Website merespons HTTP 200 OK dan memiliki pembaruan konten dalam kurun waktu &le; 30 hari.<br>
                2. Status <strong>KURANG AKTIF</strong>: Website merespons HTTP 200 OK namun belum memperbarui konten &gt; 30 hari.<br>
                3. Status <strong>TIDAK AKTIF</strong>: Website mengalami kegagalan koneksi jaringan, timeout, atau kode HTTP 4xx/5xx.
            </td>
            <td class="signature-box" style="width: 38%;">
                <div>Amuntai, {{ $printedAt }}</div>
                <div class="signature-title">Dinas Komunikasi, Informatika, dan Persandian</div>
                <div>Kabupaten Hulu Sungai Utara</div>
                <div class="signature-space"></div>
                <div class="signature-line">Administrator Sistem Monitoring Website</div>
            </td>
        </tr>
    </table>
</body>
</html>
