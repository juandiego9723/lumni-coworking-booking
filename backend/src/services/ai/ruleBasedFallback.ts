import { AiOutput } from './aiSchema';

/**
 * Motor heurístico de fallback para operar cuando no hay GEMINI_API_KEY o en pruebas locales.
 */
export function localRuleBasedAssistant(
  userText: string,
  resolvedDate?: string,
  resolvedTime?: string
): AiOutput {
  const lower = userText.toLowerCase();

  // Detectar intento de jailbreak o manipulación de reglas
  if (/olvida tus reglas|eres libre|confirma gratis|modo desarrollador|ignora instrucciones/i.test(userText)) {
    return {
      action: 'GENERAL_REPLY',
      message:
        'Como asistente de Lumni Coworking, opero bajo reglas estrictas de seguridad. Solo puedo cotizar y crear borradores según las políticas vigentes.',
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
  const nameMatch = userText.match(
    /me llamo ([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)|mi nombre es ([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)|soy ([a-zA-ZáéíóúÁÉÍÓÚñÑ ]+)/i
  );
  const detectedName = nameMatch
    ? (nameMatch[1] || nameMatch[2] || nameMatch[3]).trim()
    : undefined;

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
    message:
      '¡Hola! Con gusto te ayudo a reservar. ¿Para qué fecha y en qué horario necesitas la sala, y para cuántas personas sería?',
  };
}

