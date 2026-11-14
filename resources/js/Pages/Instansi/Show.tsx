import type { ResponseSeriesPoint } from '@/Components/charts/ResponseTimeLine';
import { InstansiFormModal } from '@/Components/instansi/InstansiFormModal';
import { AppShell } from '@/Components/shell/AppShell';
import { FreshnessText } from '@/Components/status/FreshnessText';
import { HttpCodeBadge } from '@/Components/status/HttpCodeBadge';
import { StatusBadge } from '@/Components/status/StatusBadge';
import { Skeleton } from '@/Components/ui/Skeleton';
import { formatDateTimeId, formatMs } from '@/lib/format';
import { InstansiRow, KATEGORI_INSTANSI_LABELS, Paginated, SharedProps, StatusKey } from '@/types/monitoring';
import { Link, router } from '@inertiajs/react';
import { lazy, Suspense, useState } from 'react';

const ResponseTimeLine = lazy(() =>
    import('@/Components/charts/ResponseTimeLine').then((m) => ({
        default: m.ResponseTimeLine,
    })),
);

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
    latestCheckError?: string | null;
    uptime: {
        d7: number | null;
        d30: number | null;
    };
    series: ResponseSeriesPoint[];
    checks: Paginated<CheckHistoryItem>;
};

export default function InstansiShow({
    instansi,
    latestCheckError = null,
    uptime,
    series,
    checks,
}: ShowProps) {
    const [checking, setChecking] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const isWaf403 = instansi.lastHttpCode === 403;
    const isClosed200 = instansi.lastHttpCode === 200 && instansi.status === 'tidak-aktif';
    const showDiagnosisBanner =
        instansi.status === 'tidak-aktif' || isWaf403 || Boolean(latestCheckError);

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
                        prefetch
                        cacheFor="10s"
                        className="btn-secondary inline-flex h-9 items-center px-3.5 text-xs"
                    >
                        Lihat di laporan
                    </Link>
                    <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="btn-action-edit inline-flex h-9 items-center gap-1.5 px-3.5 text-xs"
                    >
                        <span>Ubah</span>
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
            <div className="mb-4 flex items-center justify-between">
                <Link
                    href="/instansi"
                    prefetch
                    cacheFor="10s"
                    className="btn-secondary inline-flex h-8 items-center gap-1.5 px-3 text-xs"
                >
                    <span aria-hidden="true">←</span>
                    <span>Kembali ke Daftar Instansi</span>
                </Link>
            </div>

            <div className="grid grid-cols-12 gap-5">
                {showDiagnosisBanner && (
                    <div
                        role="status"
                        style={{ animationDelay: '0ms' }}
                        className={`surface-card motion-stagger col-span-12 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                            instansi.status === 'tidak-aktif'
                                ? 'border-status-tidak-border'
                                : 'border-status-kurang-border'
                        }`}
                    >
                        <div className="space-y-1 text-xs">
                            <div className="font-semibold text-ink-primary">
                                {isClosed200
                                    ? 'Deteksi Soft-200: Halaman Situs Ditutup / Dalam Perbaikan'
                                    : isWaf403
                                      ? 'Proteksi Keamanan WAF / CDN Terdeteksi (HTTP 403)'
                                      : 'Gangguan Akses Website Terdeteksi'}
                            </div>
                            <p className="text-ink-secondary">
                                {latestCheckError
                                    ? latestCheckError
                                    : isWaf403
                                      ? 'Server merespons aktif namun membatasi akses bot/scraper untuk pengambilan tanggal konten.'
                                      : 'Pengecekan terakhir gagal menjangkau server website instansi.'}
                            </p>
                        </div>
                        <div className="shrink-0">
                            <HttpCodeBadge
                                code={instansi.lastHttpCode}
                                status={instansi.status}
                                error={latestCheckError}
                                neverChecked={!instansi.lastCheckedAt}
                            />
                        </div>
                    </div>
                )}

                {/* Summary strip */}
                <div
                    style={{ animationDelay: '55ms' }}
                    className="surface-card motion-stagger motion-card-hover col-span-12 grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line-subtle"
                >
                    <div className="px-4 first:pl-0">
                        <span className="text-xs font-medium text-ink-secondary">Status & Freshness</span>
                        <p className="mt-1 text-sm font-semibold text-ink-primary">
                            <FreshnessText row={instansi} />
                        </p>
                        <p className="mt-0.5 text-xs text-ink-secondary">
                            Kategori: {KATEGORI_INSTANSI_LABELS[instansi.kategori] ?? instansi.kategori}
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
                <section
                    style={{ animationDelay: '110ms' }}
                    className="surface-card motion-stagger motion-card-hover col-span-12 p-6"
                >
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
                    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
                        <ResponseTimeLine series={series} />
                    </Suspense>
                </section>

                {/* Checks history table */}
                <section
                    style={{ animationDelay: '165ms' }}
                    className="surface-table motion-stagger col-span-12 overflow-hidden"
                >
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
                                                <td className="px-5 py-3">
                                                    <HttpCodeBadge
                                                        code={chk.httpCode}
                                                        status={chk.status}
                                                        error={chk.error}
                                                    />
                                                </td>
                                                <td className="tabular-nums px-5 py-3 text-xs text-ink-primary">
                                                    {formatMs(chk.responseMs)}
                                                </td>
                                                <td className="tabular-nums px-5 py-3 text-xs text-ink-secondary">
                                                    {formatDateTimeId(chk.contentDate)}
                                                </td>
                                                <td className="max-w-md whitespace-normal px-5 py-3 text-xs text-ink-secondary">
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

            <InstansiFormModal
                open={editOpen}
                editing={instansi}
                onClose={() => setEditOpen(false)}
            />
        </AppShell>
    );
}
