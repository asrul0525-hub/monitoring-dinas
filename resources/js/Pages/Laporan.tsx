import { AppShell } from '@/Components/shell/AppShell';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs } from '@/lib/format';
import { SharedProps, StatusKey } from '@/types/monitoring';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { endOfMonth, endOfQuarter, format, startOfMonth, startOfQuarter } from 'date-fns';
import { FormEvent, useMemo, useState } from 'react';

export interface ReportRow {
    instansiId: number;
    nama: string;
    url: string;
    uptimePct: number | null;
    downtimeCount: number;
    avgResponseMs: number | null;
    daysSinceUpdate: number | null;
    endStatus: StatusKey | null;
}

interface LaporanProps extends SharedProps {
    rows: ReportRow[];
    instansiOptions: { id: number; nama: string }[];
    filters: {
        instansi: number[];
        dari: string;
        sampai: string;
        status: StatusKey | null;
    };
}

const columnHelper = createColumnHelper<ReportRow>();

export default function Laporan({ rows, instansiOptions, filters }: LaporanProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const [selectedInstansi, setSelectedInstansi] = useState<number[]>(filters.instansi ?? []);
    const [dari, setDari] = useState<string>(filters.dari);
    const [sampai, setSampai] = useState<string>(filters.sampai);
    const [status, setStatus] = useState<string>(filters.status ?? '');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);

    const applyFilters = (next: {
        instansi: number[];
        dari: string;
        sampai: string;
        status: string;
    }) => {
        const query: Record<string, unknown> = {
            dari: next.dari,
            sampai: next.sampai,
        };
        if (next.instansi.length > 0) {
            query.instansi = next.instansi;
        }
        if (next.status !== '') {
            query.status = next.status;
        }
        router.get('/laporan', query as Record<string, string>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        applyFilters({ instansi: selectedInstansi, dari, sampai, status });
    };

    const applyPreset = (preset: 'bulan' | 'kuartal') => {
        const now = new Date();
        const nextDari =
            preset === 'bulan'
                ? format(startOfMonth(now), 'yyyy-MM-dd')
                : format(startOfQuarter(now), 'yyyy-MM-dd');
        const nextSampai =
            preset === 'bulan'
                ? format(endOfMonth(now), 'yyyy-MM-dd')
                : format(endOfQuarter(now), 'yyyy-MM-dd');
        setDari(nextDari);
        setSampai(nextSampai);
        applyFilters({
            instansi: selectedInstansi,
            dari: nextDari,
            sampai: nextSampai,
            status,
        });
    };

    const resetFilters = () => {
        const now = new Date();
        const nextDari = format(startOfMonth(now), 'yyyy-MM-dd');
        const nextSampai = format(endOfMonth(now), 'yyyy-MM-dd');
        setSelectedInstansi([]);
        setDari(nextDari);
        setSampai(nextSampai);
        setStatus('');
        router.get('/laporan');
    };

    const toggleInstansi = (id: number) => {
        setSelectedInstansi((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        );
    };

    const exportQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('dari', filters.dari);
        params.set('sampai', filters.sampai);
        if (filters.status) {
            params.set('status', filters.status);
        }
        filters.instansi.forEach((id) => {
            params.append('instansi[]', String(id));
        });
        return params.toString();
    }, [filters]);

    const summary = useMemo(() => {
        const withUptime = rows.filter((r) => r.uptimePct !== null);
        const avgUptime =
            withUptime.length > 0
                ? (
                      withUptime.reduce((acc, r) => acc + (r.uptimePct ?? 0), 0) /
                      withUptime.length
                  ).toFixed(1)
                : null;
        const totalDown = rows.reduce((acc, r) => acc + r.downtimeCount, 0);
        const endDownCount = rows.filter((r) => r.endStatus === 'tidak-aktif').length;
        const staleOver30Count = rows.filter(
            (r) => r.daysSinceUpdate !== null && r.daysSinceUpdate > 30,
        ).length;

        return { avgUptime, totalDown, endDownCount, staleOver30Count };
    }, [rows]);

    const columns = useMemo(
        () => [
            columnHelper.accessor('nama', {
                header: 'Nama Instansi',
                cell: (info) => (
                    <div>
                        <Link
                            href={`/instansi/${info.row.original.instansiId}`}
                            className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
                        >
                            {info.getValue()}
                        </Link>
                        <div className="font-mono text-xs text-[var(--text-muted)]">
                            {info.row.original.url}
                        </div>
                    </div>
                ),
            }),
            columnHelper.accessor('uptimePct', {
                header: 'Uptime (%)',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className="font-mono font-semibold text-[var(--text-primary)]">
                            {val !== null ? `${val.toFixed(1)}%` : '—'}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('downtimeCount', {
                header: 'Jumlah Down',
                cell: (info) => (
                    <span className="font-mono text-[var(--text-primary)]">
                        {info.getValue()} kali
                    </span>
                ),
            }),
            columnHelper.accessor('avgResponseMs', {
                header: 'Rata-rata Response Time',
                cell: (info) => (
                    <span className="font-mono text-[var(--text-secondary)]">
                        {formatMs(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor('daysSinceUpdate', {
                header: 'Hari Sejak Update Terakhir',
                cell: (info) => {
                    const val = info.getValue();
                    if (val === null) {
                        return (
                            <span className="text-[var(--text-muted)]">
                                Tanggal konten tidak ditemukan
                            </span>
                        );
                    }
                    return (
                        <span
                            className={`font-mono ${
                                val > 30
                                    ? 'font-semibold text-[var(--status-kurang-text)]'
                                    : 'text-[var(--text-secondary)]'
                            }`}
                        >
                            {val} hari
                        </span>
                    );
                },
            }),
            columnHelper.accessor('endStatus', {
                header: 'Status Akhir Periode',
                cell: (info) => <StatusBadge status={info.getValue()} />,
            }),
        ],
        [],
    );

    const table = useReactTable({
        data: rows,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <AppShell title="Laporan Monitoring">
            <Head title="Laporan Monitoring" />

            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                        Laporan Rekapitulasi Periode
                    </h1>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Ringkasan performa uptime dan pembaruan konten per instansi pada periode{' '}
                        <span className="font-mono font-medium text-[var(--text-primary)]">
                            {filters.dari}
                        </span>{' '}
                        s/d{' '}
                        <span className="font-mono font-medium text-[var(--text-primary)]">
                            {filters.sampai}
                        </span>
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <a
                        href={`/laporan/export/excel?${exportQueryString}`}
                        className="rounded-[var(--radius-ctrl)] border border-[var(--border-glass)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-card-hover)]"
                    >
                        Export Excel
                    </a>
                    <a
                        href={`/laporan/export/pdf?${exportQueryString}`}
                        className="rounded-[var(--radius-ctrl)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-fg)] transition hover:opacity-90"
                    >
                        Export PDF
                    </a>
                </div>
            </div>

            {/* Filter Bar */}
            <form
                onSubmit={handleFormSubmit}
                className="mb-6 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
            >
                <div className="grid grid-cols-12 items-end gap-3">
                    {/* Multi-select Instansi */}
                    <div className="relative col-span-3">
                        <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                            Instansi
                        </label>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((v) => !v)}
                            className="flex w-full items-center justify-between rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-left text-sm text-[var(--text-primary)]"
                        >
                            <span className="truncate">
                                {selectedInstansi.length === 0
                                    ? 'Semua Instansi'
                                    : `${selectedInstansi.length} instansi dipilih`}
                            </span>
                            <span className="ml-2 text-xs text-[var(--text-muted)]">▾</span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-72 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--border-glass)] bg-[var(--bg-elevated)] p-2 shadow-xl">
                                <div className="mb-2 flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedInstansi([])}
                                        className="text-[var(--accent)] hover:underline"
                                    >
                                        Pilih Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(false)}
                                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                    >
                                        Tutup
                                    </button>
                                </div>
                                {instansiOptions.map((opt) => (
                                    <label
                                        key={opt.id}
                                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedInstansi.includes(opt.id)}
                                            onChange={() => toggleInstansi(opt.id)}
                                            className="rounded border-[var(--border-glass)]"
                                        />
                                        <span className="truncate">{opt.nama}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Preset Periode */}
                    <div className="col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                            Preset Periode
                        </label>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => applyPreset('bulan')}
                                className="flex-1 rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                            >
                                Bulan ini
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('kuartal')}
                                className="flex-1 rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                            >
                                Kuartal ini
                            </button>
                        </div>
                    </div>

                    {/* Dari & Sampai */}
                    <div className="col-span-2">
                        <label
                            htmlFor="filter-dari"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                        >
                            Dari Tanggal
                        </label>
                        <input
                            id="filter-dari"
                            type="date"
                            value={dari}
                            onChange={(e) => setDari(e.target.value)}
                            className="w-full rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                        />
                    </div>

                    <div className="col-span-2">
                        <label
                            htmlFor="filter-sampai"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                        >
                            Sampai Tanggal
                        </label>
                        <input
                            id="filter-sampai"
                            type="date"
                            value={sampai}
                            onChange={(e) => setSampai(e.target.value)}
                            className="w-full rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                        />
                    </div>

                    {/* Status Akhir Periode */}
                    <div className="col-span-2">
                        <label
                            htmlFor="filter-status"
                            className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]"
                        >
                            Status Akhir Periode
                        </label>
                        <select
                            id="filter-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                        >
                            <option value="">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="kurang-aktif">Kurang Aktif</option>
                            <option value="tidak-aktif">Tidak Aktif</option>
                        </select>
                    </div>

                    {/* Tombol Terapkan & Reset */}
                    <div className="col-span-1 flex gap-1.5">
                        <button
                            type="submit"
                            className="flex-1 rounded-[var(--radius-ctrl)] bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-fg)] hover:opacity-90"
                        >
                            Terapkan
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            title="Reset filter"
                            className="rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {(errors?.dari || errors?.sampai) && (
                    <p className="mt-2 text-xs font-medium text-[var(--status-tidak-text)]">
                        {errors.dari || errors.sampai}
                    </p>
                )}
            </form>

            {/* Ringkasan Periode */}
            <div className="mb-6 grid grid-cols-4 gap-4">
                <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
                        Rata-rata Uptime Periode
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
                        {summary.avgUptime !== null ? `${summary.avgUptime}%` : '—'}
                    </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
                        Total Kejadian Down
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
                        {summary.totalDown}
                    </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
                        Tidak Aktif di Akhir Periode
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-[var(--status-tidak-text)]">
                        {summary.endDownCount}
                    </div>
                </div>
                <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
                    <div className="text-xs font-medium text-[var(--text-secondary)]">
                        Tanpa Update &gt; 30 Hari
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-[var(--status-kurang-text)]">
                        {summary.staleOver30Count}
                    </div>
                </div>
            </div>

            {/* Tabel Laporan Solid Kontras Tinggi */}
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-table)]">
                {rows.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-base font-medium text-[var(--text-secondary)]">
                            Tidak ada data instansi yang cocok dengan filter laporan ini.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-4 rounded-[var(--radius-ctrl)] border border-[var(--border-glass)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
                        >
                            Reset filter
                        </button>
                    </div>
                ) : (
                    <table className="w-full border-collapse text-left text-[15px]">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr
                                    key={headerGroup.id}
                                    className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className="cursor-pointer select-none px-4 py-3.5 hover:text-[var(--text-primary)]"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                                {{
                                                    asc: '↑',
                                                    desc: '↓',
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="transition hover:bg-[var(--bg-card-hover)]"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-4 py-3.5">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AppShell>
    );
}
