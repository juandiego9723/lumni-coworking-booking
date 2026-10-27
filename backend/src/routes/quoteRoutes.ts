import { Router, Request, Response } from 'express';
import { quoteRequestSchema } from '../schemas/quoteSchemas';
import { validateRequest } from '../middlewares/validationMiddleware';
import { processQuote } from '../services/quoteService';
import { handleRouteError } from '../utils/httpErrors';

const router = Router();

// POST /api/quotes - Cotizar disponibilidad y tarifas
router.post(
  '/',
  validateRequest({ body: quoteRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await processQuote(req.body);
      return res.status(200).json(result);
    } catch (error: unknown) {
      return handleRouteError(res, error, 'Error interno al procesar la cotización');
    }
  }
);

export default router;
