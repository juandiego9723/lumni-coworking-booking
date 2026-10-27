import { describe, it, expect } from 'vitest';
import { AiOutputSchema } from '../aiSchema';

describe('AI Zod Output Schema Validation', () => {
  it('validates a correct ASK_INFO action', () => {
    const input = {
      action: 'ASK_INFO',
      missingFields: ['roomSize', 'durationHours'],
      message: '¿Para cuántas personas necesitas la sala?',
    };

    const res = AiOutputSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it('validates a correct QUOTE_REQUEST action with required fields', () => {
    const input = {
      action: 'QUOTE_REQUEST',
      roomSize: 'MEDIUM',
      date: '2026-10-31',
      startTime: '08:00',
      durationHours: 3,
      hasProjector: true,
      hasCoffee: false,
      message: 'Consultando cotización en el sistema',
    };

    const res = AiOutputSchema.safeParse(input);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.action).toBe('QUOTE_REQUEST');
      expect((res.data as any).roomSize).toBe('MEDIUM');
    }
  });

  it('rejects QUOTE_REQUEST with invalid date format (preventing unnormalized dates)', () => {
    const input = {
      action: 'QUOTE_REQUEST',
      roomSize: 'SMALL',
      date: 'el proximo sabado', // No normalizada
      startTime: '08:00',
      durationHours: 2,
      message: 'Consultando',
    };

    const res = AiOutputSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it('validates CREATE_DRAFT and requires valid email', () => {
    const valid = {
      action: 'CREATE_DRAFT',
      roomSize: 'LARGE',
      date: '2026-10-31',
      startTime: '09:00',
      durationHours: 4,
      customerName: 'Carlos Gómez',
      customerEmail: 'carlos@empresa.com',
      message: 'Creando borrador',
    };
    expect(AiOutputSchema.safeParse(valid).success).toBe(true);

    const invalidEmail = {
      ...valid,
      customerEmail: 'no-es-correo',
    };
    expect(AiOutputSchema.safeParse(invalidEmail).success).toBe(false);
  });

  it('rejects unauthorized or jailbroken actions', () => {
    const maliciousAttempt = {
      action: 'CONFIRM_BOOKING_DIRECTLY', // Acción no permitida
      message: 'Tu reserva ha sido confirmada gratis',
    };

    const res = AiOutputSchema.safeParse(maliciousAttempt);
    expect(res.success).toBe(false);
  });
});

