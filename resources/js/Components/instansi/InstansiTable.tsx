import { FreshnessText } from '@/Components/status/FreshnessText';
import { HttpCodeBadge } from '@/Components/status/HttpCodeBadge';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { HighlightText } from '@/Components/ui/HighlightText';
import { formatMs } from '@/lib/format';
import { InstansiRow, KATEGORI_INSTANSI_LABELS } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';

interface InstansiTableProps {
    data: InstansiRow[];
    onEdit: (row: InstansiRow) => void;
    onDelete: (row: InstansiRow) => void;
    highlightQuery?: string;
}

const SOURCE_LABELS: Record<string, string> = {
    dom: 'DOM',
    rss: 'RSS',
    sitemap: 'Sitemap',
};

const columnHelper = createColumnHelper<InstansiRow>();

export function InstansiTable({
    data,
    onEdit,
    onDelete,
    highlightQuery = '',
}: InstansiTableProps) {
    const [checkingId, setCheckingId] = useState<number | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    const handleCheckOne = (row: InstansiRow) => {
        if (checkingId !== null) return;
        setCheckingId(row.id);
        router.post(
            `/instansi/${row.id}/cek`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setCheckingId(null),
            },
        );
    };

    const columns = useMemo(
        () => [
            columnHelper.accessor('status', {
                header: 'Status',
                cell: (info) => <StatusBadge status={info.getValue()} />,
            }),
            columnHelper.accessor('nama', {
                header: 'Instansi & URL',
                cell: (info) => {
                    const row = info.row.original;
                    const displayUrl = row.url.replace(/^https?:\/\//, '');
                    return (
                        <div className="max-w-[260px]">
                            <Link
                                href={`/instansi/${row.id}`}
                                prefetch
                                cacheFor="10s"
                                onClick={(e) => e.stopPropagation()}
                                className="block truncate font-semibold text-ink-primary transition-colors hover:text-accent"
                            >
                                <HighlightText text={info.getValue()} query={highlightQuery} />
                            </Link>
                            <a
                                href={row.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Buka ${row.url} di tab baru`}
                                className="mt-0.5 inline-flex max-w-full items-center gap-1 font-mono text-xs text-ink-secondary transition-colors hover:text-accent"
                            >
                                <span className="truncate">
                                    <HighlightText text={displayUrl} query={highlightQuery} />
                                </span>
                                <span aria-hidden="true">↗</span>
                            </a>
                        </div>
                    );
                },
            }),
            columnHelper.accessor(
                (row) => (row.lastContentAt ? new Date(row.lastContentAt).getTime() : -1),
                {
                    id: 'freshness',
                    header: 'Terakhir update',
                    cell: (info) => {
                        const row = info.row.original;
                        const srcLabel = row.contentSource ? SOURCE_LABELS[row.contentSource] : null;
                        return (
                            <div className="flex items-center gap-2">
                                <FreshnessText row={row} className="text-ink-secondary" />
                                {row.lastContentAt && srcLabel && (
                                    <span
                                        title={`Sumber deteksi pembaruan konten: ${srcLabel}`}
                                        className="surface-elevated rounded px-1.5 py-0.5 text-[10px] font-semibold text-ink-secondary"
                                    >
                                        {srcLabel}
                                    </span>
                                )}
                            </div>
                        );
                    },
                },
            ),
            columnHelper.accessor('lastResponseMs', {
                header: 'Response time',
                sortUndefined: 'last',
                cell: (info) => (
                    <span className="tabular-nums font-mono text-xs text-ink-primary">
                        {formatMs(info.getValue())}
                    </span>
                ),
            }),
            columnHelper.accessor('lastHttpCode', {
                header: 'HTTP terakhir',
                sortUndefined: 'last',
                cell: (info) => (
                    <HttpCodeBadge
                        code={info.getValue()}
                        status={info.row.original.status}
                        neverChecked={!info.row.original.lastCheckedAt}
                    />
                ),
            }),
            columnHelper.accessor('kategori', {
                header: 'Kategori',
                cell: (info) => {
                    const val = info.getValue();
                    return (
                        <span className="surface-elevated inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                            {KATEGORI_INSTANSI_LABELS[val] ?? val}
                        </span>
                    );
                },
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Aksi',
                enableSorting: false,
                cell: (info) => {
                    const row = info.row.original;
                    const isChecking = checkingId === row.id;
                    return (
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                disabled={checkingId !== null}
                                onClick={() => handleCheckOne(row)}
                                title="Cek ulang website instansi ini sekarang"
                                aria-label={`Cek ${row.nama}`}
                                className="btn-secondary group inline-flex h-8 w-8 items-center justify-center p-0"
                            >
                                <svg
                                    className={`h-3.5 w-3.5 transition-transform duration-300 ${
                                        isChecking ? 'animate-spin' : 'group-hover:rotate-180'
                                    }`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                                    />
                                </svg>
                                <span className="sr-only">{isChecking ? 'Cek…' : 'Cek'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onEdit(row)}
                                title={`Ubah ${row.nama}`}
                                aria-label={`Ubah ${row.nama}`}
                                className="btn-action-edit group inline-flex h-8 w-8 items-center justify-center p-0"
                            >
                                <svg
                                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-12 group-hover:scale-110"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
                                    />
                                </svg>
                                <span className="sr-only">Ubah</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(row)}
                                title={`Hapus ${row.nama}`}
                                aria-label={`Hapus ${row.nama}`}
                                className="btn-action-delete group inline-flex h-8 w-8 items-center justify-center p-0"
                            >
                                <svg
                                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-6 group-hover:scale-110"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                                <span className="sr-only">Hapus</span>
                            </button>
                        </div>
                    );
                },
            }),
        ],
        [checkingId, highlightQuery, onEdit, onDelete],
    );

    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id} className="border-b border-line-subtle text-xs font-semibold text-ink-secondary">
                            {hg.headers.map((header) => {
                                const canSort = header.column.getCanSort();
                                const sorted = header.column.getIsSorted();
                                return (
                                    <th
                                        key={header.id}
                                        className={`px-3.5 py-3.5 whitespace-nowrap ${header.id === 'actions' ? 'text-right' : ''}`}
                                    >
                                        {header.isPlaceholder ? null : canSort ? (
                                            <button
                                                type="button"
                                                onClick={header.column.getToggleSortingHandler()}
                                                className="inline-flex items-center gap-1 text-left hover:text-ink-primary"
                                            >
                                                <span>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                                </span>
                                                <span aria-hidden="true" className="text-[11px] opacity-75">
                                                    {sorted === 'asc'
                                                        ? '↑'
                                                        : sorted === 'desc'
                                                          ? '↓'
                                                          : '⇅'}
                                                </span>
                                            </button>
                                        ) : (
                                            flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-line-subtle">
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.original.id}
                            onClick={() => router.visit(`/instansi/${row.original.id}`)}
                            className="cursor-pointer transition-colors hover:bg-surface-elevated"
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-3.5 py-3">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
