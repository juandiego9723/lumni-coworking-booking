import { describe, it, expect } from 'vitest';
import { formatCOP } from '../formatters';

describe('Formatters Utilities', () => {
  it('formats amount to COP currency string', () => {
    const formatted = formatCOP(180000);
    expect(formatted).toContain('180');
    expect(formatted).toContain('000');
    expect(formatted).toContain('COP');
  });
});

