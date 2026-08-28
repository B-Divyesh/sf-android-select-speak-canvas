import './style.css';
import type { Worker } from 'tesseract.js';
import { BUY_URL, cachedUnlock, captureReturnedLicense, storeLicense, verifyLicense } from './license';
import { addHistory, exportLocalData, getValue, importLocalData, storeValue, type HistoryItem, type SavedState } from './storage';
import { clampSelection, defaultSelection, denormalizedSelection, normalizedSelection, sanitizeOcrText, type Selection } from './state';

const app = document.querySelector<HTMLDivElement>('#app')!;
const route = location.pathname.replace(/\/$/, '') || '/';

if (route === '/privacy' || route === '/terms') {
  renderLegal(route);
} else {
  renderProduct();
  void startProduct();
}

function header(): string {
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="TapRead Canvas home"><img src="/assets/brand-mark.svg" width="42" height="42" alt=""><span>TapRead Canvas</span></a>
    <div class="top-actions"><a class="text-link" href="/#how">How it works</a><a class="text-link" href="/#pricing">Unlock</a><button class="icon-button" id="themeButton" type="button" aria-label="Change colour theme" title="Change colour theme">◐</button></div>
  </header>`;
}

function footer(): string {
  return `<footer class="site-footer"><div class="footer-inner">
    <div><a class="brand" href="/" aria-label="TapRead Canvas home"><img src="/assets/brand-mark.svg" width="42" height="42" alt=""><span>TapRead Canvas</span></a><p class="footer-note">Private, local reading assistance for inaccessible pixels. The product illustration is original AI-generated artwork; it depicts the interaction, not protected-content capture.</p></div>
    <nav class="footer-links" aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-android-select-speak-canvas">Source</a></nav>
  </div></footer>`;
}

function renderProduct(): void {
  document.title = 'TapRead Canvas — frame it, hear it';
  app.innerHTML = `${header()}
  <main id="main">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">Private on-device reading aid</p>
        <h1 id="page-title">Frame it. Hear it.</h1>
        <p>On Android, TapRead can frame text over a game, stream, image, or custom canvas after your explicit screen-share approval. This web app is the private screenshot fallback. OCR and speech stay on this device.</p>
        <div class="hero-actions"><a class="button primary" href="#reader">Read an image</a><button class="button ghost hidden" id="installButton" type="button">Install app</button></div>
        <p class="privacy-line"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M10 1 3 4v5c0 4.6 2.8 8.3 7 10 4.2-1.7 7-5.4 7-10V4l-7-3Zm0 3 4 1.7V9c0 3.1-1.6 5.7-4 7.1C7.6 14.7 6 12.1 6 9V5.7L10 4Z"/></svg>No account. No upload. Works after the first offline install.</p>
      </div>
      <figure class="hero-visual"><picture><source type="image/avif" srcset="/assets/tapread-instrument-640.avif 640w, /assets/tapread-instrument-960.avif 960w" sizes="(max-width: 820px) calc(100vw - 48px), 42vw"><source type="image/webp" srcset="/assets/tapread-instrument-640.webp 640w, /assets/tapread-instrument-960.webp 960w" sizes="(max-width: 820px) calc(100vw - 48px), 42vw"><img src="/assets/tapread-instrument-960.jpg" width="960" height="640" alt="A cream and green reading instrument framing a line on its display beside an orange button and speaker" fetchpriority="high" decoding="async"></picture><figcaption class="caption">One precise gesture, like tuning an instrument.</figcaption></figure>
    </section>

    <section class="instrument-wrap" id="reader" aria-labelledby="reader-title">
      <div class="section-heading"><div><p class="eyebrow">The local reader</p><h2 id="reader-title">Tune in to the words</h2><p>This web fallback uses a screenshot or saved image. On Android, the companion offers the same framing control directly over a screen you choose to share.</p></div><span class="network-state" id="networkState">Ready locally</span></div>
      <div class="instrument">
        <div class="screen-well" id="dropZone">
          <div class="screen-empty" id="emptyState"><svg viewBox="0 0 100 70" fill="none" aria-hidden="true"><path d="M8 24V8h18M92 24V8H74M8 46v16h18M92 46v16H74" stroke="currentColor" stroke-width="5"/><path d="m35 42 10-8 9 7 11-15 12 20H25l10-4Z" fill="currentColor" opacity=".7"/></svg><h3>No image on the glass</h3><p>Load a screenshot, paste an image, or use the sample to learn the controls.</p></div>
          <canvas id="imageCanvas" tabindex="0" aria-label="Loaded image with movable reading frame" aria-describedby="canvasHelp"></canvas>
          <p class="canvas-help hidden" id="canvasHelp">Drag to frame text. Keyboard: arrows move; Shift + arrows resize.</p>
        </div>
        <div class="controls">
          <section class="control-group"><h3><span class="step-number">1</span> Load</h3><p>Screenshot or image, up to 20 MB.</p><label class="file-button">Choose an image<input id="imageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><div class="button-row"><button class="button" id="sampleButton" type="button">Use sample</button><button class="button hidden" id="clearButton" type="button">Clear</button></div></section>
          <section class="control-group"><h3><span class="step-number">2</span> Frame</h3><p id="frameDescription">A frame appears after loading. Tight regions read faster.</p><button class="button" id="resetFrameButton" type="button" disabled>Reset frame</button></section>
          <section class="control-group"><h3><span class="step-number">3</span> Listen</h3><div class="dial-row"><label for="rateInput">Speech speed</label><output class="dial-value" id="rateValue" for="rateInput">1.0×</output></div><input id="rateInput" type="range" min="0.6" max="1.6" step="0.1" value="1" aria-label="Speech speed"><button class="button primary read-button" id="readButton" type="button" disabled>Read framed text</button><button class="button" id="repeatButton" type="button" disabled>Repeat last reading</button></section>
        </div>
      </div>
      <div class="output-panel">
        <div><label for="recognizedText">Recognized text <span class="tiny-label">editable before speaking</span></label><textarea id="recognizedText" placeholder="Recognized words will appear here." spellcheck="true"></textarea><div class="button-row"><button class="button ghost" id="speakEditedButton" type="button" disabled>Speak edited text</button><button class="button ghost" id="stopButton" type="button" disabled>Stop speech</button></div></div>
        <div class="status-box" id="statusBox" data-kind="idle" role="status" aria-live="polite"><strong id="statusTitle">Waiting for an image</strong><p id="statusText">Nothing leaves your browser.</p><div class="progress hidden" id="progress" aria-hidden="true"><span id="progressBar"></span></div></div>
      </div>
      <aside class="notice"><strong>Sensitive or protected screens:</strong> check the screenshot before loading it. TapRead never bypasses Android or DRM capture protections; protected content may appear black.</aside>
    </section>

    <section class="how" id="how" aria-labelledby="how-title"><p class="eyebrow">A narrow tool by design</p><h2 id="how-title">Three moves, then back to what mattered</h2><div class="how-grid"><article><h3>Choose the pixels</h3><p>In the Android companion, enable TapRead once, tap its floating button, and approve Android’s screen-share prompt. In this web fallback, take a screenshot or choose one from Photos.</p></article><article><h3>Frame only the words</h3><p>Draw one rectangle. A smaller frame reduces noise and makes local English OCR faster. Android remembers your last frame for the next reading.</p></article><article><h3>Listen or correct</h3><p>TapRead speaks through your device’s own voices. Android can repeat the last reading; this fallback lets you edit OCR mistakes before replaying.</p></article></div></section>

    <section class="ownership" aria-labelledby="privacy-title"><div><p class="eyebrow">Your pixels stay yours</p><h2 id="privacy-title">Local from lens to voice</h2></div><div><ul><li>English OCR runs in WebAssembly on this device.</li><li>Speech uses your browser or Android system voice.</li><li>The most recent image and result are stored only in local app storage.</li><li>No analytics, advertising IDs, account, or cloud OCR.</li></ul></div></section>

    <section class="pricing" id="pricing" aria-labelledby="pricing-title"><div class="pricing-shell"><div class="pricing-copy"><p class="eyebrow">Optional supporter unlock</p><h2 id="pricing-title">Keep the core reader free</h2><p class="price">₹499 <small>one-time purchase</small></p><p>Reading, repeating, editing, data export and offline use are always free. The supporter unlock adds a private list of your last 25 recognized passages.</p><ul><li>One device-local reading history</li><li>No subscription or usage meter</li><li>Sociobot/Dodo is merchant of record</li></ul><a class="button primary" id="buyButton" href="${BUY_URL}">Buy supporter unlock</a></div><div class="license-panel"><h3>Restore a purchase</h3><p>Paste the license token from your receipt or another device.</p><label for="licenseInput">License token</label><div class="input-row"><input id="licenseInput" autocomplete="off" spellcheck="false"><button class="button" id="restoreButton" type="button">Verify</button></div><p class="license-status" id="licenseStatus" role="status">Free reader active.</p><div id="historyPanel" class="hidden"><h3>Recent passages</h3><ol id="historyList"></ol></div><div class="data-tools"><h3>Your local data</h3><p>Move or inspect it whenever you want.</p><button class="button ghost" id="exportButton" type="button">Export JSON</button><label class="button ghost">Import JSON<input class="sr-only" id="importInput" type="file" accept="application/json"></label></div></div></div></section>
  </main>
  ${footer()}
  <div class="toast" id="updateToast" role="status"><span>A new version is ready.</span><button class="button" id="updateButton" type="button">Update</button></div>`;
}

function renderLegal(path: string): void {
  const privacy = path === '/privacy';
  document.title = `${privacy ? 'Privacy' : 'Terms'} — TapRead Canvas`;
  app.innerHTML = `${header()}<main id="main" class="legal">${privacy ? privacyCopy() : termsCopy()}</main>${footer()}`;
  setupTheme();
}

function privacyCopy(): string {
  return `<p class="eyebrow">Plain-language policy</p><h1>Privacy</h1><p class="updated">Effective 28 August 2026</p><p>TapRead Canvas is designed so the product does not need to receive your images or recognized text.</p><h2>What stays on your device</h2><p>In the Android companion, the floating control appears only after you enable its accessibility service. That service does not inspect screen text or accessibility trees. When you tap it, Android shows its own screen-share approval; the selected pixels, OCR result, last frame, and last reading stay on your device. OCR and speech run locally. The web fallback stores chosen images, selected regions, recognized text, speech preferences, supporter history, and your license token in browser storage on your device.</p><h2>What leaves your device</h2><p>We do not use analytics, advertising trackers, third-party fonts, or cloud OCR. If you buy or verify a supporter license, your browser contacts the Sociobot billing API. Checkout is operated by Sociobot/Dodo as merchant of record and has its own transaction records. TapRead sends only the license token for verification.</p><h2>Your control</h2><p>You can turn off the Android accessibility service in Android Settings at any time. You can clear site data in browser settings, export your TapRead data as JSON, or replace it by importing a prior export. Removing the app also removes local data on browsers that couple installed-app and site storage.</p><h2>Contact</h2><p>Questions can be filed in the public project repository linked in the footer.</p>`;
}

function termsCopy(): string {
  return `<p class="eyebrow">Product terms</p><h1>Terms</h1><p class="updated">Effective 28 August 2026</p><p>TapRead Canvas is an assistive utility for reading text from images you are allowed to capture and process.</p><h2>Android companion disclosure</h2><p>The Android companion uses an accessibility service solely to place the TapRead control you enable. It does not read accessibility trees or automate another app. Screen pixels are requested only after you tap that control and Android presents its standard screen-share approval. You may turn the service off in Android Settings at any time.</p><h2>Acceptable use</h2><p>Do not use TapRead to bypass DRM, Android secure-screen protections, copyright controls, or another person’s privacy. Protected captures may appear black; TapRead refuses them and will not attempt to defeat that protection.</p><h2>Accuracy and safety</h2><p>OCR and text-to-speech can make mistakes. Do not rely on the output for medication, emergency, legal, financial, or other safety-critical decisions without checking the source.</p><h2>Purchase</h2><p>The ₹499 supporter unlock is a one-time license for local history features. Core reading and data export stay free. Sociobot/Dodo is the merchant of record and handles checkout and refunds. A refunded or revoked license stops unlocking supporter features.</p><h2>Warranty</h2><p>The software is provided “as is,” without warranties, to the extent allowed by law. These terms do not limit rights that cannot legally be limited.</p>`;
}

async function startProduct(): Promise<void> {
  setupTheme();
  const canvas = document.querySelector<HTMLCanvasElement>('#imageCanvas')!;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  const emptyState = document.querySelector<HTMLElement>('#emptyState')!;
  const canvasHelp = document.querySelector<HTMLElement>('#canvasHelp')!;
  const imageInput = document.querySelector<HTMLInputElement>('#imageInput')!;
  const readButton = document.querySelector<HTMLButtonElement>('#readButton')!;
  const repeatButton = document.querySelector<HTMLButtonElement>('#repeatButton')!;
  const resetFrameButton = document.querySelector<HTMLButtonElement>('#resetFrameButton')!;
  const clearButton = document.querySelector<HTMLButtonElement>('#clearButton')!;
  const recognizedText = document.querySelector<HTMLTextAreaElement>('#recognizedText')!;
  const speakEditedButton = document.querySelector<HTMLButtonElement>('#speakEditedButton')!;
  const stopButton = document.querySelector<HTMLButtonElement>('#stopButton')!;
  const rateInput = document.querySelector<HTMLInputElement>('#rateInput')!;
  const rateValue = document.querySelector<HTMLOutputElement>('#rateValue')!;
  const frameDescription = document.querySelector<HTMLElement>('#frameDescription')!;
  let selection: Selection | null = null;
  let worker: Worker | null = null;
  let pointerStart: { x: number; y: number } | null = null;
  let isUnlocked = cachedUnlock();

  const saved = await getValue<SavedState>('state').catch(() => undefined);
  if (saved) {
    recognizedText.value = saved.text;
    rateInput.value = String(saved.rate || 1);
    rateValue.value = `${Number(rateInput.value).toFixed(1)}×`;
    setTextButtons();
  }
  const savedBlob = await getValue<Blob>('image').catch(() => undefined);
  if (savedBlob instanceof Blob) await loadBlob(savedBlob, false, saved?.selection);

  function draw(): void {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sourceCanvas, 0, 0);
    if (!selection) return;
    const { x, y, width, height } = selection;
    context.save();
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.rect(x, y, width, height);
    context.fillStyle = 'rgb(4 12 10 / 54%)';
    context.fill('evenodd');
    context.strokeStyle = '#ff7a3b';
    context.lineWidth = Math.max(4, canvas.width / 280);
    context.strokeRect(x, y, width, height);
    context.fillStyle = '#ffcf78';
    const handle = Math.max(10, canvas.width / 100);
    for (const [hx, hy] of [[x, y], [x + width, y], [x, y + height], [x + width, y + height]]) context.fillRect(hx - handle / 2, hy - handle / 2, handle, handle);
    context.restore();
    const pct = normalizedSelection(selection, canvas.width, canvas.height);
    frameDescription.textContent = `Frame: ${Math.round(pct.width * 100)}% wide × ${Math.round(pct.height * 100)}% high.`;
  }

  async function loadBlob(blob: Blob, save = true, priorSelection?: Selection): Promise<void> {
    if (!blob.type.startsWith('image/')) return setStatus('That is not an image', 'Choose a PNG, JPEG, WebP, or GIF file.', 'error');
    if (blob.size > 20 * 1024 * 1024) return setStatus('Image is too large', 'Choose an image smaller than 20 MB.', 'error');
    const bitmap = await createImageBitmap(blob).catch(() => null);
    if (!bitmap) return setStatus('Image could not be opened', 'Try saving it as a PNG or JPEG, then load it again.', 'error');
    const scale = Math.min(1, 2000 / bitmap.width, 2000 / bitmap.height);
    canvas.width = sourceCanvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = sourceCanvas.height = Math.max(1, Math.round(bitmap.height * scale));
    sourceContext.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    selection = priorSelection ? denormalizedSelection(priorSelection, canvas.width, canvas.height) : defaultSelection(canvas.width, canvas.height);
    emptyState.classList.add('hidden');
    canvas.classList.add('loaded');
    canvasHelp.classList.remove('hidden');
    clearButton.classList.remove('hidden');
    readButton.disabled = false;
    resetFrameButton.disabled = false;
    draw();
    setStatus('Image ready', 'Drag a tight frame around the words, then read.', 'success');
    if (save) await storeValue('image', blob).catch(storageError);
    await saveState();
  }

  function point(event: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height };
  }

  canvas.addEventListener('pointerdown', (event) => {
    pointerStart = point(event);
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!pointerStart) return;
    const current = point(event);
    selection = clampSelection({ x: Math.min(pointerStart.x, current.x), y: Math.min(pointerStart.y, current.y), width: Math.abs(current.x - pointerStart.x), height: Math.abs(current.y - pointerStart.y) }, canvas.width, canvas.height);
    draw();
  });
  canvas.addEventListener('pointerup', () => { pointerStart = null; void saveState(); });
  canvas.addEventListener('keydown', (event) => {
    if (!selection || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const step = event.ctrlKey ? 1 : Math.max(4, Math.round(canvas.width / 150));
    const horizontal = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const vertical = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    selection = event.shiftKey
      ? clampSelection({ ...selection, width: selection.width + horizontal, height: selection.height + vertical }, canvas.width, canvas.height)
      : clampSelection({ ...selection, x: selection.x + horizontal, y: selection.y + vertical }, canvas.width, canvas.height);
    draw();
    void saveState();
  });

  async function recognize(): Promise<void> {
    if (!selection) return;
    readButton.disabled = true;
    setStatus('Warming up local OCR', 'The first reading prepares the offline English model.', 'idle', 2);
    try {
      if (!worker) {
        const { createWorker, OEM, PSM } = await import('tesseract.js');
        worker = await createWorker('eng', OEM.LSTM_ONLY, {
          workerPath: '/vendor/tesseract-worker.min.js',
          langPath: '/vendor',
          corePath: '/vendor/tesseract-core-simd-lstm.wasm.js',
          gzip: true,
          logger(message) {
            if (typeof message.progress === 'number') setStatus('Reading the frame', readableStage(message.status), 'idle', Math.max(3, message.progress * 100));
          },
        });
        await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
      }
      const crop = document.createElement('canvas');
      crop.width = Math.max(1, Math.round(selection.width));
      crop.height = Math.max(1, Math.round(selection.height));
      crop.getContext('2d')!.drawImage(sourceCanvas, selection.x, selection.y, selection.width, selection.height, 0, 0, crop.width, crop.height);
      const result = await worker.recognize(crop);
      const text = sanitizeOcrText(result.data.text);
      if (!text) {
        setStatus('No words found', 'Tighten the frame, increase screenshot contrast, or choose a clearer image.', 'error');
      } else {
        recognizedText.value = text;
        setTextButtons();
        setStatus('Words recognized', `${Math.round(result.data.confidence)}% OCR confidence. Speaking now.`, 'success');
        speak(text);
        if (isUnlocked) { await addHistory({ text, createdAt: Date.now() }); await renderHistory(); }
        await saveState();
      }
    } catch (error) {
      const offline = !navigator.onLine;
      setStatus('Local reader could not start', offline ? 'Reconnect once so the OCR model can finish installing, then it will work offline.' : 'Reload the app and try the frame again.', 'error');
      console.error('OCR error', error);
    } finally {
      readButton.disabled = !selection;
    }
  }

  function speak(text: string): void {
    if (!('speechSynthesis' in window)) return setStatus('Speech is unavailable', 'Use a browser with device text-to-speech, or read the recognized text below.', 'error');
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number(rateInput.value);
    utterance.onstart = () => { stopButton.disabled = false; setStatus('Speaking', 'Use Stop speech whenever you need it.', 'success'); };
    utterance.onend = () => { stopButton.disabled = true; setStatus('Reading complete', 'Repeat it or adjust the frame for another passage.', 'success'); };
    utterance.onerror = () => { stopButton.disabled = true; setStatus('Speech stopped', 'Choose Speak edited text to try again.', 'error'); };
    speechSynthesis.speak(utterance);
  }

  function setTextButtons(): void {
    const hasText = Boolean(recognizedText.value.trim());
    repeatButton.disabled = !hasText;
    speakEditedButton.disabled = !hasText;
  }

  async function saveState(): Promise<void> {
    const state: SavedState = { text: recognizedText.value, rate: Number(rateInput.value), selection: selection ? normalizedSelection(selection, canvas.width, canvas.height) : undefined, updatedAt: Date.now() };
    await storeValue('state', state).catch(storageError);
  }

  function storageError(): void { setStatus('Could not save locally', 'Your browser may be in private mode. Reading still works in this session.', 'error'); }

  imageInput.addEventListener('change', () => { const file = imageInput.files?.[0]; if (file) void loadBlob(file); });
  document.addEventListener('paste', (event) => { const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith('image/')); const file = item?.getAsFile(); if (file) { event.preventDefault(); void loadBlob(file); } });
  const dropZone = document.querySelector<HTMLElement>('#dropZone')!;
  dropZone.addEventListener('dragover', (event) => event.preventDefault());
  dropZone.addEventListener('drop', (event) => { event.preventDefault(); const file = event.dataTransfer?.files[0]; if (file) void loadBlob(file); });
  document.querySelector('#sampleButton')!.addEventListener('click', () => void makeSample().then((blob) => loadBlob(blob)));
  clearButton.addEventListener('click', () => {
    canvas.classList.remove('loaded'); canvasHelp.classList.add('hidden'); emptyState.classList.remove('hidden'); clearButton.classList.add('hidden'); selection = null; readButton.disabled = true; resetFrameButton.disabled = true; void storeValue('image', null); setStatus('Image cleared', 'Choose another image when you are ready.', 'idle');
  });
  resetFrameButton.addEventListener('click', () => { selection = defaultSelection(canvas.width, canvas.height); draw(); void saveState(); });
  readButton.addEventListener('click', () => void recognize());
  repeatButton.addEventListener('click', () => speak(recognizedText.value.trim()));
  speakEditedButton.addEventListener('click', () => speak(recognizedText.value.trim()));
  stopButton.addEventListener('click', () => { speechSynthesis.cancel(); stopButton.disabled = true; setStatus('Speech stopped', 'Your recognized text is still here.', 'idle'); });
  recognizedText.addEventListener('input', () => { setTextButtons(); void saveState(); });
  rateInput.addEventListener('input', () => { rateValue.value = `${Number(rateInput.value).toFixed(1)}×`; void saveState(); });

  setupNetwork();
  setupInstall();
  setupDataTools();
  captureReturnedLicense();
  updateUnlockUi();
  void verifyLicense().then((verdict) => { if (verdict) { isUnlocked = verdict.valid; updateUnlockUi(verdict.reason); } }).catch(() => updateLicenseStatus(isUnlocked ? 'Offline — using your last verified license.' : 'License verification needs a connection. Free reader is ready.'));

  document.querySelector('#restoreButton')!.addEventListener('click', async () => {
    const input = document.querySelector<HTMLInputElement>('#licenseInput')!;
    if (!input.value.trim()) return updateLicenseStatus('Paste a license token first.');
    storeLicense(input.value);
    updateLicenseStatus('Checking license…');
    try { const verdict = await verifyLicense(true); isUnlocked = Boolean(verdict?.valid); updateUnlockUi(verdict?.reason); }
    catch { updateLicenseStatus('Could not reach license verification. Try again when online.'); }
  });

  async function updateUnlockUi(reason?: string): Promise<void> {
    document.querySelector('#historyPanel')!.classList.toggle('hidden', !isUnlocked);
    updateLicenseStatus(isUnlocked ? 'Supporter unlock active on this device.' : reason && reason !== 'ok' ? 'License no longer active. The free reader remains available.' : 'Free reader active.');
    if (isUnlocked) await renderHistory();
  }

  async function renderHistory(): Promise<void> {
    const list = document.querySelector<HTMLOListElement>('#historyList')!;
    const items = (await getValue<HistoryItem[]>('history').catch(() => [])) ?? [];
    list.replaceChildren(...items.slice(0, 5).map((item) => { const li = document.createElement('li'); li.textContent = item.text.length > 90 ? `${item.text.slice(0, 90)}…` : item.text; return li; }));
    if (!items.length) { const li = document.createElement('li'); li.textContent = 'Your next successful reading will appear here.'; list.append(li); }
  }

  function updateLicenseStatus(message: string): void { document.querySelector('#licenseStatus')!.textContent = message; }
}

function setStatus(title: string, message: string, kind: 'idle' | 'success' | 'error', progress?: number): void {
  document.querySelector('#statusTitle')!.textContent = title;
  document.querySelector('#statusText')!.textContent = message;
  document.querySelector('#statusBox')!.setAttribute('data-kind', kind);
  const meter = document.querySelector<HTMLElement>('#progress')!;
  meter.classList.toggle('hidden', progress === undefined);
  document.querySelector<HTMLElement>('#progressBar')!.style.setProperty('--progress', `${progress ?? 0}%`);
}

function readableStage(stage: string): string {
  const stages: Record<string, string> = { 'loading tesseract core': 'Loading the local reading engine…', 'initializing tesseract': 'Starting the local reading engine…', 'loading language traineddata': 'Loading the offline English model…', 'initializing api': 'Preparing English recognition…', 'recognizing text': 'Looking for letters inside the frame…' };
  return stages[stage] || 'Working entirely on this device…';
}

async function makeSample(): Promise<Blob> {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 700;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f2e7ce'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#254c45'; ctx.fillRect(55, 55, 1090, 590); ctx.fillStyle = '#fff8e8'; ctx.font = '700 72px Arial'; ctx.fillText('The north gate', 140, 265); ctx.fillText('opens at dawn.', 140, 365); ctx.fillStyle = '#f29a67'; ctx.fillRect(140, 420, 550, 12); ctx.font = '36px Arial'; ctx.fillStyle = '#fff8e8'; ctx.fillText('TapRead training card 01', 140, 510);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
}

function setupTheme(): void {
  const button = document.querySelector<HTMLButtonElement>('#themeButton'); if (!button) return;
  const stored = localStorage.getItem('tapread-theme'); if (stored === 'light' || stored === 'dark') document.documentElement.dataset.theme = stored;
  button.addEventListener('click', () => { const current = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); const next = current === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem('tapread-theme', next); button.setAttribute('aria-label', `Use ${current} theme`); });
}

function setupNetwork(): void {
  const update = () => { const el = document.querySelector('#networkState')!; el.textContent = navigator.onLine ? 'Ready locally' : 'Offline mode'; el.classList.toggle('offline', !navigator.onLine); };
  addEventListener('online', update); addEventListener('offline', update); update();
}

function setupInstall(): void {
  let prompt: BeforeInstallPromptEvent | null = null;
  const button = document.querySelector<HTMLButtonElement>('#installButton')!;
  addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); prompt = event as BeforeInstallPromptEvent; button.classList.remove('hidden'); });
  button.addEventListener('click', async () => { await prompt?.prompt(); prompt = null; button.classList.add('hidden'); });
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration);
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.waiting && navigator.serviceWorker.controller) showUpdate(registration); }));
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('tapread-refresh-update') === '1') {
        sessionStorage.removeItem('tapread-refresh-update');
        location.reload();
      }
    });
  }
}

function showUpdate(registration: ServiceWorkerRegistration): void {
  document.querySelector('#updateToast')?.classList.add('visible');
  document.querySelector('#updateButton')?.addEventListener('click', () => {
    sessionStorage.setItem('tapread-refresh-update', '1');
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }, { once: true });
}

function setupDataTools(): void {
  document.querySelector('#exportButton')!.addEventListener('click', async () => { const blob = new Blob([await exportLocalData()], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `tapread-export-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); });
  document.querySelector<HTMLInputElement>('#importInput')!.addEventListener('change', async (event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return; try { await importLocalData(await file.text()); location.reload(); } catch (error) { setStatus('Import failed', error instanceof Error ? error.message : 'Choose a valid TapRead JSON export.', 'error'); } });
}

interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; }
