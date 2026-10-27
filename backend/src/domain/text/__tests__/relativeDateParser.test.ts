import { describe, it, expect } from 'vitest';
import {
  extractColloquialTime,
  extractExplicitTime,
  extractRelativeDay,
  extractWeekdayDate,
  buildEnrichedText,
  isDateSaturday,
} from '../relativeDateParser';

describe('Relative Date Parser Sub-module (SRP)', () => {
  const baseDate = new Date('2026-10-28T10:00:00-05:00'); // Miércoles 28 Oct

  it('extracts colloquial times', () => {
    expect(extractColloquialTime('quiero ir en la manana')).toBe('08:00');
    expect(extractColloquialTime('al mediodia')).toBe('12:00');
    expect(extractColloquialTime('en la tarde')).toBe('14:00');
    expect(extractColloquialTime('cualquier hora')).toBeUndefined();
  });

  it('extracts explicit times with am/pm or 24h formats', () => {
    expect(extractExplicitTime('a las 10:30')).toBe('10:30');
    expect(extractExplicitTime('a las 3pm')).toBe('15:00');
    expect(extractExplicitTime('a las 8 am')).toBe('08:00');
    expect(extractExplicitTime('a las 12pm')).toBe('12:00');
    expect(extractExplicitTime('a las 12am')).toBe('00:00');
  });

  it('extracts relative days (hoy, mañana, pasado mañana)', () => {
    expect(extractRelativeDay('reunion hoy', baseDate)).toBe('2026-10-28');
    expect(extractRelativeDay('reunion manana', baseDate)).toBe('2026-10-29');
    expect(extractRelativeDay('reunion pasado manana', baseDate)).toBe('2026-10-30');
  });

  it('extracts named weekday dates', () => {
    const sat = extractWeekdayDate('el sabado', baseDate);
    expect(sat.detectedDate).toBe('2026-10-31');
    expect(sat.dayOfWeekName).toBe('sabado');
  });

  it('verifies if date is Saturday', () => {
    expect(isDateSaturday('2026-10-31')).toBe(true);
    expect(isDateSaturday('2026-10-30')).toBe(false);
    expect(isDateSaturday(undefined)).toBe(false);
  });

  it('builds enriched text with LLM metadata tags', () => {
    const enriched = buildEnrichedText('sala para mañana', '2026-10-29', '08:00');
    expect(enriched).toBe('sala para mañana [FECHA_EXACTA_COLOMBIA: 2026-10-29] [HORA_SUGERIDA: 08:00]');
  });
});

