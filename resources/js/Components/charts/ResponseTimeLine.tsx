import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ResponseSeriesPoint {
    date: string;
    avgMs: number | null;
}

interface ResponseTimeLineProps {
    series: ResponseSeriesPoint[];
}

export function ResponseTimeLine({ series }: ResponseTimeLineProps) {
    const hasAnyValue = series.some((p) => p.avgMs !== null);

    if (!hasAnyValue) {
        return (
            <div className="surface-elevated flex h-60 items-center justify-center rounded-xl text-xs text-ink-secondary">
                Belum ada riwayat waktu respons dalam 30 hari terakhir.
            </div>
        );
    }

    return (
        <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        tickFormatter={(d: string) => d.slice(5)}
                        stroke="var(--border-subtle)"
                    />
                    <YAxis
                        tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        unit=" ms"
                        stroke="var(--border-subtle)"
                        width={64}
                    />
                    <Tooltip
                        formatter={(val) => [`${val ?? '—'} ms`, 'Rata-rata respons']}
                        labelFormatter={(label) => `Tanggal: ${String(label)}`}
                        contentStyle={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-strong)',
                            borderRadius: '10px',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                        }}
                    />
                    <Line
                        type="monotone"
                        dataKey="avgMs"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: 'var(--accent)' }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
