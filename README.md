# TapRead Canvas — read selected Android text aloud

TapRead Canvas reads selected screen or image text aloud on Android.
It helps when games, streams, remote desktops, and custom canvases lack usable labels.
The installable web image reader handles screenshots and saved images.

[Try the isolated sample](https://android-select-speak-canvas.sociobot.in/demo) or [download the Android APK](https://github.com/B-Divyesh/sf-android-select-speak-canvas/releases/download/v1.0.0/tapread-canvas-1.0.0.apk).
The demo uses separate browser storage and never reads normal reader data.

## What is included

- Select text with touch, a pointer, or the keyboard.
- Recognize English text on your device.
- Hear, edit, stop, and repeat recognized text.
- Save the latest image, selection, text, and speed on this device.
- Export and import a TapRead backup file.
- Use the installed web image reader offline after the first visit.
- Use the Android floating control after approving Android’s screen-share prompt.
- Read the direct `/privacy` and `/terms` pages.

The reader is free and needs no account.
Every retained product promise and its outcome test are in [`.factory/claims.json`](.factory/claims.json).

## Demo

Open `http://localhost:5173/demo` during development.
The sample contains the sentence “The north gate opens at dawn.”

**Reset demo** restores the sample and its separate theme.
**Start for real** deletes all demo storage and opens the normal reader.
See [`.factory/demo.md`](.factory/demo.md) for the exact browser namespaces.

The installed Android app also shows **Load sample screen**.
That bundled sample exercises native recognition, speech, and repeat without capturing another app.

## Develop

Requirements are Node.js 20 or newer and npm.

```sh
npm ci
npm run dev
```

Setup copies the exact recognition files required by this version into `public/vendor` for local use.
The web app loads no fonts, scripts, recognition files, or analytics from another origin.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
ANDROID_HOME=/opt/android-sdk npm run test:android
```

Run each command in `.factory/claims.json` from a clean checkout.
The browser suite covers desktop and 390px phone layouts.
It checks all input methods, speech controls, persistence, offline reloads, routes, privacy, and accessibility.

The production web build is written to `dist/`.
Preview it with `npm run preview`.

## Android build and install

The checked-in Capacitor project is in `android/`.
Its application id is `in.sociobot.tapreadcanvas`.

Build the web app, copy it into Android, and compile the APK:

```sh
npm run build
npx cap sync android
ANDROID_HOME=/opt/android-sdk android/gradlew -p android test assembleDebug
```

Install the [v1.0.0 APK](https://github.com/B-Divyesh/sf-android-select-speak-canvas/releases/download/v1.0.0/tapread-canvas-1.0.0.apk).
Its SHA-256 is `72e874c9df0ecae371e444100af2f78b348cc408ba88f56a236655e4efe89d8d`.

On Android, enable TapRead in Accessibility settings.
Tap the floating TapRead button.
Approve Android’s screen-share prompt for the capture session.
Adjust one selection and read the recognized text aloud.

The service hosts the visible overlay and does not inspect accessibility trees.
Recognition and speech use bundled or installed Android services.
The Android app has no network permission.
The last selection and reading are stored for repeat.

Sign release builds with the Param Factory Android release key.
Never add that key to Git.

## Privacy and limitations

The browser stores chosen content in its local database on this device.
Demo data uses `demo:tapread-canvas` and `demo:tapread-theme`.
Normal data uses `tapread-canvas` and `tapread-theme`.

The web reader has no analytics, advertising, accounts, or cloud text recognition.
The first web visit downloads recognition files from this site.
Later installed sessions can reload offline.

Android backup is disabled for the application.
Protected Android surfaces may produce blank captures.
TapRead refuses likely blank captures and does not bypass protected-screen controls.
Text recognition can be wrong.
Check safety-critical text against its source.

Licensed under the [MIT License](LICENSE).
