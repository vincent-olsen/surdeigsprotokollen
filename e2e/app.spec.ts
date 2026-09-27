import { expect, test, type Page } from '@playwright/test';

const sameOrigin = (url: string) => url.startsWith('http://localhost');

/**
 * Collects script errors and same-origin network failures — a wrong Vite
 * `base` shows up here as 404s on /assets. Third-party requests (Google Fonts)
 * are ignored so the test also passes offline.
 */
function trackProblems(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // Network failures are reported below, with their URL.
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) problems.push(`console: ${m.text()}`);
  });
  page.on('requestfailed', (r) => sameOrigin(r.url()) && problems.push(`failed: ${r.url()}`));
  page.on('response', (r) => sameOrigin(r.url()) && r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
  return problems;
}

test('loads under the GitHub Pages sub-path with no broken assets', async ({ page }) => {
  const problems = trackProblems(page);
  await page.goto('./');
  await expect(page).toHaveTitle('Surdeigsprotokollen');
  // #sched is empty in the static HTML, so steps here prove the bundle ran.
  await expect(page.locator('#sched .slot').first()).toBeVisible();
  await expect(page.locator('#levainRatio')).toHaveText('1:6:6');
  expect(problems).toEqual([]);
});

test('one loaf, 500 g, 72 %: the sums reconcile', async ({ page }) => {
  await page.goto('./');
  await page.locator('#loaves button[data-v="1"]').click();
  await page.locator('#presets button[data-p="lys"]').click();
  await page.locator('#hyd').fill('72');

  const dough = page.locator('#doughLines .line .g');
  await expect(dough).toHaveText(['450 g', '310 g', '10 g', '100 g', '870 g']);
  await expect(page.locator('#formulaLines .line .g')).toHaveText(['500 g', '360 g', '72 %']);
});

test('moving the alarm without moving the cut time raises a warning', async ({ page }) => {
  await page.goto('./');
  await page.locator('#wakeTime').fill('07:00');
  await expect(page.locator('#chkCool')).toHaveClass(/warn/);
  await expect(page.locator('#chkCoolN')).toContainText('11:50');
});

test('the levain info panel opens', async ({ page }) => {
  await page.goto('./');
  const panel = page.locator('details.info');
  await panel.locator('summary').click();
  await expect(panel.locator('#ratioRows tr')).toHaveCount(8);
});

test('does not scroll sideways', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#sched .slot').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
