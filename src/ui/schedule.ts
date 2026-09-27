import { coolingCheck, levainCheck, retardCheck, type Check } from '../domain/checks';
import { RATIOS } from '../domain/ratios';
import type { Recipe } from '../domain/recipe';
import { bakeSteps, groupByDay } from '../domain/steps';
import { formatClock, formatDuration } from '../domain/time';
import type { AppState } from '../state';
import { byId, el, setRich } from './dom';

export function renderRatioControls(doc: Document, state: AppState): void {
  const select = byId<HTMLSelectElement>(doc, 'ratioSel');
  const option = (label: string, value: string) => {
    const o = el(doc, 'option', undefined, label);
    o.value = value;
    return o;
  };
  select.replaceChildren(
    option('Auto', 'auto'),
    ...RATIOS.map((r) => option(`${r.label}  (${formatDuration(r.minutesToPeak)})`, r.label)),
  );
  select.value = state.ratioMode;

  byId(doc, 'ratioRows').replaceChildren(
    ...RATIOS.map((r) => {
      const tr = el(doc, 'tr');
      tr.append(el(doc, 'td', 'n', r.label), el(doc, 'td', 'n', formatDuration(r.minutesToPeak)), el(doc, 'td', undefined, r.note));
      return tr;
    }),
  );
}

function setCheck(doc: Document, id: string, check: Check): void {
  byId(doc, id).className = check.level === 'warn' ? 'check warn' : 'check';
  byId(doc, `${id}V`).textContent = check.value;
  byId(doc, `${id}N`).textContent = check.note;
}

export function renderChecks(doc: Document, recipe: Recipe): void {
  const s = recipe.schedule;
  byId(doc, 'ratioHint').textContent = s.manual
    ? `Ditt valg. Auto ville brukt ${s.autoRatio.label} her.`
    : `Auto valgte ${s.ratio.label} — topper når deigen skal blandes.`;
  setCheck(doc, 'chkLevain', levainCheck(s));
  setCheck(doc, 'chkRetard', retardCheck(s));
  setCheck(doc, 'chkCool', coolingCheck(s));
}

export function renderSchedule(doc: Document, recipe: Recipe): void {
  const groups = groupByDay(bakeSteps(recipe)).map((g) => {
    const day = el(doc, 'div', 'day');
    const head = el(doc, 'div', 'day-head');
    head.append(el(doc, 'span', undefined, g.day), el(doc, 'span', 'sub', g.subtitle));
    day.append(head);
    for (const step of g.steps) {
      const slot = el(doc, 'div', step.key ? 'slot key' : 'slot');
      const note = el(doc, 'div', 'slot-note');
      setRich(note, step.note);
      slot.append(el(doc, 'div', 'slot-time', formatClock(step.at).time), el(doc, 'div', 'slot-what', step.title), note);
      day.append(slot);
    }
    return day;
  });

  const hint = el(
    doc,
    'p',
    'hint',
    `Bulken er satt til ${formatDuration(recipe.bulkMinutes)}, justert for ${Math.round(recipe.formula.stats.wholeGrainPct)} % sammalt mel — ` +
      'mer sammalt gir raskere gjæring, fordi kliet gir mikrobene mer å spise av. ' +
      'Alle tidspunktene er avledet av de tre du satte øverst.',
  );

  byId(doc, 'sched').replaceChildren(...groups, hint);
}
