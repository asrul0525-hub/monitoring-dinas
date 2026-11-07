import { StatusDoughnut } from '@/Components/charts/StatusDoughnut';
import { AppShell } from '@/Components/shell/AppShell';
import { FreshnessText } from '@/Components/status/FreshnessText';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatMs, formatRelativeId, formatTimeWib } from '@/lib/format';
import { InstansiRow, SharedProps } from '@/types/monitoring';
import { Link, usePage } from '@inertiajs/react';

type DashboardProps = SharedProps & {
    attention: InstansiRow[];
    fastest: InstansiRow[];
    stalest: InstansiRow[];
    failedLastCycle: number;
};

export default function Dashboard({
    attention,
    fastest,
    stalest,
    failedLastCycle,
}: DashboardProps) {
    const { statusCounts, schedule } = usePage<DashboardProps>().props;
    const checkedCount =
        statusCounts.aktif + statusCounts['kurang-aktif'] + statusCounts['tidak-aktif'];
    const totalCount = checkedCount + statusCounts.menunggu;
    const maxFastMs = Math.max(1, ...fastest.map((r) => r.lastResponseMs ?? 1));

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
            subtitle={`Status ${totalCount} website instansi per cek terakhir ${formatTimeWib(schedule.lastCheckAt)} WIB`}
            showStatusTabs
            activeStatus={null}
        >
            <div className="grid grid-cols-12 gap-5">
                {/* Large card 1: Doughnut */}
                <section className="surface-card col-span-5 flex flex-col justify-between p-6">
                    <div>
                        <h2 className="text-base font-semibold text-ink-primary">
                            Status {checkedCount} dari {totalCount} website per cek terakhir
                        </h2>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                            Klik segmen untuk membuka daftar instansi pada zona status tersebut
                        </p>
                    </div>
                    <div className="mt-4">
                        <StatusDoughnut counts={statusCounts} />
                    </div>
                </section>

                {/* Large card 2: Perlu perhatian */}
                <section className="surface-card col-span-7 flex flex-col justify-between p-6">
                    <div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-ink-primary">Perlu Perhatian</h2>
                                <p className="mt-0.5 text-xs text-ink-secondary">
                                    Instansi berstatus Tidak Aktif dan Kurang Aktif yang membutuhkan tindak lanjut
                                </p>
                            </div>
                            <Link
                                href="/instansi?status=tidak-aktif"
                                className="text-xs font-medium text-accent hover:underline"
                            >
                                Lihat semua
                            </Link>
                        </div>

                        {attention.length === 0 ? (
                            <div className="surface-elevated mt-6 rounded-xl p-6 text-center text-xs text-ink-secondary">
                                Seluruh website instansi yang sudah dicek berada dalam status Aktif.
                            </div>
                        ) : (
                            <ul className="mt-4 space-y-2">
                                {attention.slice(0, 7).map((item) => (
                                    <li key={item.id}>
                                        <Link
                                            href={`/instansi/${item.id}`}
                                            className="surface-elevated flex items-center justify-between gap-4 rounded-xl px-4 py-2.5 transition-colors hover:border-line-strong"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="truncate text-sm font-medium text-ink-primary">
                                                        {item.nama}
                                                    </span>
                                                    <StatusBadge status={item.status} size="sm" />
                                                </div>
                                                <p className="mt-0.5 text-xs text-ink-secondary">
                                                    <FreshnessText row={item} />
                                                </p>
                                            </div>

                                            <div className="tabular-nums shrink-0 text-right text-xs text-ink-secondary">
                                                {item.status === 'tidak-aktif'
                                                    ? item.lastHttpCode
                                                        ? `HTTP ${item.lastHttpCode}`
                                                        : 'Timeout'
                                                    : formatMs(item.lastResponseMs)}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Medium card 1: Top 5 Tercepat */}
                <section className="surface-card col-span-4 p-6">
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
                                            className="group block rounded-lg p-1.5 transition-colors hover:bg-surface-elevated"
                                        >
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-medium text-ink-primary group-hover:text-accent">
                                                    {idx + 1}. {item.nama}
                                                </span>
                                                <span className="tabular-nums font-semibold text-status-aktif">
                                                    {formatMs(item.lastResponseMs)}
                                                </span>
                                            </div>
                                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                                                <div
                                                    className="status-dot--aktif h-full rounded-full"
                                                    style={{ width: `${widthPct}%` }}
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
                <section className="surface-card col-span-5 p-6">
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
                                            className="surface-elevated flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors hover:border-line-strong"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium text-ink-primary">
                                                    {idx + 1}. {item.nama}
                                                </p>
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
                <section className="surface-card col-span-3 p-6">
                    <h2 className="text-base font-semibold text-ink-primary">Jadwal Pengecekan</h2>
                    <p className="mt-0.5 text-xs text-ink-secondary">Siklus pemantauan otomatis</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="surface-elevated rounded-xl p-3">
                            <span className="text-[11px] font-medium text-ink-secondary">Cek Terakhir</span>
                            <p className="tabular-nums mt-1 text-base font-bold text-ink-primary">
                                {formatTimeWib(schedule.lastCheckAt)} WIB
                            </p>
                        </div>
                        <div className="surface-elevated rounded-xl p-3">
                            <span className="text-[11px] font-medium text-ink-secondary">Berikutnya</span>
                            <p className="tabular-nums mt-1 text-base font-bold text-ink-primary">
                                {formatTimeWib(schedule.nextCheckAt)} WIB
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
