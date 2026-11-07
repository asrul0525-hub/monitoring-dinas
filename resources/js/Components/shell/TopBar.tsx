import { formatTimeWib } from '@/lib/format';
import { SharedProps } from '@/types/monitoring';
import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { AlertBell } from './AlertBell';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
    initialQuery?: string;
}

export function TopBar({ initialQuery = '' }: TopBarProps) {
    const { auth, schedule, alerts, isSampleData } = usePage<SharedProps>().props;
    const [q, setQ] = useState(initialQuery);
    const [checkingAll, setCheckingAll] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

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

    const userName = auth.user?.name ?? 'Admin Diskominfo';
    const initials = userName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <header className="glass-shell flex h-[60px] items-center justify-between gap-4 rounded-full px-5">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setAccountOpen((v) => !v)}
                        aria-expanded={accountOpen}
                        aria-label="Menu akun Super Admin"
                        className="surface-elevated flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-ink-primary"
                    >
                        {initials}
                    </button>
                    {accountOpen && (
                        <div className="surface-card absolute left-0 top-11 z-50 w-52 p-2 shadow-2xl">
                            <div className="border-b border-line-subtle px-3 py-2">
                                <p className="text-xs font-semibold text-ink-primary">{userName}</p>
                                <p className="text-[11px] text-ink-secondary">{auth.user?.email}</p>
                            </div>
                            <Link
                                href="/pengaturan"
                                className="mt-1 block rounded-lg px-3 py-1.5 text-xs text-ink-primary hover:bg-surface-elevated"
                            >
                                Pengaturan Akun
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="mt-1 block w-full rounded-lg px-3 py-1.5 text-left text-xs text-status-tidak hover:bg-surface-elevated"
                            >
                                Keluar (Logout)
                            </Link>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink-primary">
                            Selamat datang, {userName}
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

            <div className="flex items-center gap-3">
                <span className="tabular-nums text-xs text-ink-secondary">
                    Cek terakhir {formatTimeWib(schedule.lastCheckAt)} · berikutnya {formatTimeWib(schedule.nextCheckAt)}
                </span>

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
