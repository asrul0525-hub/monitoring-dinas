import { FreshnessText } from '@/Components/status/FreshnessText';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs } from '@/lib/format';
import { InstansiRow } from '@/types/monitoring';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect } from 'react';

interface InstansiFormPanelProps {
    open: boolean;
    editing: InstansiRow | null;
    onClose: () => void;
}

export function InstansiFormPanel({ open, editing, onClose }: InstansiFormPanelProps) {
    const { data, setData, post, put, processing, errors, clearErrors } = useForm({
        nama: '',
        url: '',
        feed_url: '',
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            setData({
                nama: editing?.nama ?? '',
                url: editing?.url ?? '',
                feed_url: editing?.feedUrl ?? '',
            });
        }
    }, [open, editing]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            put(`/instansi/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        } else {
            post('/instansi', {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                aria-hidden="true"
                onClick={onClose}
                className="fixed inset-0 transition-opacity"
                style={{ background: 'var(--bg-scrim)' }}
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-label={editing ? `Ubah Instansi ${editing.nama}` : 'Tambah Instansi'}
                className="glass-shell relative z-10 flex h-full w-[440px] flex-col justify-between rounded-l-[20px] p-6"
            >
                <div>
                    <div className="flex items-start justify-between border-b border-line-subtle pb-4">
                        <div>
                            <h2 className="text-base font-bold text-ink-primary">
                                {editing ? 'Ubah Instansi' : 'Tambah Instansi'}
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-secondary">
                                {editing
                                    ? editing.nama
                                    : 'Daftarkan website instansi daerah ke dalam radar pemantauan'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Tutup panel"
                            className="surface-elevated inline-flex h-8 w-8 items-center justify-center rounded-full text-sm text-ink-secondary hover:text-ink-primary"
                        >
                            ×
                        </button>
                    </div>

                    <form id="instansi-form" onSubmit={handleSubmit} className="mt-5 space-y-4">
                        <div>
                            <label htmlFor="instansi-nama" className="block text-xs font-medium text-ink-secondary">
                                Nama Instansi
                            </label>
                            <input
                                id="instansi-nama"
                                type="text"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Dinas Contoh 01"
                                autoFocus
                                className="input-control mt-1.5 block h-10 w-full px-3.5 text-sm"
                            />
                            {errors.nama && (
                                <p role="alert" className="mt-1.5 text-xs font-medium text-status-tidak">
                                    {errors.nama}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="instansi-url" className="block text-xs font-medium text-ink-secondary">
                                URL Website Utama
                            </label>
                            <input
                                id="instansi-url"
                                type="text"
                                value={data.url}
                                onChange={(e) => setData('url', e.target.value)}
                                placeholder="https://dinas-contoh-01.go.id"
                                className="input-control mt-1.5 block h-10 w-full px-3.5 text-sm"
                            />
                            {errors.url && (
                                <p role="alert" className="mt-1.5 text-xs font-medium text-status-tidak">
                                    {errors.url}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="instansi-feed" className="block text-xs font-medium text-ink-secondary">
                                URL Sitemap atau RSS Feed (opsional)
                            </label>
                            <input
                                id="instansi-feed"
                                type="text"
                                value={data.feed_url}
                                onChange={(e) => setData('feed_url', e.target.value)}
                                placeholder="https://dinas-contoh-01.go.id/sitemap.xml"
                                className="input-control mt-1.5 block h-10 w-full px-3.5 text-sm"
                            />
                            <p className="mt-1.5 text-[11px] text-ink-secondary">
                                Kosongkan bila tidak ada; sistem akan membaca halaman utama.
                            </p>
                            {errors.feed_url && (
                                <p role="alert" className="mt-1.5 text-xs font-medium text-status-tidak">
                                    {errors.feed_url}
                                </p>
                            )}
                        </div>

                        {editing && (
                            <div className="surface-elevated mt-5 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-ink-secondary">Status Saat Ini</span>
                                    <StatusBadge status={editing.status} size="sm" />
                                </div>
                                <p className="mt-2 text-xs text-ink-primary">
                                    <FreshnessText row={editing} />
                                </p>
                                <div className="tabular-nums mt-3 flex items-center justify-between border-t border-line-subtle pt-2.5 text-xs text-ink-secondary">
                                    <span>HTTP: {editing.lastHttpCode ?? '—'}</span>
                                    <span>Latensi: {formatMs(editing.lastResponseMs)}</span>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-line-subtle pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary h-10 px-4 text-xs"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="instansi-form"
                        disabled={processing}
                        className="btn-primary-pill h-10 px-5 text-xs"
                    >
                        {processing ? 'Menyimpan…' : 'Simpan'}
                    </button>
                </div>
            </aside>
        </div>
    );
}
