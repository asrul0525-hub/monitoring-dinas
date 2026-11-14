import { HighlightText } from '@/Components/ui/HighlightText';
import { KATEGORI_INSTANSI_LABELS, SharedProps, StatusKey } from '@/types/monitoring';
import { Link, router, usePage } from '@inertiajs/react';
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertBell } from './AlertBell';
import { RealtimeClockWita } from './RealtimeClockWita';
import { ThemeToggle } from './ThemeToggle';

const STATUS_DOT_CLASS: Record<StatusKey | 'menunggu', string> = {
    aktif: 'status-dot--aktif',
    'kurang-aktif': 'status-dot--kurang',
    'tidak-aktif': 'status-dot--tidak',
    menunggu: 'status-dot--menunggu',
};

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
    const { auth, alerts, isSampleData, quickSearchItems = [] } = usePage<SharedProps>().props;
    const [q, setQ] = useState(initialQuery);
    const [checkingAll, setCheckingAll] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const accountRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        setQ(initialQuery);
    }, [initialQuery]);

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

    useEffect(() => {
        if (!searchOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setActiveIndex(-1);
            }
        };
        const onClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
                setActiveIndex(-1);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('mousedown', onClickOutside);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousedown', onClickOutside);
        };
    }, [searchOpen]);

    const trimmedQuery = q.trim();
    const matchedItems = useMemo(() => {
        if (!trimmedQuery) return [];
        const needle = trimmedQuery.toLowerCase();
        return quickSearchItems.filter((item) => {
            const kategoriLabel =
                KATEGORI_INSTANSI_LABELS[item.kategori as keyof typeof KATEGORI_INSTANSI_LABELS] ??
                item.kategori;
            return (
                item.nama.toLowerCase().includes(needle) ||
                item.url.toLowerCase().includes(needle) ||
                kategoriLabel.toLowerCase().includes(needle)
            );
        });
    }, [quickSearchItems, trimmedQuery]);

    const visibleMatches = useMemo(() => matchedItems.slice(0, 8), [matchedItems]);

    const closeSearch = () => {
        setSearchOpen(false);
        setActiveIndex(-1);
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (searchOpen && activeIndex >= 0 && visibleMatches[activeIndex]) {
            const selected = visibleMatches[activeIndex];
            closeSearch();
            router.visit(`/instansi/${selected.id}`);
            return;
        }
        closeSearch();
        router.get('/instansi', trimmedQuery ? { q: trimmedQuery } : {}, { preserveState: false });
    };

    const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            if (visibleMatches.length === 0) return;
            e.preventDefault();
            setSearchOpen(true);
            setActiveIndex((prev) => (prev + 1) % visibleMatches.length);
        } else if (e.key === 'ArrowUp') {
            if (visibleMatches.length === 0) return;
            e.preventDefault();
            setSearchOpen(true);
            setActiveIndex((prev) => (prev <= 0 ? visibleMatches.length - 1 : prev - 1));
        }
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
        <header className="glass-shell relative z-50 flex min-h-[60px] flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-2 lg:flex-nowrap lg:gap-4 lg:rounded-full lg:px-5 lg:py-0">
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

            <form ref={searchRef} onSubmit={handleSearch} className="relative w-40 sm:w-52 lg:w-72">
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
                        onChange={(e) => {
                            const nextVal = e.target.value;
                            setQ(nextVal);
                            setSearchOpen(nextVal.trim().length > 0);
                            setActiveIndex(-1);
                        }}
                        onFocus={() => {
                            if (trimmedQuery.length > 0) setSearchOpen(true);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="Cari instansi…"
                        autoComplete="off"
                        aria-expanded={searchOpen && trimmedQuery.length > 0}
                        aria-autocomplete="list"
                        className="input-control h-9 w-full rounded-full pl-9 pr-3 text-xs"
                    />
                </div>

                {searchOpen && trimmedQuery.length > 0 && (
                    <div
                        role="listbox"
                        aria-label="Hasil pencarian global instansi"
                        className="surface-elevated animate-modal-pop absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-line-strong shadow-2xl sm:w-96"
                    >
                        <div className="flex items-center justify-between border-b border-line-subtle px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                            <span>Hasil Cepat Instansi</span>
                            <span>{matchedItems.length} ditemukan</span>
                        </div>

                        {visibleMatches.length === 0 ? (
                            <p className="px-4 py-5 text-center text-xs text-ink-secondary">
                                Tidak ada instansi yang cocok dengan &ldquo;{trimmedQuery}&rdquo;.
                            </p>
                        ) : (
                            <div className="max-h-72 divide-y divide-line-subtle overflow-y-auto">
                                {visibleMatches.map((item, idx) => {
                                    const dotClass =
                                        STATUS_DOT_CLASS[(item.status as StatusKey) ?? 'menunggu'] ??
                                        STATUS_DOT_CLASS.menunggu;
                                    const kategoriLabel =
                                        KATEGORI_INSTANSI_LABELS[
                                            item.kategori as keyof typeof KATEGORI_INSTANSI_LABELS
                                        ] ?? item.kategori;
                                    const isActive = idx === activeIndex;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={`/instansi/${item.id}`}
                                            role="option"
                                            aria-selected={isActive}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            onClick={closeSearch}
                                            className={`flex items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-surface-card ${
                                                isActive ? 'bg-surface-card' : ''
                                            }`}
                                        >
                                            <span
                                                className={`status-dot mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="truncate text-xs font-semibold text-ink-primary">
                                                        <HighlightText
                                                            text={item.nama}
                                                            query={trimmedQuery}
                                                        />
                                                    </span>
                                                    <span className="shrink-0 rounded-full bg-surface-card px-2 py-0.5 text-[10px] font-medium text-ink-secondary">
                                                        <HighlightText
                                                            text={kategoriLabel}
                                                            query={trimmedQuery}
                                                        />
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 truncate font-mono text-[11px] text-ink-secondary">
                                                    <HighlightText
                                                        text={item.url}
                                                        query={trimmedQuery}
                                                    />
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {matchedItems.length > 0 && (
                            <Link
                                href={`/instansi?q=${encodeURIComponent(trimmedQuery)}`}
                                onClick={closeSearch}
                                className="flex items-center justify-between border-t border-line-subtle bg-surface-card px-3.5 py-2 text-xs font-semibold text-accent transition hover:bg-accent-soft"
                            >
                                <span>Lihat semua ({matchedItems.length}) di Daftar Instansi</span>
                                <span aria-hidden="true">&rarr;</span>
                            </Link>
                        )}
                    </div>
                )}
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
