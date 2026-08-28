# TapRead Canvas repair handoff

Date: 2026-08-28

Work order: `android-select-speak-canvas-repair-1`

Base verifier report: `66951d48c7c497d3cfe4f29cafec83f097dd80ff`

Deploy class: static (`dist/`) with the checked-in Capacitor Android companion.

## Repaired findings

- Replaced the empty Android-only Capacitor shell behavior with a native,
  explicitly disclosed `TapReadAccessibilityService`. The service uses a
  `TYPE_ACCESSIBILITY_OVERLAY` only for the visible TapRead trigger and does
  not retrieve window content or accessibility nodes.
- The trigger opens Android's own `MediaProjection` consent flow. A single
  consented frame is captured into memory, a transparent native overlay lets a
  person draw one rectangle, bundled on-device ML Kit OCR recognizes it, and
  Android TTS speaks it. No captured pixels or text are uploaded.
- The native companion persists the normalized last frame and last recognized
  passage for the **Repeat last** control. Fully black protected/secure
  captures are refused with a plain-language notice; it makes no attempt to
  defeat `FLAG_SECURE` or DRM.
- Added Android accessibility-service metadata, foreground media-projection
  declaration, notification, policy disclosure, and device instrumentation
  coverage for service declaration, frame restoration, and protected-buffer
  refusal. The web screenshot flow remains intact as a fallback.
- Added Azure Static Web Apps deployment configuration plus portable `_headers`:
  restrictive CSP (including only `wasm-unsafe-eval` required by local
  Tesseract), Permissions-Policy, deny framing, nosniff/referrer/COOP headers,
  and one-year immutable caching for hashed assets, fonts, and local OCR files.
  `sw.js` and the manifest remain no-cache.
- Pinned Playwright, its core peer, and Axe to the installed 1.58.2-compatible
  set. This resolves the prior clean-install browser mismatch that selected a
  newer Playwright browser than the worker provides.

## Verification

Run from a fresh install:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Evidence on this worker:

- `npm ci`: passed; npm reported **0 vulnerabilities**.
- `npm test`: **8/8 passed**. The new exact regression contract verifies the
  native service binding, consented projection, native overlay, local OCR/TTS,
  repeat state, secure-screen refusal, CSP/policy/framing protection, and
  immutable asset cache declarations.
- `npm run build`: passed (`tsc --noEmit`, Vite, postbuild); `dist/` contains
  `staticwebapp.config.json`. Its CSP/frame-ancestor policy and immutable
  `/assets/*` route were explicitly parsed and verified.
- `npm run test:e2e`: **9 passed, 1 intentional duplicate mobile OCR skip**.
  This covers Chromium desktop and 390px mobile, keyboard frame adjustment,
  Axe serious/critical findings, real self-hosted OCR, direct legal routes,
  controlled offline reload, and no page/console errors. The CSP was exercised
  by the real WebAssembly OCR test; its narrowly scoped `wasm-unsafe-eval`
  allowance is necessary for Tesseract's compiled WASM loader.
- Build budget remains small: main JS **29.64 KB**, lazy OCR facade **15.59
  KB**, CSS **12.00 KB** uncompressed. No runtime analytics, CDN font, or cloud
  OCR request was introduced.

## Android verification boundary

The static work order intentionally provides `dist/` rather than an APK. This
container has neither Java nor an Android SDK (`java` and `ANDROID_HOME` are
absent), so `./gradlew test assembleDebug` and device MediaProjection/
`FLAG_SECURE` exercise could not run here. The Android project now contains the
native implementation and instrumented regression suite; run the following on
an Android-capable worker before producing an APK:

```sh
npm run build
npx cap sync android
cd android
./gradlew test assembleDebug connectedAndroidTest
```

On device, enable the disclosed service, tap the floating trigger, accept the
Android screen-share dialog, draw a region, confirm local speech, confirm
Repeat last, then test a `FLAG_SECURE` surface returns the protected/blank
notice. No APK or signing material is committed.

## Deploy

Deploy the contents of `dist/` with Azure Static Web Apps using the factory
configuration. `dist/staticwebapp.config.json` is required and is included by
the build; it supplies the response headers and immutable caching policy.

```sh
/opt/fleet/lib/deploy-static.sh android-select-speak-canvas dist
```

After deploy, run:

```sh
/opt/fleet/lib/verify-url.sh https://android-select-speak-canvas.sociobot.in .factory/live-evidence
curl -sSI https://android-select-speak-canvas.sociobot.in/
curl -sSI https://android-select-speak-canvas.sociobot.in/assets/<hashed-main>.js
```

Confirm CSP, Permissions-Policy, `X-Frame-Options: DENY`, and immutable asset
caching are present on the live identity before Android release promotion.

## Live deployment evidence

Deployed successfully on 2026-08-28 with Azure Static Web Apps deployment
`73dad451-0064-4c2e-9bf7-300865f3e248`; the custom domain was already `Ready`.

- `https://android-select-speak-canvas.sociobot.in` returned **200**.
- The factory browser verifier completed with **746 ms** initial load, no page
  or console errors, title present, `lang="en"`, exactly one `<h1>`, a main
  landmark, and zero images without alt attributes.
- Live `/` returned the configured CSP, `Permissions-Policy`,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, referrer policy,
  and COOP. The live hashed `assets/index-Bm9Qv8Kc.js` returned
  `Cache-Control: public, max-age=31536000, immutable`.
- Live `/` byte-matched the deployed `dist/index.html`; SHA-256:
  `f4483a10bb5623e194d17b78b99d39f85b09e151d194c45eadf3064e89de40a6`.
