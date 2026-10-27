import { Router, Request, Response } from 'express';
import {
  createDraftSchema,
  patchBookingStepSchema,
  bookingIdParamSchema,
} from '../schemas/bookingSchemas';
import { validateRequest } from '../middlewares/validationMiddleware';
import {
  createDraftBooking,
  updateBookingStep,
  confirmBooking,
  getBookingById,
} from '../services/bookingService';
import { handleRouteError } from '../utils/httpErrors';

const router = Router();

// POST /api/bookings/draft - Crear borrador inicial
router.post(
  '/draft',
  validateRequest({ body: createDraftSchema }, 'Datos inválidos'),
  async (req: Request, res: Response) => {
    try {
      const draft = await createDraftBooking(req.body.userId, req.body);
      return res.status(201).json(draft);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

// GET /api/bookings/:id - Obtener detalle de borrador
router.get(
  '/:id',
  validateRequest({ params: bookingIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const booking = await getBookingById(Number(req.params.id));
      return res.json(booking);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

// PATCH /api/bookings/:id/step - Avanzar y actualizar pasos del wizard
router.patch(
  '/:id/step',
  validateRequest(
    { params: bookingIdParamSchema, body: patchBookingStepSchema },
    'Datos inválidos'
  ),
  async (req: Request, res: Response) => {
    try {
      const updated = await updateBookingStep(
        Number(req.params.id),
        req.body.step,
        req.body.data
      );
      return res.json(updated);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

// POST /api/bookings/:id/confirm - Confirmar reserva
router.post(
  '/:id/confirm',
  validateRequest({ params: bookingIdParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await confirmBooking(Number(req.params.id));
      return res.json(result);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

export default router;
