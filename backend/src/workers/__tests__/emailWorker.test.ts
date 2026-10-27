import { describe, it, expect } from 'vitest';
import { calculateBackoffMs, MAX_EMAIL_ATTEMPTS, BASE_BACKOFF_MS, sendEmailTransport } from '../emailWorker';

describe('Email Worker Logic', () => {
  it('has max attempts configured to 5 as required by specification', () => {
    expect(MAX_EMAIL_ATTEMPTS).toBe(5);
  });

  it('calculates exponential backoff correctly for consecutive attempts', () => {
    // Intento 1: base = 5000ms (5 segundos)
    expect(calculateBackoffMs(1, 5000)).toBe(5000);

    // Intento 2: 5000 * 2^1 = 10000ms (10 segundos)
    expect(calculateBackoffMs(2, 5000)).toBe(10000);

    // Intento 3: 5000 * 2^2 = 20000ms (20 segundos)
    expect(calculateBackoffMs(3, 5000)).toBe(20000);

    // Intento 4: 5000 * 2^3 = 40000ms (40 segundos)
    expect(calculateBackoffMs(4, 5000)).toBe(40000);

    // Intento 5: 5000 * 2^4 = 80000ms (80 segundos)
    expect(calculateBackoffMs(5, 5000)).toBe(80000);
  });

  it('handles negative or zero attempt defensively', () => {
    expect(calculateBackoffMs(0, BASE_BACKOFF_MS)).toBe(BASE_BACKOFF_MS);
    expect(calculateBackoffMs(-1, BASE_BACKOFF_MS)).toBe(BASE_BACKOFF_MS);
  });

  it('simulates transport failure on special test address', async () => {
    await expect(
      sendEmailTransport('fail@test.com', 'Test Subject', 'Test Body')
    ).rejects.toThrow('Simulated SMTP connection failure');
  });

  it('delivers email successfully for valid recipient', async () => {
    const success = await sendEmailTransport('cliente@lumni.com', 'Confirmación', 'Tu reserva está lista');
    expect(success).toBe(true);
  });
});

