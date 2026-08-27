# Handoff\n\n(written by the worker at the end of each work order)
# TapRead Canvas v1 handoff

Date: 2026-08-27

Work order: `android-select-speak-canvas-build-1`

Deploy: static `dist/`

Build command: `npm run build`

## What was built

- A complete installable screenshot/image reading workflow: load, paste or drop
  an image; drag a region; recognize English locally; speak through the device;
  stop, edit and repeat.
- Touch and mouse framing plus a documented keyboard path (arrows move the
  region, Shift+arrows resize, Ctrl reduces the adjustment step).
- A genuine local OCR pipeline using self-hosted Tesseract worker, SIMD WASM,
  and English model files. The verified sample flow makes no OCR API request.
- IndexedDB persistence for the latest image, normalized frame, result, speed,
  and optional history, with JSON export/import.
- An installable PWA manifest, branded 192/512 icons, hand-written service
  worker, versioned caches, in-app update prompt, and offline fallback. The app
  shell and OCR runtime are available after the first installation completes.
- Clear empty, working/progress, success, no-text, invalid-file, oversized-file,
  storage, speech, offline, and license-error states.
- A ₹499 one-time supporter unlock using only the Sociobot checkout and verify
  endpoints. Reading, speech, repeat, editing, export and offline behavior stay
  free. Cached valid licenses unlock optimistically; verification is limited to
  once daily; licenses can be pasted to restore a purchase.
- Privacy and terms pages, no analytics, no third-party runtime CDN, and
  self-hosted Atkinson Hyperlegible fonts.
- A Capacitor 7 Android skeleton in `android/`, synced from `dist/` and branded
  with the product palette, icon and splash. The package id is
  `in.sociobot.tapreadcanvas` because Android ids cannot contain slug hyphens.
- The mid-century instrument visual thesis and original generated hero artwork
  (source, prompt sidecar, review and provenance) in `.factory/design.md` and
  `assets/src/`; AVIF, WebP and JPEG delivery variants are all below 300 KB.

## Verification

- `npm test`: 5/5 unit tests pass.
- `npm run build`: passes; output is rooted at `dist/index.html`.
- `npm run test:e2e`: 9 passed, 1 intentionally skipped duplicate. Desktop and
  390px mobile cover the main screen, keyboard framing, direct legal routes,
  Axe, and offline reload. A desktop-only real OCR smoke test recognizes the
  generated training card in about five seconds on this worker.
- Axe Playwright: no serious or critical issues on desktop or 390px mobile.
- Console smoke test: no page exceptions or console errors on first load.
- Offline smoke test: an installed/controlled app reloads with network disabled
  on desktop and mobile.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Lighthouse 12.8.2, mobile emulation against the production preview:
  Performance **99**, Accessibility **100**, Best Practices **100**, SEO
  **100**; FCP **1.4 s**, LCP **2.0 s**, TBT **80 ms**, CLS **0**, initial
  transfer **168 KiB**.
- Built initial JS is about 29 KB plus a 16 KB lazy OCR facade (both uncompressed);
  built CSS is 12 KB. The larger OCR model/core download only during service
  worker installation or the first local read.

## Run and deploy

```sh
npm install
npm test
npm run build
npm run preview
```

Deploy the contents of `dist/`. For Android handoff, run `npm run build` then
`npx cap sync android`. The factory must register the paid product and return
URL. Staging builds can set
`VITE_BILLING_BASE=https://pilot-api.sociobot.in`; production is the default.

## Known gaps and next steps

- This static/PWA work order cannot supply a system-wide floating overlay or
  capture pixels from another Android app. Users currently take/share a
  screenshot or choose an image. The later native APK work order must implement
  the foreground capture/AccessibilityService interaction, its prominent Play
  policy disclosure, MediaProjection consent, repeat-region overlay, and native
  on-device OCR. It must continue to respect `FLAG_SECURE` and DRM.
- OCR v1 is English only. The approximately 9 MB compressed OCR runtime/model
  is cached on first install; users who go offline before installation finishes
  receive a reconnect-once instruction.
- The 80%-of-30-regions product success measure still requires a representative
  mid-range Android usability benchmark. The automated sample establishes the
  pipeline, not that field metric.
- No APK or signed release was produced, as required by the static-deploy work
  order. Release signing and Play submission remain separate factory work.
