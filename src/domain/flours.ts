export type FlourId = 'siktet' | 'sterkt' | 'shfin' | 'shgrov' | 'spelt' | 'rug';

export interface Flour {
  id: FlourId;
  name: string;
  hint: string;
  /** Hydration (%) this flour comfortably holds on its own. */
  absorption: number;
  /** Relative gluten strength; Norwegian sifted wheat = 1.0. */
  strength: number;
  wholeGrain: boolean;
}

export const FLOURS: readonly Flour[] = [
  { id: 'siktet', name: 'Siktet hvetemel', hint: 'Regal / Møllerens', absorption: 70, strength: 1.0, wholeGrain: false },
  { id: 'sterkt', name: 'Sterkt hvetemel', hint: 'manitoba / tipo 0', absorption: 76, strength: 1.35, wholeGrain: false },
  { id: 'shfin', name: 'Sammalt hvete, fin', hint: '', absorption: 80, strength: 0.75, wholeGrain: true },
  { id: 'shgrov', name: 'Sammalt hvete, grov', hint: '', absorption: 85, strength: 0.6, wholeGrain: true },
  { id: 'spelt', name: 'Sammalt spelt', hint: '', absorption: 78, strength: 0.6, wholeGrain: true },
  { id: 'rug', name: 'Sammalt rug', hint: 'fin', absorption: 85, strength: 0.2, wholeGrain: true },
];

/** Blend shares per flour. Treated as ratios, so they need not sum to 100. */
export type Blend = Record<FlourId, number>;

export type PresetId = 'lys' | 'halvgrov' | 'grov' | 'rug' | 'sterk';

export const PRESETS: Readonly<Record<PresetId, Blend>> = {
  lys: { siktet: 100, sterkt: 0, shfin: 0, shgrov: 0, spelt: 0, rug: 0 },
  halvgrov: { siktet: 85, sterkt: 0, shfin: 15, shgrov: 0, spelt: 0, rug: 0 },
  grov: { siktet: 55, sterkt: 0, shfin: 25, shgrov: 20, spelt: 0, rug: 0 },
  rug: { siktet: 75, sterkt: 0, shfin: 15, shgrov: 0, spelt: 0, rug: 10 },
  sterk: { siktet: 50, sterkt: 35, shfin: 15, shgrov: 0, spelt: 0, rug: 0 },
};

export function isPresetId(value: string): value is PresetId {
  return Object.hasOwn(PRESETS, value);
}

export interface BlendStats {
  /** Sum of the shares as entered (ideally 100). */
  sum: number;
  /** Recommended hydration for the blend, whole percent. */
  absorption: number;
  /** Weighted gluten strength. */
  strength: number;
  /** Share of whole-grain flour, 0–100. */
  wholeGrainPct: number;
}

export function blendStats(blend: Blend): BlendStats {
  let sum = 0;
  let absorption = 0;
  let strength = 0;
  let wholeGrain = 0;
  for (const f of FLOURS) {
    const share = Math.max(0, blend[f.id] ?? 0);
    sum += share;
    // Weight first, divide once: fewer floating-point operations on the way to Math.round.
    absorption += share * f.absorption;
    strength += share * f.strength;
    if (f.wholeGrain) wholeGrain += share;
  }
  if (sum <= 0) return { sum: 0, absorption: 70, strength: 1, wholeGrainPct: 0 };
  return {
    sum,
    absorption: Math.round(absorption / sum),
    strength: strength / sum,
    wholeGrainPct: (wholeGrain / sum) * 100,
  };
}
