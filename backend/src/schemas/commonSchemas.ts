import { z } from 'zod';
import { RoomSize } from '@prisma/client';

/**
 * Esquemas Zod base y reutilizables para todo el backend (DRY).
 */

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('El ID debe ser un entero positivo'),
});

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)');

export const timeStringSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)');

export const durationHoursSchema = z
  .number()
  .min(1, 'La duración mínima es 1 hora')
  .max(10, 'La duración máxima es 10 horas');

export const roomSizeEnumSchema = z.nativeEnum(RoomSize);

