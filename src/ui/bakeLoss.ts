import { bakeLossRows } from '../domain/bakeLoss';
import type { Recipe } from '../domain/recipe';
import { byId, el } from './dom';

export function renderBakeLoss(doc: Document, recipe: Recipe): void {
  byId(doc, 'lossRows').replaceChildren(
    ...bakeLossRows(recipe.formula.doughPerLoaf).map((r) => {
      const tr = el(doc, 'tr', r.isCurrent ? 'is-you' : undefined);
      tr.append(
        el(doc, 'td', r.isCurrent ? 'k n' : 'n', `${r.doughWeight} g`),
        el(doc, 'td', 'n', `${r.targetMin}–${r.targetMax} g`),
        el(doc, 'td', 'n', `${r.underbakedAbove} g`),
      );
      return tr;
    }),
  );
}
