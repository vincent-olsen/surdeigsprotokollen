import { describe, expect, it } from 'vitest';
import { bakeLossRows } from './bakeLoss';

describe('bakeLossRows', () => {
  it('inserts the current loaf in order and marks it', () => {
    const rows = bakeLossRows(870);
    expect(rows.map((r) => r.doughWeight)).toEqual([700, 800, 870, 900, 1000, 1100]);
    expect(rows.filter((r) => r.isCurrent).map((r) => r.doughWeight)).toEqual([870]);
  });

  it('computes the 12–16 % target band and the underbaked line', () => {
    const row = bakeLossRows(870).find((r) => r.doughWeight === 1000)!;
    expect([row.targetMin, row.targetMax, row.underbakedAbove]).toEqual([840, 880, 890]);
  });

  it('does not duplicate a reference weight', () => {
    const rows = bakeLossRows(900);
    expect(rows).toHaveLength(5);
    expect(rows.find((r) => r.doughWeight === 900)?.isCurrent).toBe(true);
  });
});
