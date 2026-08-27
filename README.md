# TapRead Canvas

TapRead Canvas is a private reading aid for Android users who encounter text
inside screenshots, games, remote desktops, images, or custom canvases. Load
an image, draw a rectangle around the words, and hear them through the device's
text-to-speech voice. OCR runs locally; images and recognized text are never
uploaded.

The current factory artifact is an installable PWA plus a Capacitor Android
project skeleton. It handles the complete screenshot/image workflow today.
The system-wide floating overlay and AccessibilityService integration belong
to the later native APK work order because a web deployment cannot capture
another Android app's pixels.

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
- Capacitor 7 Android project at `android/`

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
npx cap open android
```

The application id is `in.sociobot.tapreadcanvas`; Android package identifiers
cannot contain the hyphens in the factory slug. An APK is intentionally not
built in this static-deploy work order. Release signing must use the factory
keystore and must never be committed.

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
Protected Android surfaces may produce black screenshots, and TapRead does not
attempt to bypass DRM or `FLAG_SECURE`. OCR can be wrong, so safety-critical
text must be checked against its source.

Licensed under the [MIT License](LICENSE).
