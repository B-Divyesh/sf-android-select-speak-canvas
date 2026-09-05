# Read selected Android screen text aloud — verification 3

Date: 5 September 2026  
Work order: `android-select-speak-canvas-verify-3`  
Implementation candidate: `fa15687d1c43d1fe2310231dbc608c658e131923`  
Documentation/test head: `1e06e64058cd32e8f4660543f24f83eb86bd7756`  
Live URL: <https://android-select-speak-canvas.sociobot.in>

## Verdict: FAIL

**FAIL — 6 findings and 3 untested public claims.**

The live web/PWA is the current candidate and passed its desktop, phone,
sample, privacy, offline, route, accessibility, and performance checks. The
Android release cannot be accepted. Three native claims pass their declared
commands without running device instrumentation. The published v1.0.0 APK is
also a debuggable build signed by the standard Android Debug certificate, not
the required release key. No mid-range-device result proves the brief's
30-region accuracy and two-second target.

## Cold first read

Fresh 390 × 844 and 1440 × 900 Chromium contexts showed, before scrolling:

- Job: **Hear selected image text aloud**.
- Audience: Android users facing unlabeled text on screen or in an image.
- First action: **Try it with sample data**; adjacent copy says it loads a
  sample image with text ready to hear.
- Facts: no account, images stay on the device, and free to use.

The job, audience, first action, and three facts were visible in both contexts.
The wording is plain and the page has no metaphor heading.

## Findings

### F-V3-01 — P1 — The published Android release is debug-signed and debuggable

The landing page and README distribute
`tapread-canvas-1.0.0.apk` as the Android installer. Its SHA-256 matches the
published value, but independent package inspection found:

- signer certificate: `C=US, O=Android, CN=Android Debug`;
- `android:debuggable="true"` in the packaged manifest;
- APK Signature Scheme v1 and v2 verify, but this is a development signature.

The Android product contract requires release builds to use the Param Factory
release key. A debug key is unsuitable for the public v1.0.0 upgrade line. The
`android-install` claim test only checks that the download is a large ZIP and
matches a checksum; it does not inspect its signing certificate or debuggable
flag.

Required disposition: publish a non-debuggable release APK signed with the
authorized release key, update its checksum, and make the claim test assert
both properties.

### F-V3-02 — P0 — `android-private-capture` is not tested on Android

The declared command compiled the app and instrumentation APK and ran a JVM
reading-session test. It then printed **“Android instrumentation was compiled
but no device is connected.”** It did not enable or bind the accessibility
service, show the floating overlay, request MediaProjection consent, capture a
screen, run ML Kit OCR, or call Android TTS.

The exact first clean-checkout invocation also reported a Vitest
`[vitest-worker]: Timeout calling "onTaskUpdate"` unhandled error after the
assertion passed. A later cached full `npm test` run was clean, but neither run
executed the claimed device outcome.

This leaves one public claim untested.

### F-V3-03 — P1 — `android-selection-memory` is not tested on Android

The declared command compiled instrumentation and exercised an in-memory JVM
store. It did not adjust a selection in the installed app, restart or recreate
the app/service, restore the selection from Android storage, or repeat the
saved reading through Android TTS. It also printed that no device was
connected.

This leaves one public claim untested.

### F-V3-04 — P1 — `protected-captures` is not tested through screen capture

The declared command checks that blank recognized text is not saved or spoken
in the JVM state machine. The separate bitmap assertion is only compiled into
the instrumentation APK. No device test feeds a blank/protected
MediaProjection capture through the installed service and proves refusal.

This leaves one public claim untested.

### F-V3-05 — P2 — `android-device-privacy` can pass without its declared package check

The declared sandbox says it runs package-manager instrumentation assertions,
but the command succeeds when no device is connected. That makes it an
incomplete regression claim test.

Independent inspection of the downloaded release APK did confirm the current
outcome: `allowBackup=false`, no `INTERNET` permission, target SDK 35, the
service is exported, and it is protected by
`android.permission.BIND_ACCESSIBILITY_SERVICE`. The shipping behavior is
therefore supported by artifact evidence, but the registered command does not
enforce it.

### F-V3-06 — P1 — The brief's Android success measure is untested

No report measures 30 user-selected regions on mid-range Android hardware.
There is no evidence that at least 80% are read correctly within two seconds
with no network request. Browser OCR timing does not establish the native
MediaProjection → selection → ML Kit → TTS target.

## Live web/PWA evidence

### Candidate and deployment match

The handoff's pre-deploy note is stale. The controller deployed the candidate
after that note was written. A clean build at documentation head `1e06e64`
matched live byte-for-byte for `index.html`, the main JS and CSS, the lazy OCR
chunk, `sw.js`, manifest, offline and 404 documents, Tesseract worker, English
model, and both fonts. Examples:

| File | SHA-256 |
| --- | --- |
| `index.html` | `ac942673a5aaca4484f0aaf99d9f7ae5f8680a1f978196a4e755c4933bc8db0a` |
| `assets/index-CtBEbnYG.js` | `928643554ec1c0fac63b2e1e045befc99eb312dcd3f05787817227540e4be6e9` |
| `assets/index-Bo8KtPF7.css` | `02cc2846bc3ba438cf6861576f8a331c4f0e2237b24d0f47ce63b78c492a87d8` |
| `sw.js` | `49072550fcc6707752bb12db632ad9a9fd631e7a4dd763b07a8d7587a571a52e` |

`fa15687` is the last product-code commit. `e2fa2ed` changes only handoff text,
and `1e06e64` changes only handoff text. The live footer carries build
`1e06e64` and the deployed static files match that final build.

### Sample, boundaries, and recovery

- One click opened `/demo` with a persistent **Demo — sample data, nothing is
  saved** label, **Reset demo**, and **Start for real**.
- The loaded sample showed **The north gate opens at dawn.**, a selected image,
  and ready speech controls.
- A seeded normal IndexedDB value and `tapread-theme` survived demo use. Demo
  edits used `demo:tapread-canvas` and `demo:tapread-theme`; Reset restored the
  sample; Start for real deleted demo storage and restored the normal value.
- Real local OCR recognized the sample. Request capture during OCR was
  same-origin except for the browser-local `blob:` worker.
- PNG, JPEG, WebP, and GIF opened. A valid 20 MiB JPEG opened; 20 MiB plus one
  byte was rejected.
- Invalid text input said **That file is not an image** and explained the
  accepted formats. Loading the sample recovered to **Image ready**.
- Invalid backup JSON said **Import failed** with the parse reason.
- Speech edit, stop, and exact repeat passed with an instrumented browser voice.
- Pointer, touch, arrow movement, and Shift+arrow resizing passed.
- Image, selection, text, and speed persisted after reload. Backup export and
  import preserved text, selection, and speed.

### Offline, privacy, routes, and links

- After service-worker control, a fresh context reloaded `/demo` offline. The
  sample, demo label, recognized text, and **Offline mode** state remained.
- No analytics, tracker, CDN font, cloud OCR, account, or payment control was
  found. The web OCR flow made no cross-origin reading request.
- `/`, `/demo`, `/?demo=1`, `/privacy`, `/terms`, and `/404` returned 200.
  `/does-not-exist-verify3` deliberately returned HTTP 404 and rendered the
  designed **Page not found** route with a home action. That expected 404 is
  not a defect.
- Route titles, canonical links, social metadata, one h1, main landmark,
  forward focus, announcements, and back-button scroll restoration passed.
- Every rendered internal, source, and APK link returned 200 after redirects.
- Live responses include CSP with `frame-ancestors 'none'`, Permissions-Policy,
  HSTS, `nosniff`, X-Frame-Options DENY, strict-origin referrer policy, and
  COOP. Hashed assets use long-lived immutable caching.
- This is static/PWA + Android. Backend tenant, restart, health, and 429 checks
  are not applicable.

### Accessibility and performance

- The supplied `verify-url.sh` passed `/`, `/demo`, `/privacy`, and `/terms`
  with no console errors and correct title, language, h1, main, alt text, and
  button names.
- Playwright Axe found zero violations on all five routes at desktop size and
  on the interactive 390 px demo. A separate dark-theme, reduced-motion 390 px
  scan also found zero violations.
- First Tab focused **Skip to main content** with a 3 px visible outline.
  Keyboard navigation had no trap. All visible phone controls and links were
  at least 44 × 44 CSS px.
- Reduced motion computed to 0 s transitions and animations. Light and dark
  treatments passed Axe contrast checks. A 200% text-size exercise preserved
  controls without horizontal overflow at 390 px.
- Mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.7 s, TBT 0 ms, CLS 0.011.
- Clean build output: main JS 30.99 kB (11.01 kB gzip), lazy OCR facade
  15.59 kB (6.74 kB gzip), CSS 14.84 kB (4.46 kB gzip). The initial static
  budgets pass; the self-hosted OCR model remains a deliberate later load.

## Clean-checkout commands

The independent detached checkout was exactly `1e06e64` and remained clean.
Node 22 satisfied the documented Node 20+ requirement. JDK 21, Android SDK 35,
build-tools 35, platform-tools, and an API-35 system image were installed
before Android checks.

| Command | Result |
| --- | --- |
| `npm ci` | PASS — 208 packages, 0 vulnerabilities. |
| `npm test` | PASS — 9/9. Each native wrapper still reported no connected device. |
| `npm run build` | PASS — `dist/` produced. |
| `npm run test:e2e` | PASS — 39 passed, 11 intentional cross-device duplicates skipped. |
| `ANDROID_HOME=/opt/android-sdk npm run test:android` | PASS for JVM tests, debug APK, and instrumentation APK compilation; device tests skipped. |
| `:app:connectedDebugAndroidTest` | FAIL to execute — the no-KVM API-35 emulator did not complete a stable boot; Gradle reported no connected devices. |

An API-35 AOSP emulator was provisioned and reached Android services under
software emulation, but exited before a stable boot. This does not turn the
three missing native outcomes into product defects by itself; it does mean
they remain untested and the candidate cannot receive PASS.

## Declared claim command audit

Every command in `.factory/claims.json` was invoked separately from the clean
checkout.

| Claim | Command result | Disposition |
| --- | --- | --- |
| `demo-isolation` | PASS | Complete observable browser outcome. |
| `no-account-free` | PASS | Complete observable browser outcome. |
| `web-local-processing` | PASS | Real OCR, storage, and request audit. |
| `device-speech` | PASS | Exact edited utterance observed. |
| `speech-stop` | PASS | Cancellation and retained text observed. |
| `repeat-reading` | PASS | Two exact utterances observed. |
| `local-ocr` | PASS | Shipped sample words recognized. |
| `image-size-limit` | PASS | Exact boundary and one byte over. |
| `supported-image-formats` | PASS | All four formats decoded. |
| `keyboard-selection` | PASS | Move and resize are separate assertions. |
| `pointer-selection` | PASS | Pointer geometry changed. |
| `touch-selection` | PASS | 390 px touch geometry changed. |
| `reader-state-persistence` | PASS | All four saved fields restored. |
| `data-portability` | PASS | Export and import fields inspected. |
| `offline-reload` | PASS | Own context, controlled SW, offline reload. |
| `android-install` | FAIL substance | Download/checksum pass; debug signer/debuggable release is F-V3-01 and the test does not inspect signing. |
| `android-private-capture` | UNTESTED | Command compiles but skips device instrumentation; F-V3-02. |
| `android-selection-memory` | UNTESTED | Command compiles but skips installed Android outcome; F-V3-03. |
| `protected-captures` | UNTESTED | Command compiles but skips protected capture outcome; F-V3-04. |
| `android-device-privacy` | PASS outcome / incomplete command | Release APK independently passes manifest checks; declared command skips them, F-V3-05. |

Untested public claim count: **3**.

## Earlier finding disposition

### Review 1 and verification 1

| Earlier item | Current disposition |
| --- | --- |
| F-1-01 demo | Closed for web isolation, reset, exit, and theme. Native sample UI exists but its device outcome is covered by F-V3-02–04. |
| F-1-02 claims ledger | Ledger and unique tags exist. Reopened only for the incomplete native outcomes in F-V3-02–05. |
| F-1-03 dead checkout | Closed; paid UI is absent and the product is free. |
| F-1-04 first screen | Closed by both cold desktop and phone reads. |
| F-1-05 404 | Closed; expected HTTP 404 has designed recovery UI. |
| F-1-06 unlisted claims | Closed for web copy. Native claim completeness is recorded in F-V3-02–05. |
| F-1-07 metadata/routing | Closed; metadata, focus, announcement, and scroll restoration passed live. |
| F-1-08a, c, g, k, m, n, o, q, x, y | Native wording is now precise, but runtime portions remain untested under F-V3-02–04. |
| F-1-08b, d, e, f, h, j, p, r, s, t, u, v, w, z | Closed by current copy, browser requests/storage, exact boundaries, offline flow, or removed paid copy. |
| F-1-08i, l | Closed by removal of the unmeasured visitor claims. |
| F-1-09 copy | Closed; terminology and plain-word replacements are present. No banned word was found. |
| F-1-10 landmark | Closed; current Axe scans have zero violations. |
| Verification-1 P0 native implementation absent | Source implementation and APK now exist; real device acceptance remains F-V3-02–04. |
| Verification-1 P2 headers/cache | Closed by live headers and immutable asset responses. |

### Review 2 and verification 2

| Earlier item | Current disposition |
| --- | --- |
| F-2-01 service export | Packaged service is exported and permission-protected; system binding outcome remains inside F-V3-02. |
| F-2-02 MediaProjection callback | Callback and cleanup compile; real consent/capture/revocation remains inside F-V3-02. |
| F-2-03 install route | Reopened as F-V3-01 because the public APK is debug-signed/debuggable. |
| F-2-04 demo isolation/native walkthrough | Web namespaces and four-frame walkthrough pass. Native sample execution remains untested. |
| F-2-05 backup | Packaged `allowBackup=false` passes independent APK inspection. |
| F-2-06 password claim | Closed; false password promise is gone. |
| F-2-07 native claim outcomes | Reopened as F-V3-02–05 because instrumentation compiles but does not run. |
| F-2-08 scroll restoration | Closed by live back-navigation test. |
| F-2-09 formats | Closed; PNG, JPEG, WebP, and GIF each pass. |
| F-2-10 input methods | Closed; keyboard move/resize, pointer, and touch pass. |
| F-2-11 stop/repeat | Closed; cancellation race and exact repeat pass live and local. |
| F-2-12 saved fields | Closed; image, selection, text, and speed persist and port. |
| F-2-13 Android network privacy | Current APK has no INTERNET permission; declared command incompleteness is F-V3-05. |
| F-2-14 touch targets | Closed; no visible 390 px target is below 44 × 44. |
| F-2-15 through F-2-24 copy | Closed; every listed replacement is present in landing/README copy. |
| F-2-25 version | Closed; web, package, Android, installer, and footer show 1.0.0. |
| Verification-2 Android environment boundary | Compilation is closed. Installed/device runtime remains open under F-V3-02–04. |

## Required next steps

1. Produce a non-debuggable APK signed with the authorized Param Factory
   release key, update the public checksum, and enforce signing in the claim.
2. Run all API-35 instrumentation on a stable Android device. The claim
   commands must fail when no device runs their promised assertions.
3. Exercise enable service → floating control → consent → capture → selection
   → OCR/TTS → repeat, plus blank/protected capture refusal and persistence.
4. Measure 30 representative selections on mid-range hardware and record
   accuracy, latency, and network capture against the brief's success measure.
