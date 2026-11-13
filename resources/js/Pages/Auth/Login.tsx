import { ThemeToggle } from '@/Components/shell/ThemeToggle';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

const CAPABILITIES = [
    {
        label: 'Uptime 24/7',
        dotClass: 'status-dot--aktif',
    },
    {
        label: 'Deteksi Konten Otomatis',
        dotClass: 'bg-accent',
    },
    {
        label: 'Laporan Eksekutif',
        dotClass: 'status-dot--kurang',
    },
];

export default function Login({ status }: { status?: string }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="radar-grid-backdrop relative flex min-h-screen flex-col justify-between overflow-hidden px-10 py-8">
            <Head title="Masuk Super Admin" />

            {/* Top Utility Bar: Dual Co-Branding Header (Kiri) + Status & Theme Toggle (Kanan) */}
            <header className="animate-page-enter relative z-10 mx-auto flex w-full max-w-[1320px] items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="logo-emblem-tile flex h-14 w-14 items-center justify-center rounded-2xl p-1.5">
                            <img
                                src="/images/logo-hsu.png"
                                alt="Logo Kabupaten Hulu Sungai Utara"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div className="h-9 w-px bg-line-subtle" aria-hidden="true" />
                        <div className="logo-emblem-tile flex h-14 w-14 items-center justify-center rounded-2xl p-2">
                            <img
                                src="/images/logo-diskominfo.png"
                                alt="Logo Diskominfo"
                                className="h-full w-full object-contain"
                            />
                        </div>
                    </div>

                    <p className="pl-1 text-base font-extrabold tracking-wide text-ink-primary sm:text-lg">
                        DISKOMINFOSANDI HSU
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="surface-elevated hidden items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-ink-secondary sm:flex">
                        <span className="status-dot--aktif inline-block h-2 w-2 rounded-full" />
                        <span>Sistem Radar Aktif · WITA</span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Split-Screen Command Center */}
            <main className="relative z-10 mx-auto my-auto grid w-full max-w-[1320px] grid-cols-12 items-center gap-12 py-8">
                {/* Sisi Kiri: Visual Radar & Identitas RADAR HSU */}
                <section className="animate-page-enter col-span-7 flex flex-col items-start pr-4">
                    {/* Radar Sweep Visual */}
                    <div className="relative mb-8 flex items-center gap-8">
                        <div
                            aria-hidden="true"
                            className="surface-card relative flex h-56 w-56 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-2xl"
                        >
                            {/* Lingkaran Radar Konsentris */}
                            <div className="absolute h-44 w-44 rounded-full border border-line-subtle" />
                            <div className="absolute h-28 w-28 rounded-full border border-line-subtle" />
                            <div className="absolute h-14 w-14 rounded-full border border-line-subtle" />

                            {/* Garis Sumbu Silang */}
                            <div className="absolute h-full w-px bg-line-subtle" />
                            <div className="absolute h-px w-full bg-line-subtle" />

                            {/* Sapuan Radar Berputar */}
                            <div className="radar-sweep-cone absolute inset-0 rounded-full opacity-75" />

                            {/* Titik Radar (Node Website Instansi) */}
                            <span
                                className="status-dot--aktif absolute left-14 top-12 h-2.5 w-2.5 rounded-full shadow-sm"
                                title="Node Aktif"
                            />
                            <span
                                className="status-dot--aktif absolute bottom-14 right-12 h-2 w-2 rounded-full opacity-80"
                                title="Node Aktif"
                            />
                            <span
                                className="status-dot--kurang absolute right-14 top-16 h-2.5 w-2.5 rounded-full"
                                title="Node Kurang Aktif"
                            />
                            <span
                                className="status-dot--tidak absolute bottom-12 left-16 h-2 w-2 rounded-full"
                                title="Node Gangguan"
                            />

                            {/* Pusat Radar Berdenyut */}
                            <span className="radar-ping-ring bg-accent-soft absolute h-7 w-7 rounded-full" />
                            <span className="bg-accent relative h-3.5 w-3.5 rounded-full ring-4 ring-surface-card" />
                        </div>

                        <div className="space-y-2.5">
                            <div className="surface-elevated inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider text-accent uppercase">
                                <span>Pusat Pengawasan Portal Daerah</span>
                            </div>
                            <h1 className="text-5xl font-bold tracking-tight text-ink-primary">
                                RADAR <span className="text-accent">HSU</span>
                            </h1>
                            <p className="max-w-md text-sm leading-relaxed text-ink-secondary">
                                Platform pemantauan ketersediaan server, latensi respons, dan keaktifan pembaruan konten seluruh website resmi instansi di lingkungan Pemerintah Kabupaten Hulu Sungai Utara.
                            </p>
                        </div>
                    </div>

                    {/* 3 Kapabilitas Utama */}
                    <div className="flex flex-wrap items-center gap-3">
                        {CAPABILITIES.map((cap) => (
                            <div
                                key={cap.label}
                                className="surface-card flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-medium text-ink-primary"
                            >
                                <span className={`${cap.dotClass} inline-block h-2 w-2 rounded-full`} />
                                <span>{cap.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Sisi Kanan: Kartu Form Login */}
                <section className="animate-modal-pop col-span-5 flex justify-end">
                    <div className="glass-shell w-full max-w-md rounded-[24px] p-8">
                        <div className="mb-6 flex items-center gap-3.5 border-b border-line-subtle pb-5">
                            <div className="surface-elevated flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-accent">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.9"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0"
                                    />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12l4.5 -4.5" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-ink-primary">
                                    Masuk ke RADAR HSU
                                </h2>
                                <p className="text-xs text-ink-secondary">
                                    Portal Observasi Super Admin Diskominfosandi HSU
                                </p>
                            </div>
                        </div>

                        {status && (
                            <div className="status-badge--aktif mb-4 rounded-xl px-3.5 py-2.5 text-xs font-medium">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium text-ink-secondary">
                                    Email Super Admin
                                </label>
                                <div className="relative mt-1.5">
                                    <svg
                                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        aria-hidden="true"
                                    >
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
                                    </svg>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        placeholder="admin@hsu.go.id"
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="input-control block h-11 w-full pl-10 pr-3.5 text-sm"
                                    />
                                </div>
                                {errors.email && (
                                    <p role="alert" className="mt-1.5 text-xs font-medium text-status-tidak">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-medium text-ink-secondary">
                                    Password
                                </label>
                                <div className="relative mt-1.5">
                                    <svg
                                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        aria-hidden="true"
                                    >
                                        <rect x="5" y="11" width="14" height="10" rx="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
                                    </svg>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        placeholder="Masukkan password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="input-control block h-11 w-full pl-10 pr-11 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                        title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                                        className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-elevated hover:text-ink-primary"
                                    >
                                        {showPassword ? (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.828M9.363 5.365A9.466 9.466 0 0112 5c4 0 7.333 2.333 10 7a13.16 13.16 0 01-1.67 2.416m-2.802 2.138A9.622 9.622 0 0112 19c-4 0-7.333-2.333-10-7 1.369-2.395 3.133-4.273 5.292-5.635"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="h-4 w-4"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M2 12c2.667-4.667 6-7 10-7s7.333 2.333 10 7c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7z"
                                                />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p role="alert" className="mt-1.5 text-xs font-medium text-status-tidak">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-secondary">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-line-strong bg-surface-elevated text-accent focus:ring-accent"
                                    />
                                    <span>Ingat sesi di perangkat ini</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="btn-primary-pill mt-2 inline-flex h-11 w-full items-center justify-center gap-2 text-sm"
                            >
                                {processing ? 'Memverifikasi…' : 'Masuk ke Dashboard'}
                            </button>
                        </form>

                        <p className="mt-5 border-t border-line-subtle pt-4 text-center text-[11px] text-ink-secondary">
                            Akses terbatas untuk Administrator resmi Diskominfosandi HSU
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer Resmi */}
            <footer className="relative z-10 mx-auto flex w-full max-w-[1320px] items-center justify-between border-t border-line-subtle pt-4 text-xs text-ink-secondary">
                <span>© 2026 Diskominfosandi Kab. Hulu Sungai Utara</span>
                <span>Pusat Monitoring Website Pemerintah Daerah · Amuntai</span>
            </footer>
        </div>
    );
}
