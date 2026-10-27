import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createDraftBooking, updateBookingStep, confirmBooking } from '../services/bookingService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/draft', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      userId: z.number().int().positive(),
      roomId: z.number().int().positive(),
      date: z.string(),
      startTime: z.string(),
      durationHours: z.number().min(1).max(10),
      customerName: z.string().min(2),
      customerEmail: z.string().email(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.format() });

    const draft = await createDraftBooking(parsed.data.userId, parsed.data);
    return res.status(201).json(draft);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!booking) return res.status(404).json({ error: 'Borrador no encontrado' });
    return res.json(booking);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/step', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      step: z.number().int().min(1).max(3),
      data: z.record(z.any()),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.format() });

    const updated = await updateBookingStep(parseInt(req.params.id), parsed.data.step, parsed.data.data);
    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const result = await confirmBooking(parseInt(req.params.id));
    return res.json(result);
  } catch (error: any) {
    const status = error.message.includes('acaba de ser reservado') ? 409 : 400;
    return res.status(status).json({ error: error.message });
  }
});

export default router;
