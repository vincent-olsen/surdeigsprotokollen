/**
 * All points in time are integer minutes relative to Saturday 00:00.
 * Negative values are earlier days: Friday 10:00 is -840, Thursday 22:00 is -1560.
 * One number line makes the schedule arithmetic trivial and day-crossing free.
 */

export const MINUTES_PER_DAY = 1440;
export const THURSDAY = -2 * MINUTES_PER_DAY;
export const FRIDAY = -MINUTES_PER_DAY;
export const SATURDAY = 0;

const WEEKDAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'] as const;
const SATURDAY_INDEX = 5;

export interface ClockTime {
  day: string;
  time: string;
}

const pad = (n: number): string => String(n).padStart(2, '0');

export function formatClock(minutes: number): ClockTime {
  const m = Math.round(minutes);
  const dayOffset = Math.floor(m / MINUTES_PER_DAY);
  const within = m - dayOffset * MINUTES_PER_DAY;
  const index = (((SATURDAY_INDEX + dayOffset) % 7) + 7) % 7;
  return {
    day: WEEKDAYS[index] ?? 'Lørdag',
    time: `${pad(Math.floor(within / 60))}:${pad(within % 60)}`,
  };
}

/** "3 t 40 min", "12 t", "45 min", "−1 t 10 min". */
export function formatDuration(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 0) return `−${formatDuration(-m)}`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} t` : `${h} t ${r} min`;
}

/** Parses "HH:MM" (as produced by <input type="time">) onto the number line. */
export function parseClock(value: string, dayOffset: number): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return dayOffset + h * 60 + m;
}

/** Inverse of parseClock for populating inputs: minutes → "HH:MM". */
export function toInputValue(minutes: number): string {
  return formatClock(minutes).time;
}
