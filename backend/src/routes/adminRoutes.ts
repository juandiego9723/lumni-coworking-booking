import { Router, Response } from 'express';
import { Role, EmailStatus } from '@prisma/client';
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  listBookingsQuerySchema,
  cancelBookingBodySchema,
  adminBookingIdParamSchema,
  listEmailsQuerySchema,
} from '../schemas/adminSchemas';
import { validateRequest } from '../middlewares/validationMiddleware';
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

// GET /api/admin/bookings - Listado paginado con filtros
router.get(
  '/bookings',
  validateRequest({ query: listBookingsQuerySchema }, 'Parámetros de consulta inválidos'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await listAdminBookings(req.query);
      return res.json(result);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

// GET /api/admin/bookings/:id - Detalle completo de una reserva
router.get(
  '/bookings/:id',
  validateRequest({ params: adminBookingIdParamSchema }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const booking = await getAdminBookingById(Number(req.params.id));
      return res.json(booking);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

// POST /api/admin/bookings/:id/cancel - Cancelar con motivo obligatorio
router.post(
  '/bookings/:id/cancel',
  validateRequest(
    { params: adminBookingIdParamSchema, body: cancelBookingBodySchema },
    'Datos de cancelación inválidos'
  ),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await cancelAdminBooking(Number(req.params.id), req.body.reason);
      return res.json({
        message: 'Reserva cancelada exitosamente.',
        booking: result,
      });
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

// GET /api/admin/emails - Visibilidad y auditoría de la bandeja EmailOutbox
router.get(
  '/emails',
  validateRequest({ query: listEmailsQuerySchema }),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = req.query.status as EmailStatus | undefined;
      const emails = await listAdminEmails(status);
      return res.json(emails);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

export default router;
