# Adversarial first-read review 2 — TapRead Canvas

Date: 29 August 2026

Live URL: <https://android-select-speak-canvas.sociobot.in>

Reviewed repository base: `5c205383ba19cf6d5b642489445a0c87c6ef870b`

Live/local artifact match: `index.html`, `assets/index-CRbugpDD.js`, and
`assets/index-CKJj-dv9.css` had identical SHA-256 hashes.

## Verdict: FAIL

The first screen is clear and the web image-reader demo works, but this is an
Android product whose native job cannot be accepted. The service is declared
non-exported, the target-35 MediaProjection path omits Android's required
callback, there is no APK or install route, and the native claim tests only
search source text. Demo mode also writes the normal theme key, Android backup
can copy the last recognized text off-device, and browser back loses the
previous scroll position. There are also unlisted claims, undersized touch
targets, and remaining copy defects. The review therefore has nonzero findings
and untested claims.

## Cold first read

Tested before scrolling in new Chromium contexts at 390 × 844 and 1440 × 900.
Both returned HTTP 200 with no console or page errors.

The phone first screen showed:

> Android and web image reader
>
> Hear selected image text aloud
>
> For Android users facing unlabeled text, select words on screen or in an
> image and hear them spoken.
>
> Try it with sample data
>
> Loads a sample image with text ready to hear.
>
> No account needed. · Images stay on your device. · Free to use.

The desktop first screen showed the same text, alongside the product-specific
reading-instrument illustration.

The three required answers are available without inference:

- What it does: reads selected screen or image text aloud.
- For whom: Android users facing unlabeled text.
- First click: **Try it with sample data**.

The cold first read passes. The h1 has five words, the audience sentence has
18 words, the action names the result, and all three facts are visible at
390 px.

## Findings

### Blocking

#### F-2-01 — The service declaration conflicts with Android's documented accessibility registration

**Exact location:** `android/app/src/main/AndroidManifest.xml`, the
`TapReadAccessibilityService` declaration says `android:exported="false"`.
The live page instructs: **“On Android, enable TapRead and tap its floating
button.”**

**Why this fails:** Android documents an accessibility service as exported and
protected by `BIND_ACCESSIBILITY_SERVICE` so only the system can bind to it.
This manifest instead marks the service private. The source-only test checks
the permission and metadata but never checks `ServiceInfo.exported`, whether
Settings lists the service, or whether Android binds it. The core floating
control therefore has no demonstrated system binding path.

**Concrete fix:** set `android:exported="true"`, retain
`BIND_ACCESSIBILITY_SERVICE`, add an Android test that verifies the service is
listed, can be enabled, reaches `onServiceConnected`, and displays its overlay,
then run it on a target-35 build. Android's required declaration is documented
at <https://developer.android.com/guide/topics/ui/accessibility/service>.

This reopens the native-workflow P0 that the earlier handoff treated as fixed.

#### F-2-02 — Screen capture will fail on Android 14+ because no MediaProjection callback is registered

**Exact location:** `TapReadAccessibilityService.captureOnce()` calls
`projection.createVirtualDisplay(...)` without any preceding
`projection.registerCallback(...)`. The project targets SDK 35 in
`android/variables.gradle`. The visitor-facing claim is **“Approve Android’s
screen-share prompt for that capture session.”**

**Why this fails:** Android states that `createVirtualDisplay()` throws
`IllegalStateException` when the app has not registered a MediaProjection
callback. The advertised capture → select → speak path therefore fails on
current Android versions even if the service binds.

**Concrete fix:** register and implement `MediaProjection.Callback` before
creating the virtual display; release the reader, display, bitmap, overlay, and
foreground service from `onStop`; add API 34 and 35 device tests for consent,
capture, system revocation, and a second fresh session. See
<https://developer.android.com/media/grow/media-projection#resource-recovery>.

#### F-2-03 — A visitor cannot obtain the Android product

**Exact location:** the live page says **“On Android, enable TapRead”**, but it
has no Android download, Play listing, release link, or installation
instructions. The repository has no `.apk`/`.aab`, no tag, and the GitHub
releases API returned an empty list. The only install control is the normally
hidden **“Install web image reader”** PWA button.

**Why this fails:** the researched job and artifact class are Android. A new
visitor can try the screenshot fallback but cannot install the floating
Android control that the page describes. The real job is not available end to
end.

**Concrete fix:** publish a signed, reproducibly built Android artifact through
an appropriate trusted distribution route and add **Install TapRead for
Android** beside a concise setup explanation. Keep the web reader explicitly
labelled as the screenshot fallback and verify the download link in release
checks.

#### F-2-04 / F-1-01 reopened — The demo is not a fully isolated demo of the Android job

**Exact location and evidence:** `/demo` correctly preloads a 1200 × 700 sample,
a selection, and **“The north gate opens at dawn.”** It shows the required
banner, Reset works, and Start for real deletes `demo:tapread-canvas` while
preserving `tapread-canvas`. However:

1. The demo only exercises the web screenshot fallback. It has no native
   first-run sample or the required 3–5-frame walkthrough of floating button →
   Android consent → selection → speech/repeat.
2. `setupTheme()` reads and writes the unprefixed `tapread-theme` localStorage
   key in demo mode. In a live fresh-context check, entering demo with
   `tapread-theme=light`, pressing **Use dark theme**, Resetting, and leaving
   demo left the normal key as `dark`.

**Why this fails:** the first-round demo finding is only partly fixed. The
sample does not demonstrate the product's core Android job, and demo activity
persists to real storage while **“Demo — sample data, nothing is saved”** is
shown.

**Concrete fix:** provide an Android first-run **Load sample screen** path and a
captioned native walkthrough on the landing page. Namespace every mutable demo
setting, including theme, under `demo:` or keep it in memory; Reset must restore
all demo settings and Start for real must delete them. Extend
`@claim:demo-isolation` to snapshot every IndexedDB and localStorage key before,
during, after Reset, and after exit.

#### F-2-05 — Android backup contradicts the on-device privacy promise

**Exact location:** Privacy says **“The captured image, recognized text, last
selection, and last reading remain on your device.”** The Android manifest sets
`android:allowBackup="true"`; the service stores `last_text` and the selection
in `SharedPreferences`; there are no backup exclusion or data-extraction rules.

**Why this fails:** eligible app preferences can enter Android Auto Backup or
device transfer. The product therefore cannot make an unqualified “remain on
your device” promise for saved recognized text.

**Concrete fix:** set `allowBackup="false"`, or add tested backup/data-extraction
rules that exclude all captured and recognized content. Add an Android backup
eligibility test and scope the privacy copy to the behavior actually verified.

#### F-2-06 — The Android service description makes a false password claim

**Exact location:** `android/app/src/main/res/values/strings.xml` says
**“TapRead never reads passwords or bypasses protected screens.”**

**Why this fails:** the implementation OCRs any nonblank pixels inside the
chosen rectangle. It has no password detector. Protected screens are often
blank, but a visible password on an unprotected surface can be selected and
read. This assurance is stronger than the implementation.

**Concrete fix:** replace it with **“TapRead reads only the screen image you
choose after Android’s capture prompt. Protected screens may appear blank.”**
Do not claim password detection unless an observable test proves it.

#### F-2-07 / F-1-02 reopened — Native claim tests inspect strings instead of outcomes

**Exact location:** the commands for `android-private-capture`,
`android-selection-memory`, and `protected-captures` all run
`tests/native-companion.test.ts`. That file only matches source strings such as
`createScreenCaptureIntent`, `TextRecognition.getClient`, `putString`, and
`isLikelyProtectedBlank`.

**Why this fails:** all three commands return PASS even though F-2-01 and
F-2-02 show that the runtime path is not valid. No test builds the APK, binds
the service, approves capture, selects a region, observes OCR/TTS, repeats, or
feeds a protected blank capture. These claims remain untested under the
observable-outcome rule.

**Concrete fix:** make the claim commands build and run Android instrumentation
on API 34/35. Assert overlay visibility, one fresh consent per capture, exact
recognized and spoken fixture text, restored selection, repeat output, blank
capture refusal, and no outbound requests. Keep source-contract tests only as
additional lint checks.

#### F-2-08 / F-1-07 reopened — Back navigation discards the previous scroll position

**Exact location/evidence:** in a reduced-motion 390 px context, the home page
was scrolled to **How to read text aloud** at `scrollY=2758`. After navigating
to Privacy and pressing Back, the route returned to home with the h1 focused
and `scrollY=0`. `renderRoute(true)` rebuilds the app and focuses the h1 on
every `popstate`.

**Why this fails:** the URL and focus change, but browser history does not
restore the place the visitor left. This is incomplete back-button behavior
and reopens the routing/history finding marked fixed in polish round 1.

**Concrete fix:** store scroll positions per history entry, distinguish new
navigations from `popstate`, restore the saved scroll position after rendering,
and move focus only when that does not destroy history restoration. Add a test
that scrolls to `#how`, opens Privacy, presses Back, and asserts both route and
scroll restoration.

### Major

#### F-2-09 / F-1-06 reopened — The four-format image claim is not listed or tested

**Exact quote:** landing control copy: **“PNG, JPEG, WebP, or GIF.”**
`image-size-limit` tests a PNG at the size boundary only.

**Why this fails:** a visitor can rely on all four format names, but the ledger
does not list that format-support claim and no test opens JPEG, WebP, or GIF.

**Concrete fix:** add a `supported-image-formats` claim and fixtures that load
and render all four formats, or list only the formats covered by tests.

#### F-2-10 / F-1-06 reopened — Touch, pointer, and keyboard movement are only partly tested

**Exact quote:** README: **“Select text with touch, a pointer, or the
keyboard.”** The `keyboard-selection` test sends only
`Shift+ArrowRight`; it does not test an unmodified arrow, pointer drag, or
touch drag.

**Why this fails:** two input methods are unlisted, and half of the listed
move/resize keyboard claim is not asserted.

**Concrete fix:** add claim entries and observable drag tests for mouse and
touch. Expand `@claim:keyboard-selection` to assert plain-arrow movement and
Shift-arrow resizing separately.

#### F-2-11 / F-1-06 reopened — Edit, stop, and repeat are broader than the speech test

**Exact quote:** README: **“Hear, edit, stop, and repeat recognized text.”**
`device-speech` fills edited text and asserts one call to `speak`; it does not
assert Stop or Repeat.

**Why this fails:** the sentence promises four usable outcomes, but two have no
claim entry or observable test.

**Concrete fix:** add separate `speech-stop` and `repeat-reading` claims that
assert cancellation and exact replay, or narrow the sentence to the tested edit
and speak behavior.

#### F-2-12 / F-1-06 reopened — Saved-state fields are not fully covered

**Exact quotes:** landing: **“Your latest web image, selection, text, and speed
stay in browser storage.”** README: **“Save the latest image, selection, text,
and speed on this device.”**

**Why this fails:** `web-local-processing` checks only that an image and text
exist in demo IndexedDB. `data-portability` asserts imported/exported text but
not selection or speech speed. Selection and speed persistence are untested
parts of the claim.

**Concrete fix:** list a `reader-state-persistence` claim and reload after
changing all four fields; assert the exact image, normalized selection, text,
and speed. Expand portability assertions to cover selection and rate.

#### F-2-13 / F-1-06 reopened — The broad no-analytics/local Android claim has no native network test

**Exact quotes:** landing: **“TapRead has no account, analytics, advertising,
or cloud text recognition.”** README: **“Recognition and speech use Android’s
on-device services.”**

**Why this fails:** the web request log proves the browser flow is same-origin.
No Android test records network activity while ML Kit recognition and TTS run.
The unqualified product-wide wording exceeds `web-local-processing` coverage.

**Concrete fix:** record Android network traffic during capture, recognition,
speech, and repeat and assert no captured content or recognized text leaves the
device. Otherwise scope the sentence explicitly to the tested web reader.

#### F-2-14 — Several live touch targets are below 44 × 44 px

**Exact location/evidence:** at 390 px, the header/footer brand links measured
42 × 42 px; footer Demo measured 43 × 26 px; Privacy 54 × 26; Terms 45 × 26;
Source 127 × 26; and **Read the privacy policy** measured 176 × 21.

**Why this fails:** these links do not meet the product's 44 px touch-target
contract. Axe reports zero violations because it does not enforce this local
contract.

**Concrete fix:** add padding or pseudo-element hit areas so every interactive
target has a measured box of at least 44 × 44 px at 390 px, then add a geometry
assertion for all visible links and controls.

### Minor copy and consistency findings

No sentence exceeds 22 words and no banned marketing word appears. All button
labels use result-naming verbs. The remaining flags are below.

#### F-2-15 / F-1-09 reopened — The hero caption explains a metaphor, not the control

**Quote:** **“The selection control is shown as a physical reading
instrument.”**

**Why this fails:** it describes the art direction rather than telling the
visitor how the selection works.

**Concrete rewrite:** **“The orange rectangle marks the text TapRead will
read.”**

#### F-2-16 / F-1-09 reopened — The initial reader status is ambiguous

**Quote:** **“Ready on this device.”**

**Why this fails:** it does not say what is ready and can be mistaken for an
offline/local-processing assurance.

**Concrete rewrite:** **“Ready for an image.”**

#### F-2-17 / F-1-09 reopened — “Private by default” is a generic slogan

**Quote/location:** eyebrow above **What stays on your device**: **“Private by
default.”**

**Why this fails:** the h2 and bullets carry the usable information; this line
is a generic marketing claim.

**Concrete fix:** delete the eyebrow, or use the literal label **“Local
processing and storage.”**

#### F-2-18 / F-1-09 reopened — Recognized text has two unnecessary aliases

**Quotes:** **“Recognized words will appear here.”** and **“You can correct a
web result before speaking it again.”**

**Why this fails:** the product's terminology table says the output is
**recognized text**, but these lines switch to “recognized words” and “web
result.”

**Concrete rewrites:** **“Recognized text will appear here.”** and **“You can
correct recognized text before speaking it again.”**

#### F-2-19 — JSON is unnecessary user-facing jargon

**Quotes:** landing: **“Download your saved text and settings as JSON.”**
README: **“Export and import reader data as JSON.”**

**Why this fails:** a person backing up reader data does not need to understand
the serialization format.

**Concrete rewrites:** **“Download a backup of your saved text and settings.”**
and **“Export and import a TapRead backup file.”** Keep JSON in developer docs.

#### F-2-20 — The setup sentence is developer jargon without a useful reason

**Quote:** README: **“The setup script copies version-pinned recognition files
into `public/vendor`.”**

**Why this fails:** “version-pinned” and the destination path are not explained.

**Concrete rewrite:** **“Setup copies the exact recognition files required by
this version into `public/vendor` for local use.”**

#### F-2-21 — IndexedDB is unnecessary privacy-copy jargon

**Quote:** README: **“The browser stores chosen content in IndexedDB on this
device.”**

**Why this fails:** the storage engine name does not help a reader understand
the privacy boundary.

**Concrete rewrite:** **“The browser stores chosen content in its local
database on this device.”** Put `IndexedDB` in `.factory/demo.md`.

#### F-2-22 — “Factory keystore” is unexplained internal jargon

**Quote:** README: **“Release signing must use the factory keystore.”**

**Why this fails:** it does not identify the owner or the action clearly.

**Concrete rewrite:** **“Sign release builds with the Param Factory Android
release key. Never add that key to Git.”**

#### F-2-23 — The README h1 is only the product name

**Quote:** `# TapRead Canvas`.

**Why this fails:** out of context, the heading does not state the job.

**Concrete rewrite:** `# TapRead Canvas — read selected Android text aloud`.

#### F-2-24 — The same consent term is written two ways

**Quotes:** README: **“after approving screen sharing”** and **“Android’s
screen-share prompt.”**

**Why this fails:** one concept has inconsistent wording.

**Concrete rewrite:** use **“after approving Android’s screen-share prompt”**
in both places.

#### F-2-25 — The displayed version disagrees with repository versions

**Exact location:** the live footer says **“v1.0.1 · polish-1”**;
`package.json` says `1.0.0`; Android `versionName` is `1.0`.

**Why this fails:** a visitor or support report cannot identify a single
release. `polish-1` is an internal workflow label rather than a build id.

**Concrete fix:** derive one public version from the release source and append
an immutable short commit/build id, for example **“v1.0.0 · 5c20538.”** Add a
test that compares the footer, package, Android, and release metadata.

## Claim command results

Every command in `.factory/claims.json` was run exactly from fresh local clone
`/tmp/tapread-review2.cR7T5j`. Command success is recorded separately from the
coverage defects in F-2-04 and F-2-07 through F-2-13.

| Claim id | Result | Observable evidence / limitation |
| --- | --- | --- |
| `demo-isolation` | PASS | IndexedDB sample/reset/exit assertions passed; localStorage is omitted and leaks per F-2-04. |
| `no-account-free` | PASS | Demo speech action completed with no identity/payment controls. |
| `web-local-processing` | PASS | OCR flow stayed same-origin and stored image/text in demo IndexedDB. |
| `device-speech` | PASS | Instrumented browser speech received the exact edited text. |
| `local-ocr` | PASS | Shipped sample produced “north gate / opens at dawn.” |
| `image-size-limit` | PASS | 20 MB PNG accepted; 20 MB + 1 byte rejected. |
| `keyboard-selection` | PASS | Shift+ArrowRight changed size; movement is not asserted. |
| `data-portability` | PASS | Export/import text passed; selection/rate are not asserted. |
| `offline-reload` | PASS | Controlled demo reloaded offline. |
| `android-private-capture` | PASS command / UNTESTED outcome | Source-string matches only. |
| `android-selection-memory` | PASS command / UNTESTED outcome | Source-string matches only. |
| `protected-captures` | PASS command / UNTESTED outcome | Source-string matches only. |

Each ledger id appears exactly once in the test source. No listed command
returned nonzero.

## Demo, storage, offline, and request evidence

- One click from `/` reached `/demo` and loaded a 1200 × 700 training card,
  selection, recognized sample text, and **Sample ready** state.
- Reset restored the exact sample. Start for real removed
  `demo:tapread-canvas`; seeded normal text remained in `tapread-canvas`.
- Demo theme use changed the normal `tapread-theme` key from `light` to `dark`
  and Reset did not restore it (F-2-04).
- A live OCR run recognized **“The north gate / opens at dawn. / TapRead
  training card 01.”** All 27 requests were same-origin; the only non-HTTP
  worker URL was `blob:`. There were no failed requests, console errors, or
  page errors.
- After service-worker control, a live offline reload kept `/demo`, its banner,
  image-reader UI, and recognized text available.

## Copy audit

Counts treat hyphenated terms and each URL/path/code token as one word. The
tables include every prose sentence on the landing page (including hidden
state/help copy present in the DOM) and every README sentence. Headings and
controls follow in a separate inventory.

### Landing-page sentences

| ID | Words | Exact sentence | Flag |
| --- | ---: | --- | --- |
| L01 | 18 | For Android users facing unlabeled text, select words on screen or in an image and hear them spoken. | Native outcome unverified: F-2-01/02/07 |
| L02 | 9 | Loads a sample image with text ready to hear. | — |
| L03 | 3 | No account needed. | — |
| L04 | 5 | Images stay on your device. | Android privacy boundary: F-2-05/13 |
| L05 | 3 | Free to use. | — |
| L06 | 10 | The selection control is shown as a physical reading instrument. | F-2-15 |
| L07 | 11 | Choose an image, adjust the selection, then hear the selected text. | — |
| L08 | 6 | Choose, paste, or drop an image. | Input coverage: F-2-09/10 |
| L09 | 6 | You can also load the sample. | — |
| L10 | 5 | Drag to adjust the selection. | F-2-10 |
| L11 | 3 | Arrows move it. | F-2-10 |
| L12 | 5 | Shift plus arrows resize it. | — |
| L13 | 5 | PNG, JPEG, WebP, or GIF. | F-2-09 |
| L14 | 4 | Maximum size: 20 MB. | — |
| L15 | 5 | A selection appears after loading. | — |
| L16 | 6 | You can correct it before speaking. | — |
| L17 | 5 | Recognized words will appear here. | F-2-18 |
| L18 | 5 | Choose an image to begin. | — |
| L19 | 6 | Check each screenshot before loading it. | — |
| L20 | 7 | TapRead does not bypass Android capture controls. | Native outcome unverified: F-2-07 |
| L21 | 6 | A protected capture may appear black. | Native outcome unverified: F-2-07 |
| L22 | 9 | On Android, enable TapRead and tap its floating button. | F-2-01/03 |
| L23 | 8 | Approve Android’s screen-share prompt for that capture session. | F-2-02/07 |
| L24 | 10 | In the web image reader, choose or paste a screenshot. | — |
| L25 | 6 | Place one selection around the words. | Native outcome unverified: F-2-07 |
| L26 | 9 | Android remembers the last selection for the next reading. | Native outcome unverified: F-2-07 |
| L27 | 7 | Your device recognizes and speaks the text. | Native half unverified: F-2-07/13 |
| L28 | 10 | You can correct a web result before speaking it again. | F-2-18 |
| L29 | 10 | The web image reader recognizes English text on this device. | — |
| L30 | 11 | Speech uses a voice installed on your browser or Android device. | Android half unverified: F-2-07 |
| L31 | 12 | Your latest web image, selection, text, and speed stay in browser storage. | F-2-12 |
| L32 | 10 | TapRead has no account, analytics, advertising, or cloud text recognition. | Android scope untested: F-2-13 |
| L33 | 8 | Download your saved text and settings as JSON. | F-2-19 |
| L34 | 8 | Import the same file on this device later. | — |
| L35 | 10 | Read selected screen or image text aloud on your device. | Native outcome unverified: F-2-07 |
| L36 | 9 | The original product illustration was generated for TapRead Canvas. | — |
| L37 | 5 | A new version is ready. | — |

### README sentences

| ID | Words | Exact sentence | Flag |
| --- | ---: | --- | --- |
| R01 | 11 | TapRead Canvas reads selected screen or image text aloud on Android. | F-2-01/02/03/07 |
| R02 | 14 | It helps people when games, streams, remote desktops, and custom canvases lack usable labels. | — |
| R03 | 10 | The installable web image reader handles screenshots and saved images. | — |
| R04 | 8 | Try the isolated sample at `/demo` or `/?demo=1`. | — |
| R05 | 12 | The demo uses separate storage and never reads your normal reader data. | F-2-04 |
| R06 | 9 | Select text with touch, a pointer, or the keyboard. | F-2-10 |
| R07 | 6 | Recognize English text on your device. | — |
| R08 | 7 | Hear, edit, stop, and repeat recognized text. | F-2-11 |
| R09 | 11 | Save the latest image, selection, text, and speed on this device. | F-2-12 |
| R10 | 7 | Export and import reader data as JSON. | F-2-19 |
| R11 | 11 | Use the installed web image reader offline after the first visit. | — |
| R12 | 9 | Use the Android floating control after approving screen sharing. | F-2-01/02/03/07/24 |
| R13 | 7 | Read the direct `/privacy` and `/terms` pages. | — |
| R14 | 8 | The reader is free and needs no account. | — |
| R15 | 10 | The claims and their exact test commands are in `.factory/claims.json`. | Misleading for native claims: F-2-07 |
| R16 | 4 | Open `http://localhost:5173/demo` during development. | — |
| R17 | 11 | The sample contains the sentence “The north gate opens at dawn.” | — |
| R18 | 5 | Reset demo restores that sample. | — |
| R19 | 11 | Start for real deletes demo storage and opens the normal reader. | — |
| R20 | 6 | See `.factory/demo.md` for the storage boundary. | Boundary incomplete: F-2-04 |
| R21 | 8 | Requirements are Node.js 20 or newer and npm. | — |
| R22 | 9 | The setup script copies version-pinned recognition files into `public/vendor`. | F-2-20 |
| R23 | 12 | The app loads no fonts, scripts, models, or analytics from another origin. | Android scope untested: F-2-13 |
| R24 | 9 | Run each command in `.factory/claims.json` from a clean checkout. | — |
| R25 | 9 | The browser suite covers desktop and 390px phone layouts. | — |
| R26 | 12 | It also checks keyboard use, offline reloads, routes, metadata, privacy, and accessibility. | Overstates keyboard/history coverage: F-2-08/10 |
| R27 | 7 | The production build is written to `dist/`. | — |
| R28 | 6 | Preview it with `npm run preview`. | — |
| R29 | 7 | The checked-in Capacitor project is in `android/`. | — |
| R30 | 5 | Its application id is `in.sociobot.tapreadcanvas`. | — |
| R31 | 11 | After a web build, copy the web assets and build Android: | — |
| R32 | 8 | On Android, enable the described TapRead accessibility service. | F-2-01/03 |
| R33 | 5 | Tap the floating TapRead button. | F-2-01/07 |
| R34 | 8 | Approve Android’s screen-share prompt for the capture session. | F-2-02/07/24 |
| R35 | 9 | Adjust one selection and read the recognized text aloud. | F-2-07 |
| R36 | 12 | The service hosts the visible overlay and does not inspect accessibility trees. | F-2-07 |
| R37 | 7 | Recognition and speech use Android’s on-device services. | F-2-07/13 |
| R38 | 9 | The last selection and reading are stored for repeat. | F-2-07 |
| R39 | 7 | Release signing must use the factory keystore. | F-2-22 |
| R40 | 4 | Never commit that keystore. | F-2-22 rewrite pairing |
| R41 | 10 | The browser stores chosen content in IndexedDB on this device. | F-2-21 |
| R42 | 7 | Demo data uses the separate `demo:tapread-canvas` database. | Incomplete boundary: F-2-04 |
| R43 | 11 | The product has no analytics, advertising, accounts, or cloud text recognition. | Android scope untested: F-2-13 |
| R44 | 12 | The first web visit downloads the recognition files from the same site. | — |
| R45 | 6 | Later installed sessions can reload offline. | — |
| R46 | 7 | Protected Android surfaces may produce blank captures. | Native outcome unverified: F-2-07 |
| R47 | 11 | TapRead refuses likely blank captures and does not bypass protected-screen controls. | Native outcome unverified: F-2-07 |
| R48 | 5 | Text recognition can be wrong. | — |
| R49 | 6 | Check safety-critical text against its source. | — |
| R50 | 5 | Licensed under the MIT License. | — |

### Headings, labels, and actions

All landing headings were checked: **Hear selected image text aloud**, **Read a
screenshot or image**, **No image loaded**, **Load an image**, **Adjust the
selection**, **Hear the text**, **Protected screens**, **How to read text
aloud**, **Choose the image**, **Hear or correct the text**, **What stays on
your device**, and **Export or import your reader data** make sense out of
context. Eyebrows **Android and web image reader**, **Web image reader**,
**Three steps**, and **Your saved data** are literal. **Private by default** is
flagged in F-2-17.

All actions were checked: **Try it with sample data**, **Install web image
reader**, **Choose an image**, **Load sample image**, **Clear image**, **Reset
selection**, **Read selected text**, **Repeat last reading**, **Speak edited
text**, **Stop speech**, **Export reader data**, **Import reader data**, and
**Reload updated app** use result-naming verbs. Demo's **Reset demo** and
**Start for real** match the required sandbox vocabulary. The theme icon has
the accessible result name **Use dark theme** / **Use light theme**.

README headings **What is included**, **Demo**, **Develop**, **Test and build**,
**Android handoff**, and **Privacy and limitations** are understandable out of
context. Its product-name-only h1 is flagged in F-2-23.

## Structure, accessibility, and visual identity

| Check | Result |
| --- | --- |
| Route titles | PASS: root, Demo, Privacy, Terms, and 404 use the required patterns and are under 60 characters. |
| One h1 and main | PASS on `/`, `/demo`, `/privacy`, `/terms`, `/404`, and an unknown URL. |
| Description/canonical/OG/favicon | PASS: route descriptions/canonicals update; OG image is a real 1200 × 630 JPEG; SVG favicon and 180 × 180 Apple icon return 200. |
| Designed 404 | PASS: unknown URL returned HTTP 404 with product-styled h1 and home action. `/404` itself returned 200. |
| Deep link | PASS: a cold `/#how` load placed the section in view. |
| Back button | FAIL: scroll restoration is F-2-08. |
| Route focus/announcement | PASS for forward SPA navigation and route title changes. |
| Links | PASS: all internal links and the external GitHub source returned 200; no dead link found. |
| Header/footer | PASS for presence and nav consistency; touch sizes and version copy fail F-2-14/F-2-25. |
| Axe | PASS: zero violations on all six checked routes; dark 390 px demo also had zero. |
| Reduced motion | PASS: button transition and animation durations computed to `0s`. |
| Mobile overflow | PASS: `scrollWidth === clientWidth === 390`. |
| Touch targets | FAIL: F-2-14. |
| Console | PASS on normal routes and OCR; the browser emitted only the expected document-404 network message for the deliberate unknown URL. |
| Initial JS | PASS: 28.52 KB main (10.27 KB gzip); deferred OCR chunk 15.59 KB (6.74 KB gzip). |
| Visual identity | PASS: warm enamel, dark green, brass/orange controls, calibrated marks, Atkinson type, and original instrument art are recognizably product-specific rather than generic SaaS. |

## Earlier finding audit

Every earlier review/polish item was checked against both the live site and the
current source.

| Earlier item | Review-2 result |
| --- | --- |
| F-1-01 demo | **REOPENED / BLOCKING** as F-2-04: web sample works, but it does not demo the Android job and theme uses real localStorage. |
| F-1-02 claims register/tests | **REOPENED / BLOCKING** as F-2-07: ledger exists and commands pass, but native tests are source-string checks. |
| F-1-03 dead checkout | Fixed: no paid offer, checkout link, or payment control remains. |
| F-1-04 first screen | Fixed: direct h1, audience sentence, facts, and sample action all fit the cold phone screen. |
| F-1-05 404 | Fixed: unknown live URL returns 404 and styled recovery UI. |
| F-1-06 unlisted claims | **REOPENED** as F-2-09 through F-2-13. |
| F-1-07 metadata/routing skeleton | **REOPENED / BLOCKING** as F-2-08; metadata/focus are fixed, scroll history is not. Footer version also fails F-2-25. |
| F-1-09 copy | **REOPENED** as F-2-15 through F-2-24. |
| F-1-10 top-level aside | Fixed: live Axe finds zero violations; the notice is now a labelled section. |
| Verification 1 P0 native workflow | **REOPENED / BLOCKING** as F-2-01/02/03/07. Source files exist, but the system binding/capture path is invalid and no distributable was exercised. |
| Verification 1 P2 headers/caching | Fixed: live CSP/frame protection and immutable asset caching are present. |
| Verification 2 Android environment boundary | Still open and now release-blocking: this worker has no Java/SDK, no APK exists, and no device outcome has been produced. |
| Polish/handoff statement “No review finding remains open” | Incorrect based on the reopened items above. |

The first review's claim-copy subfindings were also rechecked individually:

| Earlier subfinding | Result |
| --- | --- |
| F-1-08a Android workflow | Unverified/blocked by F-2-01/02/07. |
| F-1-08b web product name | Fixed: **web image reader** is consistent. |
| F-1-08c local OCR/speech | Web fixed; Android half unverified by F-2-07/13. |
| F-1-08d no account | Fixed; claim test passed. |
| F-1-08e no upload | Web fixed; Android privacy scope remains untested. |
| F-1-08f offline | Fixed; local and live offline reload passed. |
| F-1-08g Android selection | Unverified/blocked by F-2-01/02/07. |
| F-1-08h 20 MB | Boundary passed; four-format claim remains F-2-09. |
| F-1-08i unmeasured speed | Fixed: removed. |
| F-1-08j browser privacy | Fixed for the web OCR request log. |
| F-1-08k protected capture | Source exists, runtime outcome untested by F-2-07. |
| F-1-08l speed/quality comparison | Fixed: removed. |
| F-1-08m selection memory | Source exists, runtime outcome untested by F-2-07. |
| F-1-08n installed voice | Web fixed; native outcome untested. |
| F-1-08o edit/repeat | Web edit fixed; Stop/Repeat and native repeat remain F-2-11/F-2-07. |
| F-1-08p WebAssembly jargon | Fixed in visible copy. |
| F-1-08q browser/Android voice | Web fixed; native outcome untested. |
| F-1-08r stored fields | Partly fixed; selection/speed assertions missing in F-2-12. |
| F-1-08s no analytics/cloud | Web fixed; broad Android scope remains F-2-13. |
| F-1-08t free/export/offline | Fixed; relevant web tests passed. |
| F-1-08u paid history | Fixed: removed. |
| F-1-08v subscription | Fixed: removed. |
| F-1-08w merchant | Fixed: removed. |
| F-1-08x accessibility-service boundary | Source metadata present, but service cannot be accepted per F-2-01/07. |
| F-1-08y MediaProjection consent | Consent intent exists; current capture path fails F-2-02. |
| F-1-08z offline quantity | Fixed: quantity removed and offline behavior passed. |

## Missed leverage

No AI feature is warranted. Local OCR and device speech are the product's
privacy model; an optional generative step would add cost and network exposure
without solving the core job. Sync would also weaken the stated local-first
boundary. JSON import/export already covers manual portability.

The obvious missing value is not AI: it is a working, installable Android build
and a native sample/walkthrough. That is recorded as F-2-03 and F-2-04 rather
than treated as an optional enhancement.

## Verification summary

From a fresh local clone:

- `npm ci`: passed, 208 packages, 0 vulnerabilities.
- All 12 exact claim commands: returned PASS.
- `npm test`: 8 passed.
- `npm run build`: passed and produced `dist/`.
- `npm run test:e2e`: 23 passed, 3 intentional mobile duplicates skipped.
- Android Gradle/device tests: not runnable because this worker has no Java,
  `ANDROID_HOME`, or `ANDROID_SDK_ROOT`; there is no built APK to test.

## What would make this perfect

There is not “actually nothing left to do.” Perfection requires all 25 findings
above to be closed and independently rerun: a bindable API-35 Android service,
callback-safe capture, signed install route, native end-to-end claim evidence,
backup-safe privacy, a fully namespaced native-relevant demo, complete claim
coverage, restored browser history position, 44 px targets, and zero remaining
copy or version inconsistencies. Only then should another cold phone review be
eligible for PASS.
