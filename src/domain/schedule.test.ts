import { describe, expect, it } from 'vitest';
import { RATIOS } from './ratios';
import { DURATION, bulkMinutesFor, solveSchedule, type ScheduleInput } from './schedule';
import { FRIDAY, SATURDAY, THURSDAY, formatClock } from './time';

const at = (m: number) => formatClock(m).time;

const defaults: ScheduleInput = {
  levainBuildAt: THURSDAY + 22 * 60,
  wakeAt: SATURDAY + 5 * 60,
  cutAt: SATURDAY + 10 * 60 + 30,
  bulkMinutes: 282, // 15 % whole grain
  ratioMode: 'auto',
};

describe('solveSchedule — defaults (Thu 22:00, Sat 05:00, Sat 10:30)', () => {
  const s = solveSchedule(defaults);

  it('picks 1:6:6 and lands a 13 h 58 min retard', () => {
    expect(s.ratio.label).toBe('1:6:6');
    expect(s.manual).toBe(false);
    expect(s.levainMinutes).toBe(720);
    expect(s.retardMinutes).toBe(838);
    expect(s.coolingMinutes).toBe(220);
  });

  it('lays out Friday', () => {
    expect(s.autolyseAt).toBe(FRIDAY + 9 * 60);
    expect(s.levainInAt).toBe(FRIDAY + 10 * 60);
    expect(at(s.bulkStartAt)).toBe('10:20');
    expect(s.folds.map(at)).toEqual(['10:50', '11:20', '11:50', '12:35']);
    expect(at(s.preshapeAt)).toBe('15:02');
    expect(at(s.benchAt)).toBe('15:12');
    expect(at(s.shapeAt)).toBe('15:42');
    expect(at(s.fridgeAt)).toBe('16:02');
  });

  it('lays out Saturday', () => {
    expect([s.preheatAt, s.intoOvenAt, s.lidOffAt, s.doorAjarAt, s.outOfOvenAt].map(at)).toEqual([
      '05:00', '06:00', '06:25', '06:45', '06:50',
    ]);
    expect(at(s.earliestCutAt)).toBe('09:50');
  });
});

describe('solveSchedule — elastic links', () => {
  it('auto mode moves the ratio when you sleep in', () => {
    const s = solveSchedule({ ...defaults, wakeAt: 7 * 60 });
    expect(s.ratio.label).toBe('1:8:8');
    expect(s.retardMinutes).toBe(838);
  });

  it('manual mode fixes the ratio and lets the retard absorb it', () => {
    const s = solveSchedule({ ...defaults, ratioMode: '1:1:1' });
    expect(s.manual).toBe(true);
    expect(s.ratio.label).toBe('1:1:1');
    expect(s.autoRatio.label).toBe('1:6:6');
    expect(s.retardMinutes).toBe(21 * 60 + 28);
  });

  it('falls back to auto for an unknown ratio label', () => {
    const s = solveSchedule({ ...defaults, ratioMode: '1:7:7' });
    expect(s.manual).toBe(false);
    expect(s.ratio.label).toBe('1:6:6');
  });

  it('the chain closes for every ratio', () => {
    for (const r of [{ label: 'auto' }, ...RATIOS]) {
      const s = solveSchedule({ ...defaults, ratioMode: r.label });
      expect(s.levainInAt - s.levainBuildAt).toBe(s.ratio.minutesToPeak);
      expect(s.preshapeAt - s.bulkStartAt).toBe(defaults.bulkMinutes);
      expect(s.fridgeAt + s.retardMinutes).toBe(s.intoOvenAt);
      expect(s.outOfOvenAt - s.intoOvenAt).toBe(DURATION.bake);
      expect(s.outOfOvenAt + s.coolingMinutes).toBe(s.cutAt);
    }
  });
});

describe('folds', () => {
  it('drops folds that would crowd the end of bulk', () => {
    expect(solveSchedule({ ...defaults, bulkMinutes: 210 }).folds).toHaveLength(4);
    expect(solveSchedule({ ...defaults, bulkMinutes: 170 }).folds).toHaveLength(3);
  });
});

describe('bulkMinutesFor', () => {
  it.each([
    [0, 300],
    [15, 282],
    [45, 246],
    [100, 210],
    [-50, 330],
  ])('%i %% whole grain → %i min', (wg, expected) => {
    expect(bulkMinutesFor(wg)).toBe(expected);
  });
});
