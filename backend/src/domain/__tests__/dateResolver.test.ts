import { describe, it, expect } from 'vitest';
import { resolveRelativeDates } from '../dateResolver';

describe('Date Resolver Domain Logic', () => {
  // Miércoles 28 de Octubre de 2026 a las 10:00 AM hora Colombia
  const referenceDate = new Date('2026-10-28T10:00:00-05:00');

  it('resolves "mañana" correctly to the next day', () => {
    const res = resolveRelativeDates('necesito una sala para mañana en la mañana', referenceDate);
    expect(res.detectedDate).toBe('2026-10-29'); // Jueves 29
    expect(res.detectedTime).toBe('08:00');
    expect(res.normalizedText).toContain('[FECHA_EXACTA_COLOMBIA: 2026-10-29]');
  });

  it('resolves "el sábado" correctly to upcoming Saturday', () => {
    const res = resolveRelativeDates('necesito una sala para 6 personas el sábado en la mañana con proyector', referenceDate);
    expect(res.detectedDate).toBe('2026-10-31'); // Sábado 31
    expect(res.detectedTime).toBe('08:00');
    expect(res.isSaturday).toBe(true);
  });

  it('resolves "en la tarde" and explicit hours correctly', () => {
    const resAfternoon = resolveRelativeDates('una sala para mañana en la tarde', referenceDate);
    expect(resAfternoon.detectedTime).toBe('14:00');

    const resExplicit = resolveRelativeDates('sala para hoy a las 10:30', referenceDate);
    expect(resExplicit.detectedDate).toBe('2026-10-28');
    expect(resExplicit.detectedTime).toBe('10:30');
  });

  it('resolves "pasado mañana" correctly', () => {
    const res = resolveRelativeDates('para pasado mañana a las 3pm', referenceDate);
    expect(res.detectedDate).toBe('2026-10-30'); // Viernes 30
    expect(res.detectedTime).toBe('15:00');
  });
});

