import { Router, Response } from 'express';
import { z } from 'zod';
import { BookingStatus, EmailStatus, Role } from '@prisma/client';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  listAdminBookings,
  getAdminBookingById,
  cancelAdminBooking,
  listAdminEmails,
} from '../services/adminService';
import { handleRouteError } from '../utils/httpErrors';

const router = Router();

// Todos los endpoints de administración requieren estar autenticado con rol ADMIN
router.use(authenticate);
router.use(requireRole(Role.ADMIN));

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  status: z.nativeEnum(BookingStatus).optional(),
  roomId: z.coerce.number().int().positive().optional(),
  emailStatus: z.nativeEnum(EmailStatus).optional(),
});

// GET /api/admin/bookings - Listado paginado con filtros
router.get('/bookings', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Parámetros de consulta inválidos', details: parsed.error.format() });
    }

    const result = await listAdminBookings(parsed.data);
    return res.json(result);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

// GET /api/admin/bookings/:id - Detalle completo de una reserva
router.get('/bookings/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const booking = await getAdminBookingById(bookingId);
    return res.json(booking);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

const cancelBodySchema = z.object({
  reason: z.string().min(5, 'El motivo de cancelación es obligatorio y debe tener al menos 5 caracteres.'),
});

// POST /api/admin/bookings/:id/cancel - Cancelar con motivo obligatorio
router.post('/bookings/:id/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'ID de reserva inválido' });
    }

    const parsed = cancelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos de cancelación inválidos', details: parsed.error.format() });
    }

    const result = await cancelAdminBooking(bookingId, parsed.data.reason);
    return res.json({
      message: 'Reserva cancelada exitosamente.',
      booking: result,
    });
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

// GET /api/admin/emails - Visibilidad y auditoría de la bandeja EmailOutbox (PENDING, SENT, FAILED)
router.get('/emails', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as EmailStatus | undefined;
    const emails = await listAdminEmails(status);
    return res.json(emails);
  } catch (error: unknown) {
    return handleRouteError(res, error);
  }
});

export default router;
