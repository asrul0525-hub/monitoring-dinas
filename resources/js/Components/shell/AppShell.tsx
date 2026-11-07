import { SharedProps, StatusKey } from '@/types/monitoring';
import { Head, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';
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
    const { flash } = usePage<SharedProps>().props;

    return (
        <div className="min-h-screen pl-[104px] pr-8 pt-6 pb-24">
            <Head title={title} />
            <RailNav />

            <div className="mx-auto max-w-[1600px]">
                <TopBar initialQuery={initialSearch} />

                {flash?.status && (
                    <div
                        role="status"
                        className="status-badge--aktif mt-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium"
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

                <main>{children}</main>
            </div>

            {showStatusTabs && <StatusTabs activeStatus={activeStatus} />}
        </div>
    );
}
