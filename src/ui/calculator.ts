import { blendAdvice, hydrationAdvice } from '../domain/checks';
import { FLOURS, type FlourId } from '../domain/flours';
import { decimal, grams, percent } from '../domain/format';
import { EXPECTED_BAKE_LOSS } from '../domain/formula';
import type { Recipe } from '../domain/recipe';
import type { AppState } from '../state';
import { byId, el, hintClass, line } from './dom';

/** Builds the six blend inputs. Called on start and when a preset replaces the blend. */
export function renderBlendInputs(doc: Document, state: AppState, onChange: (id: FlourId, value: number) => void): void {
  const host = byId(doc, 'blend');
  host.replaceChildren(
    ...FLOURS.map((f) => {
      const row = el(doc, 'div', 'blend-row');
      const label = el(doc, 'label', 'blend-name', f.name);
      label.htmlFor = `b_${f.id}`;
      if (f.hint) label.append(el(doc, 'br'), el(doc, 'span', 'blend-hint', ` ${f.hint}`));

      const input = el(doc, 'input');
      input.type = 'number';
      input.id = `b_${f.id}`;
      input.min = '0';
      input.max = '100';
      input.step = '5';
      input.inputMode = 'numeric';
      input.value = String(state.blend[f.id]);
      input.addEventListener('input', () => {
        const v = Number.parseFloat(input.value);
        onChange(f.id, Number.isNaN(v) ? 0 : v);
      });

      row.append(label, input);
      return row;
    }),
  );
}

export function renderCalculator(doc: Document, state: AppState, recipe: Recipe): void {
  const { formula: f, build: b } = recipe;

  byId(doc, 'flourPerOut').textContent = grams(state.flourPerLoaf);
  byId(doc, 'hydOut').textContent = percent(state.hydrationPct);
  byId(doc, 'levOut').textContent = percent(state.levainPct);
  byId(doc, 'saltOut').textContent = percent(state.saltPct, 1);

  const sum = byId(doc, 'blendSum');
  sum.className = Math.abs(f.stats.sum - 100) > 0.5 ? 'blend-sum bad' : 'blend-sum';
  const sumValue = sum.querySelector('.v');
  if (sumValue) sumValue.textContent = percent(f.stats.sum);

  const blend = blendAdvice(f.stats);
  const blendHint = byId(doc, 'blendHint');
  blendHint.className = hintClass(blend.level);
  blendHint.textContent = blend.text;

  const hyd = hydrationAdvice(state.hydrationPct, f.stats);
  const hydHint = byId(doc, 'hydHint');
  hydHint.className = hintClass(hyd.level);
  hydHint.textContent = hyd.text;

  byId(doc, 'kTotal').textContent = grams(f.dough);
  byId(doc, 'kPer').textContent = grams(f.doughPerLoaf);
  byId(doc, 'kBaked').textContent = `~${grams(f.doughPerLoaf * (1 - EXPECTED_BAKE_LOSS))}`;
  byId(doc, 'kStr').textContent = decimal(f.stats.strength);

  // Levain build
  const side = (b.ratio.parts - 1) / 2;
  byId(doc, 'levainRatio').textContent = b.ratio.label;
  byId(doc, 'levainLines').replaceChildren(
    line(doc, 'Starter fra kjøleskapet', '1 del', grams(b.starter)),
    line(doc, 'Mel', `${side} deler — samme mel som starteren`, grams(b.flour)),
    line(doc, 'Vann', `${side} deler, ~28 °C`, grams(b.water)),
    line(doc, 'Bygget blir', 'halvt mel, halvt vann', grams(b.total), 'total'),
    line(doc, 'I deigen fredag', `${grams(b.usedFlour)} mel + ${grams(b.usedWater)} vann`, grams(b.used), 'split'),
    line(doc, 'Tilbake i glasset', 'ny starter til neste bak', grams(b.surplus), 'split'),
  );
  byId(doc, 'levainSplitHint').textContent =
    `Du bygger ${grams(b.total)}, ikke ${grams(b.used)}, fordi starteren må fôres uansett. ` +
    `Derfor er ikke de ${grams(b.flour)} melet i bygget det samme som melet som havner i brødet: ` +
    `bare ${grams(b.used)} av bygget går i deigen, og det inneholder ${grams(b.usedFlour)} mel. ` +
    `Resten følger med de ${grams(b.surplus)} du beholder. ` +
    '(Regnestykket forutsetter at starteren din står på 100 % hydrering — like deler mel og vann.)';

  // Dough: what you weigh out
  byId(doc, 'doughLines').replaceChildren(
    ...f.flours.map((x) => line(doc, x.flour.name, `${Math.round(x.sharePct)} % av melet du veier opp`, grams(x.grams))),
    line(doc, 'Vann', `hold igjen ${grams(f.holdBack)} til saltet`, grams(f.addedWater)),
    line(doc, 'Salt', `${percent(state.saltPct, 1)} av alt melet`, grams(f.salt)),
    line(doc, 'Levain', 'fra i går kveld', grams(f.levain)),
    line(doc, 'Deig totalt', state.loaves > 1 ? `${grams(f.doughPerLoaf)} × ${state.loaves} brød` : 'ett brød', grams(f.dough), 'total'),
  );

  // Reconciliation
  const inLevain = `i de ${grams(f.levain)} levain du bruker`;
  byId(doc, 'formulaLines').replaceChildren(
    line(doc, 'Mel i alt', `${grams(f.addedFlour)} veid opp + ${grams(f.levainFlour)} ${inLevain}`, grams(f.totalFlour)),
    line(doc, 'Vann i alt', `${grams(f.addedWater)} veid opp + ${grams(f.levainWater)} ${inLevain}`, grams(f.totalWater)),
    line(doc, 'Hydrering', 'vann i alt ÷ mel i alt', percent(state.hydrationPct), 'total'),
  );
  byId(doc, 'levainMathHint').textContent =
    `Hydreringen måles mot alt melet i brødet — også de ${grams(f.levainFlour)} som ligger inne i levainen. ` +
    `Derfor er ikke vannet du heller i ${grams(f.addedFlour)} × ${state.hydrationPct} %: ` +
    `halvparten av levainen er allerede vann, og de ${grams(f.levainWater)} er trukket fra. ` +
    `${grams(f.addedWater)} + ${grams(f.levainWater)} = ${grams(f.totalWater)}, ` +
    `som er ${state.hydrationPct} % av ${grams(f.totalFlour)}.`;
}
