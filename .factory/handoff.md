# TapRead Canvas — repair 2 handoff

Date: 6 September 2026

## Result

Ready for independent re-verification. Five Android findings from verification 3 are closed. The sixth now has a repeatable 30-region device benchmark, but its required mid-range hardware run remains open because this worker only provides an unaccelerated software emulator.

## Shipped versions and commits

- Current web and verification implementation: `a047938e742505933ff7705a37c8a89f438fb56a`.
- Release APK implementation and tag: `d629141c0ce2c55aa3ef0713a746fa768045ef22`, `v1.0.1`.
- Android claim-runner and benchmark implementation: `0b552c1d6604df23ad3a12910f1422bab0bf641d`.
- This handoff is a later documentation commit; use `git rev-parse HEAD` in the delivered tree for its exact SHA.
- Live URL: `https://android-select-speak-canvas.sociobot.in`.
- APK: `tapread-canvas-1.0.1.apk`, 52,514,483 bytes.
- APK SHA-256: `4522f04af9dfbd5aa1baa4d122cb290e99911a48456acf441a2c122f169f2495`.

## Verification 3 findings

| Finding | Disposition | Evidence |
| --- | --- | --- |
| F-V3-01 debug public APK | Closed | v1.0.1 is signed by `CN=TapRead Canvas, OU=Android Release, O=Param Factory, C=IN`; APK Signature Scheme v2/v3 pass; manifest is non-debuggable, targets API 35, disables backup and cleartext traffic, and has no INTERNET permission. The landing page checksum matches the release asset. |
| F-V3-02 private capture claim skipped | Closed | The exact claim command ran two API-35 instrumentation tests. Android resolved its MediaProjection consent activity; the permission-protected accessibility service and media-projection foreground type were verified; bundled ML Kit recognized the sample and the app issued its speech/repeat actions. Result: `OK (2 tests)`. |
| F-V3-03 selection memory claim skipped | Closed | The exact claim command recreated an Android `SharedPreferences`-backed session and restored the exact text and 1080×2400 region. Result: `OK (1 test)`. |
| F-V3-04 protected capture claim skipped | Closed | The exact claim command rejected a blank bitmap and accepted visible pixels through `ScreenSafety`. Result: `OK (1 test)`. |
| F-V3-05 device privacy claim skipped | Closed | The exact claim command inspected the installed package and proved backup is disabled and INTERNET is denied. Result: `OK (1 test)`. |
| F-V3-06 30-region mid-range benchmark absent | Hardware run still open | `npm run test:android:benchmark` now performs 30 bundled on-device OCR runs after model warm-up and requires at least 24 correct results within two seconds. It compiles, but this worker has no KVM or physical mid-range Android device, so no qualifying performance result is claimed. |

The native runner now exits nonzero when no API-35 device is connected, installs the exact built APKs, compiles those installed packages for stable software-emulator startup, runs the selected instrumentation, and requires an `OK (...)` outcome. It cannot turn a skipped or crashed device run into a pass.

## Other repairs

- Added a product-scoped GitHub Actions release workflow. It reads encrypted repository signing secrets, refuses unsigned release builds, and verifies the certificate and manifest before upload.
- Bumped Android and public download metadata to v1.0.1.
- Removed the unsafe v1.0.0 GitHub release and its debug APK. The git tag remains, so source history is recoverable; the deleted binary is no longer publicly downloadable.
- Fixed responsive history restoration so the originating link remains visible after browser Back.
- Guarded pointer capture for programmatic assistive gestures and added `pointercancel` recovery. The touch claim now uses a real Chrome touch sequence and asserts no page error.
- Added the native build flag to the documented release command and refreshed the copy audit.
- Copied the 79-character, verb-first catalog description to `/work/.evidence/catalog-description.txt`.

All earlier Review 1 and Verification 1 items remain closed. The Review 2 items reopened by verification 3 are now covered by the release inspection and API-35 outcomes above. The previously closed demo, claims ledger, first screen, 404, metadata, copy, accessibility, cache headers, formats, input methods, speech controls, persistence, portability, touch targets, and version checks all passed again. F-2-08 also gained an outcome check that returns to the originating link in view after browser Back.

## Verification completed

From a clean dependency install:

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- `npm ci`: 208 packages, zero vulnerabilities.
- `npm test`: 5/5 passed.
- `npm run build`: passed; `dist/` created. Initial JS is about 31.3 KB plus a 15.6 KB lazy OCR chunk; CSS is 14.8 KB.
- Final full Playwright run: 38 passed, 12 intentional project-specific skips. Desktop keyboard/pointer and phone touch paths run only in their matching projects.
- All 16 web claim commands in `.factory/claims.json` were also invoked individually and passed.
- The touch claim passed three consecutive focused runs after the pointer fix.
- `:app:compileDebugAndroidTestJavaWithJavac`: passed with the new benchmark.

The four exact native claim commands ran on a booted API-35 AOSP emulator and passed:

```sh
npm run test:android:claim -- android-private-capture
npm run test:android:claim -- android-selection-memory
npm run test:android:claim -- protected-captures
npm run test:android:claim -- android-device-privacy
```

The production APK claim downloaded the public artifact and independently checked its checksum, release certificate, v2 signature, API level, debuggable flag, backup state, and network permission. It passed.

## Deployment and live checks

- Deployed `dist/` from `a047938` to the existing `sf-android-select-speak-canvas` Static Web App. Final deployment id: `5cec7e0c-be88-4869-a1b3-ad08b8875805`.
- HTTPS returned 200 after deployment. The verifier found one title, `lang="en"`, one `h1`, a main landmark, complete image alt text, labeled buttons, and no console errors.
- Fresh desktop and 390 px phone contexts passed the first-screen job/audience/action checks, sample entry, persistent demo label, reset, exit without normal-data changes, public version, and real touch selection.
- Live route checks passed for `/`, `/demo`, `/privacy`, `/terms`, and the designed 404, including Axe, focus, history, and route titles.
- Final mobile Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.37 s, TBT 33 ms, CLS 0.013.
- Evidence is under `/work/.evidence/repair-2/`.

## Remaining work

Run `npm run test:android:benchmark` on identified mid-range Android hardware and retain the instrumentation output. The success measure is not considered proven until that run reports at least 24/30 correct within two seconds. A physical-device acceptance pass should also confirm audible TTS and the user-visible system consent dialog; the automated API-35 checks verify the installed contracts and requests but cannot prove a person heard audio.

There is no advertised paid offer in this release, so no billing metadata file was created. The earlier unregistered checkout remains absent; no paid entitlement is represented as available.
