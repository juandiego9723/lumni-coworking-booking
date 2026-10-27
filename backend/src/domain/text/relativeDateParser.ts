import { DAYS_OF_WEEK_SPANISH } from '../time/timeConstants';
import { formatDateISO } from '../time/dateUtils';

/**
 * Detecta expresiones coloquiales de hora ("en la mañana", "al mediodía", "en la tarde").
 */
export function extractColloquialTime(lowerText: string): string | undefined {
  if (/en la manana|por la manana|a primera hora/.test(lowerText)) {
    return '08:00';
  }
  if (/al mediodia|medio dia/.test(lowerText)) {
    return '12:00';
  }
  if (/en la tarde|por la tarde/.test(lowerText)) {
    return '14:00';
  }
  return undefined;
}

/**
 * Detecta horas explícitas (ej. "8am", "8 am", "14:00", "2pm", "a las 10").
 */
export function extractExplicitTime(text: string): string | undefined {
  const explicitTimeMatch =
    text.match(/\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/) ||
    text.match(/\ba las\s+([1-9]|1[0-2])\s*(am|pm)?\b/i) ||
    text.match(/\b([1-9]|1[0-2])\s*(am|pm)\b/i);

  if (!explicitTimeMatch) {
    return undefined;
  }

  if (explicitTimeMatch[0].includes(':')) {
    const [h, m] = explicitTimeMatch[0].split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  const hourNum = parseInt(explicitTimeMatch[1], 10);
  const isPm = /pm/i.test(explicitTimeMatch[0]);
  const finalHour = isPm && hourNum < 12 ? hourNum + 12 : (!isPm && hourNum === 12 ? 0 : hourNum);
  return `${String(finalHour).padStart(2, '0')}:00`;
}

/**
 * Detecta días relativos ("hoy", "mañana", "pasado mañana").
 */
export function extractRelativeDay(lowerText: string, baseBogota: Date): string | undefined {
  if (/\bpasado manana\b/.test(lowerText)) {
    const target = new Date(baseBogota);
    target.setDate(target.getDate() + 2);
    return formatDateISO(target);
  }

  if (/(?<!(en la|por la)\s+)\bmanana\b/.test(lowerText)) {
    const target = new Date(baseBogota);
    target.setDate(target.getDate() + 1);
    return formatDateISO(target);
  }

  if (/\bhoy\b/.test(lowerText)) {
    return formatDateISO(baseBogota);
  }

  return undefined;
}

/**
 * Detecta días nombrados de la semana ("el sábado", "este sábado", "el próximo lunes").
 */
export function extractWeekdayDate(
  lowerText: string,
  baseBogota: Date
): { detectedDate?: string; dayOfWeekName?: string } {
  for (const [dayName, dayIndex] of Object.entries(DAYS_OF_WEEK_SPANISH)) {
    const cleanDayName = dayName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = new RegExp(`\\b(este|el proximo|el)?\\s*${cleanDayName}\\b`, 'i');

    if (regex.test(lowerText)) {
      const currentDayIndex = baseBogota.getDay();
      let daysAhead = (dayIndex - currentDayIndex + 7) % 7;

      const isNextWeek = /\bel proximo\b/.test(lowerText);
      if (daysAhead === 0 || isNextWeek) {
        daysAhead += 7;
      }

      const target = new Date(baseBogota);
      target.setDate(target.getDate() + daysAhead);
      return {
        detectedDate: formatDateISO(target),
        dayOfWeekName: dayName,
      };
    }
  }

  return {};
}

/**
 * Construye el texto enriquecido con metadatos para el asistente de IA.
 */
export function buildEnrichedText(
  originalText: string,
  detectedDate?: string,
  detectedTime?: string
): string {
  let enrichedText = originalText;
  if (detectedDate) {
    enrichedText += ` [FECHA_EXACTA_COLOMBIA: ${detectedDate}]`;
  }
  if (detectedTime) {
    enrichedText += ` [HORA_SUGERIDA: ${detectedTime}]`;
  }
  return enrichedText;
}

/**
 * Verifica si una fecha en formato YYYY-MM-DD corresponde a un sábado en Colombia.
 */
export function isDateSaturday(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(`${dateStr}T12:00:00-05:00`).getDay() === 6;
}

