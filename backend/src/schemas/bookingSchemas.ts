import { z } from 'zod';
import { dateStringSchema, timeStringSchema, durationHoursSchema, idParamSchema } from './commonSchemas';

export { idParamSchema as bookingIdParamSchema };

export const createDraftSchema = z.object({
  userId: z.number().int().positive('El userId debe ser un entero positivo'),
  roomId: z.number().int().positive('El roomId debe ser un entero positivo'),
  date: dateStringSchema,
  startTime: timeStringSchema,
  durationHours: durationHoursSchema,
  customerName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  customerEmail: z.string().email('Correo electrónico inválido'),
});

export const patchBookingStepSchema = z.object({
  step: z.number().int().min(1).max(3),
  data: z.object({
    customerName: z.string().min(2).optional(),
    customerEmail: z.string().email().optional(),
    roomId: z.number().int().positive().optional(),
    date: dateStringSchema.optional(),
    startTime: timeStringSchema.optional(),
    durationHours: durationHoursSchema.optional(),
    hasProjector: z.boolean().optional(),
    hasCoffee: z.boolean().optional(),
  }),
});

export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type PatchBookingStepInput = z.infer<typeof patchBookingStepSchema>;

