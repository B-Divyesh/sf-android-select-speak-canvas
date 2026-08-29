# TapRead Canvas demo

- URL: `https://android-select-speak-canvas.sociobot.in/demo`
- Alternate URL: `https://android-select-speak-canvas.sociobot.in/?demo=1`
- Sample: a green training card reading “The north gate opens at dawn.”
- Ready state: the image, selection, and recognized sample text load immediately.
- Reset: **Reset demo** deletes the demo database and restores the sample.
- Exit: **Start for real** deletes demo storage and opens the normal reader.
- Demo namespace: IndexedDB database `demo:tapread-canvas`.
- Demo theme namespace: localStorage key `demo:tapread-theme`.
- Normal namespace: IndexedDB database `tapread-canvas`.
- Normal theme namespace: localStorage key `tapread-theme`.

The demo never opens the normal database or theme key while its banner is shown.
Reset and Start for real delete both demo namespaces.
The isolation claim snapshots both storage systems before, during, after Reset, and after exit.

The Android APK has a separate **Load sample screen** path.
It renders a bundled training card and runs native recognition, speech, and repeat without a capture session.
