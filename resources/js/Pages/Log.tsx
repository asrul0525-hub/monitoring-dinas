import { AppShell } from '@/Components/shell/AppShell';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatDateTimeId, formatMs } from '@/lib/format';
import { Paginated, SharedProps, StatusKey } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo } from 'react';

interface LogRow {
    id: number;
    checkedAt: string | null;
    instansi: {
        id: number;
        nama: string;
    };
    httpCode: number | null;
    responseMs: number | null;
    status: StatusKey | null;
    error: string | null;
}

interface LogProps extends SharedProps {
    rows: Paginated<LogRow>;
    instansiOptions: { id: number; nama: string }[];
    filters: {
        instansi: number | null;
        hasil: 'sukses' | 'gagal' | null;
    };
}

const columnHelper = createColumnHelper<LogRow>();

export default function Log({ rows, instansiOptions, filters }: LogProps) {
    const updateFilter = (next: {
        instansi?: number | null;
        hasil?: 'sukses' | 'gagal' | null;
    }) => {
        const merged = {
            instansi: next.instansi !== undefined ? next.instansi : filters.instansi,
            hasil: next.hasil !== undefined ? next.hasil : filters.hasil,
        };

        const query: Record<string, string | number> = {};
        if (merged.instansi !== null) {
            query.instansi = merged.instansi;
        }
        if (merged.hasil !== null) {
            query.hasil = merged.hasil;
        }

        router.get('/log', query, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        router.get('/log');
    };

    const columns = useMemo(
        () => [
            columnHelper.accessor('checkedAt', {
                header: 'Waktu Cek',
                cell: (info) => (
                    <span className="tabular-nums font-mono text-xs text-ink-secondary">
                        {formatDateTimeId(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor('instansi', {
                header: 'Instansi',
                cell: (info) => {
                    const inst = info.getValue();
                    return (
                        <Link
                            href={`/instansi/${inst.id}`}
                            className="font-medium text-ink-primary hover:text-accent"
                        >
                            {inst.nama}
                        </Link>
                    );
                },
            }),
            columnHelper.accessor('httpCode', {
                header: 'HTTP',
                cell: (info) => {
                    const code = info.getValue();
                    if (code === null) {
                        return (
                            <span className="font-mono text-xs font-semibold text-status-tidak">
                                TIMEOUT
                            </span>
                        );
                    }
                    const isOk = code === 200;
                    return (
                        <span
                            className={`tabular-nums font-mono text-xs font-semibold ${
                                isOk ? 'text-status-aktif' : 'text-status-tidak'
                            }`}
                        >
                            {code}
                        </span>
                    );
                },
            }),
            columnHelper.accessor('responseMs', {
                header: 'Response Time',
                cell: (info) => (
                    <span className="tabular-nums font-mono text-xs text-ink-secondary">
                        {formatMs(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor('status', {
                header: 'Status Hasil',
                cell: (info) => <StatusBadge status={info.getValue()} />,
            }),
            columnHelper.accessor('error', {
                header: 'Pesan Error Mentah',
                cell: (info) => {
                    const err = info.getValue();
                    if (!err) {
                        return <span className="text-xs text-ink-secondary">—</span>;
                    }
                    return (
                        <code className="surface-elevated rounded px-2 py-0.5 font-mono text-xs text-status-tidak">
                            {err}
                        </code>
                    );
                },
            }),
        ],
        [],
    );

    const table = useReactTable({
        data: rows.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppShell
            title="Log Monitoring Kronologis"
            subtitle="Catatan seluruh pengecekan otomatis dan manual dari semua website instansi (50 entri per halaman)."
        >
            {/* Filter Bar */}
            <div className="surface-card mb-5 flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                    <div>
                        <label
                            htmlFor="log-instansi"
                            className="mr-2 text-xs font-medium text-ink-secondary"
                        >
                            Instansi:
                        </label>
                        <select
                            id="log-instansi"
                            value={filters.instansi ?? ''}
                            onChange={(e) =>
                                updateFilter({
                                    instansi: e.target.value ? Number(e.target.value) : null,
                                })
                            }
                            className="input-control h-9 px-3 text-xs"
                        >
                            <option value="">Semua Instansi</option>
                            {instansiOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.nama}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="mr-1 text-xs font-medium text-ink-secondary">
                            Hasil:
                        </span>
                        {(
                            [
                                { key: null, label: 'Semua' },
                                { key: 'sukses', label: 'Sukses (HTTP 200)' },
                                { key: 'gagal', label: 'Gagal / Timeout' },
                            ] as const
                        ).map((item) => {
                            const active = filters.hasil === item.key;
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => updateFilter({ hasil: item.key })}
                                    className={
                                        active
                                            ? 'btn-primary-pill h-9 px-3.5 text-xs'
                                            : 'btn-secondary h-9 px-3.5 text-xs'
                                    }
                                >
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {(filters.instansi !== null || filters.hasil !== null) && (
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="btn-secondary h-9 px-3 text-xs"
                    >
                        Reset filter
                    </button>
                )}
            </div>

            {/* Tabel Log */}
            <div className="surface-table overflow-hidden">
                {rows.data.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-sm font-medium text-ink-secondary">
                            Tidak ada catatan log monitoring untuk filter yang dipilih.
                        </p>
                        {(filters.instansi !== null || filters.hasil !== null) && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="btn-secondary mt-3 px-4 py-2 text-xs"
                            >
                                Reset filter
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <table className="w-full border-collapse text-left text-[13px]">
                            <thead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr
                                        key={headerGroup.id}
                                        className="border-b border-line-subtle bg-surface-elevated text-xs font-semibold uppercase tracking-wider text-ink-secondary"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <th key={header.id} className="px-4 py-3">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
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
                                            <td key={cell.id} className="px-4 py-2.5">
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

                        {/* Pagination */}
                        {rows.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-line-subtle px-4 py-3 text-xs text-ink-secondary">
                                <span>
                                    Menampilkan {rows.from ?? 0}–{rows.to ?? 0} dari {rows.total}{' '}
                                    log pengecekan
                                </span>
                                <div className="flex items-center gap-1">
                                    {rows.links.map((link, idx) =>
                                        link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                preserveScroll
                                                className={`rounded px-2.5 py-1 ${
                                                    link.active
                                                        ? 'btn-primary-pill'
                                                        : 'surface-card text-ink-secondary hover:text-ink-primary'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={idx}
                                                className="px-2 py-1 text-ink-secondary opacity-50"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppShell>
    );
}
