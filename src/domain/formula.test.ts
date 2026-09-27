import { describe, expect, it } from 'vitest';
import { PRESETS, type Blend } from './flours';
import { HYDRATION_MAX, HYDRATION_MIN, computeFormula, recommendedHydration, type FormulaInput } from './formula';
import { blendStats } from './flours';

const base: FormulaInput = {
  loaves: 1,
  flourPerLoaf: 500,
  hydrationPct: 72,
  levainPct: 20,
  saltPct: 2,
  blend: PRESETS.lys,
};

describe('computeFormula — one loaf, 500 g, 72 %', () => {
  const f = computeFormula(base);

  it('gives the amounts to weigh out', () => {
    expect(f.addedFlour).toBe(450);
    expect(f.addedWater).toBe(310);
    expect(f.salt).toBe(10);
    expect(f.levain).toBe(100);
    expect(f.dough).toBe(870);
  });

  it('splits the levain into half flour, half water', () => {
    expect(f.levainFlour).toBe(50);
    expect(f.levainWater).toBe(50);
  });

  it('measures hydration against ALL flour, not the weighed flour (regression: 450 × 0,72 = 324 is wrong)', () => {
    expect(f.addedWater).not.toBe(450 * 0.72);
    expect(f.totalFlour).toBe(450 + 50);
    expect(f.totalWater).toBe(310 + 50);
    expect(f.totalWater / f.totalFlour).toBeCloseTo(0.72);
  });

  it('holds back 7 % of the flour weight as water for the salt', () => {
    expect(f.holdBack).toBe(35);
  });
});

describe('computeFormula — default: two loaves, halvgrov', () => {
  const f = computeFormula({ ...base, loaves: 2, blend: PRESETS.halvgrov });

  it('splits the weighed flour by the blend', () => {
    expect(f.flours.map((l) => [l.flour.id, Math.round(l.grams), Math.round(l.sharePct)])).toEqual([
      ['siktet', 765, 85],
      ['shfin', 135, 15],
    ]);
  });

  it('scales every amount', () => {
    expect(f.addedWater).toBe(620);
    expect(f.dough).toBe(1740);
    expect(f.doughPerLoaf).toBe(870);
  });
});

describe('computeFormula — invariants across inputs', () => {
  const blends: Blend[] = Object.values(PRESETS);
  const cases: FormulaInput[] = [];
  for (const loaves of [1, 2, 3, 4])
    for (const flourPerLoaf of [300, 500, 800])
      for (const hydrationPct of [60, 72, 88])
        for (const levainPct of [10, 20, 30])
          for (const saltPct of [1.6, 2, 2.6])
            for (const blend of blends) cases.push({ loaves, flourPerLoaf, hydrationPct, levainPct, saltPct, blend });

  it(`holds for ${cases.length} combinations`, () => {
    for (const input of cases) {
      const f = computeFormula(input);
      const H = input.hydrationPct / 100;
      expect(f.addedFlour + f.levainFlour).toBeCloseTo(f.totalFlour, 9);
      expect((f.addedWater + f.levainWater) / f.totalFlour).toBeCloseTo(H, 9);
      expect(f.flours.reduce((s, l) => s + l.grams, 0)).toBeCloseTo(f.addedFlour, 9);
      expect(f.flours.reduce((s, l) => s + l.sharePct, 0)).toBeCloseTo(100, 9);
      expect(f.addedFlour + f.addedWater + f.salt + f.levain).toBeCloseTo(f.dough, 9);
      expect(f.doughPerLoaf * input.loaves).toBeCloseTo(f.dough, 9);
      expect(f.addedWater).toBeGreaterThan(0);
    }
  });
});

describe('recommendedHydration', () => {
  it('follows the blend', () => {
    expect(recommendedHydration(blendStats(PRESETS.lys))).toBe(70);
    expect(recommendedHydration(blendStats(PRESETS.halvgrov))).toBe(72);
  });

  it('clamps to the slider range', () => {
    expect(recommendedHydration({ sum: 100, absorption: 95, strength: 1, wholeGrainPct: 0 })).toBe(HYDRATION_MAX);
    expect(recommendedHydration({ sum: 100, absorption: 50, strength: 1, wholeGrainPct: 0 })).toBe(HYDRATION_MIN);
  });
});
