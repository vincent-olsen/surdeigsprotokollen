// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadIndexHtml } from '../test-utils/page';
import { createApp } from './app';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el;
};
const text = (sel: string) => $(sel).textContent?.replace(/\s+/g, ' ').trim() ?? '';
const lines = (sel: string) =>
  [...document.querySelectorAll(`${sel} .line`)].map((l) => [l.children[0]!.firstChild!.textContent, l.children[1]!.textContent]);

const type = (sel: string, value: string, event: 'input' | 'change' = 'input') => {
  const input = $<HTMLInputElement | HTMLSelectElement>(sel);
  input.value = value;
  input.dispatchEvent(new Event(event, { bubbles: true }));
};
const click = (sel: string) => $(sel).click();

beforeEach(() => {
  loadIndexHtml(document);
  createApp(document);
});

describe('app — first render', () => {
  it('shows the default recipe', () => {
    expect(text('#kTotal')).toBe('1740 g');
    expect(text('#kPer')).toBe('870 g');
    expect(text('#levainRatio')).toBe('1:6:6');
    expect(text('#hydHint')).toContain('72 %');
  });

  it('renders the schedule from Thursday to Saturday', () => {
    const days = [...document.querySelectorAll('#sched .day-head > span:first-child')].map((e) => e.textContent);
    expect(days).toEqual(['Torsdag', 'Fredag', 'Lørdag']);
    expect(text('#sched .slot .slot-time')).toBe('22:00');
    expect(document.querySelectorAll('#sched .slot-note strong').length).toBeGreaterThan(5);
  });

  it('builds all controls from state', () => {
    expect(document.querySelectorAll('#blend input')).toHaveLength(6);
    expect(document.querySelectorAll('#ratioSel option')).toHaveLength(9);
    expect($<HTMLInputElement>('#cutTime').value).toBe('10:30');
    expect($('#loaves button[data-v="2"]').getAttribute('aria-pressed')).toBe('true');
  });
});

describe('app — the two sums Vincent checked', () => {
  beforeEach(() => {
    click('#loaves button[data-v="1"]');
    click('#presets button[data-p="lys"]');
    type('#hyd', '72');
  });

  it('weighed flour + flour in the used levain = 500 g; water reconciles to 72 %', () => {
    expect(lines('#doughLines')).toEqual([
      ['Siktet hvetemel', '450 g'],
      ['Vann', '310 g'],
      ['Salt', '10 g'],
      ['Levain', '100 g'],
      ['Deig totalt', '870 g'],
    ]);
    expect(lines('#formulaLines')).toEqual([
      ['Mel i alt', '500 g'],
      ['Vann i alt', '360 g'],
      ['Hydrering', '72 %'],
    ]);
  });

  it('shows the build separately from what goes into the dough', () => {
    expect(lines('#levainLines')).toEqual([
      ['Starter fra kjøleskapet', '10 g'],
      ['Mel', '60 g'],
      ['Vann', '60 g'],
      ['Bygget blir', '130 g'],
      ['I deigen fredag', '100 g'],
      ['Tilbake i glasset', '30 g'],
    ]);
  });
});

describe('app — interactions', () => {
  it('a preset resets hydration to the blend recommendation', () => {
    type('#hyd', '80');
    click('#presets button[data-p="lys"]');
    expect($<HTMLInputElement>('#hyd').value).toBe('70');
    expect(text('#hydOut')).toBe('70 %');
  });

  it('flags a blend that does not sum to 100', () => {
    type('#b_rug', '100');
    expect($('#blendSum').className).toContain('bad');
    expect(text('#blendSum .v')).toBe('200 %');
  });

  it('warns when the alarm leaves too little cooling', () => {
    type('#wakeTime', '07:00');
    expect($('#chkCool').className).toContain('warn');
    expect(text('#chkCoolN')).toContain('11:50');
    expect(text('#sched .day:last-of-type .slot:last-of-type .slot-note')).toMatch(/^Bare 1 t 40 min avkjøling/);
  });

  it('a manual ratio moves the slack into the retard', () => {
    type('#ratioSel', '1:1:1', 'change');
    expect(text('#ratioHint')).toBe('Ditt valg. Auto ville brukt 1:6:6 her.');
    expect(text('#levainRatio')).toBe('1:1:1');
    expect($('#chkRetard').className).toContain('warn');
  });

  it('ignores invalid input instead of rendering NaN', () => {
    type('#flourPer', '');
    type('#cutTime', '');
    expect(text('#kTotal')).toBe('1740 g');
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('marks the current loaf in the bake-loss table', () => {
    click('#loaves button[data-v="1"]');
    type('#flourPer', '600');
    expect(text('#lossRows tr.is-you td:first-child')).toBe(`${Math.round(600 * 1.74)} g`);
  });
});

describe('app — wiring', () => {
  it('fails loudly if index.html is missing an element', () => {
    document.body.innerHTML = '';
    expect(() => createApp(document)).toThrow(/mangler i index.html/);
  });
});
