import './style.css';
import type { Worker } from 'tesseract.js';
import { exportLocalData, getValue, importLocalData, resetDemoStorage, storeValue, useStorageNamespace, type SavedState } from './storage';
import { clampSelection, defaultSelection, denormalizedSelection, normalizedSelection, sanitizeOcrText, type Selection } from './state';

const app = document.querySelector<HTMLDivElement>('#app')!;
const SITE = 'https://android-select-speak-canvas.sociobot.in';
const ANDROID_APK = 'https://github.com/B-Divyesh/sf-android-select-speak-canvas/releases/download/v1.0.0/tapread-canvas-1.0.0.apk';
let cleanProduct: (() => void) | undefined;
declare const __APP_VERSION__: string;
declare const __BUILD_ID__: string;

function pathName(): string {
  const path = location.pathname.replace(/\/$/, '') || '/';
  return path === '/404.html' ? '/404' : path;
}

function isDemoRoute(): boolean {
  return pathName() === '/demo' || new URLSearchParams(location.search).get('demo') === '1';
}

function pageHeader(): string {
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="TapRead Canvas home"><img src="/assets/brand-mark.svg" width="42" height="42" alt=""><span>TapRead Canvas</span></a>
    <nav class="top-actions" aria-label="Main navigation"><a class="text-link" href="/demo">Demo</a><a class="text-link" href="/#how">How it works</a><a class="text-link" href="/privacy">Privacy</a><button class="icon-button" id="themeButton" type="button" aria-label="Use dark theme" title="Change colour theme">◐</button></nav>
  </header>`;
}

function pageFooter(): string {
  return `<footer class="site-footer"><div class="footer-inner">
    <div><a class="brand" href="/" aria-label="TapRead Canvas home"><img src="/assets/brand-mark.svg" width="42" height="42" alt=""><span>TapRead Canvas</span></a><p class="footer-note">Read selected screen or image text aloud on your device.</p><p class="build-note">Built by Param Factory · v${__APP_VERSION__} · ${__BUILD_ID__}</p></div>
    <nav class="footer-links" aria-label="Footer navigation"><a href="/demo">Demo</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="https://github.com/B-Divyesh/sf-android-select-speak-canvas" rel="external">Source (external)</a></nav>
    <p class="art-note">The original product illustration was generated for TapRead Canvas.</p>
  </div></footer>`;
}

function demoBanner(): string {
  return `<section class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button class="banner-action" id="resetDemo" type="button">Reset demo</button><a class="banner-action" id="startReal" href="/">Start for real</a></div></section>`;
}

function instrumentMarkup(): string {
  return `<section class="instrument-wrap" id="reader" aria-labelledby="reader-title">
    <div class="section-heading"><div><p class="eyebrow">Web image reader</p><h2 id="reader-title">Read a screenshot or image</h2><p>Choose an image, adjust the selection, then hear the selected text.</p></div><span class="network-state" id="networkState">Ready for an image</span></div>
    <div class="instrument">
      <div class="screen-well" id="dropZone">
        <div class="screen-empty" id="emptyState"><svg viewBox="0 0 100 70" fill="none" aria-hidden="true"><path d="M8 24V8h18M92 24V8H74M8 46v16h18M92 46v16H74" stroke="currentColor" stroke-width="5"/><path d="m35 42 10-8 9 7 11-15 12 20H25l10-4Z" fill="currentColor" opacity=".7"/></svg><h3>No image loaded</h3><p>Choose, paste, or drop an image. You can also load the sample.</p></div>
        <canvas id="imageCanvas" tabindex="0" aria-label="Loaded image with movable text selection" aria-describedby="canvasHelp"></canvas><p class="canvas-help hidden" id="canvasHelp">Drag to adjust the selection. Arrows move it. Shift plus arrows resize it.</p>
      </div>
      <div class="controls">
        <section class="control-group"><h3><span class="step-number">1</span> Load an image</h3><p>PNG, JPEG, WebP, or GIF. Maximum size: 20 MB.</p><label class="file-button">Choose an image<input id="imageInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label><div class="button-row"><button class="button" id="sampleButton" type="button">Load sample image</button><button class="button hidden" id="clearButton" type="button">Clear image</button></div></section>
        <section class="control-group"><h3><span class="step-number">2</span> Adjust the selection</h3><p id="selectionDescription">A selection appears after loading.</p><button class="button" id="resetSelectionButton" type="button" disabled>Reset selection</button></section>
        <section class="control-group"><h3><span class="step-number">3</span> Hear the text</h3><div class="dial-row"><label for="rateInput">Speech speed</label><output class="dial-value" id="rateValue" for="rateInput">1.0×</output></div><input id="rateInput" type="range" min="0.6" max="1.6" step="0.1" value="1"><button class="button primary read-button" id="readButton" type="button" disabled>Read selected text</button><button class="button" id="repeatButton" type="button" disabled>Repeat last reading</button></section>
      </div>
    </div>
    <div class="output-panel"><div><label for="recognizedText">Recognized text <span class="tiny-label">You can correct it before speaking.</span></label><textarea id="recognizedText" placeholder="Recognized text will appear here." spellcheck="true"></textarea><div class="button-row"><button class="button ghost" id="speakEditedButton" type="button" disabled>Speak edited text</button><button class="button ghost" id="stopButton" type="button" disabled>Stop speech</button></div></div><div class="status-box" id="statusBox" data-kind="idle" role="status" aria-live="polite"><strong id="statusTitle">Waiting for an image</strong><p id="statusText">Choose an image to begin.</p><div class="progress hidden" id="progress" aria-hidden="true"><span id="progressBar"></span></div></div></div>
    <section class="notice" aria-labelledby="protected-title"><strong id="protected-title">Protected screens</strong><p>Check each screenshot before loading it. TapRead does not bypass Android capture controls. A protected capture may appear black.</p></section>
  </section>`;
}

function productMarkup(demo: boolean): string {
  return `${demo ? demoBanner() : ''}${pageHeader()}<main id="main"><section class="hero${demo ? ' demo-hero' : ''}" aria-labelledby="page-title"><div class="hero-copy"><p class="eyebrow">Android and web image reader</p><h1 id="page-title" tabindex="-1">Hear selected image text aloud</h1><p>For Android users facing unlabeled text, select words on screen or in an image and hear them spoken.</p>${demo ? '<p class="demo-ready">The sample is loaded below with recognized text ready to speak.</p>' : `<div class="hero-actions"><a class="button primary" href="/demo">Try it with sample data</a><span>Loads a sample image with text ready to hear.</span><a class="button ghost" id="androidDownload" href="${ANDROID_APK}" rel="external download">Install TapRead for Android</a><button class="button ghost hidden" id="installButton" type="button">Install web image reader</button></div>`}<ul class="fact-list"><li>No account needed.</li><li>Images stay on your device.</li><li>Free to use.</li></ul></div>${demo ? '' : '<figure class="hero-visual"><picture><source type="image/avif" srcset="/assets/tapread-instrument-640.avif 640w, /assets/tapread-instrument-960.avif 960w" sizes="(max-width: 820px) calc(100vw - 32px), 42vw"><source type="image/webp" srcset="/assets/tapread-instrument-640.webp 640w, /assets/tapread-instrument-960.webp 960w" sizes="(max-width: 820px) calc(100vw - 32px), 42vw"><img src="/assets/tapread-instrument-960.jpg" width="960" height="640" alt="A cream and green reading instrument showing an orange text selection" fetchpriority="high" decoding="async"></picture><figcaption class="caption">The orange rectangle marks the text TapRead will read.</figcaption></figure>'}</section>
    ${instrumentMarkup()}
    <section class="walkthrough" aria-labelledby="walkthrough-title"><p class="eyebrow">Android walkthrough</p><h2 id="walkthrough-title">Read another app’s screen</h2><button class="button primary hidden native-only" id="nativeDemoButton" type="button">Load sample screen</button><ol class="walkthrough-grid"><li><div class="walk-screen"><span class="sample-app">Sample game</span><span class="float-control">TapRead</span></div><h3>Tap the floating button</h3><p>TapRead opens Android’s screen-share prompt.</p></li><li><div class="walk-screen consent-screen"><span>Share this screen?</span><strong>Start now</strong></div><h3>Approve screen sharing</h3><p>Android asks before every new capture.</p></li><li><div class="walk-screen selection-screen"><span>The north gate opens at dawn.</span><i></i></div><h3>Draw one selection</h3><p>Place the orange rectangle around the words.</p></li><li><div class="walk-screen speech-screen"><span>Speaking</span><strong>The north gate opens at dawn.</strong></div><h3>Hear or repeat the text</h3><p>Use your device voice, then repeat the last reading.</p></li></ol></section>
    <section class="how" id="how" aria-labelledby="how-title"><p class="eyebrow">Three steps</p><h2 id="how-title">How to read text aloud</h2><div class="how-grid"><article><h3>Choose the image</h3><p>On Android, enable TapRead and tap its floating button. Approve Android’s screen-share prompt for that capture session.</p><p>In the web image reader, choose or paste a screenshot.</p></article><article><h3>Adjust the selection</h3><p>Place one selection around the words. Android remembers the last selection for the next reading.</p></article><article><h3>Hear or correct the text</h3><p>Your device recognizes and speaks the text. You can correct recognized text before speaking it again.</p></article></div></section>
    <section class="ownership" aria-labelledby="privacy-title"><div><p class="eyebrow">Local processing and storage</p><h2 id="privacy-title">What stays on your device</h2></div><div><ul><li>The web image reader recognizes English text on this device.</li><li>Speech uses a voice installed on your browser or Android device.</li><li>Your latest web image, selection, text, and speed stay in browser storage.</li><li>The web reader makes no analytics, advertising, account, or cloud-recognition requests.</li></ul><p><a class="policy-link" href="/privacy">Read the privacy policy</a>.</p></div></section>
    <section class="data-section" aria-labelledby="data-title"><div><p class="eyebrow">Your saved data</p><h2 id="data-title">Export or import your reader data</h2><p>Download a backup of your saved text and settings. Import the same file on this device later.</p></div><div class="data-tools"><button class="button ghost" id="exportButton" type="button">Export reader data</button><label class="button ghost">Import reader data<input class="sr-only" id="importInput" type="file" accept="application/json"></label></div></section></main>${pageFooter()}<div class="toast" id="updateToast" role="status"><span>A new version is ready.</span><button class="button" id="updateButton" type="button" aria-label="Reload updated app">Reload updated app</button></div>`;
}

function legalMarkup(kind: 'privacy' | 'terms'): string {
  const privacy = kind === 'privacy';
  return `${pageHeader()}<main id="main" class="legal"><p class="eyebrow">${privacy ? 'Plain-language policy' : 'Product terms'}</p><h1 tabindex="-1">${privacy ? 'Privacy' : 'Terms'}</h1><p class="updated">Effective 29 August 2026</p>${privacy ? privacyCopy() : termsCopy()}</main>${pageFooter()}`;
}

function privacyCopy(): string {
  return `<p>TapRead processes chosen images and recognized text on your device.</p><h2>Data kept on your device</h2><p>The Android control appears only after you enable its accessibility service. The service does not inspect accessibility trees or window content.</p><p>Android asks for screen-share approval after you tap the control. Android backup is disabled for captured and recognized content.</p><p>The web image reader stores your latest image, selection, text, and speech speed in browser storage. Demo storage is separate and is discarded when you choose Start for real.</p><h2>Network use</h2><p>The Android app has no network permission. Recognition and speech run through bundled or installed Android services.</p><p>The web reader has no analytics, advertising trackers, third-party fonts, accounts, or cloud text recognition. Its first visit downloads recognition files from this site.</p><h2>Your control</h2><p>Turn off the Android service in Android Settings at any time. Clear web data in browser settings. You can also export or import your web reader data.</p><h2>Contact</h2><p>Questions can be filed in the public source repository linked below.</p>`;
}

function termsCopy(): string {
  return `<p>TapRead reads text from images you are allowed to capture and process.</p><h2>Android service</h2><p>The Android service places the TapRead control on screen. It does not inspect accessibility trees or automate another app.</p><p>Android asks for screen-share approval after you tap the control. Turn off the service in Android Settings at any time.</p><h2>Acceptable use</h2><p>Do not use TapRead to bypass protected screens, copyright controls, or another person’s privacy. Protected captures may appear black. TapRead refuses blank captures instead of defeating those controls.</p><h2>Accuracy and safety</h2><p>Text recognition and speech can make mistakes. Check the source before using output for safety, medical, legal, or financial decisions.</p><h2>Price and license</h2><p>TapRead is free software under the MIT License. There is no paid offer in this release.</p><h2>Warranty</h2><p>The software is provided “as is,” without warranties, to the extent allowed by law. These terms do not limit rights that cannot legally be limited.</p>`;
}

function notFoundMarkup(): string {
  return `${pageHeader()}<main id="main" class="not-found"><p class="eyebrow">Unknown address</p><h1 tabindex="-1">Page not found</h1><p>That address does not match a TapRead Canvas page.</p><a class="button primary" href="/">Go to TapRead Canvas</a></main>${pageFooter()}`;
}

function setMetadata(route: string): void {
  const data: Record<string, [string, string, string]> = {
    '/': ['TapRead Canvas — hear selected image text', 'Select text in a screenshot or Android screen and hear it read aloud on your device.', '/'],
    '/demo': ['Demo — TapRead Canvas', 'Try TapRead Canvas with an isolated sample image and recognized text.', '/demo'],
    '/privacy': ['Privacy — TapRead Canvas', 'Learn what TapRead Canvas stores and how image text stays on your device.', '/privacy'],
    '/terms': ['Terms — TapRead Canvas', 'Read the terms for using TapRead Canvas.', '/terms'],
    '/404': ['Page not found — TapRead Canvas', 'This TapRead Canvas page could not be found.', '/404'],
  };
  const [title, description, canonicalPath] = data[route] ?? data['/404'];
  document.title = title;
  document.querySelector<HTMLMetaElement>('meta[name="description"]')!.content = description;
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')!.content = title;
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')!.content = description;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')!.content = title;
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')!.content = description;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')!.href = `${SITE}${canonicalPath}`;
}

type RouteRender = { focusHeading?: boolean; restoreScroll?: number };

async function renderRoute(options: RouteRender = {}): Promise<void> {
  cleanProduct?.(); cleanProduct = undefined;
  const rawPath = pathName();
  const demo = isDemoRoute();
  const route = demo ? '/demo' : rawPath;
  document.body.classList.toggle('demo-mode', demo);
  if (route === '/' || route === '/demo') {
    useStorageNamespace(demo); setMetadata(route); app.innerHTML = productMarkup(demo); cleanProduct = await startProduct(demo);
  } else if (route === '/privacy' || route === '/terms') {
    setMetadata(route); app.innerHTML = legalMarkup(route.slice(1) as 'privacy' | 'terms'); setupTheme(false);
  } else {
    setMetadata('/404'); app.innerHTML = notFoundMarkup(); setupTheme(false);
  }
  const heading = app.querySelector<HTMLElement>('h1');
  document.querySelector<HTMLElement>('#routeAnnouncement')!.textContent = `${document.title}. Page loaded.`;
  requestAnimationFrame(() => {
    if (typeof options.restoreScroll === 'number') scrollTo(0, options.restoreScroll);
    else if (options.focusHeading) heading?.focus();
  });
}

history.scrollRestoration = 'manual';
if (!history.state?.tapreadEntry) history.replaceState({ tapreadEntry: crypto.randomUUID(), scrollY: 0 }, '');
document.addEventListener('click', (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
  if (!link || link.target || link.download || link.origin !== location.origin) return;
  const destination = new URL(link.href);
  if (destination.pathname === location.pathname && destination.search === location.search && destination.hash) return;
  event.preventDefault();
  history.replaceState({ ...history.state, scrollY }, '');
  history.pushState({ tapreadEntry: crypto.randomUUID(), scrollY: 0 }, '', `${destination.pathname}${destination.search}${destination.hash}`);
  void renderRoute({ focusHeading: true }).then(() => destination.hash && document.querySelector(destination.hash)?.scrollIntoView());
});
addEventListener('popstate', (event) => void renderRoute({ restoreScroll: Number((event as PopStateEvent).state?.scrollY) || 0 }));
void renderRoute();

async function startProduct(demo: boolean): Promise<() => void> {
  setupTheme(demo);
  const canvas = document.querySelector<HTMLCanvasElement>('#imageCanvas')!;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const sourceCanvas = document.createElement('canvas');
  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true })!;
  const emptyState = document.querySelector<HTMLElement>('#emptyState')!;
  const canvasHelp = document.querySelector<HTMLElement>('#canvasHelp')!;
  const imageInput = document.querySelector<HTMLInputElement>('#imageInput')!;
  const readButton = document.querySelector<HTMLButtonElement>('#readButton')!;
  const repeatButton = document.querySelector<HTMLButtonElement>('#repeatButton')!;
  const resetSelectionButton = document.querySelector<HTMLButtonElement>('#resetSelectionButton')!;
  const clearButton = document.querySelector<HTMLButtonElement>('#clearButton')!;
  const recognizedText = document.querySelector<HTMLTextAreaElement>('#recognizedText')!;
  const speakEditedButton = document.querySelector<HTMLButtonElement>('#speakEditedButton')!;
  const stopButton = document.querySelector<HTMLButtonElement>('#stopButton')!;
  const rateInput = document.querySelector<HTMLInputElement>('#rateInput')!;
  const rateValue = document.querySelector<HTMLOutputElement>('#rateValue')!;
  const selectionDescription = document.querySelector<HTMLElement>('#selectionDescription')!;
  let selection: Selection | null = null;
  let worker: Worker | null = null;
  let pointerStart: { x: number; y: number } | null = null;

  const saved = await getValue<SavedState>('state').catch(() => undefined);
  if (saved) { recognizedText.value = saved.text; rateInput.value = String(saved.rate || 1); rateValue.value = `${Number(rateInput.value).toFixed(1)}×`; setTextButtons(); }
  const savedBlob = await getValue<Blob>('image').catch(() => undefined);
  if (savedBlob instanceof Blob) await loadBlob(savedBlob, false, saved?.selection);
  if (demo && !(savedBlob instanceof Blob)) { await loadBlob(await makeSample()); recognizedText.value = 'The north gate opens at dawn.'; setTextButtons(); await saveState(); setStatus('Sample ready', 'Adjust the selection or speak the sample text.', 'success'); }

  function draw(): void {
    context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(sourceCanvas, 0, 0); if (!selection) return;
    const { x, y, width, height } = selection; context.save(); context.beginPath(); context.rect(0, 0, canvas.width, canvas.height); context.rect(x, y, width, height); context.fillStyle = 'rgb(4 12 10 / 54%)'; context.fill('evenodd'); context.strokeStyle = '#ff7a3b'; context.lineWidth = Math.max(4, canvas.width / 280); context.strokeRect(x, y, width, height); context.fillStyle = '#ffcf78'; const handle = Math.max(10, canvas.width / 100);
    for (const [hx, hy] of [[x, y], [x + width, y], [x, y + height], [x + width, y + height]]) context.fillRect(hx - handle / 2, hy - handle / 2, handle, handle);
    context.restore(); const pct = normalizedSelection(selection, canvas.width, canvas.height); selectionDescription.textContent = `Selection: ${Math.round(pct.x * 100)}% from left, ${Math.round(pct.y * 100)}% from top, ${Math.round(pct.width * 100)}% wide by ${Math.round(pct.height * 100)}% high.`;
  }

  async function loadBlob(blob: Blob, save = true, priorSelection?: Selection): Promise<void> {
    if (!blob.type.startsWith('image/')) return setStatus('That file is not an image', 'Choose a PNG, JPEG, WebP, or GIF file.', 'error');
    if (blob.size > 20 * 1024 * 1024) return setStatus('Image is larger than 20 MB', 'Choose an image that is 20 MB or smaller.', 'error');
    const bitmap = await createImageBitmap(blob).catch(() => null); if (!bitmap) return setStatus('The image could not be opened', 'Save it as a PNG or JPEG, then choose it again.', 'error');
    const scale = Math.min(1, 2000 / bitmap.width, 2000 / bitmap.height); canvas.width = sourceCanvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = sourceCanvas.height = Math.max(1, Math.round(bitmap.height * scale)); sourceContext.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close(); selection = priorSelection ? denormalizedSelection(priorSelection, canvas.width, canvas.height) : defaultSelection(canvas.width, canvas.height);
    emptyState.classList.add('hidden'); canvas.classList.add('loaded'); canvasHelp.classList.remove('hidden'); clearButton.classList.remove('hidden'); readButton.disabled = false; resetSelectionButton.disabled = false; draw(); setStatus('Image ready', 'Adjust the selection, then read the selected text.', 'success'); if (save) await storeValue('image', blob).catch(storageError); await saveState();
  }

  function point(event: PointerEvent): { x: number; y: number } { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * canvas.width / rect.width, y: (event.clientY - rect.top) * canvas.height / rect.height }; }
  canvas.addEventListener('pointerdown', (event) => { pointerStart = point(event); canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => { if (!pointerStart) return; const current = point(event); selection = clampSelection({ x: Math.min(pointerStart.x, current.x), y: Math.min(pointerStart.y, current.y), width: Math.abs(current.x - pointerStart.x), height: Math.abs(current.y - pointerStart.y) }, canvas.width, canvas.height); draw(); });
  canvas.addEventListener('pointerup', () => { pointerStart = null; void saveState(); });
  canvas.addEventListener('keydown', (event) => { if (!selection || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); const step = event.ctrlKey ? 1 : Math.max(4, Math.round(canvas.width / 150)); const horizontal = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0; const vertical = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0; selection = event.shiftKey ? clampSelection({ ...selection, width: selection.width + horizontal, height: selection.height + vertical }, canvas.width, canvas.height) : clampSelection({ ...selection, x: selection.x + horizontal, y: selection.y + vertical }, canvas.width, canvas.height); draw(); void saveState(); });

  async function recognize(): Promise<void> {
    if (!selection) return; readButton.disabled = true; setStatus('Preparing text recognition', 'The first reading loads the English recognition files.', 'idle', 2);
    try {
      if (!worker) { const { createWorker, OEM, PSM } = await import('tesseract.js'); worker = await createWorker('eng', OEM.LSTM_ONLY, { workerPath: '/vendor/tesseract-worker.min.js', langPath: '/vendor', corePath: '/vendor/tesseract-core-simd-lstm.wasm.js', gzip: true, logger(message) { if (typeof message.progress === 'number') setStatus('Reading the selection', readableStage(message.status), 'idle', Math.max(3, message.progress * 100)); } }); await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO }); }
      const crop = document.createElement('canvas'); crop.width = Math.max(1, Math.round(selection.width)); crop.height = Math.max(1, Math.round(selection.height)); crop.getContext('2d')!.drawImage(sourceCanvas, selection.x, selection.y, selection.width, selection.height, 0, 0, crop.width, crop.height); const result = await worker.recognize(crop); const text = sanitizeOcrText(result.data.text);
      if (!text) setStatus('No words found', 'Tighten the selection or choose a clearer image.', 'error'); else { recognizedText.value = text; setTextButtons(); setStatus('Text recognized', 'Speaking the recognized text now.', 'success'); speak(text); await saveState(); }
    } catch (error) { setStatus('Text recognition could not start', navigator.onLine ? 'Reload the app and try again.' : 'Reconnect once to finish installing the recognition files.', 'error'); console.error('Text recognition error', error); } finally { readButton.disabled = !selection; }
  }

  function speak(text: string): void {
    if (!('speechSynthesis' in window)) return setStatus('Speech is unavailable', 'Use a browser with device speech, or read the recognized text.', 'error'); speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = Number(rateInput.value); utterance.onstart = () => { stopButton.disabled = false; setStatus('Speaking', 'Choose Stop speech whenever you need it.', 'success'); }; utterance.onend = () => { stopButton.disabled = true; setStatus('Reading complete', 'Repeat the text or adjust the selection.', 'success'); }; utterance.onerror = () => { stopButton.disabled = true; setStatus('Speech stopped', 'Choose Speak edited text to try again.', 'error'); }; speechSynthesis.speak(utterance);
  }

  function setTextButtons(): void { const hasText = Boolean(recognizedText.value.trim()); repeatButton.disabled = !hasText; speakEditedButton.disabled = !hasText; }
  async function saveState(): Promise<void> { const state: SavedState = { text: recognizedText.value, rate: Number(rateInput.value), selection: selection ? normalizedSelection(selection, canvas.width, canvas.height) : undefined, updatedAt: Date.now() }; await storeValue('state', state).catch(storageError); }
  function storageError(): void { setStatus('Reader data could not be saved', 'Reading still works in this tab. Check your browser storage settings.', 'error'); }

  imageInput.addEventListener('change', () => { const file = imageInput.files?.[0]; if (file) void loadBlob(file); });
  const pasteHandler = (event: ClipboardEvent) => { const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith('image/')); const file = item?.getAsFile(); if (file) { event.preventDefault(); void loadBlob(file); } };
  document.addEventListener('paste', pasteHandler); const dropZone = document.querySelector<HTMLElement>('#dropZone')!; dropZone.addEventListener('dragover', (event) => event.preventDefault()); dropZone.addEventListener('drop', (event) => { event.preventDefault(); const file = event.dataTransfer?.files[0]; if (file) void loadBlob(file); });
  document.querySelector('#sampleButton')!.addEventListener('click', () => void makeSample().then((blob) => loadBlob(blob)));
  clearButton.addEventListener('click', () => { canvas.classList.remove('loaded'); canvasHelp.classList.add('hidden'); emptyState.classList.remove('hidden'); clearButton.classList.add('hidden'); selection = null; recognizedText.value = ''; setTextButtons(); readButton.disabled = true; resetSelectionButton.disabled = true; void storeValue('image', null); void saveState(); setStatus('Image cleared', 'Choose another image when you are ready.', 'idle'); });
  resetSelectionButton.addEventListener('click', () => { selection = defaultSelection(canvas.width, canvas.height); draw(); void saveState(); }); readButton.addEventListener('click', () => void recognize()); repeatButton.addEventListener('click', () => speak(recognizedText.value.trim())); speakEditedButton.addEventListener('click', () => speak(recognizedText.value.trim())); stopButton.addEventListener('click', () => { speechSynthesis.cancel(); stopButton.disabled = true; setStatus('Speech stopped', 'Your recognized text is still available.', 'idle'); }); recognizedText.addEventListener('input', () => { setTextButtons(); void saveState(); }); rateInput.addEventListener('input', () => { rateValue.value = `${Number(rateInput.value).toFixed(1)}×`; void saveState(); });
  document.querySelector<HTMLButtonElement>('#resetDemo')?.addEventListener('click', async () => { await resetDemoStorage(); location.assign('/demo'); }); document.querySelector('#startReal')?.addEventListener('click', () => void resetDemoStorage());
  setupNetwork(); setupInstall(); setupNativeDemo(); setupDataTools();
  return () => { document.removeEventListener('paste', pasteHandler); void worker?.terminate(); };
}

function setStatus(title: string, message: string, kind: 'idle' | 'success' | 'error', progress?: number): void { document.querySelector('#statusTitle')!.textContent = title; document.querySelector('#statusText')!.textContent = message; document.querySelector('#statusBox')!.setAttribute('data-kind', kind); const meter = document.querySelector<HTMLElement>('#progress')!; meter.classList.toggle('hidden', progress === undefined); document.querySelector<HTMLElement>('#progressBar')!.style.setProperty('--progress', `${progress ?? 0}%`); }
function readableStage(stage: string): string { const stages: Record<string, string> = { 'loading tesseract core': 'Loading the reading engine…', 'initializing tesseract': 'Starting the reading engine…', 'loading language traineddata': 'Loading English recognition…', 'initializing api': 'Preparing English recognition…', 'recognizing text': 'Looking for letters in the selection…' }; return stages[stage] || 'Working on this device…'; }
async function makeSample(): Promise<Blob> { const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 700; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f2e7ce'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#254c45'; ctx.fillRect(55, 55, 1090, 590); ctx.fillStyle = '#fff8e8'; ctx.font = '700 72px Arial'; ctx.fillText('The north gate', 140, 265); ctx.fillText('opens at dawn.', 140, 365); ctx.fillStyle = '#f29a67'; ctx.fillRect(140, 420, 550, 12); ctx.font = '36px Arial'; ctx.fillStyle = '#fff8e8'; ctx.fillText('TapRead training card 01', 140, 510); return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png')); }

function setupTheme(demo: boolean): void { const button = document.querySelector<HTMLButtonElement>('#themeButton'); if (!button) return; const key = demo ? 'demo:tapread-theme' : 'tapread-theme'; delete document.documentElement.dataset.theme; const stored = localStorage.getItem(key); if (stored === 'light' || stored === 'dark') document.documentElement.dataset.theme = stored; const currentTheme = () => document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); button.setAttribute('aria-label', `Use ${currentTheme() === 'dark' ? 'light' : 'dark'} theme`); button.addEventListener('click', () => { const next = currentTheme() === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = next; localStorage.setItem(key, next); button.setAttribute('aria-label', `Use ${next === 'dark' ? 'light' : 'dark'} theme`); }); }
function setupNetwork(): void { const update = () => { const el = document.querySelector('#networkState'); if (!el) return; el.textContent = navigator.onLine ? 'Ready for an image' : 'Offline mode'; el.classList.toggle('offline', !navigator.onLine); }; addEventListener('online', update, { once: true }); addEventListener('offline', update, { once: true }); update(); }
function setupInstall(): void { const button = document.querySelector<HTMLButtonElement>('#installButton'); let prompt: BeforeInstallPromptEvent | null = null; addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); prompt = event as BeforeInstallPromptEvent; button?.classList.remove('hidden'); }, { once: true }); button?.addEventListener('click', async () => { await prompt?.prompt(); prompt = null; button.classList.add('hidden'); }); if ('serviceWorker' in navigator) { const hadController = Boolean(navigator.serviceWorker.controller); void navigator.serviceWorker.register('/sw.js').then((registration) => { if (registration.waiting && hadController) showUpdate(registration); registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => { if (registration.waiting && hadController) showUpdate(registration); })); }); } }
function setupNativeDemo(): void { const capacitor = (window as unknown as { Capacitor?: { isNativePlatform(): boolean } }).Capacitor; const button = document.querySelector<HTMLButtonElement>('#nativeDemoButton'); if (!button || !capacitor?.isNativePlatform()) return; button.classList.remove('hidden'); button.addEventListener('click', () => { location.href = 'tapread://sample'; }); }
function showUpdate(registration: ServiceWorkerRegistration): void { document.querySelector('#updateToast')?.classList.add('visible'); document.querySelector('#updateButton')?.addEventListener('click', () => { registration.waiting?.postMessage({ type: 'SKIP_WAITING' }); location.reload(); }, { once: true }); }
function setupDataTools(): void { document.querySelector('#exportButton')?.addEventListener('click', async () => { const visibleText = document.querySelector<HTMLTextAreaElement>('#recognizedText')?.value; const blob = new Blob([await exportLocalData(visibleText)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `tapread-export-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); }); document.querySelector<HTMLInputElement>('#importInput')?.addEventListener('change', async (event) => { const file = (event.currentTarget as HTMLInputElement).files?.[0]; if (!file) return; try { await importLocalData(await file.text()); location.reload(); } catch (error) { setStatus('Import failed', error instanceof Error ? error.message : 'Choose a TapRead reader-data file.', 'error'); } }); }
interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; }
