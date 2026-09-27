import { describe, expect, it } from 'vitest';
import { blendAdvice, coolingCheck, hydrationAdvice, levainCheck, retardCheck } from './checks';
import { PRESETS, blendStats, type Blend } from './flours';
import { solveSchedule, type ScheduleInput } from './schedule';
import { FRIDAY, THURSDAY } from './time';

const defaults: ScheduleInput = {
  levainBuildAt: THURSDAY + 22 * 60,
  wakeAt: 5 * 60,
  cutAt: 10 * 60 + 30,
  bulkMinutes: 282,
  ratioMode: 'auto',
};
const solve = (patch: Partial<ScheduleInput> = {}) => solveSchedule({ ...defaults, ...patch });

describe('schedule checks', () => {
  it('are all green for the defaults', () => {
    const s = solve();
    expect(levainCheck(s)).toMatchObject({ level: 'ok', value: '12 t' });
    expect(retardCheck(s)).toMatchObject({ level: 'ok', value: '13 t 58 min' });
    expect(coolingCheck(s)).toMatchObject({ level: 'ok', value: '3 t 40 min' });
  });

  it('flags too little cooling and names the earliest safe cut', () => {
    const c = coolingCheck(solve({ wakeAt: 7 * 60 }));
    expect(c.level).toBe('warn');
    expect(c.value).toBe('1 t 40 min');
    expect(c.note).toContain('11:50');
  });

  it('flags a retard that is too long or too short', () => {
    expect(retardCheck(solve({ ratioMode: '1:1:1' })).level).toBe('warn');
    expect(retardCheck(solve({ ratioMode: '1:10:10' })).level).toBe('warn');
    expect(retardCheck(solve({ ratioMode: '1:4:4' })).level).toBe('ok');
  });

  it('flags a levain window no single build can hit', () => {
    expect(levainCheck(solve({ levainBuildAt: THURSDAY + 6 * 60 })).level).toBe('warn');
    expect(levainCheck(solve({ levainBuildAt: FRIDAY + 6 * 60 })).level).toBe('warn');
  });

  it('never warns on the levain in manual mode — the retard carries the consequence', () => {
    const s = solve({ ratioMode: '1:1:1' });
    expect(levainCheck(s)).toMatchObject({ level: 'ok' });
    expect(levainCheck(s).note).toContain('Kaldhevingen tar støyten');
  });

  it('notes an unusually long cooling without warning', () => {
    expect(coolingCheck(solve({ cutAt: 15 * 60 }))).toMatchObject({ level: 'ok' });
  });
});

const blend = (partial: Partial<Blend>): Blend => ({
  siktet: 0, sterkt: 0, shfin: 0, shgrov: 0, spelt: 0, rug: 0, ...partial,
});

describe('hydrationAdvice', () => {
  const lys = blendStats(PRESETS.lys);
  it.each([
    [72, 'ok'],
    [76, 'warn'],
    [64, 'ok'],
    [63, 'info'],
  ])('%i %% on a 70 %% blend → %s', (hyd, level) => {
    expect(hydrationAdvice(hyd, lys).level).toBe(level);
  });
});

describe('blendAdvice', () => {
  it.each([
    ['sum off 100', blend({ siktet: 90 }), 'warn'],
    ['weak blend', blend({ siktet: 50, rug: 50 }), 'warn'],
    ['mostly whole grain', PRESETS.grov, 'info'],
    ['balanced', PRESETS.halvgrov, 'ok'],
  ])('%s → %s', (_name, b, level) => {
    expect(blendAdvice(blendStats(b)).level).toBe(level);
  });
});
