import { RoomSize } from '@prisma/client';

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
  suggestedNextSlot?: string;
}

const ROOM_RATES: Record<RoomSize, number> = {
  [RoomSize.SMALL]: 40000,
  [RoomSize.MEDIUM]: 70000,
  [RoomSize.LARGE]: 120000,
};

export function calculatePricing(roomSize: RoomSize, durationHours: number, isSaturday: boolean) {
  const hourlyRate = ROOM_RATES[roomSize];
  const baseAmount = hourlyRate * durationHours;

  let discountRate = 0;
  if (durationHours >= 8) {
    discountRate = 0.20;
  } else if (durationHours >= 4) {
    discountRate = 0.10;
  }

  const discountAmount = Math.round(baseAmount * discountRate);
  const afterDiscount = baseAmount - discountAmount;

  let surchargeAmount = 0;
  if (isSaturday) {
    surchargeAmount = Math.round(afterDiscount * 0.25);
  }

  const totalAmount = afterDiscount + surchargeAmount;

  return {
    baseAmount,
    discountAmount,
    surchargeAmount,
    totalAmount,
  };
}

export function validateSchedule(dateStr: string, startTimeStr: string, durationHours: number): { isValid: boolean; reason?: string; startMinutes: number; endMinutes: number; isSaturday: boolean } {
  const dateObj = new Date(`${dateStr}T00:00:00-05:00`); // Hora Colombia UTC-5
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

  if (dayOfWeek === 0) {
    return { isValid: false, reason: 'El coworking está cerrado los domingos.', startMinutes: 0, endMinutes: 0, isSaturday: false };
  }

  if (durationHours < 1 || durationHours > 10 || (durationHours * 2) % 1 !== 0) {
    return { isValid: false, reason: 'La duración debe estar entre 1 y 10 horas en bloques de 30 minutos (0.5h).', startMinutes: 0, endMinutes: 0, isSaturday: dayOfWeek === 6 };
  }

  const [hours, minutes] = startTimeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || minutes % 30 !== 0) {
    return { isValid: false, reason: 'La hora de inicio debe estar en bloques de 30 minutos (ej. 08:00, 08:30).', startMinutes: 0, endMinutes: 0, isSaturday: dayOfWeek === 6 };
  }

  const startMinutes = hours * 60 + minutes;
  const totalDurationMinutes = durationHours * 60;
  const endMinutes = startMinutes + totalDurationMinutes;

  const openingMinutes = 7 * 60; // 07:00
  const closingMinutes = 21 * 60; // 21:00

  if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
    return { isValid: false, reason: 'El horario de atención es de lunes a sábado de 07:00 a 21:00.', startMinutes, endMinutes, isSaturday: dayOfWeek === 6 };
  }

  return {
    isValid: true,
    startMinutes,
    endMinutes,
    isSaturday: dayOfWeek === 6,
  };
}
