import { FreshnessText } from '@/Components/status/FreshnessText';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs } from '@/lib/format';
import { InstansiRow, KATEGORI_INSTANSI_LABELS, KategoriInstansiKey } from '@/types/monitoring';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface InstansiFormModalProps {
    open: boolean;
    editing: InstansiRow | null;
    onClose: () => void;
}

const KATEGORI_OPTIONS: { value: KategoriInstansiKey; label: string }[] = [
    { value: 'vertikal', label: KATEGORI_INSTANSI_LABELS.vertikal },
    { value: 'dinas', label: KATEGORI_INSTANSI_LABELS.dinas },
    { value: 'kec_kel_pkm', label: KATEGORI_INSTANSI_LABELS.kec_kel_pkm },
    { value: 'layanan_pemerintah', label: KATEGORI_INSTANSI_LABELS.layanan_pemerintah },
    { value: 'layanan_publik', label: KATEGORI_INSTANSI_LABELS.layanan_publik },
];

export function InstansiFormModal({ open, editing, onClose }: InstansiFormModalProps) {
    const namaInputRef = useRef<HTMLInputElement | null>(null);
    const { data, setData, post, put, processing, errors, clearErrors } = useForm<{
        nama: string;
        kategori: KategoriInstansiKey;
        url: string;
        feed_url: string;
    }>({
        nama: '',
        kategori: 'dinas',
        url: '',
        feed_url: '',
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            setData({
                nama: editing?.nama ?? '',
                kategori: editing?.kategori ?? 'dinas',
                url: editing?.url ?? '',
                feed_url: editing?.feedUrl ?? '',
            });
        }
    }, [open, editing]);

    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusTimer = window.setTimeout(() => {
            namaInputRef.current?.focus({ preventScroll: true });
        }, 20);
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.clearTimeout(focusTimer);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const submitForm = (keepOpen: boolean) => {
        if (editing) {
            put(`/instansi/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => onClose(),
            });
        } else {
            post('/instansi', {
                preserveScroll: true,
                onSuccess: () => {
                    if (keepOpen) {
                        clearErrors();
                        setData({
                            nama: '',
                            kategori: data.kategori,
                            url: '',
                            feed_url: '',
                        });
                        window.setTimeout(() => {
                            namaInputRef.current?.focus({ preventScroll: true });
                        }, 20);
                    } else {
                        onClose();
                    }
                },
            });
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submitForm(false);
    };

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                aria-hidden="true"
                onClick={onClose}
                className="fixed inset-0 backdrop-blur-sm transition-opacity"
                style={{ background: 'var(--bg-scrim)' }}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-label={editing ? `Ubah Instansi ${editing.nama}` : 'Tambah Instansi'}
                className="glass-shell animate-modal-pop relative z-10 w-full max-w-lg rounded-[20px] p-5"
            >
                <div className="flex items-start justify-between border-b border-line-subtle pb-3">
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
                        aria-label="Tutup modal"
                        className="surface-elevated inline-flex h-8 w-8 items-center justify-center rounded-full text-sm text-ink-secondary hover:text-ink-primary"
                    >
                        ×
                    </button>
                </div>

                <form id="instansi-form" onSubmit={handleSubmit} className="mt-3.5 space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-7">
                            <label htmlFor="instansi-nama" className="block text-xs font-medium text-ink-secondary">
                                Nama Instansi
                            </label>
                            <input
                                ref={namaInputRef}
                                id="instansi-nama"
                                type="text"
                                value={data.nama}
                                onChange={(e) => setData('nama', e.target.value)}
                                placeholder="Dinas Contoh 01"
                                autoFocus
                                className="input-control mt-1 block h-10 w-full px-3 text-xs"
                            />
                            {errors.nama && (
                                <p role="alert" className="mt-1 text-xs font-medium text-status-tidak">
                                    {errors.nama}
                                </p>
                            )}
                        </div>

                        <div className="col-span-5">
                            <label htmlFor="instansi-kategori" className="block text-xs font-medium text-ink-secondary">
                                Kategori Instansi
                            </label>
                            <select
                                id="instansi-kategori"
                                value={data.kategori}
                                onChange={(e) => setData('kategori', e.target.value as KategoriInstansiKey)}
                                className="input-control mt-1 block h-10 w-full px-3 text-xs"
                            >
                                {KATEGORI_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {errors.kategori && (
                                <p role="alert" className="mt-1 text-xs font-medium text-status-tidak">
                                    {errors.kategori}
                                </p>
                            )}
                        </div>
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
                            className="input-control mt-1 block h-10 w-full px-3 text-xs"
                        />
                        {errors.url && (
                            <p role="alert" className="mt-1 text-xs font-medium text-status-tidak">
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
                            className="input-control mt-1 block h-10 w-full px-3 text-xs"
                        />
                        <p className="mt-1 text-[11px] text-ink-secondary">
                            Pengecekan otomatis tetap memvalidasi status HTTPS &amp; tanggal pembaruan konten.
                        </p>
                        {errors.feed_url && (
                            <p role="alert" className="mt-1 text-xs font-medium text-status-tidak">
                                {errors.feed_url}
                            </p>
                        )}
                    </div>

                    {editing && (
                        <div className="surface-elevated rounded-xl p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-ink-secondary">Status Saat Ini</span>
                                <StatusBadge status={editing.status} size="sm" />
                            </div>
                            <div className="tabular-nums mt-2 flex items-center justify-between text-xs text-ink-secondary">
                                <span>
                                    <FreshnessText row={editing} />
                                </span>
                                <span>
                                    HTTP {editing.lastHttpCode ?? '—'} · {formatMs(editing.lastResponseMs)}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 border-t border-line-subtle pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary h-9 px-4 text-xs"
                        >
                            Batal
                        </button>
                        {!editing && (
                            <button
                                type="button"
                                disabled={processing}
                                onClick={() => submitForm(true)}
                                className="btn-secondary h-9 px-3.5 text-xs"
                            >
                                Simpan &amp; Tambah Lagi
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-primary-pill h-9 px-5 text-xs"
                        >
                            {processing ? 'Menyimpan…' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
