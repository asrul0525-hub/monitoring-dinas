import { InstansiRow } from '@/types/monitoring';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface DeleteInstansiDialogProps {
    target: InstansiRow | null;
    onClose: () => void;
}

export function DeleteInstansiDialog({ target, onClose }: DeleteInstansiDialogProps) {
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!target) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [target, onClose]);

    if (!target) {
        return null;
    }

    const handleConfirm = () => {
        if (deleting) return;
        router.delete(`/instansi/${target.id}`, {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                aria-hidden="true"
                onClick={onClose}
                className="fixed inset-0 backdrop-blur-sm"
                style={{ background: 'var(--bg-scrim)' }}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                className="surface-card animate-modal-pop relative z-10 w-full max-w-md p-6 shadow-2xl"
            >
                <h2 id="delete-dialog-title" className="text-base font-bold text-ink-primary">
                    Hapus {target.nama}? Riwayat monitoringnya ikut terhapus.
                </h2>
                <p className="mt-2 text-xs text-ink-secondary">
                    Tindakan ini akan menghapus data instansi <strong className="text-ink-primary">{target.nama}</strong> ({target.url}) beserta seluruh log historis pengecekan secara permanen.
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="btn-secondary h-9 px-4 text-xs"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={deleting}
                        className="btn-action-delete h-9 rounded-full px-5 text-xs font-semibold"
                    >
                        {deleting ? 'Menghapus…' : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}
