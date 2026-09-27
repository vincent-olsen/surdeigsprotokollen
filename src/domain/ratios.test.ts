import { describe, expect, it } from 'vitest';
import { RATIOS, closestRatio, findRatio } from './ratios';

describe('RATIOS', () => {
  it('is sorted by time to peak, and parts match the label', () => {
    for (let i = 1; i < RATIOS.length; i++) {
      expect(RATIOS[i]!.minutesToPeak).toBeGreaterThan(RATIOS[i - 1]!.minutesToPeak);
    }
    for (const r of RATIOS) {
      const [s, f, w] = r.label.split(':').map(Number);
      expect(s! + f! + w!).toBe(r.parts);
      expect(f).toBe(w);
    }
  });
});

describe('closestRatio', () => {
  it.each([
    [0, '1:1:1'],
    [778, '1:6:6'],
    [838, '1:8:8'],
    [10_000, '1:10:10'],
  ])('%i min → %s', (target, label) => {
    expect(closestRatio(target).label).toBe(label);
  });

  it('breaks ties towards the shorter build', () => {
    expect(closestRatio(690).label).toBe('1:5:5');
  });
});

describe('findRatio', () => {
  it('finds by label', () => {
    expect(findRatio('1:4:4')?.parts).toBe(9);
    expect(findRatio('1:7:7')).toBeUndefined();
  });
});
