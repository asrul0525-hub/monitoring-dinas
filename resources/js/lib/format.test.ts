import { describe, expect, it } from 'vitest';
import { formatMs, formatRelativeId } from './format';

describe('format utilities', () => {
    it('formats relative dates in Bahasa Indonesia', () => {
        expect(formatRelativeId('2026-11-05T10:00:00Z', new Date('2026-11-07T10:00:00Z'))).toBe('2 hari yang lalu');
        expect(formatRelativeId('2026-07-07T10:00:00Z', new Date('2026-11-07T10:00:00Z'))).toBe('4 bulan yang lalu');
    });

    it('formats response time in milliseconds', () => {
        expect(formatMs(null)).toBe('—');
        expect(formatMs(182)).toBe('182 ms');
    });
});
