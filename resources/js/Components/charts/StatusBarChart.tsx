import {
    KATEGORI_INSTANSI_LABELS,
    KategoriInstansiKey,
    StatusCounts,
    StatusKey,
} from '@/types/monitoring';
import { router } from '@inertiajs/react';

export interface KategoriBreakdownItem {
    kategori: KategoriInstansiKey;
    total: number;
    aktif: number;
    kurang: number;
    tidak: number;
}

interface StatusBarChartProps {
    counts: StatusCounts;
    kpi?: {
        uptimePct: number | null;
        avgResponseMs: number | null;
        downCount: number;
    };
    kategoriBreakdown?: KategoriBreakdownItem[];
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

export function StatusBarChart({ counts, kpi, kategoriBreakdown = [] }: StatusBarChartProps) {
    const checked = counts.aktif + counts['kurang-aktif'] + counts['tidak-aktif'];

    return (
        <div className="flex flex-col justify-between gap-4">
            {/* 3 Mini Metric KPI Cards (mengisi ruang atas dengan proporsional) */}
            <div className="grid grid-cols-3 gap-2.5">
                <div className="surface-elevated rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
                        <span className="status-dot--aktif h-2 w-2 rounded-full" aria-hidden="true" />
                        <span>Rata-rata Uptime</span>
                    </div>
                    <p className="tabular-nums mt-1 font-mono text-xl font-bold text-ink-primary">
                        {kpi?.uptimePct !== null && kpi?.uptimePct !== undefined
                            ? `${kpi.uptimePct.toFixed(1)}%`
                            : '—'}
                    </p>
                </div>

                <div className="surface-elevated rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
                        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                        <span>Rata-rata Latensi</span>
                    </div>
                    <p className="tabular-nums mt-1 font-mono text-xl font-bold text-ink-primary">
                        {kpi?.avgResponseMs !== null && kpi?.avgResponseMs !== undefined
                            ? `${kpi.avgResponseMs} ms`
                            : '—'}
                    </p>
                </div>

                <div className="surface-elevated rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-ink-secondary">
                        <span
                            className={`status-dot--tidak h-2 w-2 rounded-full ${
                                (kpi?.downCount ?? counts['tidak-aktif']) > 0 ? 'animate-pulse' : ''
                            }`}
                            aria-hidden="true"
                        />
                        <span>Gangguan Aktif</span>
                    </div>
                    <p className="tabular-nums mt-1 font-mono text-xl font-bold text-status-tidak">
                        {kpi?.downCount ?? counts['tidak-aktif']} unit
                    </p>
                </div>
            </div>

            {/* Horizontal Status Bars */}
            <div className="space-y-2.5" role="list" aria-label="Grafik batang horizontal status website">
                {BARS.map((bar) => {
                    const count = counts[bar.key];
                    const pct = checked > 0 ? Math.round((count / checked) * 1000) / 10 : 0;
                    const widthPct = checked > 0 ? Math.max(count > 0 ? 4 : 0, (count / checked) * 100) : 0;

                    return (
                        <button
                            key={bar.key}
                            type="button"
                            onClick={() => router.get('/instansi', { status: bar.key })}
                            className="surface-elevated group block w-full rounded-xl p-3 text-left hover:border-accent"
                        >
                            <div className="mb-1.5 flex items-center justify-between gap-2">
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
                                    <span className="tabular-nums w-11 text-right font-mono text-xs font-semibold text-ink-secondary">
                                        {pct.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-card p-0.5">
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

            {/* Sebaran Kategori Instansi */}
            {kategoriBreakdown.length > 0 && (
                <div className="border-t border-line-subtle pt-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-secondary">
                            Sebaran Kategori Instansi
                        </span>
                        {counts.menunggu > 0 && (
                            <span className="status-badge--menunggu tabular-nums rounded-full px-2 py-0.5 text-[10px] font-medium">
                                {counts.menunggu} menunggu cek pertama
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {kategoriBreakdown.map((item) => (
                            <button
                                key={item.kategori}
                                type="button"
                                onClick={() => router.get('/laporan', { kategori: item.kategori })}
                                className="surface-elevated flex flex-col justify-between rounded-xl px-3 py-2.5 text-left hover:border-accent"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="truncate text-[11px] font-semibold text-ink-primary">
                                        {KATEGORI_INSTANSI_LABELS[item.kategori]}
                                    </span>
                                    <span className="tabular-nums font-mono text-xs font-bold text-accent">
                                        {item.total}
                                    </span>
                                </div>
                                <div className="tabular-nums mt-1.5 flex items-center gap-2 text-[10px] text-ink-secondary">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="status-dot--aktif h-1.5 w-1.5 rounded-full" />
                                        {item.aktif}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="status-dot--kurang h-1.5 w-1.5 rounded-full" />
                                        {item.kurang}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <span className="status-dot--tidak h-1.5 w-1.5 rounded-full" />
                                        {item.tidak}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
