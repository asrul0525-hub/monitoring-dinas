import { DeleteInstansiDialog } from '@/Components/instansi/DeleteInstansiDialog';
import { InstansiFormPanel } from '@/Components/instansi/InstansiFormPanel';
import { InstansiTable } from '@/Components/instansi/InstansiTable';
import { AppShell } from '@/Components/shell/AppShell';
import { InstansiRow, Paginated, SharedProps, StatusKey } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type InstansiIndexProps = SharedProps & {
    rows: Paginated<InstansiRow>;
    filters: {
        status: StatusKey | null;
        q: string;
    };
    openTambah?: boolean;
};

const STATUS_LABELS: Record<StatusKey, string> = {
    aktif: 'Aktif',
    'kurang-aktif': 'Kurang Aktif',
    'tidak-aktif': 'Tidak Aktif',
};

export default function InstansiIndex({ rows, filters, openTambah = false }: InstansiIndexProps) {
    const [panelOpen, setPanelOpen] = useState<boolean>(openTambah);
    const [editing, setEditing] = useState<InstansiRow | null>(null);
    const [deleting, setDeleting] = useState<InstansiRow | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(filters.q ?? '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (searchQuery.trim()) params.q = searchQuery.trim();
        router.get('/instansi', params, { preserveState: true });
    };

    const handleClearStatus = () => {
        const params: Record<string, string> = {};
        if (searchQuery.trim()) params.q = searchQuery.trim();
        router.get('/instansi', params, { preserveState: true });
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        router.get('/instansi');
    };

    const openAdd = () => {
        setEditing(null);
        setPanelOpen(true);
    };

    const openEdit = (row: InstansiRow) => {
        setEditing(row);
        setPanelOpen(true);
    };

    const subtitle = filters.status
        ? `${rows.total} instansi berstatus ${STATUS_LABELS[filters.status]}`
        : `${rows.total} instansi terdaftar dalam radar pengawasan`;

    const hasActiveFilter = Boolean(filters.status || filters.q);

    return (
        <AppShell
            title="Instansi"
            subtitle={subtitle}
            showStatusTabs
            activeStatus={filters.status}
            initialSearch={filters.q}
            actions={
                <>
                    {filters.status && (
                        <button
                            type="button"
                            onClick={handleClearStatus}
                            className="status-badge status-badge--kurang inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-medium"
                        >
                            <span>Status: {STATUS_LABELS[filters.status]}</span>
                            <span aria-hidden="true">×</span>
                        </button>
                    )}

                    <form onSubmit={handleSearch} className="w-64">
                        <label htmlFor="table-instansi-search" className="sr-only">
                            Cari nama instansi atau domain
                        </label>
                        <input
                            id="table-instansi-search"
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama instansi atau domain…"
                            className="input-control h-9 w-full px-3.5 text-xs"
                        />
                    </form>

                    <button
                        type="button"
                        onClick={openAdd}
                        className="btn-primary-pill h-9 px-4 text-xs"
                    >
                        + Tambah Instansi
                    </button>
                </>
            }
        >
            <div className="surface-table overflow-hidden">
                {rows.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        {hasActiveFilter ? (
                            <>
                                <h2 className="text-base font-semibold text-ink-primary">
                                    {filters.status
                                        ? `Tidak ada instansi berstatus ${STATUS_LABELS[filters.status]}.`
                                        : 'Tidak ada instansi yang cocok dengan pencarian.'}
                                </h2>
                                <p className="mt-1 text-xs text-ink-secondary">
                                    Ubah kata kunci pencarian atau reset filter untuk melihat seluruh daftar instansi.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="btn-secondary mt-4 h-9 px-4 text-xs"
                                >
                                    Reset filter
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="text-base font-semibold text-ink-primary">
                                    Belum ada instansi yang dipantau. Tambahkan instansi pertama.
                                </h2>
                                <button
                                    type="button"
                                    onClick={openAdd}
                                    className="btn-primary-pill mt-4 h-9 px-4 text-xs"
                                >
                                    + Tambah Instansi
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <InstansiTable
                            data={rows.data}
                            onEdit={openEdit}
                            onDelete={(row) => setDeleting(row)}
                        />

                        <div className="flex items-center justify-between border-t border-line-subtle px-4 py-3 text-xs text-ink-secondary">
                            <span className="tabular-nums">
                                Menampilkan {rows.from ?? 0}–{rows.to ?? 0} dari {rows.total} instansi
                            </span>

                            {rows.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    {rows.links.map((link, idx) =>
                                        link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                preserveScroll
                                                className={`tabular-nums rounded-lg px-2.5 py-1 text-xs font-medium ${
                                                    link.active
                                                        ? 'btn-primary-pill'
                                                        : 'surface-elevated text-ink-secondary hover:text-ink-primary'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : null,
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <InstansiFormPanel
                open={panelOpen}
                editing={editing}
                onClose={() => setPanelOpen(false)}
            />

            <DeleteInstansiDialog
                target={deleting}
                onClose={() => setDeleting(null)}
            />
        </AppShell>
    );
}
