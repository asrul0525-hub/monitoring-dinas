import { StatusKey } from '@/types/monitoring';

interface HttpCodeBadgeProps {
    code: number | null;
    status?: StatusKey | null;
    error?: string | null;
    neverChecked?: boolean;
}

/**
 * Menampilkan badge kode HTTP secara seragam di seluruh halaman monitoring,
 * termasuk deteksi khusus untuk Soft-200 (situs ditutup) dan 403 (proteksi WAF/CDN).
 */
export function HttpCodeBadge({
    code,
    status = null,
    error = null,
    neverChecked = false,
}: HttpCodeBadgeProps) {
    if (code === null) {
        if (neverChecked) {
            return <span className="tabular-nums text-xs text-ink-secondary">—</span>;
        }
        return (
            <span
                title={error ?? 'Koneksi gagal atau habis waktu (timeout)'}
                className="status-badge--tidak tabular-nums inline-flex rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
            >
                Timeout
            </span>
        );
    }

    const isClosed200 = code === 200 && (status === 'tidak-aktif' || Boolean(error));
    const isWaf403 = code === 403;

    const badgeClass =
        code === 200 && !isClosed200
            ? 'status-badge--aktif'
            : isWaf403
              ? 'status-badge--kurang'
              : 'status-badge--tidak';

    const label = isClosed200
        ? '200 (Tutup)'
        : isWaf403
          ? '403 (WAF)'
          : code === 200
            ? '200 OK'
            : String(code);

    const tooltip = isClosed200
        ? error || 'HTTP 200 OK tetapi halaman ditutup / suspended / maintenance'
        : isWaf403
          ? 'Server aktif, akses konten dibatasi proteksi WAF/CDN'
          : error || undefined;

    return (
        <span
            title={tooltip}
            className={`tabular-nums inline-flex rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${badgeClass}`}
        >
            {label}
        </span>
    );
}
