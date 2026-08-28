# TapRead Canvas demo

- URL: `https://android-select-speak-canvas.sociobot.in/demo`
- Alternate URL: `https://android-select-speak-canvas.sociobot.in/?demo=1`
- Sample: a green training card reading “The north gate opens at dawn.”
- Ready state: the image, selection, and recognized sample text load immediately.
- Reset: **Reset demo** deletes the demo database and restores the sample.
- Exit: **Start for real** deletes demo storage and opens the normal reader.
- Demo namespace: IndexedDB database `demo:tapread-canvas`.
- Normal namespace: IndexedDB database `tapread-canvas`.

The demo never opens the normal database while its banner is shown.
The isolation claim test seeds normal data before entering the demo and verifies it after exit.
