import { z } from 'zod';

export const AskInfoSchema = z.object({
  action: z.literal('ASK_INFO'),
  missingFields: z.array(z.string()).optional(),
  message: z.string().min(1),
});

export const QuoteRequestSchema = z.object({
  action: z.literal('QUOTE_REQUEST'),
  roomSize: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD inválido'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm inválido'),
  durationHours: z.number().min(1).max(10),
  hasProjector: z.boolean().optional().default(false),
  hasCoffee: z.boolean().optional().default(false),
  message: z.string().min(1),
});

export const CreateDraftSchema = z.object({
  action: z.literal('CREATE_DRAFT'),
  roomSize: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD inválido'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:mm inválido'),
  durationHours: z.number().min(1).max(10),
  customerName: z.string().min(2),
  customerEmail: z.string().email('Correo electrónico inválido'),
  hasProjector: z.boolean().optional().default(false),
  hasCoffee: z.boolean().optional().default(false),
  message: z.string().min(1),
});

export const GeneralReplySchema = z.object({
  action: z.literal('GENERAL_REPLY'),
  message: z.string().min(1),
});

export const AiOutputSchema = z.discriminatedUnion('action', [
  AskInfoSchema,
  QuoteRequestSchema,
  CreateDraftSchema,
  GeneralReplySchema,
]);

export type AiOutput = z.infer<typeof AiOutputSchema>;

