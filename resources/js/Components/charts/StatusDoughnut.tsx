import { StatusCounts, StatusKey } from '@/types/monitoring';
import { router } from '@inertiajs/react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface StatusDoughnutProps {
    counts: StatusCounts;
}

const SEGMENTS: {
    key: StatusKey;
    label: string;
    colorVar: string;
    dotClass: string;
}[] = [
    { key: 'aktif', label: 'Aktif', colorVar: 'var(--status-aktif)', dotClass: 'status-dot--aktif' },
    {
        key: 'kurang-aktif',
        label: 'Kurang Aktif',
        colorVar: 'var(--status-kurang)',
        dotClass: 'status-dot--kurang',
    },
    {
        key: 'tidak-aktif',
        label: 'Tidak Aktif',
        colorVar: 'var(--status-tidak)',
        dotClass: 'status-dot--tidak',
    },
];

export function StatusDoughnut({ counts }: StatusDoughnutProps) {
    const checkedTotal = counts.aktif + counts['kurang-aktif'] + counts['tidak-aktif'];
    const data = SEGMENTS.map((seg) => ({
        ...seg,
        value: counts[seg.key],
    }));

    const handleSelect = (status: StatusKey) => {
        router.visit(`/instansi?status=${status}`);
    };

    return (
        <div className="flex flex-col justify-between">
            <div className="relative mx-auto h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={70}
                            outerRadius={96}
                            paddingAngle={2}
                            stroke="none"
                            onClick={(entry) => {
                                if (entry?.key) {
                                    handleSelect(entry.key as StatusKey);
                                }
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            {data.map((entry) => (
                                <Cell key={entry.key} fill={entry.colorVar} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(val, name) => [`${val ?? 0} website`, String(name ?? '')]}
                            contentStyle={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-strong)',
                                borderRadius: '10px',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="tabular-nums text-3xl font-bold text-ink-primary">{checkedTotal}</span>
                    <span className="text-[11px] font-medium text-ink-secondary">Website terpantau</span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
                {SEGMENTS.map((seg) => {
                    const value = counts[seg.key];
                    const pct = checkedTotal > 0 ? Math.round((value / checkedTotal) * 1000) / 10 : 0;
                    return (
                        <button
                            key={seg.key}
                            type="button"
                            onClick={() => handleSelect(seg.key)}
                            className="surface-elevated flex flex-col items-start rounded-xl p-3 text-left transition-colors hover:border-line-strong"
                        >
                            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-primary">
                                <span className={`h-2 w-2 rounded-full ${seg.dotClass}`} aria-hidden="true" />
                                <span>{seg.label}</span>
                            </div>
                            <div className="tabular-nums mt-1.5 flex items-baseline gap-1.5">
                                <span className="text-lg font-bold text-ink-primary">{value}</span>
                                <span className="text-xs text-ink-secondary">({pct}%)</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {counts.menunggu > 0 && (
                <p className="mt-3 border-t border-line-subtle pt-2.5 text-xs text-ink-secondary">
                    {counts.menunggu} instansi menunggu cek pertama
                </p>
            )}
        </div>
    );
}
