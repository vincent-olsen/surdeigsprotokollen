import { PRESETS } from './domain/flours';
import type { RecipeInput } from './domain/recipe';
import { SATURDAY, THURSDAY } from './domain/time';

export type AppState = RecipeInput;

export function defaultState(): AppState {
  return {
    loaves: 2,
    flourPerLoaf: 500,
    hydrationPct: 72,
    levainPct: 20,
    saltPct: 2,
    blend: { ...PRESETS.halvgrov },
    levainBuildAt: THURSDAY + 22 * 60,
    wakeAt: SATURDAY + 5 * 60,
    cutAt: SATURDAY + 10 * 60 + 30,
    ratioMode: 'auto',
  };
}

export const LIMITS = {
  flourPerLoaf: { min: 150, max: 2000 },
  blendShare: { min: 0, max: 100 },
} as const;
