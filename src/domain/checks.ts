import type { BlendStats } from './flours';
import { decimal } from './format';
import { LEVAIN_RANGE, RETARD_RANGE, type Schedule } from './schedule';
import { formatClock, formatDuration } from './time';

export type Level = 'ok' | 'warn' | 'info';

export interface Check {
  level: Level;
  value: string;
  note: string;
}

export interface Advice {
  level: Level;
  text: string;
}

export function levainCheck(s: Schedule): Check {
  const value = formatDuration(s.levainMinutes);
  if (s.manual) {
    const gist = s.ratio.note.split('.')[0] ?? s.ratio.note;
    return { level: 'ok', value, note: `${s.ratio.label} — ${gist}. Kaldhevingen tar støyten.` };
  }
  if (s.levainMinutes < LEVAIN_RANGE.min) {
    return { level: 'warn', value, note: 'For kort fra et kjøleskapskaldt utgangspunkt. Bygg levainen tidligere torsdag.' };
  }
  if (s.levainMinutes > LEVAIN_RANGE.max) {
    return {
      level: 'warn',
      value,
      note: `Lenge for ett bygg — selv ${s.ratio.label} topper før det. Bygg senere torsdag, ellers mat to ganger.`,
    };
  }
  return { level: 'ok', value, note: `Mat den ${s.ratio.label} — da topper den presis.` };
}

export function retardCheck(s: Schedule): Check {
  const value = formatDuration(s.retardMinutes);
  if (s.retardMinutes < RETARD_RANGE.min) {
    return { level: 'warn', value, note: 'For kort — deigen rekker ikke å kjølne helt. Bygg levainen tidligere, eller stå opp senere.' };
  }
  if (s.retardMinutes > RETARD_RANGE.max) {
    return { level: 'warn', value, note: 'For lenge — risiko for overgjæring. Bygg levainen senere, eller stå opp tidligere.' };
  }
  return { level: 'ok', value, note: 'Innenfor 10–18 t. Dette er bufferen din.' };
}

export function coolingCheck(s: Schedule): Check {
  const value = formatDuration(s.coolingMinutes);
  if (s.cutAt < s.earliestCutAt) {
    return { level: 'warn', value, note: `For kort. Tidligst mulig skjæretid: ${formatClock(s.earliestCutAt).time}.` };
  }
  if (s.coolingMinutes > 420) {
    return { level: 'ok', value, note: 'Rikelig — brødet er helt kaldt. Helt greit.' };
  }
  return { level: 'ok', value, note: 'Nok til at krummen setter seg.' };
}

export function hydrationAdvice(hydrationPct: number, stats: BlendStats): Advice {
  const diff = hydrationPct - stats.absorption;
  if (diff > 5) {
    return {
      level: 'warn',
      text: `Anbefalt for denne blandingen: ${stats.absorption} %. Du ligger ${Math.round(diff)} prosentpoeng over — melet slipper vannet i stekingen og du får klissete krumme.`,
    };
  }
  if (diff < -6) {
    return { level: 'info', text: `Anbefalt: ${stats.absorption} %. Du ligger lavt — tettere krumme, men mye enklere å håndtere.` };
  }
  return { level: 'ok', text: `Anbefalt for denne blandingen: ${stats.absorption} %. Du ligger godt an.` };
}

export function blendAdvice(stats: BlendStats): Advice {
  if (Math.abs(stats.sum - 100) > 0.5) {
    return { level: 'warn', text: 'Summen bør være 100 %. Andelene brukes som forhold uansett, men tallene blir lettere å lese på 100.' };
  }
  if (stats.strength < 0.75) {
    return {
      level: 'warn',
      text: `Svak blanding (styrke ${decimal(stats.strength)}). Forvent slappere deig — form strammere, kortere bulk, og vurder en form i stedet for fritt brød.`,
    };
  }
  if (stats.wholeGrainPct > 40) {
    return { level: 'info', text: `${Math.round(stats.wholeGrainPct)} % sammalt: mer smak, tettere krumme, raskere gjæring. Tidsplanen er justert.` };
  }
  return { level: 'ok', text: `Balansert blanding. Styrke ${decimal(stats.strength)} — tåler hydreringen fint.` };
}
