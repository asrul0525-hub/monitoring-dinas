import { formatRelativeId } from '@/lib/format';
import { SharedProps } from '@/types/monitoring';
import { Link } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface AlertBellProps {
    alerts: SharedProps['alerts'];
}

function readCookie(name: string): string | null {
    const prefix = `${name}=`;
    const parts = document.cookie.split(';');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith(prefix)) {
            return decodeURIComponent(trimmed.slice(prefix.length));
        }
    }
    return null;
}

/**
 * Lonceng notifikasi "Gangguan Baru" dengan alur View-then-Clear:
 * daftar gangguan tetap tampil terbaca tanpa refresh halaman, lalu ditandai
 * dibaca secara silent saat popup ditutup agar tidak menumpuk.
 */
export function AlertBell({ alerts }: AlertBellProps) {
    const [open, setOpen] = useState(false);
    const [clearedKey, setClearedKey] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const currentKey = useMemo(
        () => alerts.items.map((item) => `${item.id}:${item.downSince ?? ''}`).join('|'),
        [alerts.items],
    );

    const isClearedLocally = clearedKey !== null && clearedKey === currentKey;
    const visibleItems = isClearedLocally ? [] : alerts.items;
    const badgeCount = isClearedLocally ? 0 : alerts.count;

    const markAlertsSeenSilently = useCallback(() => {
        if (visibleItems.length === 0 && badgeCount === 0) return;
        setClearedKey(currentKey);

        const xsrfToken = readCookie('XSRF-TOKEN');
        void fetch('/notifikasi/dibaca', {
            method: 'POST',
            credentials: 'same-origin',
            keepalive: true,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
            },
            body: '{}',
        }).catch(() => {});
    }, [visibleItems.length, badgeCount, currentKey]);

    const closeAndClear = useCallback(() => {
        setOpen(false);
        markAlertsSeenSilently();
    }, [markAlertsSeenSilently]);

    const toggleOpen = () => {
        if (open) {
            closeAndClear();
        } else {
            setOpen(true);
        }
    };

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeAndClear();
        };
        const onClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                closeAndClear();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onClickOutside);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [open, closeAndClear]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={toggleOpen}
                aria-expanded={open}
                aria-label={`Notifikasi gangguan (${badgeCount} baru)`}
                className="surface-elevated relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink-primary transition hover:border-accent"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {badgeCount > 0 && (
                    <span className="status-badge--tidak tabular-nums absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold">
                        {badgeCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Daftar instansi yang mengalami gangguan baru"
                    className="surface-elevated animate-modal-pop absolute right-0 top-11 z-50 w-80 rounded-2xl border border-line-strong p-4 shadow-2xl sm:w-96"
                >
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                            <span className="text-xs font-semibold text-ink-primary">Gangguan Baru</span>
                            <p className="text-[11px] text-ink-secondary">
                                {visibleItems.length > 0
                                    ? `${visibleItems.length} instansi baru turun • hilang setelah ditutup`
                                    : 'Semua notifikasi sudah dibaca'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeAndClear}
                            className="text-xs font-semibold text-accent hover:underline"
                        >
                            Tutup
                        </button>
                    </div>

                    {visibleItems.length === 0 ? (
                        <div className="surface-card rounded-xl border border-dashed border-line-subtle px-3 py-4 text-center text-xs text-ink-secondary">
                            Tidak ada instansi yang baru berubah menjadi Tidak Aktif sejak terakhir dibuka.
                        </div>
                    ) : (
                        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                            {visibleItems.map((item) => (
                                <li key={item.id}>
                                    <Link
                                        href={`/instansi/${item.id}`}
                                        onClick={closeAndClear}
                                        className="surface-card flex items-center justify-between gap-2 rounded-lg border border-line-subtle px-3 py-2 text-xs transition hover:border-accent"
                                    >
                                        <span className="truncate font-medium text-ink-primary">{item.nama}</span>
                                        <span className="shrink-0 text-status-tidak">
                                            {item.downSince ? `Down ${formatRelativeId(item.downSince)}` : 'Tidak Aktif'}
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-subtle pt-2.5 text-[11px]">
                        <Link
                            href="/instansi?status=tidak-aktif"
                            onClick={closeAndClear}
                            className="font-medium text-accent hover:underline"
                        >
                            Lihat yang Tidak Aktif →
                        </Link>
                        <Link
                            href="/log?hasil=gagal"
                            onClick={closeAndClear}
                            className="font-medium text-ink-secondary hover:text-ink-primary hover:underline"
                        >
                            Buka Log Gangguan →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
