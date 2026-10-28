import { Booking } from '@prisma/client';
import prisma from '../lib/prisma';
import { canTransition } from '../domain/bookingStateMachine';
import { calculatePricing, validateSchedule } from '../domain/quoter';
import { calculateServicesAmount } from '../domain/pricing/pricingCalculator';
import { createBogotaDateTime, calculateEndDateTime } from '../domain/time/dateUtils';

export interface CreateDraftBookingInput {
  roomId: number;
  date: string;
  startTime: string;
  durationHours: number;
  customerName: string;
  customerEmail: string;
}

export interface Step1Data {
  customerName?: string;
  customerEmail?: string;
}

export interface Step2Data {
  roomId?: number;
  date?: string;
  startTime?: string;
  durationHours?: number;
}

export interface Step3Data {
  hasProjector?: boolean;
  hasCoffee?: boolean;
}

export type UpdateBookingStepInput = Step1Data & Step2Data & Step3Data;

/**
 * Obtiene una reserva por su ID, arrojando error de dominio si no existe.
 */
export async function getBookingById(bookingId: number): Promise<Booking> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new Error('Borrador no encontrado');
  }
  return booking;
}

/**
 * Crea una reserva en estado DRAFT validando previamente las reglas horarias.
 */
export async function createDraftBooking(userId: number, data: CreateDraftBookingInput): Promise<Booking> {
  const validation = validateSchedule(data.date, data.startTime, data.durationHours);
  if (!validation.isValid) {
    throw new Error(validation.reason);
  }

  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) {
    throw new Error('Sala no encontrada');
  }

  const startsAt = createBogotaDateTime(data.date, data.startTime);
  const endsAt = calculateEndDateTime(startsAt, data.durationHours);
  const pricing = calculatePricing(room.size, data.durationHours, validation.isSaturday);

  return await prisma.booking.create({
    data: {
      userId,
      roomId: room.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      startsAt,
      endsAt,
      durationHours: data.durationHours,
      baseAmount: pricing.baseAmount,
      discountAmount: pricing.discountAmount,
      surchargeAmount: pricing.surchargeAmount,
      servicesAmount: 0,
      totalAmount: pricing.totalAmount,
      status: 'DRAFT',
      currentStep: 1,
    },
  });
}

/**
 * Actualiza progresivamente los pasos del wizard de reserva.
 */
export async function updateBookingStep(
  bookingId: number,
  step: number,
  data: UpdateBookingStepInput
): Promise<Booking> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new Error('Borrador no encontrado');
  }
  if (booking.status !== 'DRAFT') {
    throw new Error('Solo se pueden modificar borradores');
  }

  const updateData: Partial<Booking> = { currentStep: step };

  if (step === 1) {
    if (data.customerName) updateData.customerName = data.customerName;
    if (data.customerEmail) updateData.customerEmail = data.customerEmail;
  } else if (step === 2 && data.roomId && data.date && data.startTime && data.durationHours) {
    const validation = validateSchedule(data.date, data.startTime, data.durationHours);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      throw new Error('Sala no encontrada');
    }

    const startsAt = createBogotaDateTime(data.date, data.startTime);
    const endsAt = calculateEndDateTime(startsAt, data.durationHours);
    const pricing = calculatePricing(room.size, data.durationHours, validation.isSaturday);

    updateData.roomId = room.id;
    updateData.startsAt = startsAt;
    updateData.endsAt = endsAt;
    updateData.durationHours = data.durationHours;
    updateData.baseAmount = pricing.baseAmount;
    updateData.discountAmount = pricing.discountAmount;
    updateData.surchargeAmount = pricing.surchargeAmount;
    updateData.totalAmount =
      pricing.baseAmount - pricing.discountAmount + pricing.surchargeAmount + booking.servicesAmount;
  } else if (step === 3) {
    const hasProjector = data.hasProjector ?? booking.hasProjector;
    const hasCoffee = data.hasCoffee ?? booking.hasCoffee;
    const servicesAmount = calculateServicesAmount(hasProjector, hasCoffee);

    updateData.hasProjector = hasProjector;
    updateData.hasCoffee = hasCoffee;
    updateData.servicesAmount = servicesAmount;
    updateData.totalAmount =
      booking.baseAmount - booking.discountAmount + booking.surchargeAmount + servicesAmount;
  }

  return await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });
}

/**
 * Confirma una reserva de forma atómica e idempotente.
 */
export async function confirmBooking(
  bookingId: number
): Promise<{ booking: Booking; alreadyConfirmed: boolean }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new Error('Reserva no encontrada');
  }

  // Idempotencia: Si ya está confirmada, retornar inmediatamente
  if (booking.status === 'CONFIRMED') {
    return { booking, alreadyConfirmed: true };
  }

  if (!canTransition(booking.status, 'CONFIRMED')) {
    throw new Error(`Transición de estado inválida de ${booking.status} a CONFIRMED`);
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Verificar solapamiento dentro de la transacción antes de confirmar
      const overlapping = await tx.booking.findFirst({
        where: {
          roomId: booking.roomId,
          status: 'CONFIRMED',
          id: { not: bookingId },
          startsAt: { lt: booking.endsAt },
          endsAt: { gt: booking.startsAt },
        },
      });

      if (overlapping) {
        throw new Error('El horario seleccionado acaba de ser reservado por otro cliente. Por favor elige otro.');
      }

      const confirmed = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Registrar correo en EmailOutbox garantizando 1 solo registro por reserva (UPSERT)
      await tx.emailOutbox.upsert({
        where: { bookingId: confirmed.id },
        update: {},
        create: {
          bookingId: confirmed.id,
          recipientEmail: confirmed.customerEmail,
          subject: `Confirmación de Reserva #${confirmed.id} - Lumni Coworking`,
          body: `Hola ${confirmed.customerName}, tu reserva para la sala ha sido confirmada exitosamente. Total: $${confirmed.totalAmount} COP.`,
          status: 'PENDING',
        },
      });

      return confirmed;
    });

    return { booking: updated, alreadyConfirmed: false };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';
    if (
      code === '23P01' ||
      msg.includes('23P01') ||
      msg.includes('booking_no_overlap') ||
      msg.includes('exclusion constraint') ||
      msg.includes('acaba de ser reservado')
    ) {
      throw new Error('El horario seleccionado acaba de ser reservado por otro cliente. Por favor elige otro.');
    }
    throw error;
  }
}
