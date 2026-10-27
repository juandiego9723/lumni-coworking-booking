import { z } from 'zod';

export const chatRequestSchema = z.object({
  sessionId: z.string().uuid('ID de sesión inválido').optional(),
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(1000),
  userId: z.number().int().positive().optional().default(1),
});

export const chatSessionParamSchema = z.object({
  sessionId: z.string().min(1, 'El sessionId es obligatorio'),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

