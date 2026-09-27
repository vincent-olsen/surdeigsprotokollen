import { FLOURS, blendStats, type Blend, type BlendStats, type Flour } from './flours';

/**
 * Baker's percentages. Everything is relative to the TOTAL flour in the bread,
 * including the flour that arrives inside the levain. That is the whole point
 * of this module, and the source of both bugs a reader might suspect:
 *
 *   weighed water ≠ weighed flour × hydration
 *
 * because part of the flour and part of the water are already in the levain.
 */

export const HYDRATION_MIN = 60;
export const HYDRATION_MAX = 88;

/** Levain hydration (water ÷ flour). 1 = 100 %, equal parts. */
export const LEVAIN_HYDRATION = 1;

/** Fraction of total flour held back as water for the salt step. */
export const HOLD_BACK_FRACTION = 0.07;

/** Typical weight loss in the oven, used for the "finished loaf" estimate. */
export const EXPECTED_BAKE_LOSS = 0.14;

export interface FormulaInput {
  loaves: number;
  flourPerLoaf: number;
  hydrationPct: number;
  levainPct: number;
  saltPct: number;
  blend: Blend;
}

export interface FlourLine {
  flour: Flour;
  grams: number;
  /** Share of the weighed (added) flour, 0–100. */
  sharePct: number;
}

export interface Formula {
  /** All flour in the bread: weighed + inside the levain. */
  totalFlour: number;
  /** All water in the bread: weighed + inside the levain. */
  totalWater: number;
  levain: number;
  levainFlour: number;
  levainWater: number;
  /** Flour you weigh out on Friday. */
  addedFlour: number;
  /** Water you weigh out on Friday. */
  addedWater: number;
  salt: number;
  dough: number;
  doughPerLoaf: number;
  holdBack: number;
  flours: FlourLine[];
  stats: BlendStats;
}

export function computeFormula(input: FormulaInput): Formula {
  const stats = blendStats(input.blend);
  const totalFlour = input.loaves * input.flourPerLoaf;
  const H = input.hydrationPct / 100;
  const S = input.saltPct / 100;
  const L = input.levainPct / 100;

  const levain = L * totalFlour;
  const levainFlour = levain / (1 + LEVAIN_HYDRATION);
  const levainWater = levain - levainFlour;

  const addedFlour = totalFlour - levainFlour;
  const totalWater = H * totalFlour;
  const addedWater = totalWater - levainWater;
  const salt = S * totalFlour;
  const dough = totalFlour * (1 + H + S);

  const flours: FlourLine[] = [];
  if (stats.sum > 0) {
    for (const flour of FLOURS) {
      const share = Math.max(0, input.blend[flour.id] ?? 0);
      if (share > 0) {
        flours.push({ flour, grams: (addedFlour * share) / stats.sum, sharePct: (share / stats.sum) * 100 });
      }
    }
  }

  return {
    totalFlour,
    totalWater,
    levain,
    levainFlour,
    levainWater,
    addedFlour,
    addedWater,
    salt,
    dough,
    doughPerLoaf: dough / input.loaves,
    holdBack: Math.round(totalFlour * HOLD_BACK_FRACTION),
    flours,
    stats,
  };
}

export function clampHydration(pct: number): number {
  return Math.min(HYDRATION_MAX, Math.max(HYDRATION_MIN, pct));
}

/** Recommended hydration for a blend, clamped to the slider's range. */
export function recommendedHydration(stats: BlendStats): number {
  return clampHydration(stats.absorption);
}
