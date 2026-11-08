import { AppShell } from '@/Components/shell/AppShell';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs } from '@/lib/format';
import { KATEGORI_INSTANSI_LABELS, KategoriInstansiKey, SharedProps, StatusKey } from '@/types/monitoring';
import { Link, router, usePage } from '@inertiajs/react';
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
    kategori: KategoriInstansiKey;
    url: string;
    uptimePct: number | null;
    downtimeCount: number;
    avgResponseMs: number | null;
    daysSinceUpdate: number | null;
    endStatus: StatusKey | null;
}

interface LaporanProps extends SharedProps {
    rows: ReportRow[];
    instansiOptions: { id: number; nama: string; kategori: KategoriInstansiKey }[];
    filters: {
        instansi: number[];
        kategori: KategoriInstansiKey | null;
        dari: string;
        sampai: string;
        status: StatusKey | null;
    };
}

const columnHelper = createColumnHelper<ReportRow>();

const KATEGORI_LIST: { key: KategoriInstansiKey | ''; label: string }[] = [
    { key: '', label: 'Semua Instansi' },
    { key: 'vertikal', label: 'Instansi Vertikal' },
    { key: 'dinas', label: 'Dinas' },
    { key: 'kec_kel_pkm', label: 'Kec/Kel/PKM' },
];

export default function Laporan({ rows, instansiOptions, filters }: LaporanProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };

    const [selectedInstansi, setSelectedInstansi] = useState<number[]>(filters.instansi ?? []);
    const [kategori, setKategori] = useState<KategoriInstansiKey | ''>(filters.kategori ?? '');
    const [dari, setDari] = useState<string>(filters.dari);
    const [sampai, setSampai] = useState<string>(filters.sampai);
    const [status, setStatus] = useState<string>(filters.status ?? '');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sorting, setSorting] = useState<SortingState>([]);

    const applyFilters = (next: {
        instansi: number[];
        kategori: KategoriInstansiKey | '';
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
        if (next.kategori !== '') {
            query.kategori = next.kategori;
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
        setDropdownOpen(false);
        applyFilters({ instansi: selectedInstansi, kategori, dari, sampai, status });
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
            kategori,
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
        setKategori('');
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

    const selectCategory = (nextKat: KategoriInstansiKey | '') => {
        setKategori(nextKat);
        setSelectedInstansi([]);
    };

    const visibleInstansiOptions = useMemo(() => {
        if (!kategori) return instansiOptions;
        return instansiOptions.filter((opt) => opt.kategori === kategori);
    }, [instansiOptions, kategori]);

    const selectorButtonLabel = useMemo(() => {
        if (selectedInstansi.length > 0) {
            return `${selectedInstansi.length} instansi dipilih`;
        }
        if (kategori) {
            return `Kategori: ${KATEGORI_INSTANSI_LABELS[kategori]}`;
        }
        return 'Semua Instansi';
    }, [selectedInstansi, kategori]);

    const exportQueryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('dari', filters.dari);
        params.set('sampai', filters.sampai);
        if (filters.kategori) {
            params.set('kategori', filters.kategori);
        }
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
                            className="font-semibold text-ink-primary transition-colors hover:text-accent"
                        >
                            {info.getValue()}
                        </Link>
                        <div className="font-mono text-xs text-ink-secondary">
                            {info.row.original.url}
                        </div>
                    </div>
                ),
            }),
            columnHelper.accessor('kategori', {
                header: 'Kategori',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className="surface-elevated inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                            {KATEGORI_INSTANSI_LABELS[val] ?? val}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('uptimePct', {
                header: 'Uptime (%)',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className="tabular-nums font-mono font-semibold text-ink-primary">
                            {val !== null ? `${val.toFixed(1)}%` : '—'}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('downtimeCount', {
                header: 'Jumlah Down',
                cell: (info) => (
                    <span className="tabular-nums font-mono text-ink-primary">
                        {info.getValue()} kali
                    </span>
                ),
            }),
            columnHelper.accessor('avgResponseMs', {
                header: 'Rata-rata Response Time',
                cell: (info) => (
                    <span className="tabular-nums font-mono text-ink-secondary">
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
                            <span className="text-ink-secondary">
                                Tanggal konten tidak ditemukan
                            </span>
                        );
                    }
                    return (
                        <span
                            className={`tabular-nums font-mono ${
                                val > 30
                                    ? 'font-semibold text-status-kurang'
                                    : 'text-ink-secondary'
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
        <AppShell
            title="Laporan Rekapitulasi Periode"
            subtitle={`Ringkasan performa uptime dan pembaruan konten per instansi pada periode ${filters.dari} s/d ${filters.sampai}`}
            actions={
                <>
                    <a
                        href={`/laporan/export/excel?${exportQueryString}`}
                        className="btn-secondary inline-flex h-10 items-center gap-2 px-4 text-xs"
                    >
                        <svg
                            className="h-4 w-4 text-status-aktif"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        <span>Cetak Excel</span>
                    </a>
                    <a
                        href={`/laporan/export/pdf?${exportQueryString}`}
                        className="btn-primary-pill inline-flex h-10 items-center gap-2 px-5 text-xs"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"
                            />
                        </svg>
                        <span>Cetak PDF</span>
                    </a>
                </>
            }
        >
            {/* Filter Bar */}
            <form onSubmit={handleFormSubmit} className="surface-card mb-6 p-4">
                <div className="grid grid-cols-12 items-end gap-3">
                    {/* Multi-select Instansi + Kategori Instansi */}
                    <div className="relative col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                            Instansi &amp; Kategori
                        </label>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((v) => !v)}
                            className="input-control flex h-10 w-full items-center justify-between px-3 text-left text-xs"
                        >
                            <span className="truncate">{selectorButtonLabel}</span>
                            <span className="ml-2 text-xs text-ink-secondary">▾</span>
                        </button>

                        {dropdownOpen && (
                            <div className="surface-elevated animate-modal-pop absolute left-0 top-full z-30 mt-1 w-80 rounded-xl p-3 shadow-2xl">
                                <div className="mb-2 flex items-center justify-between border-b border-line-subtle pb-2 text-xs">
                                    <span className="font-semibold text-ink-primary">
                                        Pilih Kategori / Instansi
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setDropdownOpen(false)}
                                        className="text-ink-secondary hover:text-ink-primary"
                                    >
                                        Tutup
                                    </button>
                                </div>

                                {/* Pilihan Kategori Instansi */}
                                <div className="mb-2.5 grid grid-cols-2 gap-1.5 border-b border-line-subtle pb-2.5">
                                    {KATEGORI_LIST.map((item) => {
                                        const active = kategori === item.key && selectedInstansi.length === 0;
                                        return (
                                            <button
                                                key={item.label}
                                                type="button"
                                                onClick={() => selectCategory(item.key)}
                                                className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium ${
                                                    active
                                                        ? 'btn-primary-pill text-center'
                                                        : 'surface-card text-ink-secondary hover:text-ink-primary'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="max-h-52 overflow-y-auto pr-1">
                                    {visibleInstansiOptions.map((opt) => (
                                        <label
                                            key={opt.id}
                                            className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-primary hover:bg-surface-card"
                                        >
                                            <span className="flex items-center gap-2 truncate">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedInstansi.includes(opt.id)}
                                                    onChange={() => toggleInstansi(opt.id)}
                                                    className="rounded border-line-strong"
                                                />
                                                <span className="truncate">{opt.nama}</span>
                                            </span>
                                            <span className="shrink-0 text-[10px] text-ink-secondary">
                                                {KATEGORI_INSTANSI_LABELS[opt.kategori]}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Preset Periode */}
                    <div className="col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-ink-secondary">
                            Preset Periode
                        </label>
                        <div className="flex gap-1.5">
                            <button
                                type="button"
                                onClick={() => applyPreset('bulan')}
                                className="btn-secondary h-10 flex-1 px-2.5 text-xs"
                            >
                                Bulan ini
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('kuartal')}
                                className="btn-secondary h-10 flex-1 px-2.5 text-xs"
                            >
                                Kuartal ini
                            </button>
                        </div>
                    </div>

                    {/* Dari & Sampai */}
                    <div className="col-span-2">
                        <label
                            htmlFor="filter-dari"
                            className="mb-1.5 block text-xs font-medium text-ink-secondary"
                        >
                            Dari Tanggal
                        </label>
                        <input
                            id="filter-dari"
                            type="date"
                            value={dari}
                            onChange={(e) => setDari(e.target.value)}
                            className="input-control h-10 w-full px-3 font-mono text-xs"
                        />
                    </div>

                    <div className="col-span-2">
                        <label
                            htmlFor="filter-sampai"
                            className="mb-1.5 block text-xs font-medium text-ink-secondary"
                        >
                            Sampai Tanggal
                        </label>
                        <input
                            id="filter-sampai"
                            type="date"
                            value={sampai}
                            onChange={(e) => setSampai(e.target.value)}
                            className="input-control h-10 w-full px-3 font-mono text-xs"
                        />
                    </div>

                    {/* Status Akhir Periode */}
                    <div className="col-span-2">
                        <label
                            htmlFor="filter-status"
                            className="mb-1.5 block text-xs font-medium text-ink-secondary"
                        >
                            Status Akhir Periode
                        </label>
                        <select
                            id="filter-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="input-control h-10 w-full px-3 text-xs"
                        >
                            <option value="">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="kurang-aktif">Kurang Aktif</option>
                            <option value="tidak-aktif">Tidak Aktif</option>
                        </select>
                    </div>

                    {/* Tombol Terapkan & Reset */}
                    <div className="col-span-2 flex items-center gap-2">
                        <button
                            type="submit"
                            className="btn-primary-pill h-10 flex-1 whitespace-nowrap px-3.5 text-xs"
                        >
                            Terapkan
                        </button>
                        <button
                            type="button"
                            onClick={resetFilters}
                            title="Reset filter"
                            className="btn-secondary h-10 whitespace-nowrap px-3.5 text-xs"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {(errors?.dari || errors?.sampai) && (
                    <p className="mt-2 text-xs font-medium text-status-tidak">
                        {errors.dari || errors.sampai}
                    </p>
                )}
            </form>

            {/* Ringkasan Periode */}
            <div className="mb-6 grid grid-cols-4 gap-4">
                <div className="surface-card p-4">
                    <div className="text-xs font-medium text-ink-secondary">
                        Rata-rata Uptime Periode
                    </div>
                    <div className="tabular-nums mt-1 font-mono text-2xl font-bold text-ink-primary">
                        {summary.avgUptime !== null ? `${summary.avgUptime}%` : '—'}
                    </div>
                </div>
                <div className="surface-card p-4">
                    <div className="text-xs font-medium text-ink-secondary">
                        Total Kejadian Down
                    </div>
                    <div className="tabular-nums mt-1 font-mono text-2xl font-bold text-ink-primary">
                        {summary.totalDown}
                    </div>
                </div>
                <div className="surface-card p-4">
                    <div className="text-xs font-medium text-ink-secondary">
                        Tidak Aktif di Akhir Periode
                    </div>
                    <div className="tabular-nums mt-1 font-mono text-2xl font-bold text-status-tidak">
                        {summary.endDownCount}
                    </div>
                </div>
                <div className="surface-card p-4">
                    <div className="text-xs font-medium text-ink-secondary">
                        Tanpa Update &gt; 30 Hari
                    </div>
                    <div className="tabular-nums mt-1 font-mono text-2xl font-bold text-status-kurang">
                        {summary.staleOver30Count}
                    </div>
                </div>
            </div>

            {/* Tabel Laporan Solid Kontras Tinggi */}
            <div className="surface-table overflow-hidden">
                {rows.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-base font-medium text-ink-secondary">
                            Tidak ada data instansi yang cocok dengan filter laporan ini.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="btn-secondary mt-4 px-4 py-2 text-xs"
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
                                    className="border-b border-line-subtle bg-surface-elevated text-xs font-semibold text-ink-secondary"
                                >
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            onClick={header.column.getToggleSortingHandler()}
                                            className="cursor-pointer select-none px-4 py-3.5 hover:text-ink-primary"
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
                        <tbody className="divide-y divide-line-subtle">
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="transition hover:bg-surface-elevated"
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
