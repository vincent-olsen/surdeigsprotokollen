import { describe, expect, it } from 'vitest';
import { defaultState } from '../state';
import { planRecipe } from './recipe';

describe('planRecipe', () => {
  it('threads blend → bulk time → schedule → levain build', () => {
    const r = planRecipe(defaultState());
    expect(r.formula.stats.wholeGrainPct).toBe(15);
    expect(r.bulkMinutes).toBe(282);
    expect(r.build.ratio).toBe(r.schedule.ratio);
    expect(r.build.used).toBe(Math.round(r.formula.levain));
  });

  it('more whole grain → shorter bulk → an earlier fridge', () => {
    const light = planRecipe({ ...defaultState(), blend: { siktet: 100, sterkt: 0, shfin: 0, shgrov: 0, spelt: 0, rug: 0 } });
    const coarse = planRecipe({ ...defaultState(), blend: { siktet: 50, sterkt: 0, shfin: 25, shgrov: 25, spelt: 0, rug: 0 } });
    expect(coarse.bulkMinutes).toBeLessThan(light.bulkMinutes);
  });
});
