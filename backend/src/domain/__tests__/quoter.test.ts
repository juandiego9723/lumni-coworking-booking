import { describe, it, expect } from 'vitest';
import { calculatePricing, validateSchedule } from '../quoter';
import { RoomSize } from '@prisma/client';

describe('Quoter Domain Logic', () => {
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

  it('validates schedule rules correctly', () => {
    const valid = validateSchedule('2026-10-24', '08:00', 2);
    expect(valid.isValid).toBe(true);

    const invalidTime = validateSchedule('2026-10-23', '20:00', 3);
    expect(invalidTime.isValid).toBe(false);
  });
});
