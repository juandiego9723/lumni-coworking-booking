export const BOGOTA_TIMEZONE = 'America/Bogota';
export const BOGOTA_OFFSET = '-05:00';

export const BUSINESS_HOURS = {
  OPEN_HOUR: 7,   // 07:00
  CLOSE_HOUR: 21, // 21:00
  MIN_DURATION_HOURS: 1,
  MAX_DURATION_HOURS: 10,
  SLOT_INTERVAL_MINUTES: 30,
  SUNDAY_DAY_OF_WEEK: 0,
  SATURDAY_DAY_OF_WEEK: 6,
} as const;

export const ROOM_RATES = {
  SMALL: 40000,
  MEDIUM: 70000,
  LARGE: 120000,
} as const;

export const SERVICE_PRICES = {
  projector: 20000,
  coffee: 10000,
} as const;

export const DAYS_OF_WEEK_SPANISH: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
} as const;

