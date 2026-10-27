import { Router, Request, Response } from 'express';
import { chatRequestSchema, chatSessionParamSchema } from '../schemas/chatSchemas';
import { validateRequest } from '../middlewares/validationMiddleware';
import { handleChatMessage, getSessionHistory } from '../services/ai/aiService';
import { handleRouteError } from '../utils/httpErrors';

const router = Router();

// POST /api/ai/chat - Envío de mensaje en lenguaje natural
router.post(
  '/chat',
  validateRequest({ body: chatRequestSchema }),
  async (req: Request, res: Response) => {
    try {
      const result = await handleChatMessage(req.body);
      return res.json(result);
    } catch (error: unknown) {
      return handleRouteError(res, error, 'Error al procesar mensaje con IA');
    }
  }
);

// GET /api/ai/chat/:sessionId - Recuperar historial y borrador para retomar al recargar la página
router.get(
  '/chat/:sessionId',
  validateRequest({ params: chatSessionParamSchema }),
  async (req: Request, res: Response) => {
    try {
      const history = await getSessionHistory(req.params.sessionId);
      if (!history) {
        return res.status(404).json({ error: 'Sesión de chat no encontrada' });
      }
      return res.json(history);
    } catch (error: unknown) {
      return handleRouteError(res, error);
    }
  }
);

export default router;
