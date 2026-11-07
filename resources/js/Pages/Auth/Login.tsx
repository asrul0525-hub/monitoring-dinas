import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({ status }: { status?: string }) {
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
        <div className="flex min-h-screen items-center justify-center px-6">
            <Head title="Masuk Super Admin" />

            <div className="glass-shell w-full max-w-md rounded-[20px] p-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="surface-elevated flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-accent">
                        SM
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-ink-primary">Monitoring Website Dinas</h1>
                        <p className="text-xs text-ink-secondary">Portal Observasi Super Admin Diskominfo</p>
                    </div>
                </div>

                {status && (
                    <div className="status-badge--aktif mb-4 rounded-xl px-3.5 py-2 text-xs font-medium">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-medium text-ink-secondary">
                            Email Super Admin
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            placeholder="admin@diskominfo.test"
                            onChange={(e) => setData('email', e.target.value)}
                            className="input-control mt-1.5 block h-10 w-full px-3.5 text-sm"
                        />
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
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            autoComplete="current-password"
                            placeholder="Masukkan password"
                            onChange={(e) => setData('password', e.target.value)}
                            className="input-control mt-1.5 block h-10 w-full px-3.5 text-sm"
                        />
                        {errors.password && (
                            <p role="alert" className="mt-1.5 text-xs font-medium text-status-tidak">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-ink-secondary">
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
                        className="btn-primary-pill mt-2 h-10 w-full text-sm"
                    >
                        {processing ? 'Memverifikasi…' : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
}
