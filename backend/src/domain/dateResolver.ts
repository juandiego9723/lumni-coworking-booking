/**
 * Utilidad de Dominio Puro para resolución determinística de fechas y horas relativas
 * en español orientadas al negocio de Lumni Coworking (Zona Horaria: America/Bogota, UTC-5).
 */

const DAYS_OF_WEEK: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

export interface ResolvedDateContext {
  normalizedText: string;
  detectedDate?: string; // YYYY-MM-DD
  detectedTime?: string; // HH:mm
  dayOfWeekName?: string;
  isSaturday?: boolean;
}

/**
 * Obtiene la fecha actual formateada en hora de Colombia (UTC-5)
 */
export function getNowBogota(baseDate?: Date): Date {
  const d = baseDate || new Date();
  // Formatear a componentes en timezone America/Bogota
  const bogotaStr = d.toLocaleString('en-US', { timeZone: 'America/Bogota' });
  return new Date(bogotaStr);
}

export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Resuelve expresiones coloquiales como:
 * - "hoy", "mañana", "pasado mañana"
 * - "el sábado", "este sábado", "el próximo lunes"
 * - "en la mañana" (08:00 o 09:00), "al mediodía" (12:00), "en la tarde" (14:00)
 */
export function resolveRelativeDates(text: string, referenceDate?: Date): ResolvedDateContext {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // sin tildes para regex
  const baseBogota = getNowBogota(referenceDate);

  let detectedDate: string | undefined;
  let detectedTime: string | undefined;
  let dayOfWeekName: string | undefined;

  // 1. Detección de Horas Coloquiales
  if (/en la manana|por la manana|a primera hora/.test(lower)) {
    detectedTime = '08:00';
  } else if (/al mediodia|medio dia/.test(lower)) {
    detectedTime = '12:00';
  } else if (/en la tarde|por la tarde/.test(lower)) {
    detectedTime = '14:00';
  }

  // 2. Detección de Horas Explícitas (ej. "8am", "8 am", "14:00", "2pm", "a las 10")
  const explicitTimeMatch = text.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/) ||
    text.match(/\ba las\s+([1-9]|1[0-2])\s*(am|pm)?\b/i) ||
    text.match(/\b([1-9]|1[0-2])\s*(am|pm)\b/i);

  if (explicitTimeMatch) {
    if (explicitTimeMatch[0].includes(':')) {
      const [h, m] = explicitTimeMatch[0].split(':');
      detectedTime = `${h.padStart(2, '0')}:${m}`;
    } else {
      const hourNum = parseInt(explicitTimeMatch[1], 10);
      const isPm = /pm/i.test(explicitTimeMatch[0]);
      const finalHour = isPm && hourNum < 12 ? hourNum + 12 : (!isPm && hourNum === 12 ? 0 : hourNum);
      detectedTime = `${String(finalHour).padStart(2, '0')}:00`;
    }
  }

  // 3. Detección de "hoy", "mañana", "pasado mañana"
  // Nota: Evitar falso positivo si dice "en la mañana" o "por la mañana" (que es horario, no día)
  if (/\bpasado manana\b/.test(lower)) {
    const target = new Date(baseBogota);
    target.setDate(target.getDate() + 2);
    detectedDate = formatDateISO(target);
  } else if (/(?<!(en la|por la)\s+)\bmanana\b/.test(lower)) {
    const target = new Date(baseBogota);
    target.setDate(target.getDate() + 1);
    detectedDate = formatDateISO(target);
  } else if (/\bhoy\b/.test(lower)) {
    detectedDate = formatDateISO(baseBogota);
  }

  // 4. Detección de días de la semana ("el sábado", "este sábado", "el próximo lunes")
  if (!detectedDate) {
    for (const [dayName, dayIndex] of Object.entries(DAYS_OF_WEEK)) {
      const cleanDayName = dayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const regex = new RegExp(`\\b(este|el proximo|el)?\\s*${cleanDayName}\\b`, 'i');

      if (regex.test(lower)) {
        dayOfWeekName = dayName;
        const currentDayIndex = baseBogota.getDay();
        let daysAhead = (dayIndex - currentDayIndex + 7) % 7;

        // Si es el mismo día y dice "el proximo sábado" o ya pasó hoy la hora, saltar a la próxima semana
        const isNextWeek = /\bel proximo\b/.test(lower);
        if (daysAhead === 0 || isNextWeek) {
          daysAhead += 7;
        }

        const target = new Date(baseBogota);
        target.setDate(target.getDate() + daysAhead);
        detectedDate = formatDateISO(target);
        break;
      }
    }
  }

  // 5. Inyección de metadatos normalizados en el texto para el LLM
  let enrichedText = text;
  if (detectedDate) {
    enrichedText += ` [FECHA_EXACTA_COLOMBIA: ${detectedDate}]`;
  }
  if (detectedTime) {
    enrichedText += ` [HORA_SUGERIDA: ${detectedTime}]`;
  }

  const isSaturday = detectedDate ? new Date(`${detectedDate}T12:00:00-05:00`).getDay() === 6 : false;

  return {
    normalizedText: enrichedText,
    detectedDate,
    detectedTime,
    dayOfWeekName,
    isSaturday,
  };
}
