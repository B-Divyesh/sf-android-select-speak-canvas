# Polish round 1 — finding closure map

Date: 28 August 2026

Live site: <https://android-select-speak-canvas.sociobot.in>

Live demo: <https://android-select-speak-canvas.sociobot.in/demo>

## Primary findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-01 | Added one-click `/demo` and `?demo=1` entry points. The sample image and text load immediately. Demo data uses `demo:tapread-canvas`; normal data uses `tapread-canvas`. Reset and exit delete only demo data. | `@claim:demo-isolation`; [live phone demo](evidence/polish-1/live/demo-mobile.png); live `/demo` and `/?demo=1` returned 200. |
| F-1-02 | Added `.factory/claims.json` with one unique tagged test for every retained material claim. | All 12 tagged claims passed in the full clean-clone suite at `5284d10`; every recorded command was also exercised individually across the clean-clone passes. |
| F-1-03 | Removed the dead ₹499 offer, license form, merchant copy, billing origins, and unused license module. Terms now say this release is free. | `@claim:no-account-free`; live DOM contains no buy, checkout, subscription, email, or password control. |
| F-1-04 | Replaced the slogan with “Hear selected image text aloud.” Added one short audience sentence, three facts, and “Try it with sample data.” | `first screen states the job and offers a working sample`; live cold screenshot and `verify-url.sh`. |
| F-1-05 | Added the designed Page not found route and host `responseOverrides`. Removed catch-all navigation fallback. Built `404.html`. | `routes set titles, metadata, focus, history, and a designed 404`; live `/does-not-exist` returned HTTP 404 and rendered “Page not found.” |
| F-1-06 | Registered every retained claim and removed claims that were vague, unprovable, or tied to the dead offer. | `.factory/claims.json`; `rg -o '@claim:…' tests` has exactly one test for each ledger id. |
| F-1-07 | Added canonical, Open Graph, Twitter, social image, Apple icon, route titles, Demo/Privacy navigation, factory/build footer, sitemap routes, focus movement, and route announcements. | `routes set titles…`; `every route has complete metadata…`; live link/route checks. |
| F-1-09 | Rewrote slogans, metaphors, technical copy, and vague buttons. Standardized on “selection,” “recognized text,” and “web image reader.” | `.factory/copy-audit.md`; landing and legal route copy review; live screenshots. |
| F-1-10 | Replaced the top-level complementary landmark with a labelled section. | Playwright Axe and Axe CLI: zero violations on `/`, `/demo`, `/privacy`, and `/terms`; `evidence/polish-1/live/axe.json`. |

## Claim-copy findings

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-08a | Rewrote the Android workflow as two short, literal steps. | `@claim:android-private-capture`; native service regression test. |
| F-1-08b | Standardized the browser surface name to “web image reader.” | `@claim:web-local-processing`; copy audit. |
| F-1-08c | Split local recognition and speech into precise web and Android claims. | `@claim:web-local-processing`, `@claim:local-ocr`, `@claim:device-speech`, `@claim:android-private-capture`. |
| F-1-08d | Kept “No account needed” and tested an account-free usable demo. | `@claim:no-account-free`. |
| F-1-08e | Replaced “No upload” with “Images stay on your device.” | `@claim:web-local-processing`; request log is same-origin or embedded data only. |
| F-1-08f | Moved the exact offline promise to README and verified installed reload. | `@claim:offline-reload`. |
| F-1-08g | Rewrote the Android selection flow without promising web/native equivalence. | `@claim:android-private-capture`. |
| F-1-08h | Kept the 20 MB limit and enforced both sides of the boundary. | `@claim:image-size-limit` accepts a valid 20 MB PNG and rejects 20 MB plus one byte. |
| F-1-08i | Removed the unquantified “faster” claim. | Copy audit and source search. |
| F-1-08j | Replaced the absolute slogan with a scoped local-storage and network statement. | `@claim:web-local-processing`. |
| F-1-08k | Kept the protected-screen limitation in plain language. | `@claim:protected-captures`. |
| F-1-08l | Removed the unmeasured speed and quality comparison. | Copy audit and source search. |
| F-1-08m | Standardized “frame” to “selection” in user copy. | `@claim:android-selection-memory`. |
| F-1-08n | Rewrote device voices as an observable installed-voice action. | `@claim:device-speech`; `@claim:android-private-capture`. |
| F-1-08o | Split web correction and Android repeat into separately tested behavior. | `@claim:device-speech`; `@claim:android-selection-memory`. |
| F-1-08p | Replaced WebAssembly jargon with “recognizes English text on this device.” | `@claim:local-ocr`; `@claim:web-local-processing`. |
| F-1-08q | Kept the browser/Android device-voice statement and tested both implementations. | `@claim:device-speech`; `@claim:android-private-capture`. |
| F-1-08r | Kept the exact latest browser data fields and storage location. | `@claim:web-local-processing`; IndexedDB assertions. |
| F-1-08s | Kept the no-account/tracking/cloud statement with UI and request tests. | `@claim:no-account-free`; `@claim:web-local-processing`. |
| F-1-08t | Removed the entitlement list. The release is now simply free, with export and offline behavior tested separately. | `@claim:no-account-free`, `@claim:data-portability`, `@claim:offline-reload`. |
| F-1-08u | Removed the unsupported paid history feature and all related UI. | Live DOM audit; source search finds no supporter or checkout copy. |
| F-1-08v | Removed the subscription claim with the paid offer. | Live DOM audit and copy audit. |
| F-1-08w | Removed the merchant-of-record claim with the paid offer. | Live DOM audit and CSP has no billing origin. |
| F-1-08x | Kept the service boundary in Privacy, Terms, and README. | `@claim:android-private-capture`; service metadata has `canRetrieveWindowContent="false"`. |
| F-1-08y | Rewrote the consent promise in plain language. | `@claim:android-private-capture`; source asserts `createScreenCaptureIntent`. |
| F-1-08z | Removed the unverified 9 MB quantity. Kept the first-visit/offline behavior as an observable claim. | `@claim:offline-reload`; `@claim:web-local-processing`. |

## Earlier verification findings

| Earlier item | Closure | Evidence |
| --- | --- | --- |
| Verification 1 P0 | Preserved the native overlay, MediaProjection consent, on-device recognition, device speech, selection memory, repeat, and protected-buffer refusal. Updated user-visible native terminology. | Three native `@claim` tests; existing Android instrumentation source. |
| Verification 1 P2 | Preserved CSP, permissions policy, framing protection, and immutable asset caching. Added `data:` only for Tesseract’s embedded WebAssembly fetch and removed an unsupported permissions token. | Static host regression test; live headers; live OCR console audit has zero errors. |
| Verification 2 P2 | Kept the Capacitor Android project and device instrumentation. APK compilation remains assigned to the later Android-capable work order by the injected stack decision. | `android/` source and tests; this container has no Java or Android SDK. |

## Final evidence

- Clean-clone full suite at `5284d10`: 8 unit tests passed; build produced `dist/`; 23 browser tests passed with 3 intentional duplicate mobile skips.
- Clean-clone claim suite: every command in `.factory/claims.json` passed.
- Live claim checks: demo isolation, OCR, request privacy, speech, exact file limit, export/import, offline reload, routing, metadata, and mobile layout passed.
- Live accessibility: Axe CLI found zero violations on four routes.
- Local Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 2.0 s, CLS 0, TBT 70 ms.
- Live host: `/`, `/demo`, `/?demo=1`, `/privacy`, and `/terms` return 200; an unknown route returns 404.
- Screenshots: `evidence/polish-1/live/demo-mobile.png` and `evidence/polish-1/live/demo-desktop.png`.
