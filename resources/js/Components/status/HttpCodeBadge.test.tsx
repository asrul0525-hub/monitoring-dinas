import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HttpCodeBadge } from './HttpCodeBadge';

describe('HttpCodeBadge', () => {
    it('renders 200 (Tutup) for Soft-200 closed pages', () => {
        render(<HttpCodeBadge code={200} status="tidak-aktif" error="Situs Ditutup" />);
        expect(screen.getByText('200 (Tutup)')).toBeInTheDocument();
    });

    it('renders 403 (WAF) for WAF-protected 403 responses', () => {
        render(<HttpCodeBadge code={403} status="kurang-aktif" error="WAF" />);
        expect(screen.getByText('403 (WAF)')).toBeInTheDocument();
    });

    it('renders 200 OK when online without errors', () => {
        render(<HttpCodeBadge code={200} status="aktif" error={null} />);
        expect(screen.getByText('200 OK')).toBeInTheDocument();
    });

    it('renders Timeout vs dash cleanly when code is null', () => {
        const { rerender } = render(<HttpCodeBadge code={null} neverChecked={false} />);
        expect(screen.getByText('Timeout')).toBeInTheDocument();

        rerender(<HttpCodeBadge code={null} neverChecked />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
