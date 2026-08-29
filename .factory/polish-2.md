# Polish round 2 — closure map

Date: 29 August 2026  
Reviewed base: `5c205383ba19cf6d5b642489445a0c87c6ef870b`

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-2-01 | Exported the protected accessibility service and verify registration metadata in device tests. | `NativeWorkflowInstrumentedTest.accessibilityServiceIsBoundAndDoesNotRequestWindowContent`; Android instrumentation APK compiles. |
| F-2-02 | Registered a `MediaProjection.Callback` before creating the display; revocation releases reader, display, bitmap, overlay, and foreground state. | Target-35 Android compile; service lifecycle implementation. |
| F-2-03 | Published the Android APK route, version, checksum, landing action, and README install instructions. | `@claim:android-install`; release SHA-256 `72e874…e89d8`. |
| F-2-04 / F-1-01 | Isolated `/demo` and `?demo=1`, including the theme key; added a four-frame Android walkthrough and native Load sample screen. | `@claim:demo-isolation`; `.factory/demo.md`; `evidence/polish-2/live/demo/screenshot-mobile.png`. |
| F-2-05 | Disabled Android backup and assert the package flag. | `@claim:android-device-privacy`; manifest/device test. |
| F-2-06 | Replaced the unsupported password promise with the exact protected-screen limitation. | `strings.xml`; `@claim:protected-captures`. |
| F-2-07 / F-1-02 | Added native sample OCR/TTS/repeat outcomes and compiled Android claim coverage. | Native claim entries and `scripts/test-android.sh`. |
| F-2-08 / F-1-07 | Persisted scroll per history entry and restore it on popstate. | Route/history Playwright test. |
| F-2-09 | Registered/tested PNG, JPEG, WebP, and GIF. | `@claim:supported-image-formats`. |
| F-2-10 | Added pointer/touch claims and separate keyboard move/resize checks. | `@claim:keyboard-selection`, `@claim:pointer-selection`, `@claim:touch-selection`. |
| F-2-11 | Added Stop and Repeat claims; stale completion events cannot overwrite Stop. | `@claim:speech-stop`, `@claim:repeat-reading`. |
| F-2-12 | Tested reload and backup/import of image, selection, text, and speed. | `@claim:reader-state-persistence`, `@claim:data-portability`. |
| F-2-13 | Scoped web privacy text and removed Android network permission. | `@claim:web-local-processing`, `@claim:android-device-privacy`. |
| F-2-14 | Made visible links and controls 44px minimum at 390px. | Mobile layout test and screenshots. |
| F-2-15–F-2-24 | Rewrote every recorded copy defect: selection caption, ready status, local label, recognized text, backup wording, setup/privacy/key guidance, README h1, and consent term. | `.factory/copy-audit.md`; landing and README. |
| F-2-25 | Unified web, Android, APK, and footer version as `1.0.0`; footer has immutable short build SHA. | Public-version Playwright test. |

Live route evidence: `evidence/polish-2/live/`.
