import { ROOM_RATES, SERVICE_PRICES } from '../time/timeConstants';

export type RoomSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export const RoomSize = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
} as const;

export interface PricingCalculationResult {
  baseAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  totalAmount: number;
}

/**
 * Calcula la tasa de descuento según la duración reservada.
 */
export function calculateDiscountRate(durationHours: number): number {
  if (durationHours >= 8) {
    return 0.20;
  }
  if (durationHours >= 4) {
    return 0.10;
  }
  return 0;
}

/**
 * Calcula el desglose de precios (tarifa base, descuento por volumen, recargo de sábado).
 */
export function calculateRoomPricing(
  roomSize: RoomSize,
  durationHours: number,
  isSaturday: boolean
): PricingCalculationResult {
  const hourlyRate = ROOM_RATES[roomSize];
  const baseAmount = hourlyRate * durationHours;

  const discountRate = calculateDiscountRate(durationHours);
  const discountAmount = Math.round(baseAmount * discountRate);
  const afterDiscount = baseAmount - discountAmount;

  const surchargeAmount = isSaturday ? Math.round(afterDiscount * 0.25) : 0;
  const totalAmount = afterDiscount + surchargeAmount;

  return {
    baseAmount,
    discountAmount,
    surchargeAmount,
    totalAmount,
  };
}

/**
 * Calcula el total de servicios adicionales (proyector, café).
 */
export function calculateServicesAmount(hasProjector: boolean, hasCoffee: boolean): number {
  return (
    (hasProjector ? SERVICE_PRICES.projector : 0) +
    (hasCoffee ? SERVICE_PRICES.coffee : 0)
  );
}

