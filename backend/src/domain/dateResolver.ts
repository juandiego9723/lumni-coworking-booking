/**
 * Utilidad de Dominio Puro para resolución determinística de fechas y horas relativas
 * en español orientadas al negocio de Lumni Coworking (Zona Horaria: America/Bogota, UTC-5).
 * Refactorizado bajo principios SOLID (SRP) y DRY.
 */

import { getNowBogota, formatDateISO, normalizeSpanishText } from './time/dateUtils';
import {
  extractColloquialTime,
  extractExplicitTime,
  extractRelativeDay,
  extractWeekdayDate,
  buildEnrichedText,
  isDateSaturday,
} from './text/relativeDateParser';

export { getNowBogota, formatDateISO };

export interface ResolvedDateContext {
  normalizedText: string;
  detectedDate?: string; // YYYY-MM-DD
  detectedTime?: string; // HH:mm
  dayOfWeekName?: string;
  isSaturday?: boolean;
}

/**
 * Resuelve expresiones coloquiales en lenguaje natural para fechas y horas en hora de Colombia.
 */
export function resolveRelativeDates(text: string, referenceDate?: Date): ResolvedDateContext {
  const lower = normalizeSpanishText(text);
  const baseBogota = getNowBogota(referenceDate);

  // 1. Detección de hora (explícita tiene prioridad sobre coloquial)
  const detectedTime = extractExplicitTime(text) ?? extractColloquialTime(lower);

  // 2. Detección de día relativo ("hoy", "mañana", "pasado mañana") o día de la semana ("el sábado")
  let detectedDate = extractRelativeDay(lower, baseBogota);
  let dayOfWeekName: string | undefined;

  if (!detectedDate) {
    const weekdayResult = extractWeekdayDate(lower, baseBogota);
    detectedDate = weekdayResult.detectedDate;
    dayOfWeekName = weekdayResult.dayOfWeekName;
  }

  // 3. Enriquecimiento del texto para el LLM y cálculo de día sábado
  const normalizedText = buildEnrichedText(text, detectedDate, detectedTime);
  const isSaturday = isDateSaturday(detectedDate);

  return {
    normalizedText,
    detectedDate,
    detectedTime,
    dayOfWeekName,
    isSaturday,
  };
}
