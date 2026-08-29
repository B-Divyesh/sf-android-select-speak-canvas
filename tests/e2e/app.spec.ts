import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    class MockUtterance {
      text: string; rate = 1;
      onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: MockUtterance });
    Object.defineProperty(window, 'speechSynthesis', { value: { cancel() { const state = window as unknown as { __tapreadCancelled?: number }; state.__tapreadCancelled = (state.__tapreadCancelled ?? 0) + 1; }, speak(utterance: MockUtterance) { const state = window as unknown as { __tapreadSpoken?: string; __tapreadSpeechLog?: string[] }; state.__tapreadSpoken = utterance.text; state.__tapreadSpeechLog = [...(state.__tapreadSpeechLog ?? []), utterance.text]; utterance.onstart?.(); setTimeout(() => utterance.onend?.(), 2_000); } }});
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
  await expect(page.locator('#updateToast')).toBeHidden();
  expect(errors).toEqual([]);
});

test('@claim:demo-isolation one click opens seeded isolated demo and reset affects only demo', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('tapread-theme', 'light'));
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
  await page.getByRole('button', { name: 'Use dark theme' }).click();
  expect(await page.evaluate(() => ({ normal: localStorage.getItem('tapread-theme'), demo: localStorage.getItem('demo:tapread-theme') }))).toEqual({ normal: 'light', demo: 'dark' });
  await page.locator('#recognizedText').fill('CHANGED DEMO TEXT');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue('The north gate opens at dawn.');
  expect(await page.evaluate(() => ({ normal: localStorage.getItem('tapread-theme'), demo: localStorage.getItem('demo:tapread-theme') }))).toEqual({ normal: 'light', demo: null });
  await page.getByRole('link', { name: 'Start for real' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue('REAL PRIVATE TEXT');
  const databases = await page.evaluate(async () => (await indexedDB.databases()).map((item) => item.name));
  expect(databases).toContain('tapread-canvas');
  expect(databases).not.toContain('demo:tapread-canvas');
  expect(await page.evaluate(() => localStorage.getItem('tapread-theme'))).toBe('light');
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

test('@claim:device-speech speaks user-corrected text with the browser voice', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  await page.locator('#recognizedText').fill('Corrected words to speak');
  await page.getByRole('button', { name: 'Speak edited text' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tapreadSpoken?: string }).__tapreadSpoken)).toBe('Corrected words to speak');
});

test('@claim:speech-stop cancels active speech and keeps the text', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  await page.locator('#recognizedText').fill('Stop this reading');
  const before = await page.evaluate(() => (window as unknown as { __tapreadCancelled?: number }).__tapreadCancelled ?? 0);
  await page.getByRole('button', { name: 'Speak edited text' }).click();
  await expect(page.getByRole('button', { name: 'Stop speech' })).toBeEnabled();
  await page.getByRole('button', { name: 'Stop speech' }).click();
  await expect(page.locator('#statusTitle')).toHaveText('Speech stopped');
  await expect(page.locator('#recognizedText')).toHaveValue('Stop this reading');
  expect(await page.evaluate(() => (window as unknown as { __tapreadCancelled?: number }).__tapreadCancelled ?? 0)).toBeGreaterThan(before);
});

test('@claim:repeat-reading replays the exact latest recognized text', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  await page.locator('#recognizedText').fill('Repeat this exact reading');
  await page.getByRole('button', { name: 'Speak edited text' }).click();
  await page.getByRole('button', { name: 'Repeat last reading' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __tapreadSpeechLog?: string[] }).__tapreadSpeechLog ?? [])).toEqual(['Repeat this exact reading', 'Repeat this exact reading']);
});

test('@claim:web-local-processing demo flow sends no cross-origin requests', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the OCR network audit once.');
  const requests: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  await page.locator('#recognizedText').fill('');
  await page.getByRole('button', { name: 'Read selected text' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue(/north gate|opens at dawn/i, { timeout: 40_000 });
  await expect(page.getByRole('button', { name: 'Read selected text' })).toBeEnabled();
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
  expect(requests.every((url) => url.startsWith('data:') || new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(errors).toEqual([]);
});

test('@claim:local-ocr recognizes the shipped sample', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the expensive OCR outcome once.');
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  await page.locator('#recognizedText').fill('');
  await page.getByRole('button', { name: 'Read selected text' }).click();
  await expect(page.locator('#recognizedText')).toHaveValue(/north gate|opens at dawn/i, { timeout: 40_000 });
  await expect(page.getByRole('button', { name: 'Read selected text' })).toBeEnabled();
});

test('@claim:image-size-limit accepts a valid 20 MB image and rejects one extra byte', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run the 40 MB transfer once.');
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  const png = await readFile('public/assets/icon-192.png');
  const atLimit = Buffer.alloc(20 * 1024 * 1024);
  png.copy(atLimit);
  await page.locator('#imageInput').setInputFiles({ name: 'at-limit.png', mimeType: 'image/png', buffer: atLimit });
  await expect(page.locator('#statusTitle')).toHaveText('Image ready');
  await page.locator('#imageInput').setInputFiles({ name: 'too-large.png', mimeType: 'image/png', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
  await expect(page.locator('#statusTitle')).toHaveText('Image is larger than 20 MB');
});

test('@claim:supported-image-formats opens PNG, JPEG, WebP, and GIF images', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Run format decoding once.');
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  const base = sharp({ create: { width: 48, height: 32, channels: 3, background: '#f2e7ce' } });
  const fixtures = [
    ['sample.png', 'image/png', await base.clone().png().toBuffer()],
    ['sample.jpg', 'image/jpeg', await base.clone().jpeg().toBuffer()],
    ['sample.webp', 'image/webp', await base.clone().webp().toBuffer()],
    ['sample.gif', 'image/gif', await base.clone().gif().toBuffer()],
  ] as const;
  for (const [name, mimeType, buffer] of fixtures) {
    await page.locator('#imageInput').setInputFiles({ name, mimeType, buffer });
    await expect(page.locator('#statusTitle')).toHaveText('Image ready');
    await expect(page.getByLabel('Loaded image with movable text selection')).toBeVisible();
  }
});

test('@claim:data-portability exports and imports reader data', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.locator('#statusTitle')).toHaveText('Sample ready');
  await page.locator('#recognizedText').fill('Exported sample passage');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export reader data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^tapread-export-\d{4}-\d{2}-\d{2}\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString()).state;
  expect(exported.text).toBe('Exported sample passage');
  expect(exported.rate).toBe(1);
  expect(exported.selection).toMatchObject({ x: expect.any(Number), y: expect.any(Number), width: expect.any(Number), height: expect.any(Number) });
  await page.locator('#importInput').setInputFiles({ name: 'reader-data.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, state: { text: 'Imported passage', rate: 1.2, selection: { x: .2, y: .2, width: .5, height: .4 }, updatedAt: 1 }, history: [] })) });
  await expect(page.locator('#recognizedText')).toHaveValue('Imported passage');
  await expect(page.locator('#rateInput')).toHaveValue('1.2');
  await expect(page.locator('#selectionDescription')).toContainText('50% wide by 40% high');
});

test('@claim:reader-state-persistence restores image, selection, text, and speed', async ({ page }) => {
  await page.goto('/demo');
  const canvas = page.getByLabel('Loaded image with movable text selection');
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  const selection = await page.locator('#selectionDescription').textContent();
  await page.locator('#recognizedText').fill('Saved exact passage');
  await page.locator('#rateInput').fill('1.4');
  await page.reload();
  await expect(canvas).toBeVisible();
  await expect(page.locator('#selectionDescription')).toHaveText(selection ?? '');
  await expect(page.locator('#recognizedText')).toHaveValue('Saved exact passage');
  await expect(page.locator('#rateInput')).toHaveValue('1.4');
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

test('@claim:keyboard-selection moves and resizes the selection with the keyboard', async ({ page }) => {
  await page.goto('/demo');
  const canvas = page.getByLabel('Loaded image with movable text selection');
  const before = await page.locator('#selectionDescription').textContent();
  await canvas.focus();
  await page.keyboard.press('ArrowRight');
  const moved = await page.locator('#selectionDescription').textContent();
  expect(moved).not.toBe(before);
  await page.keyboard.press('Shift+ArrowRight');
  await expect(page.locator('#selectionDescription')).not.toHaveText(moved ?? '');
});

test('@claim:pointer-selection changes the selection with a pointer drag', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Pointer claim runs in the mouse project.');
  await page.goto('/demo');
  const canvas = page.getByLabel('Loaded image with movable text selection');
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no box');
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .55, box.y + box.height * .55);
  await page.mouse.up();
  await expect(page.locator('#selectionDescription')).not.toContainText('80% wide');
});

test('@claim:touch-selection changes the selection with a touch drag', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch claim runs on the phone project.');
  await page.goto('/demo');
  const canvas = page.getByLabel('Loaded image with movable text selection');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no box');
  await canvas.dispatchEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: box.x + 15, clientY: box.y + 15 });
  await canvas.dispatchEvent('pointermove', { pointerId: 7, pointerType: 'touch', clientX: box.x + box.width * .6, clientY: box.y + box.height * .6 });
  await canvas.dispatchEvent('pointerup', { pointerId: 7, pointerType: 'touch', clientX: box.x + box.width * .6, clientY: box.y + box.height * .6 });
  await expect(page.locator('#selectionDescription')).toContainText('55% wide');
});

test('routes set titles, metadata, focus, history, and a designed 404', async ({ page }) => {
  await page.goto('/');
  await page.locator('.policy-link').scrollIntoViewIfNeeded();
  const beforeScroll = await page.evaluate(() => scrollY);
  await page.locator('.policy-link').click();
  await expect(page).toHaveTitle('Privacy — TapRead Canvas');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeFocused();
  await page.goBack();
  await expect(page).toHaveTitle('TapRead Canvas — hear selected image text');
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThanOrEqual(beforeScroll - 2);
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
  const undersized = await page.locator('a, button, input[type="range"], label.file-button, label.button').evaluateAll((nodes) => nodes.filter((node) => (node as HTMLElement).offsetParent !== null && !node.classList.contains('hidden')).map((node) => ({ name: (node.textContent || node.getAttribute('aria-label') || '').trim(), box: node.getBoundingClientRect().toJSON() })).filter(({ box }) => box.width < 44 || box.height < 44));
  expect(undersized).toEqual([]);
});

test('public version matches package and Android metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.build-note')).toContainText(/v1\.0\.0 · [0-9a-f]{7}/);
  await expect(page.locator('#androidDownload')).toHaveAttribute('href', /releases\/download\/v1\.0\.0\/tapread-canvas-1\.0\.0\.apk$/);
});

test('@claim:android-install published Android APK is downloadable', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Verify the 54 MB release once.');
  const response = await request.get('https://github.com/B-Divyesh/sf-android-select-speak-canvas/releases/download/v1.0.0/tapread-canvas-1.0.0.apk');
  expect(response.ok()).toBe(true);
  const body = await response.body();
  expect(body.subarray(0, 2).toString()).toBe('PK');
  expect(body.length).toBeGreaterThan(1_000_000);
  expect(createHash('sha256').update(body).digest('hex')).toBe('72e874c9df0ecae371e444100af2f78b348cc408ba88f56a236655e4efe89d8d');
});
