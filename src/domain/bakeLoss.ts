/** Target weight loss in the oven: 12–16 %. Under ~11 % means underbaked. */
export const BAKE_LOSS = { min: 0.12, max: 0.16, underbaked: 0.11 } as const;

const REFERENCE_WEIGHTS = [700, 800, 900, 1000, 1100] as const;

export interface BakeLossRow {
  doughWeight: number;
  /** Lightest acceptable baked weight (max loss). */
  targetMin: number;
  /** Heaviest acceptable baked weight (min loss). */
  targetMax: number;
  /** Heavier than this after baking = underbaked. */
  underbakedAbove: number;
  isCurrent: boolean;
}

export function bakeLossRows(doughPerLoaf: number): BakeLossRow[] {
  const current = Math.round(doughPerLoaf);
  const weights = new Set<number>(REFERENCE_WEIGHTS);
  weights.add(current);
  return [...weights]
    .sort((a, b) => a - b)
    .map((w) => ({
      doughWeight: w,
      targetMin: Math.round(w * (1 - BAKE_LOSS.max)),
      targetMax: Math.round(w * (1 - BAKE_LOSS.min)),
      underbakedAbove: Math.round(w * (1 - BAKE_LOSS.underbaked)),
      isCurrent: w === current,
    }));
}
