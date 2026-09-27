import { grams } from './format';
import type { Recipe } from './recipe';
import { formatClock, formatDuration } from './time';

/** Minimal rich text: plain strings and bold runs. Rendered without innerHTML. */
export type Rich = ReadonlyArray<string | { strong: string }>;

export type Phase = 'levain' | 'deig' | 'steking';

export interface Step {
  at: number;
  title: string;
  note: Rich;
  key: boolean;
  phase: Phase;
}

export interface DayGroup {
  day: string;
  subtitle: string;
  steps: Step[];
}

const PHASE_LABEL: Record<Phase, string> = {
  levain: 'starteren vekkes',
  deig: 'bulk, brett og forming',
  steking: 'steking og avkjøling',
};

export function bakeSteps({ formula: f, schedule: s, bulkMinutes }: Recipe): Step[] {
  const t = (m: number) => formatClock(m).time;
  const levainNote: Rich = s.manual
    ? ['Ta starteren ut av kjøleskapet og bygg levainen ', { strong: s.ratio.label }, ` med tallene over. La den stå ute på kjøkkenet. Med dette forholdet topper den etter ca. ${formatDuration(s.levainMinutes)}.`]
    : ['Ta starteren ut av kjøleskapet og bygg levainen ', { strong: s.ratio.label }, ` med tallene over. La den stå ute på kjøkkenet. Forholdet er valgt så den treffer toppen presis når du trenger den — ${formatDuration(s.levainMinutes)} senere.`];

  const steps: Step[] = [
    { at: s.levainBuildAt, title: `Levainbygg — ${s.ratio.label}`, note: levainNote, key: true, phase: 'levain' },
    {
      at: s.autolyseAt, title: 'Autolyse', key: false, phase: 'deig',
      note: ['Bland ', { strong: `${grams(f.addedFlour)} mel` }, ' med ', { strong: `${grams(f.addedWater - f.holdBack)} vann` },
        ` — hold igjen ${grams(f.holdBack)} til saltet. Ingen salt, ingen levain ennå. Tildekket i 60 min: melet suger, og gluten begynner å danne seg helt av seg selv.`],
    },
    {
      at: s.levainInAt, title: 'Levain inn', key: true, phase: 'deig',
      note: [{ strong: `${grams(f.levain)} levain` }, ' — den skal være på toppen: doblet, kuppelformet, syrlig-søt. Flyter en klatt i vann, er den klar. Klyp den inn til den er borte. Hvil 20 min.'],
    },
    {
      at: s.bulkStartAt, title: 'Salt inn — bulk starter', key: true, phase: 'deig',
      note: [{ strong: `${grams(f.salt)} salt` }, ` + de siste ${grams(f.holdBack)} vannet klypes inn. `, { strong: 'Mål deigtemperaturen nå: 25–26 °C.' }, ' Dette er nullpunktet for hele bulken.'],
    },
  ];

  const [firstFold] = s.folds;
  if (firstFold !== undefined) {
    steps.push({
      at: firstFold, title: `Brett — ${s.folds.length} sett`, key: false, phase: 'deig',
      note: ['Coil folds: ', { strong: s.folds.map(t).join(' · ') }, '. De første to setter styrke, de siste justerer bare. Ikke rør deigen etter det siste settet.'],
    });
  }

  steps.push(
    {
      at: s.preshapeAt, title: 'Bulk ferdig — preforming', key: true, phase: 'deig',
      note: [`Etter ${formatDuration(bulkMinutes)}. Deigen skal være `, { strong: '+50–75 %' }, ', kuppelformet, boblet i kanten. Velt ut, preform rundt, la hvile.'],
    },
    { at: s.benchAt, title: 'Benkehvile', key: false, phase: 'deig', note: ['30 min utildekket. Deigen slapper av så du får formet den stramt uten å rive.'] },
    { at: s.shapeAt, title: 'Endelig forming', key: false, phase: 'deig', note: ['Stram forming, i melet banneton med skjøten opp. Dryss rismel om du har.'] },
    {
      at: s.fridgeAt, title: 'I kjøleskapet', key: true, phase: 'deig',
      note: ['4 °C, tildekket. ', { strong: formatDuration(s.retardMinutes) }, '. Herfra er det bufferen din — alt mellom 10 og 18 timer går fint.'],
    },
    { at: s.preheatAt, title: 'Ovn + gryte på 250 °C', key: true, phase: 'steking', note: ['60 min forvarming. Gryta må være gjennomvarm — det er termisk masse, ikke lufttemperatur, som gir ovenspring.'] },
    { at: s.intoOvenAt, title: 'Snitt og inn', key: true, phase: 'steking', note: ['Rett fra kjøleskapet, ingen temperering. Snitt kaldt og bestemt. Lokk på, 250 °C, 25 min.'] },
    { at: s.lidOffAt, title: 'Lokk av — 230 °C', key: true, phase: 'steking', note: ['Nå starter skorpen. Kjernen treffer 98 °C etter ~8 min til — ', { strong: 'ikke ta det ut da' }, '.'] },
    { at: s.doorAjarAt, title: 'Ovnsdør på gløtt', key: false, phase: 'steking', note: ['Siste 5 min. Lufter damp og tørker skorpen.'] },
    {
      at: s.outOfOvenAt, title: 'Ut av ovnen — vei det', key: true, phase: 'steking',
      note: ['Vei brødet. Mål: ', { strong: '12–16 % lavere' }, ' enn deigvekten. På rist umiddelbart, ut av gryta, ikke tildekket.'],
    },
    {
      at: s.cutAt, title: 'Skjær', key: true, phase: 'steking',
      note: s.cutAt < s.earliestCutAt
        ? [{ strong: `Bare ${formatDuration(s.coolingMinutes)} avkjøling — for lite.` }, ` Krummen har ikke satt seg, og du får nøyaktig den fuktige krummen protokollen er laget for å unngå. Vent til ${t(s.earliestCutAt)} eller senere.`]
        : ['Under 25 °C i midten. ', { strong: formatDuration(s.coolingMinutes) }, ' avkjøling — krummen setter seg her, ikke i ovnen.'],
    },
  );

  return steps;
}

/**
 * Groups consecutive steps by their actual weekday. Days come from the
 * timestamps, not from assumptions — a fast levain can pull Friday's work
 * into Thursday, and the headings follow.
 */
export function groupByDay(steps: readonly Step[]): DayGroup[] {
  const groups: { day: string; phases: Phase[]; steps: Step[] }[] = [];
  for (const step of steps) {
    const day = formatClock(step.at).day;
    let group = groups.at(-1);
    if (!group || group.day !== day) {
      group = { day, phases: [], steps: [] };
      groups.push(group);
    }
    if (!group.phases.includes(step.phase)) group.phases.push(step.phase);
    group.steps.push(step);
  }
  return groups.map((g) => ({ day: g.day, subtitle: g.phases.map((p) => PHASE_LABEL[p]).join(' · '), steps: g.steps }));
}
