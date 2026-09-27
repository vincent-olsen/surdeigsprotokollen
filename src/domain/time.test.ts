import { describe, expect, it } from 'vitest';
import { FRIDAY, SATURDAY, THURSDAY, formatClock, formatDuration, parseClock, toInputValue } from './time';

describe('formatClock', () => {
  it.each([
    [SATURDAY, 'Lørdag', '00:00'],
    [THURSDAY + 22 * 60, 'Torsdag', '22:00'],
    [FRIDAY + 10 * 60, 'Fredag', '10:00'],
    [5 * 60, 'Lørdag', '05:00'],
    [1440 + 60, 'Søndag', '01:00'],
    [-3 * 1440, 'Onsdag', '00:00'],
    [-1, 'Fredag', '23:59'],
  ])('%i → %s %s', (minutes, day, time) => {
    expect(formatClock(minutes)).toEqual({ day, time });
  });
});

describe('formatDuration', () => {
  it.each([
    [220, '3 t 40 min'],
    [720, '12 t'],
    [45, '45 min'],
    [0, '0 min'],
    [838, '13 t 58 min'],
  ])('%i → %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it('formats negative durations correctly (regression: −170 used to print "-50 min")', () => {
    expect(formatDuration(-170)).toBe('−2 t 50 min');
    expect(formatDuration(-10)).toBe('−10 min');
  });
});

describe('parseClock', () => {
  it('places a clock time on the Saturday-relative number line', () => {
    expect(parseClock('22:00', THURSDAY)).toBe(-1560);
    expect(parseClock('05:00', SATURDAY)).toBe(300);
    expect(parseClock('10:30:00', SATURDAY)).toBe(630);
  });

  it.each(['', 'abc', '24:00', '12:60', '1230'])('rejects %j', (value) => {
    expect(parseClock(value, SATURDAY)).toBeNull();
  });

  it.each(['00:00', '05:15', '22:45', '23:59'])('round-trips %s', (value) => {
    expect(toInputValue(parseClock(value, THURSDAY)!)).toBe(value);
  });
});
