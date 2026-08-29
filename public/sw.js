const VERSION = 'tapread-v2';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const PRECACHE = [
  '/',
  '/demo',
  '/privacy',
  '/terms',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/brand-mark.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/tapread-instrument-640.webp',
  '/assets/tapread-instrument-960.webp',
  '/assets/tapread-instrument-640.avif',
  '/assets/tapread-instrument-960.avif',
  '/assets/tapread-instrument-960.jpg',
  '/fonts/atkinson-regular.ttf',
  '/fonts/atkinson-bold.ttf',
  '/vendor/tesseract-worker.min.js',
  '/vendor/tesseract-core-simd-lstm.wasm.js',
  '/vendor/tesseract-core-simd-lstm.wasm',
  '/vendor/eng.traineddata.gz',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => ![SHELL, RUNTIME].includes(key)).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(RUNTIME).then((cache) => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match('/')) || caches.match('/offline.html')));
    return;
  }

  event.respondWith(caches.match(url.pathname).then((cached) => {
    if (cached) return cached;
    return fetch(request).then((response) => {
      if (response.ok) caches.open(RUNTIME).then((cache) => cache.put(request, response.clone()));
      return response;
    });
  }));
});
