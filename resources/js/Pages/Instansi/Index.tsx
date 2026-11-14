import { DeleteInstansiDialog } from '@/Components/instansi/DeleteInstansiDialog';
import { InstansiFormModal } from '@/Components/instansi/InstansiFormModal';
import { InstansiTable } from '@/Components/instansi/InstansiTable';
import { AppShell } from '@/Components/shell/AppShell';
import {
    InstansiRow,
    KATEGORI_INSTANSI_LABELS,
    KategoriInstansiKey,
    Paginated,
    SharedProps,
    StatusKey,
} from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type StatusFilterKey = StatusKey | 'perlu-perhatian';

type InstansiIndexProps = SharedProps & {
    rows: Paginated<InstansiRow>;
    allRows?: InstansiRow[];
    filters: {
        status: StatusFilterKey | null;
        kategori: KategoriInstansiKey | null;
        q: string;
    };
    openTambah?: boolean;
};

const STATUS_LABELS: Record<StatusFilterKey, string> = {
    aktif: 'Aktif',
    'kurang-aktif': 'Kurang Aktif',
    'tidak-aktif': 'Tidak Aktif',
    'perlu-perhatian': 'Perlu Perhatian',
};

const KATEGORI_FILTER_OPTIONS: { value: '' | KategoriInstansiKey; label: string }[] = [
    { value: '', label: 'Semua Kategori' },
    { value: 'vertikal', label: KATEGORI_INSTANSI_LABELS.vertikal },
    { value: 'dinas', label: KATEGORI_INSTANSI_LABELS.dinas },
    { value: 'kec_kel_pkm', label: KATEGORI_INSTANSI_LABELS.kec_kel_pkm },
    { value: 'layanan_pemerintah', label: KATEGORI_INSTANSI_LABELS.layanan_pemerintah },
    { value: 'layanan_publik', label: KATEGORI_INSTANSI_LABELS.layanan_publik },
];

export default function InstansiIndex({
    rows,
    allRows,
    filters,
    openTambah = false,
}: InstansiIndexProps) {
    const [panelOpen, setPanelOpen] = useState<boolean>(openTambah);
    const [editing, setEditing] = useState<InstansiRow | null>(null);
    const [deleting, setDeleting] = useState<InstansiRow | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>(filters.q ?? '');
    const isSearchFocusedRef = useRef<boolean>(false);

    useEffect(() => {
        if (isSearchFocusedRef.current) {
            return;
        }
        setSearchQuery(filters.q ?? '');
    }, [filters.q]);

    useEffect(() => {
        if (openTambah) {
            setEditing(null);
            setPanelOpen(true);
        }
    }, [openTambah]);

    const visitWithFilters = (next: {
        status?: StatusFilterKey | null;
        kategori?: KategoriInstansiKey | null;
        q?: string;
    }) => {
        const mergedStatus = next.status !== undefined ? next.status : filters.status;
        const mergedKategori = next.kategori !== undefined ? next.kategori : filters.kategori;
        const mergedQ = (next.q !== undefined ? next.q : searchQuery).trim();

        const params: Record<string, string> = {};
        if (mergedStatus) params.status = mergedStatus;
        if (mergedKategori) params.kategori = mergedKategori;
        if (mergedQ) params.q = mergedQ;

        router.get('/instansi', params, { preserveState: true, preserveScroll: true });
    };

    // Sync URL query string silently without triggering any Inertia request or re-render
    useEffect(() => {
        const timer = window.setTimeout(() => {
            const url = new URL(window.location.href);
            const trimmed = searchQuery.trim();
            const currentQ = url.searchParams.get('q') ?? '';
            if (trimmed === currentQ) return;

            if (trimmed) {
                url.searchParams.set('q', trimmed);
                url.searchParams.delete('page');
            } else {
                url.searchParams.delete('q');
            }
            window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
        }, 180);

        return () => window.clearTimeout(timer);
    }, [searchQuery]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
    };

    const handleClearStatus = () => {
        visitWithFilters({ status: null });
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        if (filters.status || filters.kategori || filters.q) {
            router.get('/instansi');
        } else {
            const url = new URL(window.location.href);
            url.searchParams.delete('q');
            window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
        }
    };

    const openAdd = () => {
        setEditing(null);
        setPanelOpen(true);
    };

    const openEdit = (row: InstansiRow) => {
        setEditing(row);
        setPanelOpen(true);
    };

    const trimmedQuery = searchQuery.trim();
    const isFilteringBySearch = trimmedQuery !== '';

    const displayedRows = useMemo(() => {
        if (!isFilteringBySearch) {
            return rows.data;
        }
        const source = allRows ?? rows.data;
        const qLower = trimmedQuery.toLowerCase();
        return source.filter(
            (row) =>
                row.nama.toLowerCase().includes(qLower) ||
                row.url.toLowerCase().includes(qLower),
        );
    }, [allRows, isFilteringBySearch, rows.data, trimmedQuery]);

    const subtitleParts: string[] = [];
    if (filters.status) subtitleParts.push(`berstatus ${STATUS_LABELS[filters.status]}`);
    if (filters.kategori) subtitleParts.push(`kategori ${KATEGORI_INSTANSI_LABELS[filters.kategori]}`);
    const baseTotal = (allRows ?? rows.data).length || rows.total;
    const subtitle = isFilteringBySearch
        ? `${displayedRows.length} instansi cocok dengan "${trimmedQuery}"`
        : subtitleParts.length > 0
          ? `${rows.total} instansi ${subtitleParts.join(' · ')}`
          : `${baseTotal} instansi terdaftar dalam radar pengawasan`;

    const hasActiveFilter = Boolean(filters.status || filters.kategori || isFilteringBySearch);

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

                    <div className="relative">
                        <label htmlFor="table-instansi-kategori" className="sr-only">
                            Filter kategori instansi
                        </label>
                        <select
                            id="table-instansi-kategori"
                            value={filters.kategori ?? ''}
                            onChange={(e) =>
                                visitWithFilters({
                                    kategori: (e.target.value as KategoriInstansiKey) || null,
                                })
                            }
                            style={{ backgroundImage: 'none' }}
                            className="input-control h-9 cursor-pointer appearance-none pl-3 pr-8 text-xs hover:border-accent"
                        >
                            {KATEGORI_FILTER_OPTIONS.map((opt) => (
                                <option key={opt.label} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <span
                            className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-xs text-ink-secondary"
                            aria-hidden="true"
                        >
                            ▾
                        </span>
                    </div>

                    <form onSubmit={handleSearch} className="w-56 sm:w-64">
                        <label htmlFor="table-instansi-search" className="sr-only">
                            Cari nama instansi atau domain
                        </label>
                        <input
                            id="table-instansi-search"
                            type="search"
                            value={searchQuery}
                            onFocus={() => {
                                isSearchFocusedRef.current = true;
                            }}
                            onBlur={() => {
                                isSearchFocusedRef.current = false;
                            }}
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
            <div className="surface-table motion-stagger overflow-hidden">
                {displayedRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        {hasActiveFilter ? (
                            <>
                                <h2 className="text-base font-semibold text-ink-primary">
                                    {isFilteringBySearch
                                        ? `Tidak ada instansi yang cocok dengan "${trimmedQuery}".`
                                        : filters.status
                                          ? `Tidak ada instansi berstatus ${STATUS_LABELS[filters.status]}.`
                                          : 'Tidak ada instansi yang cocok dengan filter.'}
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
                            data={displayedRows}
                            onEdit={openEdit}
                            onDelete={(row) => setDeleting(row)}
                            highlightQuery={trimmedQuery}
                        />

                        <div className="flex items-center justify-between border-t border-line-subtle px-4 py-3 text-xs text-ink-secondary">
                            <span className="tabular-nums">
                                {isFilteringBySearch
                                    ? `Ditemukan ${displayedRows.length} instansi cocok untuk "${trimmedQuery}"`
                                    : `Menampilkan ${rows.from ?? 0}–${rows.to ?? 0} dari ${rows.total} instansi`}
                            </span>

                            {!isFilteringBySearch && rows.last_page > 1 && (
                                <div className="flex items-center gap-1">
                                    {rows.links.map((link, idx) =>
                                        link.url ? (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                prefetch
                                                cacheFor="10s"
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

            <InstansiFormModal
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
