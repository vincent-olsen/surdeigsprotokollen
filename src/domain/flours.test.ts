import { describe, expect, it } from 'vitest';
import { PRESETS, blendStats, isPresetId, type Blend } from './flours';

const blend = (partial: Partial<Blend>): Blend => ({
  siktet: 0, sterkt: 0, shfin: 0, shgrov: 0, spelt: 0, rug: 0, ...partial,
});

describe('blendStats', () => {
  it('100 % sifted wheat is the baseline', () => {
    expect(blendStats(PRESETS.lys)).toEqual({ sum: 100, absorption: 70, strength: 1, wholeGrainPct: 0 });
  });

  it('rounds 85/15 (71,5 %) up to 72 %', () => {
    expect(blendStats(PRESETS.halvgrov).absorption).toBe(72);
  });

  it('computes the whole-grain share', () => {
    expect(blendStats(PRESETS.rug).wholeGrainPct).toBe(25);
    expect(blendStats(PRESETS.grov).wholeGrainPct).toBe(45);
  });

  it('treats shares as ratios when they do not sum to 100', () => {
    const halves = blendStats(blend({ siktet: 50, shfin: 50 }));
    const doubled = blendStats(blend({ siktet: 100, shfin: 100 }));
    expect(doubled.absorption).toBe(halves.absorption);
    expect(doubled.strength).toBeCloseTo(halves.strength);
    expect(doubled.sum).toBe(200);
  });

  it('weights strength by share', () => {
    expect(blendStats(blend({ siktet: 50, rug: 50 })).strength).toBeCloseTo(0.6);
  });

  it('falls back to neutral values for an empty blend', () => {
    expect(blendStats(blend({}))).toEqual({ sum: 0, absorption: 70, strength: 1, wholeGrainPct: 0 });
  });

  it('ignores negative shares', () => {
    expect(blendStats(blend({ siktet: 100, rug: -50 }))).toEqual(blendStats(PRESETS.lys));
  });
});

describe('isPresetId', () => {
  it('accepts known presets only', () => {
    expect(isPresetId('grov')).toBe(true);
    expect(isPresetId('toString')).toBe(false);
    expect(isPresetId('ukjent')).toBe(false);
  });
});
