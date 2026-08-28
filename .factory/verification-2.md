# Independent verification 2 — PASS

Date: 2026-08-28
Work order: `android-select-speak-canvas-verify-2`
Candidate: `3a873555db6d5c1ab5dd912dbdd6d3adbc43c6b3`
Live URL: <https://android-select-speak-canvas.sociobot.in>

## Verdict

**PASS.** The candidate satisfies the researched product's web/PWA and
checked-in Android companion contract. In contrast with verification 1, the
Android project now declares a bound, non-window-content-reading
`TapReadAccessibilityService`, puts up an accessibility overlay trigger,
requires Android's own MediaProjection consent for each capture, lets the
person draw a rectangle, performs on-device ML Kit OCR, speaks through Android
TTS, saves the normalized frame and latest passage, and rejects blank protected
captures. The PWA remains a clearly-labelled local screenshot fallback rather
than being presented as the Android overlay itself.

The deployed static artifact is the freshly built candidate: `index.html` and
20 additional critical application, PWA, OCR, font, icon, and hero files were
byte-identical to `dist/` at the URL above.

## Clean-checkout quality gates

The worktree started clean at the candidate SHA. `npm ci` completed from
`package-lock.json`, installing 208 packages with **0 vulnerabilities**.

| Check | Fresh result |
| --- | --- |
| Unit/source regression tests | `npm test`: **8/8 passed** (including native service/policy contract tests). |
| Type check and exact production build | `npm run build`: **passed** (`tsc --noEmit`, local OCR sync, Vite build, postbuild). `dist/` produced. |
| Repository browser suite | `npm run test:e2e`: **9 passed, 1 expected duplicate mobile OCR skip**. |
| Android Gradle attempt | `cd android && ./gradlew test assembleDebug`: cannot start in this supplied verifier image: `JAVA_HOME is not set and no 'java' command could be found`; `ANDROID_HOME` and `ANDROID_SDK_ROOT` are also empty. This is an environment limitation, not a product failure. |

The static release budget passes: main JS is 29,637 B, deferred OCR facade is
15,589 B, CSS is 11,995 B, and the two self-hosted fonts total 109,604 B.
The 640px AVIF hero is 12,349 B. The on-device OCR worker/model is deliberately
larger (about 9.9 MB), is self-hosted, and is installed for offline use; it is
not initial JavaScript or a cloud OCR request.

## Independent live product exercise

Fresh Chromium sessions against the live URL exercised the actual deployed
site, with browser TTS mocked only to observe the speech completion path:

- Normal path: **Use sample** → keyboard-focus canvas → `Shift+ArrowRight` →
  **Read framed text** recognized `The north gate / opens at dawn. / TapRead
  training card 01`, then completed the speech path.
- Boundary values: speech speed accepted both `0.6×` and `1.6×`.
- Invalid/recovery paths: a text file reported **That is not an image**; a
  20 MiB + 1 byte PNG reported **Image is too large**; **Use sample** recovered
  to **Image ready**. Invalid JSON import reported **Import failed**, and an
  empty license field reported **Paste a license token first.**
- Persistence: after loading the sample, IndexedDB contained the 49,772-byte
  image blob and a reload restored the loaded canvas.
- Desktop and 390px mobile: no horizontal overflow at 390px
  (`scrollWidth === innerWidth === 390`); the Read button was 340 × 64 CSS px.
  The initial keyboard focus is the visible skip link with a 3px solid focus
  outline; keyboard framing changes the announced frame description. There was
  no keyboard trap in the interactive path.
- Accessibility: independent Axe scans found **0 serious/critical** findings
  on desktop and 390px mobile. Reduced-motion emulation yielded a `0s`
  transition duration.
- Runtime: no console errors or page errors occurred.

## PWA, privacy, deployment, and policy evidence

- A fresh live service worker became controller; an offline reload still
  rendered the product. A separate candidate-`dist` local server test changed
  only the service worker revision, called `registration.update()`, and
  observed both a waiting worker and the in-app **A new version is ready**
  update toast.
- Chrome DevTools parsed the live web manifest without errors; it supplies
  192px and 512px/maskable icons, standalone display, and a versioned
  `start_url`.
- First-load browser request capture contained only
  `https://android-select-speak-canvas.sociobot.in`; local OCR uses a browser
  `blob:` worker. Source inspection found no analytics, ads, CDN fonts, cloud
  OCR, beacon, or third-party script. The only possible outbound application
  request is the documented, user-initiated/stored-license Sociobot verification
  request. Chosen images, state, and history remain in IndexedDB; the license
  remains in localStorage.
- Live `/`, `/privacy`, `/terms`, manifest, and service-worker routes returned
  200. Live response headers include HSTS, CSP with `frame-ancestors 'none'`,
  `Permissions-Policy`, `X-Frame-Options: DENY`, `nosniff`, strict-origin
  referrer policy, and COOP. Hashed assets, fonts, and OCR vendor assets are
  served `public, max-age=31536000, immutable`; manifest and worker are
  no-cache.
- Mobile Lighthouse against the live URL: **100 performance, 100
  accessibility, 100 best practices, 100 SEO**. Observed FCP/LCP 0.4s, TBT
  20ms, CLS 0.

## Defects and verification boundaries

### P0 / P1

None confirmed.

### P2 — verification environment boundary, not a confirmed shipping defect

The supplied container has no Java runtime or Android SDK, so it cannot compile
the checked-in Android project or exercise MediaProjection, `FLAG_SECURE`,
accessibility enablement, foreground notification, ML Kit OCR, and Android TTS
on a real device. The source implementation and instrumentation tests are
present and static tests pass, but the following must still be run on an
Android-capable release worker before signing/distributing an APK:

```sh
npm run build
npx cap sync android
cd android
./gradlew test assembleDebug connectedAndroidTest
```

Then enable the disclosed service on-device and exercise trigger → system
consent → frame → local OCR/TTS → repeat → protected/blank capture refusal.

## Handoff

The live static/PWA deployment is verified at the candidate commit and is safe
to retain. No product-code changes were made during this verification. The only
follow-up is the normal Android-capable APK/device validation above, required
before an Android binary is signed or promoted.
