import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class MockUtterance {
      text: string;
      rate = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: MockUtterance });
    Object.defineProperty(window, 'speechSynthesis', { value: {
      cancel() {},
      speak(utterance: MockUtterance) { utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 10); },
    }});
  });
});

test('has a clear accessible primary screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Frame it. Hear it.' })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
});

test('loads a sample and supports the keyboard frame path', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Use sample' }).click();
  const canvas = page.getByLabel('Loaded image with movable reading frame');
  await expect(canvas).toBeVisible();
  await expect(page.getByRole('button', { name: 'Read framed text' })).toBeEnabled();
  const before = await page.locator('#frameDescription').textContent();
  await canvas.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.locator('#frameDescription')).not.toHaveText(before ?? '');
});

test('recognizes the local sample without an OCR API', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the expensive OCR smoke test once.');
  await page.goto('/');
  await page.getByRole('button', { name: 'Use sample' }).click();
  await page.getByRole('button', { name: 'Read framed text' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue(/north gate|opens at dawn/i, { timeout: 40_000 });
});

test('keeps the installed shell available offline', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Frame it. Hear it.' })).toBeVisible();
});

test('serves legal routes directly with one h1', async ({ page }) => {
  for (const path of ['/privacy', '/terms']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
});
