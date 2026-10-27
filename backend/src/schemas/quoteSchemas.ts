import { z } from 'zod';
import {
  dateStringSchema,
  timeStringSchema,
  durationHoursSchema,
  roomSizeEnumSchema,
} from './commonSchemas';

export const quoteRequestSchema = z
  .object({
    roomSize: roomSizeEnumSchema.optional(),
    roomId: z.number().int().positive().optional(),
    date: dateStringSchema,
    startTime: timeStringSchema,
    durationHours: durationHoursSchema,
  })
  .refine((data) => data.roomSize || data.roomId, {
    message: 'Debe proporcionar roomSize o roomId',
  });

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

