import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FreshnessText } from './FreshnessText';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge & FreshnessText', () => {
    it('renders Menunggu cek pertama when status is null', () => {
        render(<StatusBadge status={null} />);
        expect(screen.getByText('Menunggu cek pertama')).toBeInTheDocument();
    });

    it('renders explicit Indonesian status labels', () => {
        render(<StatusBadge status="kurang-aktif" />);
        expect(screen.getByText('Kurang Aktif')).toBeInTheDocument();
    });

    it('renders FreshnessText for active, down, and missing content date', () => {
        const now = new Date('2026-11-07T10:00:00Z');

        const { rerender } = render(
            <FreshnessText
                now={now}
                row={{
                    id: 1,
                    nama: 'Dinas Contoh 01',
                    url: 'https://dinas-contoh-01.go.id',
                    feedUrl: null,
                    status: 'aktif',
                    lastContentAt: '2026-11-05T10:00:00Z',
                    lastCheckedAt: '2026-11-07T09:00:00Z',
                    lastResponseMs: 200,
                    lastHttpCode: 200,
                    contentSource: 'sitemap',
                    downSince: null,
                }}
            />,
        );
        expect(screen.getByText('Terakhir update: 2 hari yang lalu')).toBeInTheDocument();

        rerender(
            <FreshnessText
                now={now}
                row={{
                    id: 2,
                    nama: 'Dinas Contoh 02',
                    url: 'https://dinas-contoh-02.go.id',
                    feedUrl: null,
                    status: 'tidak-aktif',
                    lastContentAt: '2026-11-01T10:00:00Z',
                    lastCheckedAt: '2026-11-07T09:00:00Z',
                    lastResponseMs: null,
                    lastHttpCode: 502,
                    contentSource: null,
                    downSince: '2026-11-07T04:00:00Z',
                }}
            />,
        );
        expect(screen.getByText('Down sejak 6 jam yang lalu')).toBeInTheDocument();

        rerender(
            <FreshnessText
                now={now}
                row={{
                    id: 3,
                    nama: 'Dinas Contoh 03',
                    url: 'https://dinas-contoh-03.go.id',
                    feedUrl: null,
                    status: 'kurang-aktif',
                    lastContentAt: null,
                    lastCheckedAt: '2026-11-07T09:00:00Z',
                    lastResponseMs: 250,
                    lastHttpCode: 200,
                    contentSource: null,
                    downSince: null,
                }}
            />,
        );
        expect(screen.getByText('Tanggal konten tidak ditemukan')).toBeInTheDocument();
    });
});
