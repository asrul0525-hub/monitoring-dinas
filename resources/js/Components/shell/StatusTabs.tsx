import { SharedProps, StatusKey } from '@/types/monitoring';
import { Link, usePage } from '@inertiajs/react';

interface StatusTabsProps {
    activeStatus?: StatusKey | null;
}

export function StatusTabs({ activeStatus = null }: StatusTabsProps) {
    const { statusCounts } = usePage<SharedProps>().props;
    const total =
        statusCounts.aktif +
        statusCounts['kurang-aktif'] +
        statusCounts['tidak-aktif'] +
        statusCounts.menunggu;

    const tabs: {
        key: StatusKey | null;
        label: string;
        count: number;
        href: string;
        dotClass?: string;
    }[] = [
        { key: null, label: 'Semua', count: total, href: '/instansi' },
        {
            key: 'aktif',
            label: 'Aktif',
            count: statusCounts.aktif,
            href: '/instansi?status=aktif',
            dotClass: 'status-dot--aktif',
        },
        {
            key: 'kurang-aktif',
            label: 'Kurang Aktif',
            count: statusCounts['kurang-aktif'],
            href: '/instansi?status=kurang-aktif',
            dotClass: 'status-dot--kurang',
        },
        {
            key: 'tidak-aktif',
            label: 'Tidak Aktif',
            count: statusCounts['tidak-aktif'],
            href: '/instansi?status=tidak-aktif',
            dotClass: 'status-dot--tidak',
        },
    ];

    return (
        <div
            role="navigation"
            aria-label="Filter status instansi"
            className="glass-shell fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-2.5 py-1.5"
        >
            {tabs.map((tab) => {
                const selected = activeStatus === tab.key;
                return (
                    <Link
                        key={tab.label}
                        href={tab.href}
                        aria-current={selected ? 'page' : undefined}
                        className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            selected
                                ? 'btn-primary-pill'
                                : 'text-ink-secondary hover:bg-surface-elevated hover:text-ink-primary'
                        }`}
                    >
                        {tab.dotClass && (
                            <span className={`h-2 w-2 rounded-full ${tab.dotClass}`} aria-hidden="true" />
                        )}
                        <span>{tab.label}</span>
                        <span
                            className={`tabular-nums rounded-full px-2 py-0.5 text-[11px] ${
                                selected ? 'bg-surface-card text-ink-primary' : 'surface-elevated text-ink-secondary'
                            }`}
                        >
                            {tab.count}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}
