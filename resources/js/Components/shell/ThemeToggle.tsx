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
    const isLight = theme === 'light';

    const toggle = () => {
        setTheme(isLight ? 'dark' : 'light');
    };

    return (
        <button
            type="button"
            onClick={toggle}
            title={isLight ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
            aria-label={isLight ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
            className="surface-elevated group relative inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-primary hover:border-accent hover:text-accent"
        >
            {/* Sun Icon (visible in Light mode / switches to Dark) */}
            <svg
                className={`h-4 w-4 transition-all duration-300 ${
                    isLight
                        ? 'rotate-0 scale-100 opacity-100 text-status-kurang'
                        : '-rotate-90 scale-0 opacity-0'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
            >
                <circle cx="12" cy="12" r="4" />
                <path
                    strokeLinecap="round"
                    d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
                />
            </svg>

            {/* Moon Icon (visible in Dark mode / switches to Light) */}
            <svg
                className={`absolute h-4 w-4 transition-all duration-300 ${
                    !isLight
                        ? 'rotate-0 scale-100 opacity-100 text-accent'
                        : 'rotate-90 scale-0 opacity-0'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                />
            </svg>
        </button>
    );
}
