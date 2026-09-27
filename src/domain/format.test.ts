import { describe, expect, it } from 'vitest';
import { decimal, grams, percent } from './format';

describe('format', () => {
  it('rounds grams', () => {
    expect(grams(764.6)).toBe('765 g');
    expect(grams(0)).toBe('0 g');
  });

  it('uses a decimal comma', () => {
    expect(decimal(0.9575)).toBe('0,96');
    expect(percent(2, 1)).toBe('2,0 %');
    expect(percent(72)).toBe('72 %');
  });
});
