import { describe, it, expect } from 'vitest';
import {
  getNowBogota,
  formatDateISO,
  createBogotaDateTime,
  calculateEndDateTime,
  timeToMinutes,
  minutesToTime,
  normalizeSpanishText,
} from '../dateUtils';

describe('Time and Date Utilities (DRY & Pure)', () => {
  it('formats Date to ISO string YYYY-MM-DD correctly', () => {
    const d = new Date(2026, 9, 28); // 28 de Octubre (mes 9 es Octubre)
    expect(formatDateISO(d)).toBe('2026-10-28');
  });

  it('converts time strings to total minutes and back', () => {
    expect(timeToMinutes('07:00')).toBe(420);
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('21:00')).toBe(1260);

    expect(minutesToTime(420)).toBe('07:00');
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(1260)).toBe('21:00');
  });

  it('creates Bogota datetime with proper -05:00 offset', () => {
    const bogotaDate = createBogotaDateTime('2026-10-31', '14:30');
    expect(bogotaDate.toISOString()).toContain('2026-10-31T19:30:00.000Z'); // 14:30 -05:00 = 19:30 UTC
  });

  it('calculates end datetime accurately given duration in hours', () => {
    const start = createBogotaDateTime('2026-10-31', '08:00');
    const end = calculateEndDateTime(start, 2.5);
    expect(end.getTime() - start.getTime()).toBe(2.5 * 3600 * 1000);
  });

  it('normalizes spanish text removing accents', () => {
    expect(normalizeSpanishText('Miércoles en la mañana')).toBe('miercoles en la manana');
    expect(normalizeSpanishText('SÁBADO')).toBe('sabado');
  });
});

