import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base: the build works unchanged on GitHub Pages
  // (/surdeigsprotokollen/), on a custom domain, and under `vite preview`.
  // Safe because the app is a single page with no client-side routing.
  base: './',
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
