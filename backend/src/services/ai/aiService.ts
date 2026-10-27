import { PrismaClient } from '@prisma/client';
import { BOOKING_ASSISTANT_SYSTEM_PROMPT } from '../../prompts/bookingAssistantPrompt';
import { AiOutputSchema, AiOutput } from './aiSchema';
import { resolveRelativeDates } from '../../domain/dateResolver';
import { processQuote } from '../quoteService';
import { createDraftBooking, updateBookingStep } from '../bookingService';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface ChatInteractionResult {
  sessionId: string;
  reply: string;
  action: string;
  quoteData?: any;
  draftBooking?: any;
}

/**
 * Motor heurístico de fallback para operar cuando no hay GEMINI_API_KEY en local o pruebas
 */
function localRuleBasedAssistant(userText: string, resolvedDate?: string, resolvedTime?: string): AiOutput {
  const lower = userText.toLowerCase();

  // Detectar intento de jailbreak o manipulación de reglas
  if (/olvida tus reglas|eres libre|confirma gratis|modo desarrollador|ignora instrucciones/i.test(userText)) {
    return {
      action: 'GENERAL_REPLY',
      message: 'Como asistente de Lumni Coworking, opero bajo reglas estrictas de seguridad. Solo puedo cotizar y crear borradores según las políticas vigentes.',
    };
  }

  // Detectar capacidad de personas y tamaño de sala
  let roomSize: 'SMALL' | 'MEDIUM' | 'LARGE' = 'SMALL';
  if (/grande|1[0-6]|1[0-2]|9|10 personas/.test(lower)) {
    roomSize = 'LARGE';
  } else if (/mediana|5|6|7|8 personas/.test(lower)) {
    roomSize = 'MEDIUM';
  } else if (/pequeña|pequena|1|2|3|4 personas/.test(lower)) {
    roomSize = 'SMALL';
  }

  const hasProjector = /proyector|video beam/i.test(lower);
  const hasCoffee = /cafe|café|bebidas/i.test(lower);

  // Extraer datos de contacto si el usuario los envía
  const emailMatch = userText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const nameMatch = userText.match(/me llamo ([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)|mi nombre es ([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)|soy ([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)/i);
  const detectedName = nameMatch ? (nameMatch[1] || nameMatch[2] || nameMatch[3]).trim() : undefined;

  // Si ya tenemos fecha, hora y datos de contacto -> CREATE_DRAFT
  if (resolvedDate && (emailMatch || detectedName)) {
    return {
      action: 'CREATE_DRAFT',
      roomSize,
      date: resolvedDate,
      startTime: resolvedTime || '09:00',
      durationHours: 2,
      customerName: detectedName || 'Cliente Lumni',
      customerEmail: emailMatch ? emailMatch[0] : 'cliente@lumni.com',
      hasProjector,
      hasCoffee,
      message: 'He recopilado tus datos y estoy creando el borrador en el sistema.',
    };
  }

  // Si tenemos fecha pero no cotización -> QUOTE_REQUEST
  if (resolvedDate) {
    return {
      action: 'QUOTE_REQUEST',
      roomSize,
      date: resolvedDate,
      startTime: resolvedTime || '09:00',
      durationHours: 2,
      hasProjector,
      hasCoffee,
      message: `Consultando disponibilidad y cotización para sala ${roomSize} el ${resolvedDate}...`,
    };
  }

  // Si falta información indispensable
  return {
    action: 'ASK_INFO',
    missingFields: ['date', 'startTime', 'durationHours'],
    message: '¡Hola! Con gusto te ayudo a reservar. ¿Para qué fecha y en qué horario necesitas la sala, y para cuántas personas sería?',
  };
}

/**
 * Consulta la API de Gemini (o utiliza el motor local de respaldo)
 */
async function callGeminiApi(systemPrompt: string, history: { role: string; content: string }[], userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'tu_api_key_aqui') {
    // Modo local / prueba sin API key
    return '';
  }

  try {
    const contents = [
      ...history.map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn(`[GEMINI API] Error HTTP ${response.status}. Usando fallback local.`);
      return '';
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (err) {
    console.warn('[GEMINI API] Fallo de conexión. Usando fallback local:', err);
    return '';
  }
}

/**
 * Orquestador principal de la interacción con el Asistente de IA
 */
export async function handleChatMessage(params: {
  sessionId?: string;
  message: string;
  userId?: number;
}): Promise<ChatInteractionResult> {
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
      data: {
        id: newSessionId,
        userId,
      },
      include: { messages: true },
    });
  }

  // 2. Resolver fechas relativas en código (Regla de negocio: no delegar cálculo de fechas al LLM)
  const dateContext = resolveRelativeDates(rawMessage);

  // 3. Obtener respuesta estructurada (Gemini o Fallback)
  let rawAiResponse = await callGeminiApi(
    BOOKING_ASSISTANT_SYSTEM_PROMPT,
    session.messages.map((m) => ({ role: m.role, content: m.content })),
    dateContext.normalizedText
  );

  let parsedOutput: AiOutput;

  if (rawAiResponse) {
    try {
      const json = JSON.parse(rawAiResponse);
      const validation = AiOutputSchema.safeParse(json);
      if (validation.success) {
        parsedOutput = validation.data;
      } else {
        console.warn('[AI VALIDATOR] Salida no coincide con esquema Zod:', validation.error.format());
        parsedOutput = localRuleBasedAssistant(rawMessage, dateContext.detectedDate, dateContext.detectedTime);
      }
    } catch {
      parsedOutput = localRuleBasedAssistant(rawMessage, dateContext.detectedDate, dateContext.detectedTime);
    }
  } else {
    parsedOutput = localRuleBasedAssistant(rawMessage, dateContext.detectedDate, dateContext.detectedTime);
  }

  // 4. Ejecutar acciones de dominio según el schema validado
  let finalReply = parsedOutput.message;
  let quoteData: any = null;
  let draftBooking: any = null;

  if (parsedOutput.action === 'QUOTE_REQUEST') {
    // Regla 1: Precios y disponibilidad obtenidos del cotizador oficial de la Parte 1
    const quote = await processQuote({
      roomSize: parsedOutput.roomSize,
      date: parsedOutput.date,
      startTime: parsedOutput.startTime,
      durationHours: parsedOutput.durationHours,
    });

    quoteData = quote;

    if (quote.isAvailable && 'baseAmount' in quote) {
      finalReply = `He cotizado tu solicitud en nuestro sistema:\n` +
        `• **Sala:** ${(quote as any).roomName || parsedOutput.roomSize}\n` +
        `• **Fecha y Hora:** ${parsedOutput.date} a las ${parsedOutput.startTime} (${parsedOutput.durationHours}h)\n` +
        `• **Tarifa Base:** $${(quote as any).baseAmount.toLocaleString('es-CO')} COP\n` +
        ((quote as any).discountAmount > 0 ? `• **Descuento por duración:** -$${(quote as any).discountAmount.toLocaleString('es-CO')} COP\n` : '') +
        ((quote as any).surchargeAmount > 0 ? `• **Recargo Sábado:** +$${(quote as any).surchargeAmount.toLocaleString('es-CO')} COP\n` : '') +
        `• **Total Estimado:** **$${(quote as any).totalAmount.toLocaleString('es-CO')} COP**\n\n` +
        `¡La sala se encuentra disponible! Para generar tu borrador de reserva, por favor confírmame tu nombre y correo electrónico.`;
    } else {
      const suggested = (quote as any).suggestedNextSlot;
      finalReply = `No es posible reservar en ese horario. Motivo: ${(quote as any).reason || 'Horario no disponible'}\n` +
        (suggested
          ? `💡 Sin embargo, hay disponibilidad hoy mismo a partir de las **${suggested}**. ¿Deseas que cotice a esa hora?`
          : 'Por favor indícame otro horario o fecha de tu preferencia.');
    }
  } else if (parsedOutput.action === 'CREATE_DRAFT') {
    // Regla 3: El asistente solo crea borradores (DRAFT), nunca confirma
    const room = await prisma.room.findUnique({ where: { size: parsedOutput.roomSize } });
    if (room) {
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
        where: { id: session.id },
        data: { draftBookingId: created.id },
      });

      draftBooking = created;

      finalReply = `¡Excelente! He creado tu reserva en **Borrador (DRAFT)** con el código **#${created.id}**.\n\n` +
        `📋 **Resumen:** ${room.name} para el ${parsedOutput.date} a las ${parsedOutput.startTime}.\n\n` +
        `⚠️ **Importante:** Por políticas del coworking, el asistente no confirma reservas directamente. Para asegurar tu espacio, haz clic en el botón **'Confirmar Reserva'** en la pantalla.`;
    }
  }

  // 5. Persistir mensajes de la conversación en PostgreSQL
  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'user',
      content: rawMessage,
    },
  });

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: 'assistant',
      content: finalReply,
    },
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
 * Recupera el historial completo de la conversación y el borrador activo al recargar la página
 */
export async function getSessionHistory(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) return null;

  let draftBooking = null;
  if (session.draftBookingId) {
    draftBooking = await prisma.booking.findUnique({
      where: { id: session.draftBookingId },
      include: { room: true },
    });
  }

  return {
    sessionId: session.id,
    draftBookingId: session.draftBookingId,
    draftBooking,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  };
}
