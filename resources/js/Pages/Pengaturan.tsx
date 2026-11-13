import { AppShell } from '@/Components/shell/AppShell';
import { ThemeToggle } from '@/Components/shell/ThemeToggle';
import { SharedProps } from '@/types/monitoring';
import { useForm } from '@inertiajs/react';
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
        <AppShell
            title="Pengaturan Sistem & Akun"
            subtitle="Konfigurasi parameter keaktifan konten website dinas, preferensi tampilan, dan keamanan akun Super Admin."
        >
            <div className="grid grid-cols-12 gap-6">
                {/* Parameter Monitoring */}
                <div className="col-span-6 space-y-6">
                    <section className="surface-card p-6">
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

                            <div className="surface-elevated rounded-xl p-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-ink-secondary">
                                        Interval Jadwal Pengecekan Otomatis (Cron)
                                    </span>
                                    <span className="surface-card rounded px-2 py-0.5 font-mono text-xs font-semibold text-ink-primary">
                                        Setiap {settings.checkIntervalHours} jam
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-ink-secondary">
                                    Ditampilkan hanya-baca pada fase ini. Pengecekan berjalan pada
                                    pukul 02:00, 08:00, 14:00, dan 20:00 WITA.
                                </p>
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

                    <section className="surface-card p-6">
                        <div className="flex items-center justify-between">
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

                {/* Ganti Password */}
                <div className="col-span-6">
                    <section className="surface-card p-6">
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
                </div>
            </div>
        </AppShell>
    );
}
