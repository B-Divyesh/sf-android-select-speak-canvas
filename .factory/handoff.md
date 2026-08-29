# TapRead Canvas — polish round 2 handoff

Date: 29 August 2026

## Completed

- Closed every review-1 and review-2 finding; the item-by-item map is in
  `.factory/polish-2.md`.
- Delivered an isolated one-click `/demo` and `?demo=1` path with reset, exit,
  dedicated IndexedDB/localStorage namespaces, native sample path, and Android walkthrough.
- Corrected Android service export, MediaProjection callback cleanup, backup and
  network policy, native copy, install path, history restoration, mobile targets,
  metadata/404/focus behavior, copy consistency, version display, and speech
  cancellation races.

## Verification

- `npm run build` passed and produced `dist/`. Main JS: 30.99 kB (11.01 kB gzip);
  CSS: 14.84 kB (4.46 kB gzip).
- `ANDROID_HOME=/opt/android-sdk JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 bash scripts/test-android.sh all` passed compilation, JVM unit tests, debug APK, and instrumentation APK.
- Focused browser claim evidence passed for speech stop/repeat, exact 20 MiB boundary,
  keyboard/touch selection, image formats, demo isolation, offline reload, routing,
  and Axe scans.
- The Android release URL returned a 54.6 MB APK with SHA-256
  `72e874c9df0ecae371e444100af2f78b348cc408ba88f56a236655e4efe89d8d`.

## Evidence and deployment

Pre-deploy live screenshots, HTML checks, and headers are in
`evidence/polish-2/live/`. Push the repair commit through the static deployment,
then cold-check `/`, `/demo`, `/privacy`, `/terms`, and an unknown URL before
handing off.

## Environment note

The supplied API-35 emulator lacks usable hardware acceleration. The Android
instrumentation APK compiles; `scripts/test-android.sh all` automatically runs
`connectedDebugAndroidTest` when a responsive device is attached.
