import { Link, usePage } from '@inertiajs/react';

interface NavItem {
    label: string;
    href: string;
    match: (url: string) => boolean;
    icon: JSX.Element;
}

const NAV_ITEMS: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/',
        match: (url) => url === '/' || url.startsWith('/?'),
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
        ),
    },
    {
        label: 'Instansi',
        href: '/instansi',
        match: (url) => url.startsWith('/instansi'),
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-5 8v-4h4v4" />
            </svg>
        ),
    },
    {
        label: 'Laporan',
        href: '/laporan',
        match: (url) => url.startsWith('/laporan'),
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-5m3 5v-8m3 8v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        label: 'Log Monitoring',
        href: '/log',
        match: (url) => url.startsWith('/log'),
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        label: 'Pengaturan',
        href: '/pengaturan',
        match: (url) => url.startsWith('/pengaturan'),
        icon: (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <circle cx="12" cy="12" r="3" />
            </svg>
        ),
    },
];

export function RailNav() {
    const page = usePage();
    const url = page.url;

    return (
        <aside className="relative z-40 hidden w-16 shrink-0 self-stretch md:block">
            <div className="pointer-events-none sticky top-6 flex h-[calc(100vh-3rem)] items-center">
                <nav
                    aria-label="Navigasi utama"
                    className="glass-shell pointer-events-auto relative z-40 flex w-16 flex-col items-center gap-3 rounded-full py-5"
                >
            <Link
                href="/"
                prefetch
                cacheFor="10s"
                title="RADAR HSU — Diskominfosandi Kab. HSU"
                className="mb-2 flex flex-col items-center"
            >
                <div className="logo-emblem-tile flex h-12 w-12 items-center justify-center rounded-full p-1 transition-transform hover:scale-105">
                    <img
                        src="/images/logo-hsu.png"
                        alt="RADAR HSU"
                        className="h-full w-full object-contain"
                    />
                </div>
                <span className="mt-1 text-center text-[9px] font-bold tracking-wider text-ink-primary">
                    RADAR
                </span>
            </Link>

            {NAV_ITEMS.map((item) => {
                const active = item.match(url);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        cacheFor="10s"
                        title={item.label}
                        aria-label={item.label}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                            active
                                ? 'bg-accent-soft text-accent shadow-[0_0_16px_var(--accent-soft)] ring-1 ring-accent'
                                : 'text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
                        }`}
                    >
                        {item.icon}
                        <span className="surface-elevated pointer-events-none absolute left-[68px] z-50 whitespace-nowrap rounded-xl border border-line-strong px-2.5 py-1 text-xs font-semibold text-ink-primary opacity-0 shadow-xl transition-all duration-150 group-hover:translate-x-1 group-hover:opacity-100">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
                </nav>
            </div>
        </aside>
    );
}
