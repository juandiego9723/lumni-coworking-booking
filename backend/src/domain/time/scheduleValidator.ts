import { BUSINESS_HOURS } from './timeConstants';
import { createBogotaDateTime, timeToMinutes } from './dateUtils';

export interface ScheduleValidationResult {
  isValid: boolean;
  reason?: string;
  startMinutes: number;
  endMinutes: number;
  isSaturday: boolean;
}

/**
 * Valida las reglas de horario de Lumni Coworking:
 * - Cerrado los domingos
 * - Duración entre 1 y 10 horas en bloques de 30 minutos
 * - Inicio en bloques de 30 minutos
 * - Horario de atención: 07:00 a 21:00 (lunes a sábado)
 */
export function validateBookingSchedule(
  dateStr: string,
  startTimeStr: string,
  durationHours: number
): ScheduleValidationResult {
  const dateObj = createBogotaDateTime(dateStr, '00:00');
  const dayOfWeek = dateObj.getDay();
  const isSaturday = dayOfWeek === BUSINESS_HOURS.SATURDAY_DAY_OF_WEEK;

  if (dayOfWeek === BUSINESS_HOURS.SUNDAY_DAY_OF_WEEK) {
    return {
      isValid: false,
      reason: 'El coworking está cerrado los domingos.',
      startMinutes: 0,
      endMinutes: 0,
      isSaturday: false,
    };
  }

  if (
    durationHours < BUSINESS_HOURS.MIN_DURATION_HOURS ||
    durationHours > BUSINESS_HOURS.MAX_DURATION_HOURS ||
    (durationHours * 2) % 1 !== 0
  ) {
    return {
      isValid: false,
      reason: 'La duración debe estar entre 1 y 10 horas en bloques de 30 minutos (0.5h).',
      startMinutes: 0,
      endMinutes: 0,
      isSaturday,
    };
  }

  const [hours, minutes] = startTimeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes) || minutes % BUSINESS_HOURS.SLOT_INTERVAL_MINUTES !== 0) {
    return {
      isValid: false,
      reason: 'La hora de inicio debe estar en bloques de 30 minutos (ej. 08:00, 08:30).',
      startMinutes: 0,
      endMinutes: 0,
      isSaturday,
    };
  }

  const startMinutes = timeToMinutes(startTimeStr);
  const totalDurationMinutes = durationHours * 60;
  const endMinutes = startMinutes + totalDurationMinutes;

  const openingMinutes = BUSINESS_HOURS.OPEN_HOUR * 60;
  const closingMinutes = BUSINESS_HOURS.CLOSE_HOUR * 60;

  if (startMinutes < openingMinutes || endMinutes > closingMinutes) {
    return {
      isValid: false,
      reason: 'El horario de atención es de lunes a sábado de 07:00 a 21:00.',
      startMinutes,
      endMinutes,
      isSaturday,
    };
  }

  return {
    isValid: true,
    startMinutes,
    endMinutes,
    isSaturday,
  };
}

