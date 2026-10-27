import { BOGOTA_TIMEZONE, BOGOTA_OFFSET } from './timeConstants';

/**
 * Obtiene la fecha actual en la zona horaria de Colombia (America/Bogota, UTC-5).
 */
export function getNowBogota(baseDate?: Date): Date {
  const d = baseDate || new Date();
  const bogotaStr = d.toLocaleString('en-US', { timeZone: BOGOTA_TIMEZONE });
  return new Date(bogotaStr);
}

/**
 * Formatea un objeto Date a string ISO 'YYYY-MM-DD'.
 */
export function formatDateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Construye un objeto Date en el huso horario de Colombia a partir de fecha y hora.
 */
export function createBogotaDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00${BOGOTA_OFFSET}`);
}

/**
 * Calcula la fecha y hora de fin a partir de la fecha de inicio y duración en horas.
 */
export function calculateEndDateTime(startsAt: Date, durationHours: number): Date {
  return new Date(startsAt.getTime() + durationHours * 3600 * 1000);
}

/**
 * Convierte un string de hora 'HH:mm' a minutos totales desde medianoche.
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a string de hora 'HH:mm'.
 */
export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Normaliza texto eliminando acentos y diacríticos para análisis regex en español.
 */
export function normalizeSpanishText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

