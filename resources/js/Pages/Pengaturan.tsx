import { AppShell } from '@/Components/shell/AppShell';
import { ThemeToggle } from '@/Components/shell/ThemeToggle';
import { SharedProps } from '@/types/monitoring';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface PengaturanProps extends SharedProps {
    settings: {
        freshnessDays: number;
        checkIntervalHours: number;
    };
}

export default function Pengaturan({ settings }: PengaturanProps) {
    const monitorForm = useForm({
        freshness_days: settings.freshnessDays,
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

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
        <AppShell title="Pengaturan">
            <Head title="Pengaturan" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    Pengaturan Sistem &amp; Akun
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Konfigurasi parameter keaktifan konten website dinas, preferensi tampilan, dan
                    keamanan akun Super Admin.
                </p>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Parameter Monitoring */}
                <div className="col-span-6 space-y-6">
                    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">
                            Parameter Monitoring
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Mengubah ambang hari akan langsung menghitung ulang status seluruh
                            instansi berdasarkan data cek terakhir.
                        </p>

                        <form onSubmit={submitMonitor} className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="freshness_days"
                                    className="block text-xs font-medium text-[var(--text-secondary)]"
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
                                        className="w-36 rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]"
                                    />
                                    <span className="text-xs text-[var(--text-muted)]">
                                        hari sejak artikel/berita terakhir dipublikasikan
                                    </span>
                                </div>
                                {monitorForm.errors.freshness_days && (
                                    <p className="mt-1.5 text-xs text-[var(--status-tidak-text)]">
                                        {monitorForm.errors.freshness_days}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                        Interval Jadwal Pengecekan Otomatis (Cron)
                                    </span>
                                    <span className="rounded bg-[var(--bg-card)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--text-primary)]">
                                        Setiap {settings.checkIntervalHours} jam
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                                    Ditampilkan hanya-baca pada fase ini. Pengecekan berjalan pada
                                    pukul 02:00, 08:00, 14:00, dan 20:00 WIB.
                                </p>
                            </div>

                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={monitorForm.processing}
                                    className="rounded-[var(--radius-ctrl)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {monitorForm.processing
                                        ? 'Menyimpan…'
                                        : 'Simpan & Hitung Ulang Status'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                    Preferensi Tema Tampilan
                                </h2>
                                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                                    Pilih mode gelap kaca (default) atau mode terang kontras tinggi.
                                </p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </section>
                </div>

                {/* Ganti Password */}
                <div className="col-span-6">
                    <section className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
                        <h2 className="text-base font-semibold text-[var(--text-primary)]">
                            Ganti Kata Sandi Super Admin
                        </h2>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Perbarui kata sandi akun administrator Diskominfo secara berkala.
                        </p>

                        <form onSubmit={submitPassword} className="mt-5 space-y-4">
                            <div>
                                <label
                                    htmlFor="current_password"
                                    className="block text-xs font-medium text-[var(--text-secondary)]"
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
                                    className="mt-1.5 w-full rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1.5 text-xs text-[var(--status-tidak-text)]">
                                        {passwordForm.errors.current_password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-medium text-[var(--text-secondary)]"
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
                                    className="mt-1.5 w-full rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-1.5 text-xs text-[var(--status-tidak-text)]">
                                        {passwordForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-xs font-medium text-[var(--text-secondary)]"
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
                                    className="mt-1.5 w-full rounded-[var(--radius-ctrl)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
                                />
                                {passwordForm.errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-[var(--status-tidak-text)]">
                                        {passwordForm.errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="rounded-[var(--radius-ctrl)] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--accent-fg)] transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {passwordForm.processing
                                        ? 'Menyimpan…'
                                        : 'Perbarui Kata Sandi'}
                                </button>
                                {passwordForm.recentlySuccessful && (
                                    <span className="text-xs font-medium text-[var(--status-aktif-text)]">
                                        Kata sandi berhasil diperbarui.
                                    </span>
                                )}
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </AppShell>
    );
}
