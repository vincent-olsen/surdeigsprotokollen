import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Loads the <body> of the real index.html into the jsdom document. */
export function loadIndexHtml(doc: Document): void {
  // Vitest runs from the project root. (import.meta.url + URL would pick up
  // jsdom's URL class, which node:fs rejects.)
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1];
  if (!body) throw new Error('Fant ikke <body> i index.html');
  doc.body.innerHTML = body;
}
