import { FreshnessText } from '@/Components/status/FreshnessText';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs } from '@/lib/format';
import { InstansiRow, KATEGORI_INSTANSI_LABELS } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

interface InstansiTableProps {
    data: InstansiRow[];
    onEdit: (row: InstansiRow) => void;
    onDelete: (row: InstansiRow) => void;
}

const columnHelper = createColumnHelper<InstansiRow>();

export function InstansiTable({ data, onEdit, onDelete }: InstansiTableProps) {
    const columns = [
        columnHelper.accessor('status', {
            header: 'Status',
            cell: (info) => <StatusBadge status={info.getValue()} />,
        }),
        columnHelper.accessor('nama', {
            header: 'Nama instansi',
            cell: (info) => (
                <Link
                    href={`/instansi/${info.row.original.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-ink-primary transition-colors hover:text-accent"
                >
                    {info.getValue()}
                </Link>
            ),
        }),
        columnHelper.display({
            id: 'freshness',
            header: 'Terakhir update',
            cell: (info) => <FreshnessText row={info.row.original} className="text-ink-secondary" />,
        }),
        columnHelper.accessor('lastResponseMs', {
            header: 'Response time',
            cell: (info) => <span className="tabular-nums text-ink-primary">{formatMs(info.getValue())}</span>,
        }),
        columnHelper.accessor('lastHttpCode', {
            header: 'HTTP terakhir',
            cell: (info) => {
                const code = info.getValue();
                if (code === null) {
                    return (
                        <span className="tabular-nums text-xs text-ink-secondary">
                            {info.row.original.lastCheckedAt ? 'Timeout' : '—'}
                        </span>
                    );
                }
                const ok = code === 200;
                return (
                    <span
                        className={`tabular-nums inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                            ok ? 'status-badge--aktif' : 'status-badge--tidak'
                        }`}
                    >
                        {code === 200 ? '200 OK' : code}
                    </span>
                );
            },
        }),
        columnHelper.accessor('url', {
            header: 'URL',
            cell: (info) => {
                const raw = info.getValue();
                const display = raw.replace(/^https?:\/\//, '');
                return (
                    <a
                        href={raw}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex max-w-[220px] items-center gap-1 truncate text-xs text-ink-secondary transition-colors hover:text-accent"
                    >
                        <span className="truncate">{display}</span>
                        <span aria-hidden="true">↗</span>
                    </a>
                );
            },
        }),
        columnHelper.accessor('kategori', {
            header: 'Kategori instansi',
            cell: (info) => {
                const val = info.getValue();
                return (
                    <span className="surface-elevated inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                        {KATEGORI_INSTANSI_LABELS[val] ?? val}
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Aksi',
            cell: (info) => {
                const row = info.row.original;
                return (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="btn-action-edit group inline-flex h-8 items-center gap-1.5 px-3 text-xs"
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
                            <span>Ubah</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="btn-action-delete group inline-flex h-8 items-center gap-1.5 px-3 text-xs"
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
                            <span>Hapus</span>
                        </button>
                    </div>
                );
            },
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    {table.getHeaderGroups().map((hg) => (
                        <tr key={hg.id} className="border-b border-line-subtle text-xs font-semibold text-ink-secondary">
                            {hg.headers.map((header) => (
                                <th
                                    key={header.id}
                                    className={`px-4 py-3.5 ${header.id === 'actions' ? 'text-right' : ''}`}
                                >
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-line-subtle">
                    {table.getRowModel().rows.map((row) => (
                        <tr
                            key={row.id}
                            onClick={() => router.visit(`/instansi/${row.original.id}`)}
                            className="cursor-pointer whitespace-nowrap transition-colors hover:bg-surface-elevated"
                        >
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-4 py-3">
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
