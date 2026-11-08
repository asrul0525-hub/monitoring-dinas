import { useEffect, useState } from 'react';

function formatWitaTime(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })
        .format(date)
        .replace(/\./g, ':');
}

export function RealtimeClockWita() {
    const [now, setNow] = useState<Date>(() => new Date());

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <div
            aria-label="Waktu real-time WITA"
            className="surface-elevated inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-medium text-ink-primary"
        >
            <span className="status-dot--aktif h-2 w-2 animate-pulse rounded-full" aria-hidden="true" />
            <svg
                className="h-3.5 w-3.5 text-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
            </svg>
            <span className="tabular-nums font-mono font-semibold tracking-tight">
                {formatWitaTime(now)}
            </span>
            <span className="text-[10px] font-bold tracking-wider text-accent">WITA</span>
        </div>
    );
}
