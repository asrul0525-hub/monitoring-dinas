import { ResponseSeriesPoint, ResponseTimeLine } from '@/Components/charts/ResponseTimeLine';
import { InstansiFormPanel } from '@/Components/instansi/InstansiFormPanel';
import { AppShell } from '@/Components/shell/AppShell';
import { FreshnessText } from '@/Components/status/FreshnessText';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { formatDateTimeId, formatMs } from '@/lib/format';
import { InstansiRow, Paginated, SharedProps, StatusKey } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface CheckHistoryItem {
    id: number;
    checkedAt: string;
    httpCode: number | null;
    responseMs: number | null;
    contentDate: string | null;
    contentSource: string | null;
    status: StatusKey;
    error: string | null;
}

type ShowProps = SharedProps & {
    instansi: InstansiRow;
    uptime: {
        d7: number | null;
        d30: number | null;
    };
    series: ResponseSeriesPoint[];
    checks: Paginated<CheckHistoryItem>;
};

export default function InstansiShow({ instansi, uptime, series, checks }: ShowProps) {
    const [checking, setChecking] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const handleCheckNow = () => {
        if (checking) return;
        router.post(
            `/instansi/${instansi.id}/cek`,
            {},
            {
                preserveScroll: true,
                onStart: () => setChecking(true),
                onFinish: () => setChecking(false),
            },
        );
    };

    const formatPct = (val: number | null) =>
        val === null ? '—' : `${val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

    return (
        <AppShell
            title={instansi.nama}
            subtitle={instansi.url}
            actions={
                <>
                    <StatusBadge status={instansi.status} size="lg" />
                    <a
                        href={instansi.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary inline-flex h-9 items-center gap-1.5 px-3.5 text-xs"
                    >
                        <span>Buka Website</span>
                        <span aria-hidden="true">↗</span>
                    </a>
                    <Link
                        href={`/laporan?instansi[]=${instansi.id}`}
                        className="btn-secondary inline-flex h-9 items-center px-3.5 text-xs"
                    >
                        Lihat di laporan
                    </Link>
                    <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="btn-secondary h-9 px-3.5 text-xs"
                    >
                        Ubah
                    </button>
                    <button
                        type="button"
                        onClick={handleCheckNow}
                        disabled={checking}
                        className="btn-primary-pill h-9 px-4 text-xs"
                    >
                        {checking ? 'Mengecek…' : 'Cek Sekarang'}
                    </button>
                </>
            }
        >
            <div className="grid grid-cols-12 gap-5">
                {/* Summary strip */}
                <div className="surface-card col-span-12 grid grid-cols-4 divide-x divide-line-subtle p-5">
                    <div className="px-4 first:pl-0">
                        <span className="text-xs font-medium text-ink-secondary">Status & Freshness</span>
                        <p className="mt-1 text-sm font-semibold text-ink-primary">
                            <FreshnessText row={instansi} />
                        </p>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                            Sumber konten: {instansi.contentSource ? instansi.contentSource.toUpperCase() : '—'}
                        </p>
                    </div>
                    <div className="px-4">
                        <span className="text-xs font-medium text-ink-secondary">Uptime 7 Hari</span>
                        <p className="tabular-nums mt-1 text-2xl font-bold text-ink-primary">
                            {formatPct(uptime.d7)}
                        </p>
                    </div>
                    <div className="px-4">
                        <span className="text-xs font-medium text-ink-secondary">Uptime 30 Hari</span>
                        <p className="tabular-nums mt-1 text-2xl font-bold text-ink-primary">
                            {formatPct(uptime.d30)}
                        </p>
                    </div>
                    <div className="px-4">
                        <span className="text-xs font-medium text-ink-secondary">Tanggal Konten Terakhir</span>
                        <p className="tabular-nums mt-1 text-sm font-semibold text-ink-primary">
                            {formatDateTimeId(instansi.lastContentAt)}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                            Respons terakhir: {formatMs(instansi.lastResponseMs)}
                        </p>
                    </div>
                </div>

                {/* Line chart response time 30 days */}
                <section className="surface-card col-span-12 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-ink-primary">
                                Rata-rata Response Time Harian (30 Hari Terakhir)
                            </h2>
                            <p className="mt-0.5 text-xs text-ink-secondary">
                                Latensi rata-rata per hari dalam satuan milidetik (ms)
                            </p>
                        </div>
                    </div>
                    <ResponseTimeLine series={series} />
                </section>

                {/* Checks history table */}
                <section className="surface-table col-span-12 overflow-hidden">
                    <div className="border-b border-line-subtle px-5 py-4">
                        <h2 className="text-base font-semibold text-ink-primary">Riwayat Pengecekan</h2>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                            Catatan kronologis setiap pemeriksaan server dan konten untuk {instansi.nama}
                        </p>
                    </div>

                    {checks.data.length === 0 ? (
                        <div className="px-6 py-12 text-center text-xs text-ink-secondary">
                            Instansi ini belum pernah dicek. Tekan tombol <strong className="text-ink-primary">Cek Sekarang</strong> di kanan atas untuk menjalankan pemeriksaan pertama.
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-line-subtle text-xs font-semibold text-ink-secondary">
                                            <th className="px-5 py-3.5">Waktu cek</th>
                                            <th className="px-5 py-3.5">Status hasil</th>
                                            <th className="px-5 py-3.5">Kode HTTP</th>
                                            <th className="px-5 py-3.5">Response time</th>
                                            <th className="px-5 py-3.5">Tanggal konten terdeteksi</th>
                                            <th className="px-5 py-3.5">Keterangan / Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line-subtle">
                                        {checks.data.map((chk) => (
                                            <tr key={chk.id} className="whitespace-nowrap hover:bg-surface-elevated">
                                                <td className="tabular-nums px-5 py-3 text-xs text-ink-primary">
                                                    {formatDateTimeId(chk.checkedAt)}
                                                </td>
                                                <td className="px-5 py-3">
                                                    <StatusBadge status={chk.status} size="sm" />
                                                </td>
                                                <td className="tabular-nums px-5 py-3 text-xs text-ink-primary">
                                                    {chk.httpCode ?? 'Timeout'}
                                                </td>
                                                <td className="tabular-nums px-5 py-3 text-xs text-ink-primary">
                                                    {formatMs(chk.responseMs)}
                                                </td>
                                                <td className="tabular-nums px-5 py-3 text-xs text-ink-secondary">
                                                    {formatDateTimeId(chk.contentDate)}
                                                </td>
                                                <td className="px-5 py-3 text-xs text-ink-secondary">
                                                    {chk.error ?? 'OK'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between border-t border-line-subtle px-5 py-3 text-xs text-ink-secondary">
                                <span className="tabular-nums">
                                    Menampilkan {checks.from ?? 0}–{checks.to ?? 0} dari {checks.total} pengecekan
                                </span>
                                {checks.last_page > 1 && (
                                    <div className="flex items-center gap-1">
                                        {checks.links.map((link, idx) =>
                                            link.url ? (
                                                <Link
                                                    key={idx}
                                                    href={link.url}
                                                    preserveScroll
                                                    className={`tabular-nums rounded-lg px-2.5 py-1 text-xs font-medium ${
                                                        link.active
                                                            ? 'btn-primary-pill'
                                                            : 'surface-elevated text-ink-secondary hover:text-ink-primary'
                                                    }`}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ) : null,
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>

            <InstansiFormPanel
                open={editOpen}
                editing={instansi}
                onClose={() => setEditOpen(false)}
            />
        </AppShell>
    );
}
