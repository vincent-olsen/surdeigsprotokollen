import type { Level } from '../domain/checks';
import type { Rich } from '../domain/steps';

export function byId<T extends HTMLElement = HTMLElement>(doc: Document, id: string): T {
  const el = doc.getElementById(id);
  if (!el) throw new Error(`#${id} mangler i index.html`);
  return el as T;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Renders rich text with DOM nodes — no innerHTML anywhere in the app. */
export function setRich(target: HTMLElement, content: Rich): void {
  const doc = target.ownerDocument;
  target.replaceChildren(
    ...content.map((part) => (typeof part === 'string' ? doc.createTextNode(part) : el(doc, 'strong', undefined, part.strong))),
  );
}

export type LineVariant = 'total' | 'split' | 'sub';

/** One row in a result card: label, optional subtext, value on the right. */
export function line(doc: Document, label: string, sub: string | null, value: string, variant?: LineVariant): HTMLElement {
  const row = el(doc, 'div', variant ? `line ${variant}` : 'line');
  const left = el(doc, 'div', undefined, label);
  if (sub) left.append(el(doc, 'small', undefined, sub));
  row.append(left, el(doc, 'div', 'g', value));
  return row;
}

export function hintClass(level: Level): string {
  return level === 'info' ? 'hint' : `hint ${level}`;
}
