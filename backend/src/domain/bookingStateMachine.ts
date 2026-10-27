export type BookingStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(current: BookingStatus, target: BookingStatus): boolean {
  return VALID_TRANSITIONS[current]?.includes(target) ?? false;
}
