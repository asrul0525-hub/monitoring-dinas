import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                canvas: {
                    start: 'var(--bg-canvas-start)',
                    end: 'var(--bg-canvas-end)',
                },
                surface: {
                    card: 'var(--bg-card)',
                    table: 'var(--bg-table)',
                    elevated: 'var(--bg-elevated)',
                },
                ink: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    fg: 'var(--accent-fg)',
                    soft: 'var(--accent-soft)',
                },
                status: {
                    aktif: 'var(--status-aktif)',
                    kurang: 'var(--status-kurang)',
                    tidak: 'var(--status-tidak)',
                    menunggu: 'var(--status-menunggu)',
                },
                line: {
                    subtle: 'var(--border-subtle)',
                    strong: 'var(--border-strong)',
                },
            },
        },
    },

    plugins: [forms],
};
