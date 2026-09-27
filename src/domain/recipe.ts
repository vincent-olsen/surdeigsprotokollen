import { computeFormula, type Formula, type FormulaInput } from './formula';
import { planLevainBuild, type LevainBuild } from './levain';
import { bulkMinutesFor, solveSchedule, type Schedule, type ScheduleInput } from './schedule';

/** Everything the user controls. */
export interface RecipeInput extends FormulaInput, Omit<ScheduleInput, 'bulkMinutes'> {}

/** Everything derived from it. */
export interface Recipe {
  formula: Formula;
  bulkMinutes: number;
  schedule: Schedule;
  build: LevainBuild;
}

export function planRecipe(input: RecipeInput): Recipe {
  const formula = computeFormula(input);
  const bulkMinutes = bulkMinutesFor(formula.stats.wholeGrainPct);
  const schedule = solveSchedule({ ...input, bulkMinutes });
  const build = planLevainBuild(formula.levain, schedule.ratio);
  return { formula, bulkMinutes, schedule, build };
}
