import { RoomSize } from '@prisma/client';
import prisma from '../lib/prisma';
import { calculatePricing, validateSchedule } from '../domain/quoter';
import {
  createBogotaDateTime,
  calculateEndDateTime,
  minutesToTime,
  getNowBogota,
} from '../domain/time/dateUtils';
import { BUSINESS_HOURS } from '../domain/time/timeConstants';

export interface ProcessQuoteInput {
  roomSize?: RoomSize;
  roomId?: number;
  date: string;
  startTime: string;
  durationHours: number;
}

export interface QuoteServiceResult {
  roomId?: number;
  roomName?: string;
  isAvailable: boolean;
  reason?: string;
  suggestedNextSlot?: string | null;
  baseAmount?: number;
  discountAmount?: number;
  surchargeAmount?: number;
  totalAmount?: number;
}

/**
 * Procesa la cotización de una sala y verifica su disponibilidad en tiempo real.
 * Según la especificación oficial, la respuesta SIEMPRE incluye el desglose de precios
 * (baseAmount, discountAmount, surchargeAmount, totalAmount), indicando si es posible
 * reservar o el motivo de no disponibilidad con una sugerencia de horario alternativo.
 */
export async function processQuote(
  data: ProcessQuoteInput,
  referenceDate?: Date
): Promise<QuoteServiceResult> {
  // 1. Buscar la sala por ID o por tamaño
  const room = data.roomId
    ? await prisma.room.findUnique({ where: { id: data.roomId } })
    : data.roomSize
    ? await prisma.room.findUnique({ where: { size: data.roomSize } })
    : null;

  if (!room) {
    return { isAvailable: false, reason: 'La sala seleccionada no existe.' };
  }

  // 2. Validar reglas estructurales de horario y calcular el desglose oficial de precios
  const validation = validateSchedule(data.date, data.startTime, data.durationHours, referenceDate);
  const pricing = calculatePricing(room.size, data.durationHours, validation.isSaturday);

  // 3. Si el horario solicitado no es válido (fechas/horas pasadas, domingo cerrado o fuera de 07:00 a 21:00)
  if (!validation.isValid) {
    const isSunday = validation.reason?.includes('domingo');
    const suggestedStartTime = isSunday
      ? null
      : await findNextAvailableSlot(room.id, data.date, data.durationHours, referenceDate);

    return {
      roomId: room.id,
      roomName: room.name,
      isAvailable: false,
      reason: validation.reason,
      suggestedNextSlot: suggestedStartTime,
      ...pricing,
    };
  }

  // 4. Verificar disponibilidad (solapamiento con reservas CONFIRMED)
  const startsAt = createBogotaDateTime(data.date, data.startTime);
  const endsAt = calculateEndDateTime(startsAt, data.durationHours);

  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      roomId: room.id,
      status: 'CONFIRMED',
      AND: [{ startsAt: { lt: endsAt } }, { endsAt: { gt: startsAt } }],
    },
  });

  if (overlappingBooking) {
    const suggestedStartTime = await findNextAvailableSlot(
      room.id,
      data.date,
      data.durationHours,
      referenceDate
    );
    return {
      roomId: room.id,
      roomName: room.name,
      isAvailable: false,
      reason: `La sala ${room.name} ya se encuentra reservada en el horario solicitado.`,
      suggestedNextSlot: suggestedStartTime,
      ...pricing,
    };
  }

  return {
    roomId: room.id,
    roomName: room.name,
    isAvailable: true,
    ...pricing,
  };
}

/**
 * Busca el siguiente bloque disponible en el mismo día entre 07:00 y 21:00,
 * descartando horas que ya hayan transcurrido en el día de hoy.
 */
async function findNextAvailableSlot(
  roomId: number,
  dateStr: string,
  durationHours: number,
  referenceDate?: Date
): Promise<string | null> {
  const openingMinutes = BUSINESS_HOURS.OPEN_HOUR * 60;
  const closingMinutes = BUSINESS_HOURS.CLOSE_HOUR * 60;
  const durationMinutes = durationHours * 60;
  const now = referenceDate ?? getNowBogota();

  // Consulta única de todas las reservas confirmadas del día
  const dayStart = createBogotaDateTime(dateStr, '00:00');
  const dayEnd = createBogotaDateTime(dateStr, '23:59');

  const existingBookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: 'CONFIRMED',
      startsAt: { lte: dayEnd },
      endsAt: { gte: dayStart },
    },
    select: { startsAt: true, endsAt: true },
  });

  for (let currentMin = openingMinutes; currentMin + durationMinutes <= closingMinutes; currentMin += BUSINESS_HOURS.SLOT_INTERVAL_MINUTES) {
    const slotStart = createBogotaDateTime(dateStr, minutesToTime(currentMin));

    // Descartar horarios en el pasado para el día actual
    if (slotStart.getTime() <= now.getTime()) {
      continue;
    }

    const slotEnd = calculateEndDateTime(slotStart, durationHours);

    const hasOverlap = existingBookings.some(
      (b) => b.startsAt < slotEnd && b.endsAt > slotStart
    );

    if (!hasOverlap) {
      return minutesToTime(currentMin);
    }
  }

  return null;
}
