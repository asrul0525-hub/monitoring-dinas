import { AppShell } from '@/Components/shell/AppShell';
import { ThemeToggle } from '@/Components/shell/ThemeToggle';
import { formatDateTimeId, formatRelativeId } from '@/lib/format';
import { SharedProps } from '@/types/monitoring';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface PengaturanProps extends SharedProps {
    settings: {
        freshnessDays: number;
        checkIntervalHours: number;
        schedulerActive?: boolean;
        lastHeartbeatAt?: string | null;
    };
}

const INTERVAL_OPTIONS = [
    {
        value: 1,
        label: 'Setiap 1 jam (Pemantauan Ketat)',
        hint: 'Berjalan tiap jam pada menit :00 WITA (24 kali sehari).',
    },
    {
        value: 3,
        label: 'Setiap 3 jam (Pemantauan Responsif)',
        hint: 'Berjalan pada pukul 02:00, 05:00, 08:00, 11:00, 14:00, 17:00, 20:00, dan 23:00 WITA.',
    },
    {
        value: 6,
        label: 'Setiap 6 jam (Direkomendasikan)',
        hint: 'Berjalan pada pukul 02:00, 08:00, 14:00, dan 20:00 WITA.',
    },
    {
        value: 12,
        label: 'Setiap 12 jam (Hemat Beban Server)',
        hint: 'Berjalan pada pukul 08:00 dan 20:00 WITA.',
    },
];

export default function Pengaturan({ settings }: PengaturanProps) {
    const { auth } = usePage<SharedProps>().props;
    const [checkingAll, setCheckingAll] = useState(false);

    const monitorForm = useForm({
        freshness_days: settings.freshnessDays,
        check_interval_hours: settings.checkIntervalHours,
    });

    const selectedIntervalMeta =
        INTERVAL_OPTIONS.find((opt) => opt.value === monitorForm.data.check_interval_hours) ??
        INTERVAL_OPTIONS[2];

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleCheckAll = () => {
        if (checkingAll) return;
        router.post(
            '/cek-semua',
            {},
            {
                preserveScroll: true,
                onStart: () => setCheckingAll(true),
                onFinish: () => setCheckingAll(false),
            },
        );
    };

    const submitMonitor: FormEventHandler = (e) => {
        e.preventDefault();
        monitorForm.put('/pengaturan/monitor', {
            preserveScroll: true,
        });
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.put('/password', {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppShell
            title="Pengaturan Sistem & Akun"
            subtitle="Konfigurasi parameter keaktifan konten website dinas, preferensi tampilan, dan keamanan akun Super Admin."
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Parameter Monitoring */}
                <div className="space-y-6 lg:col-span-6">
                    <section
                        style={{ animationDelay: '0ms' }}
                        className="surface-card motion-stagger motion-card-hover p-6"
                    >
                        <h2 className="text-base font-semibold text-ink-primary">
                            Parameter Monitoring
                        </h2>
                        <p className="mt-1 text-xs text-ink-secondary">
                            Mengubah ambang hari akan langsung menghitung ulang status seluruh
                            instansi berdasarkan data cek terakhir.
                        </p>

                        <form onSubmit={submitMonitor} className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="freshness_days"
                                    className="block text-xs font-medium text-ink-secondary"
                                >
                                    Ambang Hari Keaktifan Konten (1–365 hari)
                                </label>
                                <div className="mt-1.5 flex items-center gap-3">
                                    <input
                                        id="freshness_days"
                                        type="number"
                                        min={1}
                                        max={365}
                                        value={monitorForm.data.freshness_days}
                                        onChange={(e) =>
                                            monitorForm.setData(
                                                'freshness_days',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="input-control h-10 w-36 px-3 font-mono text-sm"
                                    />
                                    <span className="text-xs text-ink-secondary">
                                        hari sejak artikel/berita terakhir dipublikasikan
                                    </span>
                                </div>
                                {monitorForm.errors.freshness_days && (
                                    <p className="mt-1.5 text-xs text-status-tidak">
                                        {monitorForm.errors.freshness_days}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="check_interval_hours"
                                    className="block text-xs font-medium text-ink-secondary"
                                >
                                    Interval Jadwal Pengecekan Otomatis (Cron WITA)
                                </label>
                                <select
                                    id="check_interval_hours"
                                    value={monitorForm.data.check_interval_hours}
                                    onChange={(e) =>
                                        monitorForm.setData(
                                            'check_interval_hours',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="input-control mt-1.5 block h-10 w-full px-3 text-xs"
                                >
                                    {INTERVAL_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1.5 text-[11px] text-ink-secondary">
                                    {selectedIntervalMeta.hint}
                                </p>
                                {monitorForm.errors.check_interval_hours && (
                                    <p className="mt-1.5 text-xs text-status-tidak">
                                        {monitorForm.errors.check_interval_hours}
                                    </p>
                                )}
                            </div>

                            <div className="surface-elevated rounded-xl p-3.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-medium text-ink-secondary">
                                        Status Mesin Scheduler Otomatis
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                            settings.schedulerActive
                                                ? 'status-badge--aktif'
                                                : 'status-badge--kurang'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                                                settings.schedulerActive
                                                    ? 'status-dot--aktif'
                                                    : 'status-dot--kurang'
                                            }`}
                                        />
                                        {settings.schedulerActive ? 'Aktif Otomatis' : 'Belum Terdeteksi'}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-[11px] text-ink-secondary">
                                        {settings.lastHeartbeatAt
                                            ? `Detak terakhir scheduler: ${formatDateTimeId(settings.lastHeartbeatAt)} (${formatRelativeId(settings.lastHeartbeatAt)}).`
                                            : 'Belum ada detak dari scheduler latar belakang. Pastikan Windows Task Scheduler atau cron server aktif memicu schedule:run.'}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleCheckAll}
                                        disabled={checkingAll}
                                        className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                                    >
                                        {checkingAll ? 'Mengecek semua…' : 'Cek Semua Sekarang'}
                                    </button>
                                </div>
                            </div>

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={monitorForm.processing}
                                    className="btn-primary-pill h-10 px-5 text-xs"
                                >
                                    {monitorForm.processing
                                        ? 'Menyimpan…'
                                        : 'Simpan & Hitung Ulang Status'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section
                        style={{ animationDelay: '60ms' }}
                        className="surface-card motion-stagger motion-card-hover p-6"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-base font-semibold text-ink-primary">
                                    Preferensi Tema Tampilan
                                </h2>
                                <p className="mt-1 text-xs text-ink-secondary">
                                    Pilih mode gelap kaca (default) atau mode terang kontras tinggi.
                                </p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </section>
                </div>

                {/* Ganti Password & Sesi Akun */}
                <div className="space-y-6 lg:col-span-6">
                    <section
                        style={{ animationDelay: '120ms' }}
                        className="surface-card motion-stagger motion-card-hover p-6"
                    >
                        <h2 className="text-base font-semibold text-ink-primary">
                            Ganti Kata Sandi Super Admin
                        </h2>
                        <p className="mt-1 text-xs text-ink-secondary">
                            Perbarui kata sandi akun administrator Diskominfosandi HSU secara berkala.
                        </p>

                        <form onSubmit={submitPassword} className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="current_password"
                                    className="block text-xs font-medium text-ink-secondary"
                                >
                                    Kata Sandi Saat Ini
                                </label>
                                <input
                                    id="current_password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) =>
                                        passwordForm.setData('current_password', e.target.value)
                                    }
                                    className="input-control mt-1.5 h-10 w-full px-3 text-sm"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1.5 text-xs text-status-tidak">
                                        {passwordForm.errors.current_password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-medium text-ink-secondary"
                                >
                                    Kata Sandi Baru
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password}
                                    onChange={(e) =>
                                        passwordForm.setData('password', e.target.value)
                                    }
                                    className="input-control mt-1.5 h-10 w-full px-3 text-sm"
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-1.5 text-xs text-status-tidak">
                                        {passwordForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-xs font-medium text-ink-secondary"
                                >
                                    Konfirmasi Kata Sandi Baru
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    className="input-control mt-1.5 h-10 w-full px-3 text-sm"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-status-tidak">
                                        {passwordForm.errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="btn-primary-pill h-10 px-5 text-xs"
                                >
                                    {passwordForm.processing
                                        ? 'Menyimpan…'
                                        : 'Perbarui Kata Sandi'}
                                </button>
                                {passwordForm.recentlySuccessful && (
                                    <span className="text-xs font-medium text-status-aktif">
                                        Kata sandi berhasil diperbarui.
                                    </span>
                                )}
                            </div>
                        </form>
                    </section>

                    <section
                        style={{ animationDelay: '180ms' }}
                        className="surface-card motion-stagger motion-card-hover p-6"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold text-ink-primary">
                                    Sesi &amp; Akun Administrator
                                </h2>
                                <p className="mt-1 truncate text-xs text-ink-secondary">
                                    Masuk sebagai{' '}
                                    <strong className="text-ink-primary">
                                        {auth.user?.name ?? 'Admin'}
                                    </strong>{' '}
                                    ({auth.user?.email ?? '—'})
                                </p>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="btn-action-delete inline-flex h-10 shrink-0 items-center justify-center gap-2 px-4 text-xs font-semibold"
                            >
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                                    />
                                </svg>
                                <span>Keluar (Logout)</span>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
