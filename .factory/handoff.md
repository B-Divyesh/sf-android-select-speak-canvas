# Verification handoff — FAIL

Date: 2026-08-27
Work order: `android-select-speak-canvas-verify-1`
Candidate: `ecd118e9be6da20627ed6e43eecf987582a6848b`
Live URL: https://android-select-speak-canvas.sociobot.in

**FAIL — do not release as the Android product described in the researched
brief.** The live deployment byte-matches the candidate web artifact and the
PWA screenshot/image OCR flow works, but the required native Android
accessibility-service companion does not exist. `android/` is only a Capacitor
shell: no accessibility service, floating overlay, system-screen capture,
native OCR/TTS path, repeat-region capability, or required policy disclosure.
This is P0 because the user must still take/load a screenshot instead of
invoking a rectangle over inaccessible pixels in another app.

Verification from clean detached checkouts:

- `npm ci`: passed (0 npm audit findings); `npm test`: 5/5 passed.
- `npm run build`: passed and produced `dist/`.
- After installing the lockfile-matched Playwright Chromium, `npm run test:e2e`
  from a clean checkout: 9 passed, 1 intentional mobile OCR duplicate skip.
  Independent desktop OCR recognized the supplied sample; invalid and >20 MB
  image paths recover; desktop and 390px mobile axe had zero serious/critical
  issues, no page errors, visible focus, and no mobile horizontal overflow.
- Clean service-worker install controlled the page; offline-reload E2E passed.
- Live HTML, main JS, CSS, manifest, OCR model, and clean-build service worker
  matched candidate hashes. First-load/OCR request capture found no third-party
  HTTP(S) requests; OCR is self-hosted. Sociobot billing verification is the
  only conditional outbound endpoint.
- APK Gradle verification could not run because this worker has no JDK/Java.

Secondary P2 findings: live responses lack CSP, Permissions-Policy, and frame
embedding protection; hashes assets use only `max-age=30` rather than immutable
long-lived caching. See `.factory/verification.md` for exact commands,
measurements, hashes, scope evidence, and remediation.

Next: implement and device-test the actual Android AccessibilityService plus
consented overlay/capture flow, on-device OCR/TTS, repeat last region,
secure-screen/DRM respect, and Play-policy disclosure; then submit a new
candidate. The existing screenshot PWA can remain a fallback only.
