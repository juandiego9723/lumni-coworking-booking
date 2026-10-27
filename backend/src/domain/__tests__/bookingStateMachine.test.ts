import { describe, it, expect } from 'vitest';
import { canTransition } from '../bookingStateMachine';

describe('Booking State Machine', () => {
  it('allows valid transitions from DRAFT', () => {
    expect(canTransition('DRAFT', 'CONFIRMED')).toBe(true);
    expect(canTransition('DRAFT', 'CANCELLED')).toBe(true);
    expect(canTransition('DRAFT', 'COMPLETED')).toBe(false);
  });

  it('allows valid transitions from CONFIRMED', () => {
    expect(canTransition('CONFIRMED', 'COMPLETED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'DRAFT')).toBe(false);
  });

  it('prevents any transition from terminal states', () => {
    expect(canTransition('COMPLETED', 'CANCELLED')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
  });
});
