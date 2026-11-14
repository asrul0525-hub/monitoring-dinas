import { AdaptivePageSkeleton } from '@/Components/ui/Skeleton';
import { SharedProps, StatusKey } from '@/types/monitoring';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { RailNav } from './RailNav';
import { StatusTabs } from './StatusTabs';
import { TopBar } from './TopBar';

const MOBILE_NAV_LINKS = [
    { href: '/', label: 'Dashboard' },
    { href: '/instansi', label: 'Instansi' },
    { href: '/laporan', label: 'Laporan' },
    { href: '/log', label: 'Log' },
    { href: '/pengaturan', label: 'Pengaturan' },
];

interface AppShellProps extends PropsWithChildren {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    showStatusTabs?: boolean;
    activeStatus?: StatusKey | 'perlu-perhatian' | null;
    initialSearch?: string;
}

export function AppShell({
    title,
    subtitle,
    actions,
    showStatusTabs = false,
    activeStatus = null,
    initialSearch = '',
    children,
}: AppShellProps) {
    const page = usePage<SharedProps>();
    const { flash } = page.props;
    const [loadingPath, setLoadingPath] = useState<string | null>(null);
    const [flashVisible, setFlashVisible] = useState<boolean>(Boolean(flash?.status));

    useEffect(() => {
        if (!flash?.status) {
            setFlashVisible(false);
            return;
        }
        setFlashVisible(true);
        const dismissTimer = window.setTimeout(() => {
            setFlashVisible(false);
        }, 4000);
        return () => window.clearTimeout(dismissTimer);
    }, [flash]);

    useEffect(() => {
        let skeletonTimer: number | null = null;

        const clearSkeletonTimer = () => {
            if (skeletonTimer !== null) {
                window.clearTimeout(skeletonTimer);
                skeletonTimer = null;
            }
        };

        const removeStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            if ('prefetch' in visit && visit.prefetch) {
                return;
            }
            clearSkeletonTimer();

            if (visit.method === 'get' && visit.url.pathname !== window.location.pathname) {
                const targetPath = visit.url.pathname;
                skeletonTimer = window.setTimeout(() => {
                    setLoadingPath(targetPath);
                }, 180);
            }
        });

        const removeFinish = router.on('finish', () => {
            clearSkeletonTimer();
            setLoadingPath(null);
        });

        return () => {
            clearSkeletonTimer();
            removeStart();
            removeFinish();
        };
    }, []);

    return (
        <div className="min-h-screen px-4 pt-4 pb-28 md:px-8 md:pt-6 md:pb-36">
            <Head title={title} />

            <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-[1684px] items-start gap-5">
                <RailNav />

                <div className="min-w-0 flex-1">
                    <TopBar initialQuery={initialSearch} />

                <nav
                    aria-label="Navigasi seluler"
                    className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 md:hidden"
                >
                    {MOBILE_NAV_LINKS.map((item) => {
                        const active =
                            item.href === '/'
                                ? page.url === '/' || page.url.startsWith('/?')
                                : page.url.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                cacheFor="10s"
                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                                    active
                                        ? 'btn-primary-pill'
                                        : 'surface-elevated text-ink-secondary hover:text-ink-primary'
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {flash?.status && flashVisible && (
                    <div
                        role="status"
                        className="status-badge--aktif animate-page-enter mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-xs font-medium"
                    >
                        <span>{flash.status}</span>
                        <button
                            type="button"
                            onClick={() => setFlashVisible(false)}
                            aria-label="Tutup notifikasi"
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-sm leading-none opacity-80 transition-opacity hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="motion-stagger mt-6 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-ink-primary sm:text-[28px]">
                            {title}
                        </h1>
                        {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3">{actions}</div>}
                </div>

                <main
                    aria-busy={loadingPath !== null || undefined}
                    className="relative z-10"
                >
                    {loadingPath !== null ? <AdaptivePageSkeleton path={loadingPath} /> : children}
                </main>
                </div>
            </div>

            {showStatusTabs && <StatusTabs activeStatus={activeStatus} />}
        </div>
    );
}
