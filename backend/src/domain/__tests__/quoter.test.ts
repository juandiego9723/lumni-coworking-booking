import { describe, it, expect } from 'vitest';
import { calculatePricing, validateSchedule, RoomSize } from '../quoter';

describe('Quoter Domain Logic', () => {
  const refDate = new Date('2026-10-20T00:00:00-05:00');

  it('calculates correct pricing for small room without discount on weekday', () => {
    const pricing = calculatePricing(RoomSize.SMALL, 2, false);
    expect(pricing.baseAmount).toBe(80000);
    expect(pricing.discountAmount).toBe(0);
    expect(pricing.surchargeAmount).toBe(0);
    expect(pricing.totalAmount).toBe(80000);
  });

  it('applies 10% discount for 4 hours or more', () => {
    const pricing = calculatePricing(RoomSize.MEDIUM, 4, false);
    expect(pricing.baseAmount).toBe(280000);
    expect(pricing.discountAmount).toBe(28000);
    expect(pricing.totalAmount).toBe(252000);
  });

  it('applies 20% discount for 8 hours or more', () => {
    const pricing = calculatePricing(RoomSize.LARGE, 8, false);
    expect(pricing.baseAmount).toBe(960000);
    expect(pricing.discountAmount).toBe(192000);
    expect(pricing.totalAmount).toBe(768000);
  });

  it('applies 25% saturday surcharge over discounted amount', () => {
    const pricing = calculatePricing(RoomSize.SMALL, 4, true);
    expect(pricing.baseAmount).toBe(160000);
    expect(pricing.discountAmount).toBe(16000);
    expect(pricing.surchargeAmount).toBe(36000);
    expect(pricing.totalAmount).toBe(180000);
  });

  it('validates schedule rules correctly according to specification', () => {
    const valid = validateSchedule('2026-10-24', '08:00', 2, refDate);
    expect(valid.isValid).toBe(true);

    // 20:00 + 3h = 23:00 (supera las 21:00)
    const invalidTime = validateSchedule('2026-10-23', '20:00', 3, refDate);
    expect(invalidTime.isValid).toBe(false);
    expect(invalidTime.reason).toBe('El horario de atención es de lunes a sábado de 07:00 a 21:00.');

    // Domingo cerrado
    const sunday = validateSchedule('2026-10-25', '10:00', 2, refDate);
    expect(sunday.isValid).toBe(false);
    expect(sunday.reason).toBe('El coworking está cerrado los domingos.');
  });

  it('rejects bookings in the past (e.g. today at 9am when it is 6pm)', () => {
    const sixPm = new Date('2026-10-27T18:00:00-05:00');
    const pastNineAm = validateSchedule('2026-10-27', '09:00', 2, sixPm);
    expect(pastNineAm.isValid).toBe(false);
    expect(pastNineAm.reason).toBe('No es posible reservar en una fecha u hora que ya ha transcurrido.');
  });
});
