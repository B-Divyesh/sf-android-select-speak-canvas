# TapRead Canvas — verification 3 handoff

Date: 5 September 2026

## Verdict

**FAIL — 6 findings, including 3 untested public claims.**

The full report is `.factory/verification-3.md`.

## Candidate and live state

- Last product-code commit reviewed: `fa15687d1c43d1fe2310231dbc608c658e131923`.
- Documentation/test head reviewed: `1e06e64058cd32e8f4660543f24f83eb86bd7756`.
- The live static deployment now matches a clean build of `1e06e64`
  byte-for-byte for the shell, application bundles, service worker, manifest,
  OCR worker/model, and fonts. The earlier pre-deploy note is no longer true.
- No product code was modified during verification.

## What passed

- Clean checkout: `npm ci`, `npm test` (9/9), `npm run build`, and
  `npm run test:e2e` (39 passed, 11 intentional skips).
- Every command in `.factory/claims.json` was invoked individually.
- Live desktop and 390 px phone: one-click isolated sample, reset/exit without
  real-data changes, OCR, speech edit/stop/repeat, file boundaries, all input
  methods, persistence, export/import, offline reload, legal pages, links,
  titles, history/focus, designed 404, and same-origin privacy.
- Axe: zero violations across all routes, phone demo, and dark/reduced-motion
  phone mode. Mobile Lighthouse: 100/100/100/100; LCP 1.7 s, TBT 0 ms,
  CLS 0.011.
- JDK 21 and Android SDK 35 were installed. JVM tests, target-35 debug APK, and
  instrumentation APK compile successfully.
- Independent release-APK inspection confirms target 35, exported
  permission-protected service, `allowBackup=false`, and no INTERNET
  permission.

## What failed acceptance

- The public v1.0.0 APK is debuggable and signed by
  `C=US, O=Android, CN=Android Debug`, not the authorized release key.
- `android-private-capture`, `android-selection-memory`, and
  `protected-captures` pass their commands while device instrumentation is
  skipped. Their promised installed outcomes remain untested.
- `android-device-privacy` also skips its declared package-manager
  instrumentation, although independent APK inspection confirms the current
  flags.
- An API-35 AOSP emulator was provisioned without KVM. It exposed Android
  services under software emulation but did not remain stably booted;
  `connectedDebugAndroidTest` reported no connected devices.
- No 30-region mid-range Android benchmark proves the brief's 80% accuracy and
  two-second success measure.

## Next steps

Release-sign a non-debuggable APK, make native claim commands require and run a
real API-35 device, exercise the complete overlay/capture/OCR/TTS/repeat and
protected-screen paths, and record the 30-region benchmark. Then request a new
independent verification.
