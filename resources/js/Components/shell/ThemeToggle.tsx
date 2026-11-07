import { useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export function useThemeMode(): [ThemeMode, (mode: ThemeMode) => void] {
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        if (typeof window === 'undefined') {
            return 'dark';
        }
        const stored = window.localStorage.getItem('monitoring-theme');
        return stored === 'light' ? 'light' : 'dark';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'light') {
            root.classList.add('light');
        } else {
            root.classList.remove('light');
        }
        window.localStorage.setItem('monitoring-theme', theme);
    }, [theme]);

    return [theme, setThemeState];
}

export function ThemeToggle() {
    const [theme, setTheme] = useThemeMode();

    return (
        <div
            role="group"
            aria-label="Pilih tema tampilan"
            className="surface-elevated inline-flex items-center rounded-full p-0.5 text-xs"
        >
            <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    theme === 'dark' ? 'btn-primary-pill' : 'text-ink-secondary hover:text-ink-primary'
                }`}
            >
                Gelap
            </button>
            <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                    theme === 'light' ? 'btn-primary-pill' : 'text-ink-secondary hover:text-ink-primary'
                }`}
            >
                Terang
            </button>
        </div>
    );
}
