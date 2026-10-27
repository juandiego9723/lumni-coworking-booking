import { z } from 'zod';
import { BookingStatus, EmailStatus } from '@prisma/client';
import { idParamSchema } from './commonSchemas';

export { idParamSchema as adminBookingIdParamSchema };

export const listBookingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.nativeEnum(BookingStatus).optional(),
  roomId: z.coerce.number().int().positive().optional(),
  emailStatus: z.nativeEnum(EmailStatus).optional(),
});

export const cancelBookingBodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'El motivo de cancelación es obligatorio y debe tener al menos 5 caracteres.'),
});

export const listEmailsQuerySchema = z.object({
  status: z.nativeEnum(EmailStatus).optional(),
});

export type ListBookingsQueryInput = z.infer<typeof listBookingsQuerySchema>;
export type CancelBookingBodyInput = z.infer<typeof cancelBookingBodySchema>;

