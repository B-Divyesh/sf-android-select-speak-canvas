# TapRead Canvas adversarial review 2 handoff

Date: 29 August 2026

Work order: `android-select-speak-canvas-review-2`

Verdict: **FAIL**

## Done

- Reviewed the live site cold at 390 × 844 and 1440 × 900.
- Audited every landing-page and README sentence, headings, and actions.
- Exercised the one-click demo, Reset, Start for real, storage boundaries,
  live OCR, request log, and offline reload.
- Ran all 12 exact `.factory/claims.json` commands from a fresh clone.
- Ran `npm test`, `npm run build`, and `npm run test:e2e` from that clone.
- Checked routes, titles, metadata, 404, links, history, focus, Axe in light and
  dark treatments, reduced motion, mobile overflow, target sizes, visual
  identity, earlier findings, and missed leverage.
- Wrote the full evidence and 25 findings to `.factory/review-2.md`.
- Did not modify product code or deploy anything.

## Verification results

- All 12 recorded claim commands returned zero.
- Unit: 8 passed.
- Build: passed; `dist/` produced.
- Browser: 23 passed, 3 intentional duplicate mobile skips.
- Live OCR recognized the shipped sample; its request log was same-origin plus
  one `blob:` worker URL; live offline reload passed.
- Live Axe: zero violations on root, demo, legal, and 404 routes, including a
  dark/reduced-motion 390 px check.
- Live and fresh-build HTML, main JavaScript, and CSS hashes matched.

## Blocking handoff items

The Android accessibility service is non-exported, target-35 MediaProjection
omits the required callback, no installable Android release exists, and native
claim tests inspect source strings rather than runtime outcomes. Demo mode
writes the normal theme key, Android backup can include saved recognized text,
the native settings description makes an unsupported password claim, and Back
does not restore scroll position.

See `.factory/review-2.md` for exact locations, reproductions, all additional
findings, copy rewrites, and the earlier-finding closure audit.

## Environment boundary

This worker has no Java binary, Android SDK, `ANDROID_HOME`, or
`ANDROID_SDK_ROOT`, so it could not compile an APK or execute Android
instrumentation. That is not treated as proof of the native claims; it is a
release blocker until an Android-capable worker supplies observable results.
