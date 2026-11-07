export function formatRelativeId(iso: string | null | undefined, now: Date = new Date()): string {
    if (!iso) {
        return '—';
    }

    const target = new Date(iso);
    if (Number.isNaN(target.getTime())) {
        return '—';
    }

    const diffSeconds = Math.max(0, Math.round((now.getTime() - target.getTime()) / 1000));

    if (diffSeconds < 60) {
        return 'baru saja';
    }

    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
        return `${diffMinutes} menit yang lalu`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} jam yang lalu`;
    }

    const diffDays = Math.round(diffHours / 24);
    if (diffDays < 60) {
        return `${diffDays} hari yang lalu`;
    }

    const diffMonths = Math.round(diffDays / 30.4375);
    if (diffMonths < 12) {
        return `${diffMonths} bulan yang lalu`;
    }

    const diffYears = Math.round(diffDays / 365);
    return `${diffYears} tahun yang lalu`;
}

export function formatMs(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) {
        return '—';
    }

    return `${new Intl.NumberFormat('id-ID').format(ms)} ms`;
}

export function formatTimeWib(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function formatDateTimeId(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}
