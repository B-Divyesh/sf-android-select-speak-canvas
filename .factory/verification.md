# Independent verification 1 — FAIL

Date: 2026-08-27
Work order: `android-select-speak-canvas-verify-1`
Candidate: `ecd118e9be6da20627ed6e43eecf987582a6848b`
Live URL: https://android-select-speak-canvas.sociobot.in

## Verdict

**FAIL.** The deployed PWA is a competent local *screenshot/image* OCR reader,
but it is not the Android accessibility-service companion required by the
researched brief. The required core job is to invoke a floating button over an
arbitrary Android app, draw one on-screen rectangle, OCR it locally, speak it,
and repeat that region. This candidate requires the user to first acquire and
load/share a screenshot instead. Its checked-in Android project contains only a
`BridgeActivity`; there is no `AccessibilityService`, accessibility-service
metadata/configuration, overlay, MediaProjection/capture path, Android OCR, or
repeat-region implementation.

This is a release blocker for an `android` artifact, not a deployment-only
failure.

## Reproduction and quality gates

All web commands below were run in fresh detached clones at the candidate SHA.

| Check | Result / evidence |
| --- | --- |
| Clean install | `npm ci` installed 208 packages; npm reported 0 vulnerabilities. |
| Unit tests | `npm test`: **5/5 passed**. |
| Type check and exact production build | `npm run build`: **passed** (`tsc --noEmit`, Vite, postbuild), producing `dist/`. |
| Browser setup | The lockfile resolves Playwright Chromium 1.58/1234, which was not initially present at `$PLAYWRIGHT_BROWSERS_PATH`; `npx playwright install chromium` installed the matching browser before browser QA. |
| Repository E2E | From a fresh checkout with no pre-existing `dist/`, `npm run test:e2e` completed **9 passed, 1 intentionally skipped** (the duplicate expensive mobile OCR smoke test). It covers desktop and 390px mobile, axe, keyboard frame controls, real OCR, legal routes, and controlled offline reload. |
| Android Gradle | `./gradlew test assembleDebug` could not start because this verifier image has no `java`/`JAVA_HOME`. This is an environment limitation, not the basis of the FAIL; source inspection independently establishes the missing Android functionality. |

Additional independent desktop production-preview exercise:

- Loaded the supplied sample, adjusted its frame with `Shift+ArrowRight`, and
  performed a real local OCR read. Result: `The north gate opens at dawn.
  TapRead training card 01` (line breaks retained).
- Invalid text file showed **“That is not an image”**; a 20 MiB + 1 byte
  `image/png` showed **“Image is too large”**; **Use sample** recovered to a
  ready state.
- Mocked only the browser TTS voice to observe the post-OCR speech path. No
  page exceptions or console errors occurred.
- Desktop and 390px mobile axe scans had **0 serious/critical** findings.
  Mobile was 390px wide with `scrollWidth === innerWidth === 390`; the first
  keyboard focus was the skip link with a visible 3px focus outline. The
  390px Read button measured 340 × 64 CSS px. Reduced motion is explicitly
  disabled through `@media (prefers-reduced-motion: reduce)`.
- A clean-build service worker became `activated` and controlled the page;
  the repository's fresh E2E offline-reload checks passed. Do not run the E2E
  command after separately building into the same `dist/`: the current
  postbuild script appends hashed assets to an existing worker precache and
  can make that non-clean test run fail. The release command itself was
  validated from a clean output directory.

## Live deployment and network evidence

The live deployment matches this candidate's web artifact:

- `/` content SHA-256: `9303ea4d96c7fa4505f2a0ab4052b6b0b42f5e75e65bdd74e401667a562fc863`,
  identical to the clean `dist/index.html`.
- Live `manifest.webmanifest`, main JS `assets/index-i9OrMgxZ.js`, CSS
  `assets/index-D9PdH7Gf.css`, lazy OCR chunk, English traineddata, and the
  clean-build `sw.js` were byte-identical to candidate output. `/privacy` and
  `/terms` returned 200.
- Desktop browser request capture during first load and local OCR found no
  third-party HTTP(S) requests. The only non-HTTP request was a browser-local
  `blob:` worker URL. Source inspection confirms OCR assets are self-hosted;
  the only potential outbound fetch is the documented, user-initiated or
  stored-license Sociobot verification endpoint. No analytics/tracker/CDN was
  found.
- Local data use is IndexedDB for image/state/history and localStorage for a
  returned license, with JSON export/import. This matches the privacy page for
  the implemented web product.

## Performance, headers, and policy checks

- Initial application JS: 28.64 KB main + 15.59 KB lazy OCR facade
  (44.23 KB uncompressed; well below the 200 KB initial-JS budget). CSS is
  12.00 KB; self-hosted fonts total 109,499 bytes. The largest mobile hero
  AVIF is 12,349 bytes. These static budgets pass.
- The optional local OCR runtime/model is substantial: 9.5 MB in `dist/vendor`
  and is precached on first service-worker installation. It is local rather
  than cloud OCR, but it is material first-install cost and the brief's
  two-second success measure was not benchmarked on a mid-range Android
  device.
- Live responses had HTTPS/HSTS, `nosniff`, and strict-origin referrer policy,
  but **no Content-Security-Policy, Permissions-Policy, or frame-ancestors
  protection**. Hashed JS, CSS, and OCR assets were served with only
  `cache-control: public, must-revalidate, max-age=30`, not immutable
  long-lived caching.

## Defects

### P0 — release blocker

1. **The required Android accessibility workflow does not exist.**
   `android/app/src/main/AndroidManifest.xml` declares only an activity and
   `INTERNET`; `MainActivity.java` is an empty Capacitor `BridgeActivity`.
   Searches found no `AccessibilityService`,
   `android.permission.BIND_ACCESSIBILITY_SERVICE`, accessibility XML,
   `SYSTEM_ALERT_WINDOW`, MediaProjection, or native on-device OCR. The product
   cannot invoke over games/streams/canvas content, draw over another app, or
   repeat the last on-screen region. It therefore fails the smallest useful
   product and Android artifact acceptance contract.

### P2 — should fix before a security/performance-sensitive release

2. **Response protection and caching are incomplete.** The live host lacks
   CSP/Permissions-Policy/frame embedding protection and gives hashed static
   assets a 30-second revalidation TTL. Add a restrictive CSP and browser
   permissions policy appropriate to local OCR, deny framing, and serve
   content-hashed assets with `immutable` long-lived caching.

### Evidence limitation (not scored as a product defect)

3. **APK build was not executable in this container** because the supplied
   verifier image has no JDK. Once P0 is implemented, rerun `./gradlew test
   assembleDebug` on an Android-capable worker and exercise the foreground
   accessibility flow and `FLAG_SECURE`/DRM behaviour on device.

## Required next step

Build and test the actual native Android accessibility service and overlay
workflow (with Play-policy disclosure, user consent, on-device OCR/TTS, and
secure-screen respect), then submit a new candidate for verification. A
screenshot-import PWA may remain as a companion/fallback but cannot substitute
for that core product.
