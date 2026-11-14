import { KategoriBreakdownItem, StatusBarChart } from '@/Components/charts/StatusBarChart';
import { AppShell } from '@/Components/shell/AppShell';
import { FreshnessText } from '@/Components/status/FreshnessText';
import { HttpCodeBadge } from '@/Components/status/HttpCodeBadge';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs, formatRelativeId, formatTimeWita } from '@/lib/format';
import { InstansiRow, KATEGORI_INSTANSI_LABELS, SharedProps } from '@/types/monitoring';
import { Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

type DashboardProps = SharedProps & {
    attention: InstansiRow[];
    attentionStale?: InstansiRow[];
    attentionReasons?: Record<number, string>;
    fastest: InstansiRow[];
    stalest: InstansiRow[];
    failedLastCycle: number;
    kpi?: {
        uptimePct: number | null;
        avgResponseMs: number | null;
        downCount: number;
    };
    kategoriBreakdown?: KategoriBreakdownItem[];
};

type AttentionTab = 'all' | 'tidak-aktif' | 'kurang-aktif';

export default function Dashboard({
    attention,
    attentionStale = [],
    attentionReasons = {},
    fastest,
    stalest,
    failedLastCycle,
    kpi,
    kategoriBreakdown = [],
}: DashboardProps) {
    const { statusCounts, schedule } = usePage<DashboardProps>().props;
    const [attentionTab, setAttentionTab] = useState<AttentionTab>('all');

    const checkedCount =
        statusCounts.aktif + statusCounts['kurang-aktif'] + statusCounts['tidak-aktif'];
    const totalCount = checkedCount + statusCounts.menunggu;
    const maxFastMs = Math.max(1, ...fastest.map((r) => r.lastResponseMs ?? 1));

    const downCount = statusCounts['tidak-aktif'];
    const staleCount = statusCounts['kurang-aktif'];
    const problemTotal = downCount + staleCount;

    const visibleAttention = useMemo(() => {
        if (attentionTab === 'tidak-aktif') {
            return attention.filter((item) => item.status === 'tidak-aktif').slice(0, 6);
        }
        if (attentionTab === 'kurang-aktif') {
            const source =
                attentionStale.length > 0
                    ? attentionStale
                    : attention.filter((item) => item.status === 'kurang-aktif');
            return source.slice(0, 6);
        }
        return attention.slice(0, 6);
    }, [attention, attentionStale, attentionTab]);

    const attentionSubtitle = useMemo(() => {
        if (problemTotal === 0) {
            return 'Instansi berstatus Tidak Aktif dan Kurang Aktif yang membutuhkan tindak lanjut';
        }
        if (attentionTab === 'tidak-aktif') {
            return `Menampilkan ${visibleAttention.length} dari ${downCount} instansi Tidak Aktif`;
        }
        if (attentionTab === 'kurang-aktif') {
            return `Menampilkan ${visibleAttention.length} dari ${staleCount} instansi Kurang Aktif`;
        }
        return `Menampilkan ${visibleAttention.length} dari ${problemTotal} instansi bermasalah`;
    }, [attentionTab, visibleAttention.length, downCount, staleCount, problemTotal]);

    const seeAllHref =
        attentionTab === 'tidak-aktif'
            ? '/instansi?status=tidak-aktif'
            : attentionTab === 'kurang-aktif'
              ? '/instansi?status=kurang-aktif'
              : downCount > 0 && staleCount === 0
                ? '/instansi?status=tidak-aktif'
                : staleCount > 0 && downCount === 0
                  ? '/instansi?status=kurang-aktif'
                  : '/instansi?status=perlu-perhatian';

    const seeAllLabel =
        attentionTab === 'tidak-aktif'
            ? `Lihat semua (${downCount})`
            : attentionTab === 'kurang-aktif'
              ? `Lihat semua (${staleCount})`
              : `Lihat semua (${problemTotal})`;

    if (totalCount === 0) {
        return (
            <AppShell
                title="Dashboard"
                subtitle="Belum ada website instansi yang terdaftar"
                showStatusTabs
            >
                <div className="surface-card flex flex-col items-center justify-center px-6 py-16 text-center">
                    <h2 className="text-base font-semibold text-ink-primary">
                        Belum ada instansi yang dipantau. Tambahkan instansi pertama.
                    </h2>
                    <p className="mt-1 max-w-md text-xs text-ink-secondary">
                        Daftarkan URL website utama dan sitemap atau RSS feed instansi daerah untuk mulai melacak uptime serta pembaruan konten.
                    </p>
                    <Link
                        href="/instansi?tambah=1"
                        className="btn-primary-pill mt-5 inline-flex h-10 items-center px-5 text-xs"
                    >
                        Tambah Instansi Pertama
                    </Link>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            title="Dashboard"
            subtitle={`Status ${totalCount} website instansi per cek terakhir ${formatTimeWita(schedule.lastCheckAt)} WITA`}
            showStatusTabs
            activeStatus={null}
        >
            <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
                {/* Large card 1: Horizontal Bar Chart */}
                <section
                    style={{ animationDelay: '0ms' }}
                    className="surface-card motion-stagger motion-card-hover flex flex-col justify-between p-6 lg:col-span-5"
                >
                    <div>
                        <h2 className="text-base font-semibold text-ink-primary">
                            Status {checkedCount} dari {totalCount} website per cek terakhir
                        </h2>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                            Klik batang status untuk menyaring daftar instansi pada zona tersebut
                        </p>
                    </div>
                    <div className="mt-4">
                        <StatusBarChart
                            counts={statusCounts}
                            kpi={kpi}
                            kategoriBreakdown={kategoriBreakdown}
                        />
                    </div>
                </section>

                {/* Large card 2: Perlu perhatian */}
                <section
                    style={{ animationDelay: '55ms' }}
                    className="surface-card motion-stagger motion-card-hover flex flex-col justify-between p-6 lg:col-span-7"
                >
                    <div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-ink-primary">Perlu Perhatian</h2>
                                <p className="mt-0.5 text-xs text-ink-secondary">{attentionSubtitle}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {[
                                    { key: 'all' as const, label: `Semua (${problemTotal})` },
                                    { key: 'tidak-aktif' as const, label: `Tidak Aktif (${downCount})` },
                                    { key: 'kurang-aktif' as const, label: `Kurang Aktif (${staleCount})` },
                                ].map((tab) => {
                                    const active = attentionTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setAttentionTab(tab.key)}
                                            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                                                active
                                                    ? 'btn-primary-pill'
                                                    : 'surface-elevated text-ink-secondary hover:text-ink-primary'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {visibleAttention.length === 0 ? (
                            <div className="surface-elevated mt-6 rounded-xl p-6 text-center text-xs text-ink-secondary">
                                {attentionTab === 'tidak-aktif'
                                    ? 'Tidak ada website instansi yang berstatus Tidak Aktif.'
                                    : attentionTab === 'kurang-aktif'
                                      ? 'Tidak ada website instansi yang berstatus Kurang Aktif.'
                                      : 'Seluruh website instansi yang sudah dicek berada dalam status Aktif.'}
                            </div>
                        ) : (
                            <ul className="mt-4 space-y-2">
                                {visibleAttention.map((item) => {
                                    const reason = attentionReasons[item.id] ?? null;
                                    return (
                                        <li key={item.id}>
                                            <Link
                                                href={`/instansi/${item.id}`}
                                                prefetch
                                                cacheFor="10s"
                                                className="surface-elevated motion-card-hover flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 transition-colors hover:border-line-strong"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="truncate text-sm font-medium text-ink-primary">
                                                            {item.nama}
                                                        </span>
                                                        <StatusBadge status={item.status} size="sm" />
                                                    </div>
                                                    <p className="mt-0.5 truncate text-xs text-ink-secondary">
                                                        <FreshnessText row={item} />
                                                        {reason ? ` · ${reason}` : ''}
                                                    </p>
                                                </div>

                                                <div className="tabular-nums shrink-0 text-right text-xs text-ink-secondary">
                                                    {item.status === 'tidak-aktif' ? (
                                                        <HttpCodeBadge
                                                            code={item.lastHttpCode}
                                                            status={item.status}
                                                            error={reason}
                                                            neverChecked={!item.lastCheckedAt}
                                                        />
                                                    ) : (
                                                        formatMs(item.lastResponseMs)
                                                    )}
                                                </div>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {problemTotal > 0 && (
                            <div className="mt-3 flex justify-end border-t border-line-subtle pt-3">
                                <Link
                                    href={seeAllHref}
                                    prefetch
                                    cacheFor="10s"
                                    className="text-xs font-medium text-accent hover:underline"
                                >
                                    {seeAllLabel} →
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Medium card 1: Top 5 Tercepat */}
                <section
                    style={{ animationDelay: '110ms' }}
                    className="surface-card motion-stagger motion-card-hover p-6 lg:col-span-4"
                >
                    <h2 className="text-base font-semibold text-ink-primary">Top 5 Website Tercepat</h2>
                    <p className="mt-0.5 text-xs text-ink-secondary">Waktu respons HTTP terendah pada cek terakhir</p>

                    {fastest.length === 0 ? (
                        <p className="mt-6 text-xs text-ink-secondary">Belum ada data waktu respons.</p>
                    ) : (
                        <ol className="mt-4 space-y-3">
                            {fastest.map((item, idx) => {
                                const ms = item.lastResponseMs ?? 0;
                                const widthPct = Math.max(12, Math.round((ms / maxFastMs) * 100));
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={`/instansi/${item.id}`}
                                            prefetch
                                            cacheFor="10s"
                                            className="group block rounded-lg p-1.5 transition-colors hover:bg-surface-elevated"
                                        >
                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <span className="truncate font-medium text-ink-primary group-hover:text-accent">
                                                        {idx + 1}. {item.nama}
                                                    </span>
                                                    <span className="surface-elevated shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary">
                                                        {KATEGORI_INSTANSI_LABELS[item.kategori] ?? item.kategori}
                                                    </span>
                                                </div>
                                                <span className="tabular-nums shrink-0 font-semibold text-status-aktif">
                                                    {formatMs(item.lastResponseMs)}
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                                                <div
                                                    className="status-dot--aktif motion-bar h-full rounded-full"
                                                    style={{ width: `${widthPct}%`, animationDelay: `${idx * 45}ms` }}
                                                />
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>

                {/* Medium card 2: Top 5 Paling Usang */}
                <section
                    style={{ animationDelay: '165ms' }}
                    className="surface-card motion-stagger motion-card-hover p-6 lg:col-span-5"
                >
                    <h2 className="text-base font-semibold text-ink-primary">Top 5 Website Paling Usang</h2>
                    <p className="mt-0.5 text-xs text-ink-secondary">Rentang waktu terlama sejak pembaruan konten terakhir</p>

                    {stalest.length === 0 ? (
                        <p className="mt-6 text-xs text-ink-secondary">Belum ada data umur konten.</p>
                    ) : (
                        <ol className="mt-4 space-y-2.5">
                            {stalest.map((item, idx) => {
                                const days = item.lastContentAt
                                    ? Math.max(
                                          0,
                                          Math.round(
                                              (Date.now() - new Date(item.lastContentAt).getTime()) /
                                                  86_400_000,
                                          ),
                                      )
                                    : null;
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={`/instansi/${item.id}`}
                                            prefetch
                                            cacheFor="10s"
                                            className="surface-elevated motion-card-hover flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-colors hover:border-line-strong"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="truncate text-xs font-medium text-ink-primary">
                                                        {idx + 1}. {item.nama}
                                                    </p>
                                                    <span className="surface-card shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-ink-secondary">
                                                        {KATEGORI_INSTANSI_LABELS[item.kategori] ?? item.kategori}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-ink-secondary">
                                                    {item.lastContentAt
                                                        ? `Terakhir update: ${formatRelativeId(item.lastContentAt)}`
                                                        : 'Tanggal konten tidak ditemukan'}
                                                </p>
                                            </div>
                                            <span className="status-badge--kurang tabular-nums shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                {days !== null ? `${days} hari` : 'Tidak ada'}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </section>

                {/* Small card: Ringkasan Jadwal */}
                <section
                    style={{ animationDelay: '220ms' }}
                    className="surface-card motion-stagger motion-card-hover p-6 lg:col-span-3"
                >
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h2 className="text-base font-semibold text-ink-primary">Jadwal Pengecekan</h2>
                            <p className="mt-0.5 text-xs text-ink-secondary">Siklus pemantauan otomatis</p>
                        </div>
                        <Link
                            href="/pengaturan"
                            prefetch
                            cacheFor="10s"
                            title={
                                schedule.schedulerActive
                                    ? 'Mesin scheduler cron aktif berjalan otomatis'
                                    : 'Mesin scheduler cron belum terdeteksi aktif'
                            }
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-90 ${
                                schedule.schedulerActive
                                    ? 'status-badge--aktif'
                                    : 'status-badge--kurang'
                            }`}
                        >
                            <span
                                className={`inline-block h-1.5 w-1.5 rounded-full ${
                                    schedule.schedulerActive
                                        ? 'status-dot--aktif'
                                        : 'status-dot--kurang'
                                }`}
                            />
                            <span>{schedule.schedulerActive ? 'Cron Aktif' : 'Cron Off'}</span>
                        </Link>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="surface-elevated rounded-xl p-3">
                            <span className="text-[11px] font-medium text-ink-secondary">Cek Terakhir</span>
                            <p className="tabular-nums mt-1 text-base font-bold text-ink-primary">
                                {formatTimeWita(schedule.lastCheckAt)} WITA
                            </p>
                        </div>
                        <div className="surface-elevated rounded-xl p-3">
                            <span className="text-[11px] font-medium text-ink-secondary">Berikutnya</span>
                            <p className="tabular-nums mt-1 text-base font-bold text-ink-primary">
                                {formatTimeWita(schedule.nextCheckAt)} WITA
                            </p>
                        </div>
                        <div className="surface-elevated rounded-xl p-3">
                            <span className="text-[11px] font-medium text-ink-secondary">Interval Rutin</span>
                            <p className="tabular-nums mt-1 text-base font-bold text-ink-primary">
                                {schedule.intervalHours} Jam
                            </p>
                        </div>
                        <div className="surface-elevated rounded-xl p-3">
                            <span className="text-[11px] font-medium text-ink-secondary">Gagal Siklus Lalu</span>
                            <p className="tabular-nums mt-1 text-base font-bold text-status-tidak">
                                {failedLastCycle} Website
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
