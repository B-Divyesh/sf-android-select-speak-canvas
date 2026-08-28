# TapRead Canvas

TapRead Canvas is a private Android reading aid for text trapped in games,
streams, remote desktops, images, or custom canvases. In the Android companion,
turn on the explicitly described accessibility service, tap its floating
TapRead button, approve Android's screen-share prompt, draw one rectangle, and
hear it through the device voice. OCR runs locally; images and recognized text
are never uploaded. The installable web app remains a screenshot/image fallback.

The artifact is an installable PWA plus a Capacitor Android companion. The
native companion uses an `AccessibilityService` only to host the user-visible
TapRead overlay; it does not inspect accessibility trees or window content.
Pixels enter only after Android's `MediaProjection` consent dialog. It uses
on-device ML Kit text recognition and Android text-to-speech, remembers the
last frame/text for repeat, and refuses blank protected captures instead of
attempting to bypass `FLAG_SECURE` or DRM.

## What is included

- Local English OCR with a self-hosted Tesseract WebAssembly model
- Pointer, touch, and keyboard-adjustable reading frame
- Device text-to-speech, editable results, stop and repeat controls
- Local persistence of the latest image, frame, text, and speech speed
- Installable offline PWA with update notification and offline fallback
- JSON export/import and no analytics or tracking
- Optional ₹499 one-time supporter license for a 25-item local history; the
  core accessibility workflow and export are never gated
- Direct `/privacy` and `/terms` pages
- Capacitor 7 Android project with native accessibility overlay, MediaProjection
  consent flow, local ML Kit OCR, Android TTS, and repeat-last-region at
  `android/`

## Develop

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run dev
```

`predev` copies the version-pinned OCR worker, WebAssembly core, and English
model from `node_modules` into the local public directory. No runtime CDN is
used.

## Test and build

```sh
npm test
npm run build
npx playwright install chromium   # once per machine
npm run test:e2e
```

The exact production build command is `npm run build`. Static output lands in
`dist/` with `dist/index.html` at its root. End-to-end tests cover desktop and
390px mobile layouts, Axe serious/critical issues, keyboard framing, real local
OCR, legal routes, and an offline reload.

To preview the production output:

```sh
npm run preview
```

## Android handoff

After a web build, sync it into the checked-in Capacitor skeleton:

```sh
npx cap sync android
cd android
./gradlew test assembleDebug
```

The application id is `in.sociobot.tapreadcanvas`; Android package identifiers
cannot contain the hyphens in the factory slug. After installation, open the
app, follow Android's accessibility-service disclosure, then tap the floating
TapRead button and approve the system screen-share prompt for each capture
session. Release signing must use the factory keystore and must never be
committed.

## Billing configuration

Checkout and verification use the Sociobot billing API with the product slug,
never a payment provider SDK. Production is the default. To use the registered
test product on staging:

```sh
VITE_BILLING_BASE=https://pilot-api.sociobot.in npm run build
```

The factory registers the product and return URL separately. No product id or
secret is stored here.

## Privacy and limitations

The browser stores only user-chosen content in IndexedDB and the license token
in localStorage. A first online load is required to install approximately 9 MB
of local OCR runtime/model data; subsequent readings make no OCR network call.
Protected Android surfaces may produce black captures. TapRead refuses those
frames and does not attempt to bypass DRM or `FLAG_SECURE`. OCR can be wrong,
so safety-critical text must be checked against its source.

Licensed under the [MIT License](LICENSE).
