import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { createDraftBooking, updateBookingStep, confirmBooking } from '../services/bookingService';
import { handleRouteError } from '../utils/httpErrors';

const router = Router();

const draftSchema = z.object({
  userId: z.number().int().positive(),
  roomId: z.number().int().positive(),
  date: z.string(),
  startTime: z.string(),
  durationHours: z.number().min(1).max(10),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
});

const patchStepSchema = z.object({
  step: z.number().int().min(1).max(3),
  data: z.object({
    customerName: z.string().min(2).optional(),
    customerEmail: z.string().email().optional(),
    roomId: z.number().int().positive().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    durationHours: z.number().min(1).max(10).optional(),
    hasProjector: z.boolean().optional(),
    hasCoffee: z.boolean().optional(),
  }),
});

router.post('/draft', async (req: Request, res: Response) => {
  try {
    const parsed = draftSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.format() });
    }

    const draft = await createDraftBooking(parsed.data.userId, parsed.data);
    return res.status(201).json(draft);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return res.status(404).json({ error: 'Borrador no encontrado' });
    }
    return res.json(booking);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

router.patch('/:id/step', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const parsed = patchStepSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.format() });
    }

    const updated = await updateBookingStep(bookingId, parsed.data.step, parsed.data.data);
    return res.json(updated);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

router.post('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const result = await confirmBooking(bookingId);
    return res.json(result);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

export default router;
