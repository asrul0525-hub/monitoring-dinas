import { formatRelativeId } from '@/lib/format';
import { SharedProps } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface AlertBellProps {
    alerts: SharedProps['alerts'];
}

export function AlertBell({ alerts }: AlertBellProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        const next = !open;
        setOpen(next);
        if (next && alerts.count > 0) {
            router.post('/notifikasi/dibaca', {}, { preserveScroll: true, preserveState: true });
        }
    };

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onClickOutside);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggleOpen}
                aria-expanded={open}
                aria-label={`Notifikasi gangguan (${alerts.count} baru)`}
                className="surface-elevated relative inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-primary"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {alerts.count > 0 && (
                    <span className="status-badge--tidak tabular-nums absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold">
                        {alerts.count}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Daftar instansi yang mengalami gangguan baru"
                    className="surface-card absolute right-0 top-11 z-50 w-80 p-4 shadow-2xl"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-primary">Gangguan Baru</span>
                        <span className="text-xs text-ink-secondary">{alerts.items.length} instansi</span>
                    </div>
                    {alerts.items.length === 0 ? (
                        <p className="py-3 text-xs text-ink-secondary">
                            Tidak ada instansi yang baru berubah menjadi Tidak Aktif sejak terakhir dibuka.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {alerts.items.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        href={`/instansi/${item.id}`}
                                        onClick={() => setOpen(false)}
                                        className="surface-elevated flex items-center justify-between rounded-lg px-3 py-2 text-xs hover:border-line-strong"
                                    >
                                        <span className="font-medium text-ink-primary">{item.nama}</span>
                                        <span className="text-status-tidak">
                                            {item.downSince ? `Down ${formatRelativeId(item.downSince)}` : 'Tidak Aktif'}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
