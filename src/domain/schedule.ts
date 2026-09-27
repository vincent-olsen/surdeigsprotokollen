import { closestRatio, findRatio, type LevainRatio } from './ratios';

/**
 * The schedule is a chain of fixed durations between three anchors the user
 * sets: when the levain is built (Thursday), when they wake up (Saturday),
 * and when the loaf is cut (Saturday). Three anchors over-determine the chain,
 * so two links are elastic:
 *
 *   1. levain maturation — set by the feed ratio
 *   2. cold retard — absorbs whatever is left
 *
 * In auto mode we aim for a 13 h retard and pick the ratio that gets closest;
 * in manual mode the ratio is fixed and the retard takes the full difference.
 * Cooling is a third slack (cut − out of oven) that may grow but must not
 * drop below three hours.
 */

export const DURATION = {
  preheat: 60,
  lidOn: 25,
  bake: 50,
  doorAjar: 5,
  autolyse: 60,
  levainRest: 20,
  preshapeToBench: 10,
  bench: 30,
  shapeToFridge: 20,
  targetRetard: 780,
  minCooling: 180,
} as const;

export const RETARD_RANGE = { min: 600, max: 1080 } as const;
export const LEVAIN_RANGE = { min: 300, max: 900 } as const;

/** Coil folds, minutes after bulk start. */
export const FOLD_OFFSETS = [30, 60, 90, 135] as const;

/** Keep this much bulk untouched after the last fold. */
const FOLD_QUIET_TAIL = 45;

export type RatioMode = 'auto' | string;

export interface ScheduleInput {
  levainBuildAt: number;
  wakeAt: number;
  cutAt: number;
  bulkMinutes: number;
  ratioMode: RatioMode;
}

export interface Schedule {
  ratio: LevainRatio;
  /** What auto would have chosen, shown as a reference in manual mode. */
  autoRatio: LevainRatio;
  manual: boolean;

  levainMinutes: number;
  retardMinutes: number;
  coolingMinutes: number;

  levainBuildAt: number;
  autolyseAt: number;
  levainInAt: number;
  bulkStartAt: number;
  folds: number[];
  preshapeAt: number;
  benchAt: number;
  shapeAt: number;
  fridgeAt: number;

  preheatAt: number;
  intoOvenAt: number;
  lidOffAt: number;
  doorAjarAt: number;
  outOfOvenAt: number;
  cutAt: number;
  earliestCutAt: number;
}

/** Whole grain ferments faster: the bran feeds the microbes. */
export function bulkMinutesFor(wholeGrainPct: number): number {
  return Math.max(210, Math.min(330, Math.round(300 - wholeGrainPct * 1.2)));
}

export function solveSchedule(input: ScheduleInput): Schedule {
  const preheatAt = input.wakeAt;
  const intoOvenAt = preheatAt + DURATION.preheat;
  const lidOffAt = intoOvenAt + DURATION.lidOn;
  const outOfOvenAt = intoOvenAt + DURATION.bake;
  const doorAjarAt = outOfOvenAt - DURATION.doorAjar;

  const levainInToFridge =
    DURATION.levainRest + input.bulkMinutes + DURATION.preshapeToBench + DURATION.bench + DURATION.shapeToFridge;
  const span = intoOvenAt - input.levainBuildAt;
  const targetLevain = span - levainInToFridge - DURATION.targetRetard;

  const autoRatio = closestRatio(targetLevain);
  const chosen = input.ratioMode === 'auto' ? undefined : findRatio(input.ratioMode);
  const ratio = chosen ?? autoRatio;

  const levainMinutes = ratio.minutesToPeak;
  const levainInAt = input.levainBuildAt + levainMinutes;
  const autolyseAt = levainInAt - DURATION.autolyse;
  const bulkStartAt = levainInAt + DURATION.levainRest;
  const preshapeAt = bulkStartAt + input.bulkMinutes;
  const benchAt = preshapeAt + DURATION.preshapeToBench;
  const shapeAt = benchAt + DURATION.bench;
  const fridgeAt = shapeAt + DURATION.shapeToFridge;

  const folds = FOLD_OFFSETS.filter((m) => m < input.bulkMinutes - FOLD_QUIET_TAIL).map((m) => bulkStartAt + m);

  return {
    ratio,
    autoRatio,
    manual: chosen !== undefined,
    levainMinutes,
    retardMinutes: intoOvenAt - fridgeAt,
    coolingMinutes: input.cutAt - outOfOvenAt,
    levainBuildAt: input.levainBuildAt,
    autolyseAt,
    levainInAt,
    bulkStartAt,
    folds,
    preshapeAt,
    benchAt,
    shapeAt,
    fridgeAt,
    preheatAt,
    intoOvenAt,
    lidOffAt,
    doorAjarAt,
    outOfOvenAt,
    cutAt: input.cutAt,
    earliestCutAt: outOfOvenAt + DURATION.minCooling,
  };
}
