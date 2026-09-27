import { describe, expect, it } from 'vitest';
import { PRESETS } from './flours';
import { computeFormula } from './formula';
import { BUILD_MARGIN_G, MIN_STARTER_G, planLevainBuild } from './levain';
import { RATIOS, findRatio } from './ratios';

const ratio = (label: string) => findRatio(label)!;

describe('planLevainBuild', () => {
  it('builds 1:6:6 for 100 g levain', () => {
    const b = planLevainBuild(100, ratio('1:6:6'));
    expect([b.starter, b.flour, b.water, b.total]).toEqual([10, 60, 60, 130]);
    expect([b.used, b.usedFlour, b.usedWater, b.surplus]).toEqual([100, 50, 50, 30]);
  });

  it('scales up so the starter stays weighable (regression: 1:8:8 asked for 7 g)', () => {
    const b = planLevainBuild(100, ratio('1:8:8'));
    expect(b.starter).toBe(MIN_STARTER_G);
    expect(b.scaledUp).toBe(true);
  });

  it('does not scale up when the margin already covers it', () => {
    const b = planLevainBuild(200, ratio('1:5:5'));
    expect(b.scaledUp).toBe(false);
    expect([b.starter, b.flour, b.water]).toEqual([20, 102, 102]);
  });

  it('holds its invariants for every ratio and size', () => {
    for (const r of RATIOS) {
      for (let need = 40; need <= 400; need += 7) {
        const b = planLevainBuild(need, r);
        expect(b.total).toBe(b.starter + b.flour + b.water);
        expect(b.flour).toBe(b.water);
        expect(b.starter).toBeGreaterThanOrEqual(MIN_STARTER_G);
        expect(b.surplus).toBeGreaterThanOrEqual(BUILD_MARGIN_G - 2);
        expect(b.usedFlour + b.usedWater).toBe(b.used);
      }
    }
  });
});

describe('levain build ↔ dough', () => {
  it('the flour that reaches the bread is the flour in the USED portion, not the build (regression: 450 + 60 ≠ 500)', () => {
    const f = computeFormula({ loaves: 1, flourPerLoaf: 500, hydrationPct: 72, levainPct: 20, saltPct: 2, blend: PRESETS.lys });
    const b = planLevainBuild(f.levain, ratio('1:6:6'));
    expect(f.addedFlour + b.flour).toBe(510);
    expect(f.addedFlour + b.usedFlour).toBe(f.totalFlour);
    expect(f.addedWater + b.usedWater).toBe(f.totalWater);
  });
});
