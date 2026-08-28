import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class MockUtterance {
      text: string; rate = 1;
      onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: MockUtterance });
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel() {}, speak(utterance: MockUtterance) { utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 10); } }});
  });
});

test('first screen states the job and offers a working sample', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hear selected image text aloud' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('@claim:demo-isolation one click opens seeded isolated demo and reset affects only demo', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('tapread-canvas', 1);
      open.onupgradeneeded = () => open.result.createObjectStore('local-data');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction('local-data', 'readwrite');
        tx.objectStore('local-data').put({ text: 'REAL PRIVATE TEXT', rate: 1, updatedAt: Date.now() }, 'state');
        tx.oncomplete = () => { open.result.close(); resolve(); };
      };
    });
  });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#recognizedText')).toHaveValue('The north gate opens at dawn.');
  await page.locator('#recognizedText').fill('CHANGED DEMO TEXT');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue('The north gate opens at dawn.');
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue('REAL PRIVATE TEXT');
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  expect(databases).toContain('tapread-canvas');
  expect(databases).not.toContain('demo:tapread-canvas');
  await page.goto('/?demo=1');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#recognizedText')).toHaveValue('The north gate opens at dawn.');
});

test('@claim:no-account-free demo and reader work without sign-in or payment', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('No account needed.')).toBeVisible();
  await expect(page.getByText('Free to use.')).toBeVisible();
  await expect(page.locator('input[type="email"], input[type="password"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /buy|checkout|subscribe/i })).toHaveCount(0);
  await page.getByRole('button', { name: 'Speak edited text' }).click();
  await expect(page.locator('#statusTitle')).toContainText(/Speaking|Reading complete/);
});

test('@claim:web-local-processing demo flow sends no cross-origin requests', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the OCR network audit once.');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Read selected text' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue(/north gate|opens at dawn/i, { timeout: 40_000 });
  const stored = await page.evaluate(async () => new Promise<{ hasImage: boolean; text: string }>((resolve, reject) => {
    const open = indexedDB.open('demo:tapread-canvas');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const tx = open.result.transaction('local-data');
      const image = tx.objectStore('local-data').get('image');
      const state = tx.objectStore('local-data').get('state');
      tx.oncomplete = () => { open.result.close(); resolve({ hasImage: image.result instanceof Blob, text: state.result.text }); };
    };
  }));
  expect(stored.hasImage).toBe(true);
  expect(stored.text).toMatch(/north gate|opens at dawn/i);
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every((url) => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
});

test('@claim:local-ocr recognizes the shipped sample', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the expensive OCR outcome once.');
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Read selected text' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue(/north gate|opens at dawn/i, { timeout: 40_000 });
});

test('@claim:image-size-limit accepts a valid 20 MB image and rejects one extra byte', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the 40 MB transfer once.');
  await page.goto('/demo');
  const png = await readFile('public/assets/icon-192.png');
  const atLimit = Buffer.alloc(20 * 1024 * 1024);
  png.copy(atLimit);
  await page.locator('#imageInput').setInputFiles({ name: 'at-limit.png', mimeType: 'image/png', buffer: atLimit });
  await expect(page.locator('#statusTitle')).toHaveText('Image ready');
  await page.locator('#imageInput').setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
  await expect(page.locator('#statusTitle')).toHaveText('Image is larger than 20 MB');
});

test('@claim:data-portability exports and imports reader data', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#recognizedText').fill('Exported sample passage');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reader data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^tapread-export-\d{4}-\d{2}-\d{2}\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(JSON.parse(Buffer.concat(chunks).toString()).state.text).toBe('Exported sample passage');
  await page.locator('#importInput').setInputFiles({ name: 'reader-data.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, state: { text: 'Imported passage', rate: 1.2, updatedAt: 1 }, history: [] })) });
  await expect(page.locator('#recognizedText')).toHaveValue('Imported passage');
});

test('@claim:offline-reload keeps the demo available after installation', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('#recognizedText')).toHaveValue('The north gate opens at dawn.');
});

test('selection is fully operable with a keyboard', async ({ page }) => {
  await page.goto('/demo');
  const canvas = page.getByLabel('Loaded image with movable text selection');
  const before = await page.locator('#selectionDescription').textContent();
  await canvas.focus();
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.locator('#selectionDescription')).not.toHaveText(before ?? '');
});

test('routes set titles, metadata, focus, history, and a designed 404', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy', exact: true }).first().click();
  await expect(page).toHaveTitle('Privacy — TapRead Canvas');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveTitle('TapRead Canvas — hear selected image text');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.goto('/terms');
  await expect(page).toHaveTitle('Terms — TapRead Canvas');
  await page.goto('/does-not-exist');
  await expect(page).toHaveTitle('Page not found — TapRead Canvas');
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to TapRead Canvas' })).toBeVisible();
});

test('every route has complete metadata and no accessibility violations', async ({ page }) => {
  for (const path of ['/', '/demo', '/privacy', '/terms', '/404']) {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\//);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /tapread-social\.jpg$/);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('mobile layout has no horizontal overflow and keeps controls reachable', async ({ page }) => {
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start for real' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy', exact: true }).first()).toBeVisible();
});
