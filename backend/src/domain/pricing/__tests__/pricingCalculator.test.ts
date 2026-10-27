import { describe, it, expect } from 'vitest';
import {
  calculateDiscountRate,
  calculateRoomPricing,
  calculateServicesAmount,
} from '../pricingCalculator';

describe('Pricing Calculator Sub-module (DRY & SRP)', () => {
  it('calculates correct discount rates according to duration tiers', () => {
    expect(calculateDiscountRate(1)).toBe(0);
    expect(calculateDiscountRate(3.5)).toBe(0);
    expect(calculateDiscountRate(4)).toBe(0.10);
    expect(calculateDiscountRate(6)).toBe(0.10);
    expect(calculateDiscountRate(8)).toBe(0.20);
    expect(calculateDiscountRate(10)).toBe(0.20);
  });

  it('calculates room pricing correctly with saturday surcharge', () => {
    const pricing = calculateRoomPricing('SMALL', 4, true);
    expect(pricing.baseAmount).toBe(160000);
    expect(pricing.discountAmount).toBe(16000);
    expect(pricing.surchargeAmount).toBe(36000);
    expect(pricing.totalAmount).toBe(180000);
  });

  it('calculates add-on service amounts', () => {
    expect(calculateServicesAmount(false, false)).toBe(0);
    expect(calculateServicesAmount(true, false)).toBe(20000); // projector
    expect(calculateServicesAmount(false, true)).toBe(10000); // coffee
    expect(calculateServicesAmount(true, true)).toBe(30000); // both
  });
});

