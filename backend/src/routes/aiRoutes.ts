import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { handleChatMessage, getSessionHistory } from '../services/ai/aiService';

const router = Router();

const chatRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().min(1, 'El mensaje no puede estar vacío').max(1000),
  userId: z.number().int().positive().optional().default(1),
});

// POST /api/ai/chat - Envío de mensaje en lenguaje natural
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos de entrada inválidos', details: parsed.error.format() });
    }

    const result = await handleChatMessage(parsed.data);
    return res.json(result);
  } catch (error: any) {
    console.error('Error en /api/ai/chat:', error);
    return res.status(500).json({ error: error.message || 'Error al procesar mensaje con IA' });
  }
});

// GET /api/ai/chat/:sessionId - Recuperar historial y borrador para retomar al recargar la página
router.get('/chat/:sessionId', async (req: Request, res: Response) => {
  try {
    const history = await getSessionHistory(req.params.sessionId);
    if (!history) {
      return res.status(404).json({ error: 'Sesión de chat no encontrada' });
    }
    return res.json(history);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;

