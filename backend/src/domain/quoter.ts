/**
 * Dominio puro de cotización y validación de horarios para Lumni Coworking.
 * Refactorizado bajo principios SOLID y DRY.
 */

import {
  RoomSize,
  calculateRoomPricing,
  PricingCalculationResult,
} from './pricing/pricingCalculator';
import {
  validateBookingSchedule,
  ScheduleValidationResult,
} from './time/scheduleValidator';

export { RoomSize };

export interface QuoteInput {
  roomSize: RoomSize;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (ej. "08:00")
  durationHours: number; // entre 1 y 10, bloques de 0.5
}

export interface QuoteResult {
  baseAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  servicesAmount: number;
  totalAmount: number;
  isAvailable: boolean;
  reason?: string;
  suggestedNextSlot?: string | null;
}

/**
 * Calcula el desglose de precios para una sala, delegando en el calculador de precios puro.
 */
export function calculatePricing(
  roomSize: RoomSize,
  durationHours: number,
  isSaturday: boolean
): PricingCalculationResult {
  return calculateRoomPricing(roomSize, durationHours, isSaturday);
}

/**
 * Valida las reglas de horario de negocio, delegando en el validador de calendario puro.
 */
export function validateSchedule(
  dateStr: string,
  startTimeStr: string,
  durationHours: number,
  referenceDate?: Date
): ScheduleValidationResult {
  return validateBookingSchedule(dateStr, startTimeStr, durationHours, referenceDate);
}
