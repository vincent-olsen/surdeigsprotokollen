import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// GitHub Pages cannot set response headers, so the policy ships as a <meta>.
// require-trusted-types-for makes Chromium reject innerHTML-style sinks,
// which the app never uses (see src/ui/dom.ts).
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "require-trusted-types-for 'script'",
].join('; ');

/** Build only: the dev server injects <style> tags and opens an HMR websocket. */
function contentSecurityPolicy(): Plugin {
  const anchor = '<meta charset="utf-8" />';
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      // A meta policy only covers elements after it, so it goes right after the charset.
      if (!html.includes(anchor)) throw new Error(`CSP: ${anchor} not found in index.html`);
      return html.replace(anchor, `${anchor}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

export default defineConfig({
  // Relative base: the build works unchanged on GitHub Pages
  // (/surdeigsprotokollen/), on a custom domain, and under `vite preview`.
  // Safe because the app is a single page with no client-side routing.
  base: './',
  plugins: [contentSecurityPolicy()],
  build: {
    target: 'es2022',
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/main.ts', 'src/test-utils/**'],
      thresholds: {
        'src/domain/**': { lines: 95, functions: 95, branches: 90, statements: 95 },
      },
    },
  },
});
