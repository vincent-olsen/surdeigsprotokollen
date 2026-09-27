import type { LevainRatio } from './ratios';

/** A starter amount below this is hard to weigh on a 1 g kitchen scale. */
export const MIN_STARTER_G = 10;

/** Extra levain built on top of what the dough needs: sticks to the jar, and keeps the starter going. */
export const BUILD_MARGIN_G = 25;

export interface LevainBuild {
  ratio: LevainRatio;
  starter: number;
  flour: number;
  water: number;
  /** Sum of the three rounded amounts, so the card always adds up. */
  total: number;
  /** Grams of the build that go into the dough. */
  used: number;
  usedFlour: number;
  usedWater: number;
  /** Grams left in the jar: your starter for next time. */
  surplus: number;
  /** True when the build was scaled up to keep the starter weighable. */
  scaledUp: boolean;
}

/**
 * Plans Thursday's build. Assumes the starter itself is at 100 % hydration,
 * so the whole build is half flour, half water — which is why any portion
 * taken from it (the `used` grams) is also exactly half flour.
 */
export function planLevainBuild(levainNeeded: number, ratio: LevainRatio): LevainBuild {
  const side = (ratio.parts - 1) / 2;
  const wanted = levainNeeded + BUILD_MARGIN_G;
  const minimum = MIN_STARTER_G * ratio.parts;
  const target = Math.max(wanted, minimum);

  const starter = Math.round(target / ratio.parts);
  const flour = Math.round((target * side) / ratio.parts);
  const water = flour;
  const total = starter + flour + water;
  const used = Math.round(levainNeeded);

  return {
    ratio,
    starter,
    flour,
    water,
    total,
    used,
    usedFlour: used / 2,
    usedWater: used / 2,
    surplus: total - used,
    scaledUp: minimum > wanted,
  };
}
