import { SharedProps } from '@/types/monitoring';
import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertBell } from './AlertBell';
import { RealtimeClockWita } from './RealtimeClockWita';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
    initialQuery?: string;
}

export function deriveUserIdentity(user?: { name?: string; email?: string } | null): {
    displayName: string;
    shortLabel: string;
    initials: string;
} {
    const emailPrefix = user?.email
        ? user.email
              .split('@')[0]
              .replace(/[._-]+/g, ' ')
              .trim()
        : '';

    const formattedFromEmail = emailPrefix
        ? emailPrefix
              .split(/\s+/)
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
        : '';

    const displayName = formattedFromEmail || user?.name || 'Admin';
    const words = displayName.split(/\s+/).filter(Boolean);
    const shortLabel = (words[0] ?? 'ADMIN').slice(0, 8).toUpperCase();
    const initials =
        words.length >= 2
            ? `${words[0][0]}${words[1][0]}`.toUpperCase()
            : displayName.slice(0, 2).toUpperCase();

    return { displayName, shortLabel, initials };
}

export function TopBar({ initialQuery = '' }: TopBarProps) {
    const { auth, alerts, isSampleData } = usePage<SharedProps>().props;
    const [q, setQ] = useState(initialQuery);
    const [checkingAll, setCheckingAll] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!accountOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setAccountOpen(false);
        };
        const onClickOutside = (e: MouseEvent) => {
            if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
                setAccountOpen(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onClickOutside);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [accountOpen]);

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = q.trim();
        router.get('/instansi', trimmed ? { q: trimmed } : {}, { preserveState: false });
    };

    const handleCheckAll = () => {
        if (checkingAll) return;
        router.post(
            '/cek-semua',
            {},
            {
                preserveScroll: true,
                onStart: () => setCheckingAll(true),
                onFinish: () => setCheckingAll(false),
            },
        );
    };

    const { displayName, initials } = deriveUserIdentity(auth.user);

    return (
        <header className="glass-shell relative z-50 flex h-[60px] items-center justify-between gap-4 rounded-full px-5">
            <div className="flex items-center gap-3">
                <Link
                    href="/"
                    className="surface-elevated hidden items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:border-accent sm:inline-flex"
                    title="RADAR HSU — Diskominfosandi Kab. HSU"
                >
                    <span className="status-dot--aktif inline-block h-2 w-2 rounded-full" />
                    <span className="text-xs font-bold tracking-wide text-ink-primary">
                        RADAR <span className="text-accent">HSU</span>
                    </span>
                </Link>

                <div className="hidden h-5 w-px bg-line-subtle sm:block" aria-hidden="true" />

                <div ref={accountRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setAccountOpen((v) => !v)}
                        aria-expanded={accountOpen}
                        aria-label="Menu akun Super Admin"
                        className="surface-elevated flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-accent hover:border-accent"
                    >
                        {initials}
                    </button>
                    {accountOpen && (
                        <div className="surface-card animate-modal-pop absolute left-0 top-11 z-50 w-56 p-2 shadow-2xl">
                            <div className="border-b border-line-subtle px-3 py-2">
                                <p className="text-xs font-semibold text-ink-primary">{displayName}</p>
                                <p className="truncate text-[11px] text-ink-secondary">{auth.user?.email}</p>
                            </div>
                            <Link
                                href="/pengaturan"
                                className="mt-1 block rounded-lg px-3 py-1.5 text-xs text-ink-primary transition hover:bg-surface-elevated"
                            >
                                Pengaturan Akun
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="mt-1 block w-full rounded-lg px-3 py-1.5 text-left text-xs text-status-tidak transition hover:bg-surface-elevated"
                            >
                                Keluar (Logout)
                            </Link>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-primary">
                            Selamat datang, {displayName}
                        </span>
                        {isSampleData && (
                            <span
                                title="Aplikasi sedang memakai FakeMonitor dan data contoh"
                                className="surface-elevated rounded-full px-2.5 py-0.5 text-[11px] font-medium text-ink-secondary"
                            >
                                Data contoh
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <form onSubmit={handleSearch} className="w-72">
                <label htmlFor="global-instansi-search" className="sr-only">
                    Cari instansi
                </label>
                <div className="relative flex items-center">
                    <svg
                        className="pointer-events-none absolute left-3 h-4 w-4 text-ink-secondary"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
                    </svg>
                    <input
                        id="global-instansi-search"
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Cari instansi…"
                        className="input-control h-9 w-full rounded-full pl-9 pr-3 text-xs"
                    />
                </div>
            </form>

            <div className="flex items-center gap-2.5">
                <RealtimeClockWita />

                <button
                    type="button"
                    onClick={handleCheckAll}
                    disabled={checkingAll}
                    className="btn-primary-pill h-9 px-4 text-xs"
                >
                    {checkingAll ? 'Mengecek…' : 'Cek Sekarang'}
                </button>

                <ThemeToggle />

                <AlertBell alerts={alerts} />
            </div>
        </header>
    );
}
