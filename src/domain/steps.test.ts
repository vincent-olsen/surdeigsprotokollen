import { describe, expect, it } from 'vitest';
import { plain } from '../test-utils/rich';
import { defaultState } from '../state';
import { PRESETS } from './flours';
import { planRecipe, type RecipeInput } from './recipe';
import { bakeSteps, groupByDay } from './steps';
import { THURSDAY } from './time';

const recipe = (patch: Partial<RecipeInput> = {}) => planRecipe({ ...defaultState(), ...patch });
const step = (steps: ReturnType<typeof bakeSteps>, title: string) => {
  const s = steps.find((x) => x.title.startsWith(title));
  if (!s) throw new Error(`no step "${title}"`);
  return s;
};

describe('bakeSteps', () => {
  it('puts the real grams into the steps', () => {
    const steps = bakeSteps(recipe({ loaves: 1, blend: { ...PRESETS.lys } }));
    expect(plain(step(steps, 'Autolyse').note)).toContain('Bland 450 g mel med 275 g vann — hold igjen 35 g til saltet.');
    expect(plain(step(steps, 'Levain inn').note)).toMatch(/^100 g levain/);
    expect(plain(step(steps, 'Salt inn').note)).toMatch(/^10 g salt \+ de siste 35 g vannet/);
  });

  it('runs in chronological order', () => {
    const steps = bakeSteps(recipe());
    for (let i = 1; i < steps.length; i++) expect(steps[i]!.at).toBeGreaterThanOrEqual(steps[i - 1]!.at);
  });

  it('warns in the cut step when cooling is too short', () => {
    const cut = step(bakeSteps(recipe({ wakeAt: 7 * 60 })), 'Skjær');
    expect(cut.note[0]).toEqual({ strong: 'Bare 1 t 40 min avkjøling — for lite.' });
    expect(plain(cut.note)).toContain('Vent til 11:50');
  });

  it('words the levain step differently when the ratio is chosen by hand', () => {
    expect(plain(step(bakeSteps(recipe()), 'Levainbygg').note)).toContain('Forholdet er valgt');
    expect(plain(step(bakeSteps(recipe({ ratioMode: '1:4:4' })), 'Levainbygg').note)).toContain('Med dette forholdet');
  });
});

describe('groupByDay', () => {
  it('groups the default plan into Thursday, Friday, Saturday', () => {
    const groups = groupByDay(bakeSteps(recipe()));
    expect(groups.map((g) => [g.day, g.subtitle])).toEqual([
      ['Torsdag', 'starteren vekkes'],
      ['Fredag', 'bulk, brett og forming'],
      ['Lørdag', 'steking og avkjøling'],
    ]);
  });

  it('follows the timestamps when a fast levain pulls dough work into Thursday', () => {
    const groups = groupByDay(bakeSteps(recipe({ levainBuildAt: THURSDAY + 6 * 60, ratioMode: '1:1:1' })));
    expect(groups[0]).toMatchObject({ day: 'Torsdag', subtitle: 'starteren vekkes · bulk, brett og forming' });
  });
});
