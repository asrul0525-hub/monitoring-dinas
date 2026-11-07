import { FreshnessText } from '@/Components/status/FreshnessText';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs } from '@/lib/format';
import { InstansiRow } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

interface InstansiTableProps {
    data: InstansiRow[];
    onEdit: (row: InstansiRow) => void;
    onDelete: (row: InstansiRow) => void;
}

const columnHelper = createColumnHelper<InstansiRow>();

const SOURCE_LABELS: Record<string, string> = {
    sitemap: 'Sitemap',
    rss: 'RSS',
    dom: 'DOM',
};

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
                    className="font-semibold text-ink-primary hover:text-accent"
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
                        className="inline-flex max-w-[220px] items-center gap-1 truncate text-xs text-ink-secondary hover:text-accent"
                    >
                        <span className="truncate">{display}</span>
                        <span aria-hidden="true">↗</span>
                    </a>
                );
            },
        }),
        columnHelper.accessor('contentSource', {
            header: 'Sumber konten',
            cell: (info) => {
                const val = info.getValue();
                return (
                    <span className="surface-elevated inline-flex rounded-md px-2 py-0.5 text-xs text-ink-secondary">
                        {val ? SOURCE_LABELS[val] ?? val : '—'}
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
                    <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="text-xs font-medium text-ink-primary hover:text-accent"
                        >
                            Ubah
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(row)}
                            className="text-xs font-medium text-status-tidak hover:underline"
                        >
                            Hapus
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
