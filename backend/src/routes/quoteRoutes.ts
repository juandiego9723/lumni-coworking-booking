import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { processQuote } from '../services/quoteService';
import { RoomSize } from '@prisma/client';

const router = Router();

const quoteSchema = z.object({
  roomSize: z.nativeEnum(RoomSize).optional(),
  roomId: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:mm)'),
  durationHours: z.number().min(1).max(10),
}).refine(data => data.roomSize || data.roomId, {
  message: 'Debe proporcionar roomSize o roomId',
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = quoteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Datos de entrada inválidos', details: validation.error.format() });
    }

    const result = await processQuote(validation.data);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error en POST /api/quotes:', error);
    return res.status(500).json({ error: 'Error interno al procesar la cotización' });
  }
});

export default router;
