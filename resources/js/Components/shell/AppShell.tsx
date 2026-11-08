import { AdaptivePageSkeleton } from '@/Components/ui/Skeleton';
import { SharedProps, StatusKey } from '@/types/monitoring';
import { Head, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, useEffect, useState } from 'react';
import { RailNav } from './RailNav';
import { StatusTabs } from './StatusTabs';
import { TopBar } from './TopBar';

interface AppShellProps extends PropsWithChildren {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    showStatusTabs?: boolean;
    activeStatus?: StatusKey | null;
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

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            if (visit.method === 'get') {
                setLoadingPath(visit.url.pathname);
            } else if (visit.url.pathname === '/cek-semua') {
                setLoadingPath(window.location.pathname);
            }
        });
        const removeFinish = router.on('finish', () => {
            setLoadingPath(null);
        });

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    return (
        <div className="min-h-screen pl-[104px] pr-8 pt-6 pb-36">
            <Head title={title} />
            <RailNav />

            <div className="mx-auto max-w-[1600px]">
                <TopBar initialQuery={initialSearch} />

                {flash?.status && (
                    <div
                        role="status"
                        className="status-badge--aktif animate-page-enter mt-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium"
                    >
                        <span>{flash.status}</span>
                    </div>
                )}

                <div className="mt-6 mb-5 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[28px] font-bold tracking-tight text-ink-primary">{title}</h1>
                        {subtitle && <p className="mt-0.5 text-sm text-ink-secondary">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-3">{actions}</div>}
                </div>

                <main className="animate-page-enter">
                    {loadingPath !== null ? <AdaptivePageSkeleton path={loadingPath} /> : children}
                </main>
            </div>

            {showStatusTabs && <StatusTabs activeStatus={activeStatus} />}
        </div>
    );
}
