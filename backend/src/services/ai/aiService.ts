import { Booking } from '@prisma/client';
import { randomUUID } from 'crypto';
import prisma from '../../lib/prisma';
import { BOOKING_ASSISTANT_SYSTEM_PROMPT } from '../../prompts/bookingAssistantPrompt';
import { AiOutputSchema, AiOutput } from './aiSchema';
import { resolveRelativeDates } from '../../domain/dateResolver';
import { processQuote, QuoteServiceResult } from '../quoteService';
import { createDraftBooking, updateBookingStep } from '../bookingService';
import { callGeminiApi } from './geminiClient';
import { localRuleBasedAssistant } from './ruleBasedFallback';
import {
  formatAvailableQuoteReply,
  formatUnavailableQuoteReply,
  formatDraftCreatedReply,
} from './aiResponseFormatter';

export interface ChatInteractionResult {
  sessionId: string;
  reply: string;
  action: string;
  quoteData?: QuoteServiceResult | null;
  draftBooking?: Booking | null;
}

export interface HandleChatMessageParams {
  sessionId?: string;
  message: string;
  userId?: number;
}

/**
 * Obtiene la respuesta estructurada desde Gemini o ejecuta el fallback heurístico.
 */
async function resolveAiOutput(
  rawMessage: string,
  normalizedText: string,
  history: Array<{ role: string; content: string }>,
  detectedDate?: string,
  detectedTime?: string
): Promise<AiOutput> {
  const rawAiResponse = await callGeminiApi(
    BOOKING_ASSISTANT_SYSTEM_PROMPT,
    history,
    normalizedText
  );

  if (rawAiResponse) {
    try {
      const json: unknown = JSON.parse(rawAiResponse);
      const validation = AiOutputSchema.safeParse(json);
      if (validation.success) {
        return validation.data;
      }
      console.warn('[AI VALIDATOR] Salida no coincide con esquema Zod:', validation.error.format());
    } catch {
      // Ignorar error de JSON parse y usar fallback
    }
  }

  return localRuleBasedAssistant(rawMessage, detectedDate, detectedTime);
}

/**
 * Procesa la acción QUOTE_REQUEST dentro del asistente conversacional.
 */
async function handleQuoteAction(
  parsedOutput: Extract<AiOutput, { action: 'QUOTE_REQUEST' }>
): Promise<{ reply: string; quoteData: QuoteServiceResult }> {
  const quote = await processQuote({
    roomSize: parsedOutput.roomSize,
    date: parsedOutput.date,
    startTime: parsedOutput.startTime,
    durationHours: parsedOutput.durationHours,
  });

  if (quote.isAvailable && quote.baseAmount !== undefined) {
    const reply = formatAvailableQuoteReply({
      roomName: quote.roomName || parsedOutput.roomSize,
      date: parsedOutput.date,
      startTime: parsedOutput.startTime,
      durationHours: parsedOutput.durationHours,
      baseAmount: quote.baseAmount,
      discountAmount: quote.discountAmount ?? 0,
      surchargeAmount: quote.surchargeAmount ?? 0,
      totalAmount: quote.totalAmount ?? quote.baseAmount,
    });
    return { reply, quoteData: quote };
  }

  return { reply: formatUnavailableQuoteReply(quote), quoteData: quote };
}

/**
 * Procesa la acción CREATE_DRAFT dentro del asistente conversacional.
 */
async function handleDraftAction(
  userId: number,
  sessionId: string,
  parsedOutput: Extract<AiOutput, { action: 'CREATE_DRAFT' }>
): Promise<{ reply: string; draftBooking: Booking | null }> {
  const room = await prisma.room.findUnique({ where: { size: parsedOutput.roomSize } });
  if (!room) {
    return { reply: 'La sala solicitada no se encuentra disponible.', draftBooking: null };
  }

  const created = await createDraftBooking(userId, {
    roomId: room.id,
    date: parsedOutput.date,
    startTime: parsedOutput.startTime,
    durationHours: parsedOutput.durationHours,
    customerName: parsedOutput.customerName,
    customerEmail: parsedOutput.customerEmail,
  });

  if (parsedOutput.hasProjector || parsedOutput.hasCoffee) {
    await updateBookingStep(created.id, 3, {
      hasProjector: parsedOutput.hasProjector,
      hasCoffee: parsedOutput.hasCoffee,
    });
  }

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { draftBookingId: created.id },
  });

  const reply = formatDraftCreatedReply(created.id, room.name, parsedOutput.date, parsedOutput.startTime);
  return { reply, draftBooking: created };
}

/**
 * Orquestador principal de la interacción con el Asistente de IA.
 */
export async function handleChatMessage(params: HandleChatMessageParams): Promise<ChatInteractionResult> {
  const userId = params.userId || 1;
  const rawMessage = params.message.trim();

  // 1. Obtener o crear sesión de chat
  let session = params.sessionId
    ? await prisma.chatSession.findUnique({
        where: { id: params.sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  if (!session) {
    const newSessionId = params.sessionId || randomUUID();
    session = await prisma.chatSession.create({
      data: { id: newSessionId, userId },
      include: { messages: true },
    });
  }

  // 2. Resolver fechas relativas determinísticamente en código
  const dateContext = resolveRelativeDates(rawMessage);

  // 3. Obtener respuesta estructurada (Gemini o Fallback heurístico)
  const history = session.messages.map((m) => ({ role: m.role, content: m.content }));
  const parsedOutput = await resolveAiOutput(
    rawMessage,
    dateContext.normalizedText,
    history,
    dateContext.detectedDate,
    dateContext.detectedTime
  );

  // 4. Ejecutar acciones de dominio según el schema validado
  let finalReply = parsedOutput.message;
  let quoteData: QuoteServiceResult | null = null;
  let draftBooking: Booking | null = null;

  if (parsedOutput.action === 'QUOTE_REQUEST') {
    const quoteResult = await handleQuoteAction(parsedOutput);
    finalReply = quoteResult.reply;
    quoteData = quoteResult.quoteData;
  } else if (parsedOutput.action === 'CREATE_DRAFT') {
    const draftResult = await handleDraftAction(userId, session.id, parsedOutput);
    finalReply = draftResult.reply;
    draftBooking = draftResult.draftBooking;
  }

  // 5. Persistir mensajes de la conversación en PostgreSQL
  await prisma.chatMessage.createMany({
    data: [
      { sessionId: session.id, role: 'user', content: rawMessage },
      { sessionId: session.id, role: 'assistant', content: finalReply },
    ],
  });

  return {
    sessionId: session.id,
    reply: finalReply,
    action: parsedOutput.action,
    quoteData,
    draftBooking,
  };
}

/**
 * Recupera el historial completo de la conversación y el borrador activo al recargar la página.
 */
export async function getSessionHistory(sessionId: string) {
  return await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
}
