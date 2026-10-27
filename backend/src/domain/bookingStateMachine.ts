export type BookingStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const VALID_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
} as const;

export function canTransition(current: BookingStatus, target: BookingStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}
