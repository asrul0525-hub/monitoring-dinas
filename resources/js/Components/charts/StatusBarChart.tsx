import { StatusCounts, StatusKey } from '@/types/monitoring';
import { router } from '@inertiajs/react';

interface StatusBarChartProps {
    counts: StatusCounts;
}

const BARS: {
    key: StatusKey;
    label: string;
    description: string;
    dotClass: string;
    badgeClass: string;
    fillColor: string;
}[] = [
    {
        key: 'aktif',
        label: 'Aktif',
        description: 'HTTP 200 & konten mutakhir',
        dotClass: 'status-dot--aktif',
        badgeClass: 'status-badge--aktif',
        fillColor: 'var(--status-aktif)',
    },
    {
        key: 'kurang-aktif',
        label: 'Kurang Aktif',
        description: 'HTTP 200 & konten perlu diperbarui',
        dotClass: 'status-dot--kurang',
        badgeClass: 'status-badge--kurang',
        fillColor: 'var(--status-kurang)',
    },
    {
        key: 'tidak-aktif',
        label: 'Tidak Aktif',
        description: 'HTTP gagal atau timeout jaringan',
        dotClass: 'status-dot--tidak',
        badgeClass: 'status-badge--tidak',
        fillColor: 'var(--status-tidak)',
    },
];

export function StatusBarChart({ counts }: StatusBarChartProps) {
    const checked = counts.aktif + counts['kurang-aktif'] + counts['tidak-aktif'];
    const total = checked + counts.menunggu;

    return (
        <div className="flex flex-col justify-between gap-4">
            <div className="flex items-baseline justify-between border-b border-line-subtle pb-3">
                <div>
                    <span className="tabular-nums font-mono text-3xl font-bold text-ink-primary">
                        {checked}
                    </span>
                    <span className="ml-2 text-xs text-ink-secondary">
                        dari {total} website sudah dicek
                    </span>
                </div>
                {counts.menunggu > 0 && (
                    <span className="status-badge--menunggu tabular-nums rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                        {counts.menunggu} menunggu cek pertama
                    </span>
                )}
            </div>

            <div className="space-y-3" role="list" aria-label="Grafik batang horizontal status website">
                {BARS.map((bar) => {
                    const count = counts[bar.key];
                    const pct = checked > 0 ? Math.round((count / checked) * 1000) / 10 : 0;
                    const widthPct = checked > 0 ? Math.max(count > 0 ? 4 : 0, (count / checked) * 100) : 0;

                    return (
                        <button
                            key={bar.key}
                            type="button"
                            onClick={() => router.get('/instansi', { status: bar.key })}
                            className="surface-elevated group block w-full rounded-xl p-3.5 text-left hover:border-accent"
                        >
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2.5 w-2.5 rounded-full ${bar.dotClass}`}
                                        aria-hidden="true"
                                    />
                                    <span className="text-xs font-semibold text-ink-primary group-hover:text-accent">
                                        {bar.label}
                                    </span>
                                    <span className="text-[11px] text-ink-secondary">
                                        · {bar.description}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`tabular-nums rounded-full px-2 py-0.5 font-mono text-xs font-bold ${bar.badgeClass}`}
                                    >
                                        {count} unit
                                    </span>
                                    <span className="tabular-nums w-12 text-right font-mono text-xs font-semibold text-ink-secondary">
                                        {pct.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-card p-0.5">
                                <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{
                                        width: `${widthPct}%`,
                                        background: bar.fillColor,
                                    }}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
