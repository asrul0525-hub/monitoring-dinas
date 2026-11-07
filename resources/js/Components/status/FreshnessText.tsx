import { formatRelativeId } from '@/lib/format';
import { InstansiRow } from '@/types/monitoring';

interface FreshnessTextProps {
    row: Pick<InstansiRow, 'status' | 'lastContentAt' | 'lastCheckedAt' | 'downSince'> & Partial<InstansiRow>;
    now?: Date;
    className?: string;
}

export function FreshnessText({ row, now = new Date(), className = '' }: FreshnessTextProps) {
    if (row.status === null && !row.lastCheckedAt) {
        return <span className={className}>Menunggu cek pertama</span>;
    }

    if (row.status === 'tidak-aktif') {
        const since = row.downSince ?? row.lastCheckedAt;
        return (
            <span className={className}>
                {since ? `Down sejak ${formatRelativeId(since, now)}` : 'Server tidak merespons'}
            </span>
        );
    }

    if (!row.lastContentAt) {
        return <span className={className}>Tanggal konten tidak ditemukan</span>;
    }

    return <span className={className}>Terakhir update: {formatRelativeId(row.lastContentAt, now)}</span>;
}
