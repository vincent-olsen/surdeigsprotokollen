import { blendStats, isPresetId, PRESETS } from '../domain/flours';
import { recommendedHydration } from '../domain/formula';
import { planRecipe, type Recipe } from '../domain/recipe';
import { SATURDAY, THURSDAY, parseClock, toInputValue } from '../domain/time';
import { LIMITS, defaultState, type AppState } from '../state';
import { renderBakeLoss } from './bakeLoss';
import { renderBlendInputs, renderCalculator } from './calculator';
import { byId } from './dom';
import { renderChecks, renderRatioControls, renderSchedule } from './schedule';

export interface App {
  readonly state: AppState;
  render(): Recipe;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Wires the static page in index.html to the domain. State lives here;
 * every change re-derives the whole recipe (it is microseconds of arithmetic)
 * and re-renders the dynamic regions.
 */
export function createApp(doc: Document, state: AppState = defaultState()): App {
  const render = (): Recipe => {
    const recipe = planRecipe(state);
    renderCalculator(doc, state, recipe);
    renderChecks(doc, recipe);
    renderSchedule(doc, recipe);
    renderBakeLoss(doc, recipe);
    return recipe;
  };

  /** A new blend brings a new recommended hydration. */
  const syncHydration = () => {
    state.hydrationPct = recommendedHydration(blendStats(state.blend));
    byId<HTMLInputElement>(doc, 'hyd').value = String(state.hydrationPct);
  };

  const onBlendChange = (id: keyof AppState['blend'], value: number) => {
    state.blend[id] = clamp(value, LIMITS.blendShare.min, LIMITS.blendShare.max);
    syncHydration();
    render();
  };

  // Loaves
  const loaves = byId(doc, 'loaves');
  const syncLoaves = () => {
    for (const b of loaves.querySelectorAll<HTMLButtonElement>('button')) {
      b.setAttribute('aria-pressed', String(Number(b.dataset.v) === state.loaves));
    }
  };
  loaves.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-v]');
    if (!btn) return;
    state.loaves = Number(btn.dataset.v);
    syncLoaves();
    render();
  });

  // Numeric inputs and sliders
  const flourPer = byId<HTMLInputElement>(doc, 'flourPer');
  flourPer.addEventListener('input', () => {
    const v = Number.parseInt(flourPer.value, 10);
    if (Number.isNaN(v)) return;
    state.flourPerLoaf = clamp(v, LIMITS.flourPerLoaf.min, LIMITS.flourPerLoaf.max);
    render();
  });

  const slider = (id: string, apply: (v: number) => void) => {
    const input = byId<HTMLInputElement>(doc, id);
    input.addEventListener('input', () => {
      apply(Number.parseFloat(input.value));
      render();
    });
    return input;
  };
  const hyd = slider('hyd', (v) => (state.hydrationPct = v));
  const lev = slider('lev', (v) => (state.levainPct = v));
  const salt = slider('salt', (v) => (state.saltPct = v));

  // Presets
  byId(doc, 'presets').addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-p]');
    const id = btn?.dataset.p;
    if (!id || !isPresetId(id)) return;
    state.blend = { ...PRESETS[id] };
    renderBlendInputs(doc, state, onBlendChange);
    syncHydration();
    render();
  });

  // Schedule anchors
  const clock = (id: string, dayOffset: number, apply: (m: number) => void) => {
    const input = byId<HTMLInputElement>(doc, id);
    input.addEventListener('input', () => {
      const m = parseClock(input.value, dayOffset);
      if (m === null) return;
      apply(m);
      render();
    });
    return input;
  };
  const levTime = clock('levTime', THURSDAY, (m) => (state.levainBuildAt = m));
  const wakeTime = clock('wakeTime', SATURDAY, (m) => (state.wakeAt = m));
  const cutTime = clock('cutTime', SATURDAY, (m) => (state.cutAt = m));

  const ratioSel = byId<HTMLSelectElement>(doc, 'ratioSel');
  ratioSel.addEventListener('change', () => {
    state.ratioMode = ratioSel.value;
    render();
  });

  // Push state into the controls so the HTML defaults never disagree with it.
  flourPer.value = String(state.flourPerLoaf);
  hyd.value = String(state.hydrationPct);
  lev.value = String(state.levainPct);
  salt.value = String(state.saltPct);
  levTime.value = toInputValue(state.levainBuildAt);
  wakeTime.value = toInputValue(state.wakeAt);
  cutTime.value = toInputValue(state.cutAt);
  syncLoaves();
  renderBlendInputs(doc, state, onBlendChange);
  renderRatioControls(doc, state);
  render();

  return { state, render };
}
