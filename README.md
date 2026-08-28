# TapRead Canvas

TapRead Canvas reads selected screen or image text aloud on Android.
It helps people when games, streams, remote desktops, and custom canvases lack usable labels.

The installable web image reader handles screenshots and saved images.
Try the isolated sample at `/demo` or `/?demo=1`.
The demo uses separate storage and never reads your normal reader data.

## What is included

- Select text with touch, a pointer, or the keyboard.
- Recognize English text on your device.
- Hear, edit, stop, and repeat recognized text.
- Save the latest image, selection, text, and speed on this device.
- Export and import reader data as JSON.
- Use the installed web image reader offline after the first visit.
- Use the Android floating control after approving screen sharing.
- Read the direct `/privacy` and `/terms` pages.

The reader is free and needs no account.
The claims and their exact test commands are in [`.factory/claims.json`](.factory/claims.json).

## Demo

Open `http://localhost:5173/demo` during development.
The sample contains the sentence “The north gate opens at dawn.”

**Reset demo** restores that sample.
**Start for real** deletes demo storage and opens the normal reader.
See [`.factory/demo.md`](.factory/demo.md) for the storage boundary.

## Develop

Requirements are Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

The setup script copies version-pinned recognition files into `public/vendor`.
The app loads no fonts, scripts, models, or analytics from another origin.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

Run each command in `.factory/claims.json` from a clean checkout.
The browser suite covers desktop and 390px phone layouts.
It also checks keyboard use, offline reloads, routes, metadata, privacy, and accessibility.

The production build is written to `dist/`.
Preview it with `npm run preview`.

## Android handoff

The checked-in Capacitor project is in `android/`.
Its application id is `in.sociobot.tapreadcanvas`.

After a web build, copy the web assets and build Android:

```sh
npx cap sync android
cd android
./gradlew test assembleDebug
```

On Android, enable the described TapRead accessibility service.
Tap the floating TapRead button.
Approve Android’s screen-share prompt for the capture session.
Adjust one selection and read the recognized text aloud.

The service hosts the visible overlay and does not inspect accessibility trees.
Recognition and speech use Android’s on-device services.
The last selection and reading are stored for repeat.

Release signing must use the factory keystore.
Never commit that keystore.

## Privacy and limitations

The browser stores chosen content in IndexedDB on this device.
Demo data uses the separate `demo:tapread-canvas` database.
The product has no analytics, advertising, accounts, or cloud text recognition.

The first web visit downloads the recognition files from the same site.
Later installed sessions can reload offline.

Protected Android surfaces may produce blank captures.
TapRead refuses likely blank captures and does not bypass protected-screen controls.
Text recognition can be wrong.
Check safety-critical text against its source.

Licensed under the [MIT License](LICENSE).
