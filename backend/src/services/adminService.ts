import { BookingStatus, EmailStatus, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { canTransition } from '../domain/bookingStateMachine';

export interface AdminBookingFilterParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  roomId?: number;
  emailStatus?: EmailStatus;
}

export async function listAdminBookings(params: AdminBookingFilterParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  const where: Prisma.BookingWhereInput = {};

  if (params.status) {
    where.status = params.status;
  }

  if (params.roomId) {
    where.roomId = params.roomId;
  }

  if (params.emailStatus) {
    where.emailOutbox = {
      status: params.emailStatus,
    };
  }

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        room: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        emailOutbox: {
          select: {
            id: true,
            status: true,
            attempts: true,
            lastError: true,
            nextRetryAt: true,
            sentAt: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function getAdminBookingById(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      room: true,
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
      emailOutbox: true,
    },
  });

  if (!booking) {
    throw new Error('Reserva no encontrada');
  }

  return booking;
}

export async function cancelAdminBooking(bookingId: number, cancellationReason: string) {
  const trimmedReason = cancellationReason?.trim();
  if (!trimmedReason || trimmedReason.length < 5) {
    throw new Error('El motivo de cancelación es obligatorio y debe tener al menos 5 caracteres.');
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new Error('Reserva no encontrada');
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('La reserva ya se encuentra cancelada.');
  }

  if (!canTransition(booking.status, 'CANCELLED')) {
    throw new Error(`No se puede cancelar una reserva con estado actual '${booking.status}'.`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CANCELLED',
      cancellationReason: trimmedReason,
    },
    include: {
      room: true,
      emailOutbox: true,
    },
  });

  return updatedBooking;
}

export async function listAdminEmails(status?: EmailStatus) {
  const where: Prisma.EmailOutboxWhereInput = {};
  if (status) {
    where.status = status;
  }

  return await prisma.emailOutbox.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      booking: {
        select: {
          id: true,
          customerName: true,
          customerEmail: true,
          status: true,
          totalAmount: true,
        },
      },
    },
  });
}
