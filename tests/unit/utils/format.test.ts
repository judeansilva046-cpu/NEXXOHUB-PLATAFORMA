import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

describe('Format Utilities', () => {
  describe('formatDate', () => {
    it('formats date to pt-BR locale', () => {
      const date = new Date('2026-06-21T00:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      expect(formatted).toBe('21/06/2026');
    });

    it('handles string input', () => {
      const formatted = formatDate('2026-06-21');

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time to pt-BR locale', () => {
      const date = new Date('2026-06-21T14:30:00Z');
      const formatted = formatDateTime(date);

      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    });

    it('includes hours and minutes', () => {
      const date = new Date('2026-06-21T14:30:00Z');
      const formatted = formatDateTime(date);

      expect(formatted).toContain(':');
    });
  });

  describe('formatCurrency', () => {
    it('formats number as Brazilian currency', () => {
      const formatted = formatCurrency(1000);

      expect(formatted).toBe('R$ 1.000,00');
    });

    it('handles decimal values', () => {
      const formatted = formatCurrency(99.99);

      expect(formatted).toBe('R$ 99,99');
    });

    it('handles large numbers', () => {
      const formatted = formatCurrency(1000000);

      expect(formatted).toContain('R$');
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
    });

    it('handles zero', () => {
      const formatted = formatCurrency(0);

      expect(formatted).toBe('R$ 0,00');
    });

    it('handles negative values', () => {
      const formatted = formatCurrency(-100);

      expect(formatted).toContain('-');
      expect(formatted).toContain('100');
    });
  });
});
