import { PrismaClient, BookingStatus } from '@prisma/client';
import { canTransition } from '../domain/bookingStateMachine';
import { calculatePricing, validateSchedule } from '../domain/quoter';

const prisma = new PrismaClient();

const SERVICE_PRICES = {
  projector: 20000,
  coffee: 10000,
};

export async function createDraftBooking(userId: number, data: { roomId: number; date: string; startTime: string; durationHours: number; customerName: string; customerEmail: string }) {
  const validation = validateSchedule(data.date, data.startTime, data.durationHours);
  if (!validation.isValid) throw new Error(validation.reason);

  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) throw new Error('Sala no encontrada');

  const startsAt = new Date(`${data.date}T${data.startTime}:00-05:00`);
  const endsAt = new Date(startsAt.getTime() + data.durationHours * 3600 * 1000);
  const pricing = calculatePricing(room.size, data.durationHours, validation.isSaturday!);

  const booking = await prisma.booking.create({
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

  return booking;
}

export async function updateBookingStep(bookingId: number, step: number, data: any) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Borrador no encontrado');
  if (booking.status !== 'DRAFT') throw new Error('Solo se pueden modificar borradores');

  let updateData: any = { currentStep: step };

  if (step === 1) {
    if (data.customerName) updateData.customerName = data.customerName;
    if (data.customerEmail) updateData.customerEmail = data.customerEmail;
  } else if (step === 2 && data.roomId && data.date && data.startTime && data.durationHours) {
    const validation = validateSchedule(data.date, data.startTime, data.durationHours);
    if (!validation.isValid) throw new Error(validation.reason);

    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new Error('Sala no encontrada');

    const startsAt = new Date(`${data.date}T${data.startTime}:00-05:00`);
    const endsAt = new Date(startsAt.getTime() + data.durationHours * 3600 * 1000);
    const pricing = calculatePricing(room.size, data.durationHours, validation.isSaturday!);

    updateData.roomId = room.id;
    updateData.startsAt = startsAt;
    updateData.endsAt = endsAt;
    updateData.durationHours = data.durationHours;
    updateData.baseAmount = pricing.baseAmount;
    updateData.discountAmount = pricing.discountAmount;
    updateData.surchargeAmount = pricing.surchargeAmount;
    updateData.totalAmount = pricing.baseAmount - pricing.discountAmount + pricing.surchargeAmount + booking.servicesAmount;
  } else if (step === 3) {
    const hasProjector = data.hasProjector ?? booking.hasProjector;
    const hasCoffee = data.hasCoffee ?? booking.hasCoffee;
    const servicesAmount = (hasProjector ? SERVICE_PRICES.projector : 0) + (hasCoffee ? SERVICE_PRICES.coffee : 0);

    updateData.hasProjector = hasProjector;
    updateData.hasCoffee = hasCoffee;
    updateData.servicesAmount = servicesAmount;
    updateData.totalAmount = booking.baseAmount - booking.discountAmount + booking.surchargeAmount + servicesAmount;
  }

  return await prisma.booking.update({
    where: { id: bookingId },
    data: updateData,
  });
}

export async function confirmBooking(bookingId: number) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error('Reserva no encontrada');

  // Idempotencia: Si ya está confirmada, retornar OK sin recalcular ni duplicar
  if (booking.status === 'CONFIRMED') {
    return { booking, alreadyConfirmed: true };
  }

  if (!canTransition(booking.status, 'CONFIRMED')) {
    throw new Error(`Transición de estado inválida de ${booking.status} a CONFIRMED`);
  }

  try {
    // Transacción atómica asegurada por el constraint btree_gist en PostgreSQL
    const updated = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Registrar outbox de correo en segundo plano (Parte 2.1) con UPSERT para garantizar 1 solo correo
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
  } catch (error: any) {
    // Capturar violación del constraint de exclusión de Postgres (23P01)
    if (error.code === '23P01') {
      throw new Error('El horario seleccionado acaba de ser reservado por otro cliente. Por favor elige otro.');
    }
    throw error;
  }
}
