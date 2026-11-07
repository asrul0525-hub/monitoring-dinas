import { StatusKey } from '@/types/monitoring';

interface StatusBadgeProps {
    status: StatusKey | null;
    size?: 'sm' | 'md' | 'lg';
}

const STATUS_META: Record<
    StatusKey | 'menunggu',
    { label: string; badgeClass: string; dotClass: string }
> = {
    aktif: {
        label: 'Aktif',
        badgeClass: 'status-badge status-badge--aktif',
        dotClass: 'status-dot status-dot--aktif',
    },
    'kurang-aktif': {
        label: 'Kurang Aktif',
        badgeClass: 'status-badge status-badge--kurang',
        dotClass: 'status-dot status-dot--kurang',
    },
    'tidak-aktif': {
        label: 'Tidak Aktif',
        badgeClass: 'status-badge status-badge--tidak',
        dotClass: 'status-dot status-dot--tidak',
    },
    menunggu: {
        label: 'Menunggu cek pertama',
        badgeClass: 'status-badge status-badge--menunggu',
        dotClass: 'status-dot status-dot--menunggu',
    },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
    const key = status ?? 'menunggu';
    const meta = STATUS_META[key];
    const sizeClass =
        size === 'lg'
            ? 'px-3.5 py-1 text-sm'
            : size === 'sm'
              ? 'px-2 py-0.5 text-xs'
              : 'px-2.5 py-1 text-xs';

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${meta.badgeClass}`}>
            <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} aria-hidden="true" />
            <span>{meta.label}</span>
        </span>
    );
}
