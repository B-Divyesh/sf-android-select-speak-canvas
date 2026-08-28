# Adversarial first-read review 1 — TapRead Canvas

Date: 2026-08-28  
Live URL: <https://android-select-speak-canvas.sociobot.in>  
Reviewed commit: `b878950e5d3ec2e21f28f3e1314e93583207bd33`

## Verdict: FAIL

The product is not acceptable on a cold phone visit. There is no one-click,
isolated demo, the claims ledger and all required claim tests are absent, the
paid checkout link is dead, and an unknown route renders the home page rather
than a designed 404. The first-screen headline is a slogan rather than the
job, so it does not independently say what the tool does.

## Cold first read

Tested in new Chromium contexts at 390 × 844 and 1440 × 900, without
scrolling. The visible phone copy was:

> Private on-device reading aid / Frame it. Hear it. / On Android, TapRead can
> frame text over a game, stream, image, or custom canvas after your explicit
> screen-share approval. This web app is the private screenshot fallback. OCR
> and speech stay on this device. / Read an image.

My best inference was: this is an Android tool that reads text from a screen
or image aloud; it is for an Android user with inaccessible text; I should tap
**Read an image**. That is not an adequate first-read answer because the
headline **“Frame it. Hear it.”** names neither the job nor the user, and the
only prominent action merely jumps to an empty image reader. It does not say
that a sample will be loaded or make the native Android flow tryable. The
required “what should I click first?” answer is therefore unavailable as a
working action. This is a blocking first-screen failure.

## Findings

### Blocking

#### F-1-01 — No one-click isolated demo

**Location/evidence:** The first-screen action is **“Read an image”**
(`src/main.ts:40`). It scrolls to `#reader`; its resulting first screen says
**“Waiting for an image”** and **“No image on the glass.”** The only sample
control is the second-screen **“Use sample”** button (`src/main.ts:55`).
`/?demo=1` and `/demo` both returned the ordinary home page, with no demo
banner, no **Reset demo**, no **Start for real**, and no sample preloaded.

The failure is also a real data-boundary failure: in one fresh browser context
I loaded the normal **Use sample** path. It wrote `image` and `state` to the
`tapread-canvas` IndexedDB database. Opening `/?demo=1` in that same context
showed **Image ready** and the loaded image. `src/storage.ts:12-13` fixes the
only database name as `tapread-canvas`; `src/main.ts:116-124, 166-168` always
reads/writes it. There is no `demo:` namespace or demo mode.

**Why this fails:** A visitor cannot try the product in one click, cannot see
the product already in use after the click, and has no assurance that the
sample path is separated from their actual content. This directly fails the
demo and sandbox contract.

**Concrete fix:** Add `/demo` (and `?demo=1`) that immediately renders the
framed training card and recognized sample text in a dedicated `demo:`
IndexedDB namespace. Put **Try it with sample data** on the first screen with
adjacent text such as “Loads a sample image and reads it aloud.” Keep a
persistent **“Demo — sample data, nothing is saved”** banner with **Reset
demo** and **Start for real**. Add Playwright tests proving `?demo=1` never
reads or writes normal keys and that reset restores only the sample.

#### F-1-02 — Required claims register and claim tests are absent

**Location/evidence:** `.factory/claims.json` does not exist. `rg
'@claim:|claims\\.json'` finds no tagged claim tests. Consequently there were
no listed claim commands to run from a clean checkout, and every visitor claim
below is untested under the required contract.

**Why this fails:** Privacy, offline, pricing, local processing, Android
workflow, and export promises are material promises. The review cannot verify
them reproducibly without the required register and one observable sandbox
test per claim.

**Concrete fix:** Create `.factory/claims.json`; enumerate every retained
claim with its exact location, a clean-demo test command tagged
`@claim:<id>`, and sandbox instructions. Add observable Playwright/unit tests
for each. Remove wording that cannot be tested. The unlisted instances are
enumerated in F-1-08a through F-1-08z.

#### F-1-03 — Paid checkout link is dead

**Location/evidence:** **“Buy supporter unlock”** links to
`https://api.sociobot.in/api/v1/products/android-select-speak-canvas/checkout`
(`src/license.ts` via `src/main.ts:71`). A live `curl -I -L` returned **404**.

**Why this fails:** A user is invited to buy a ₹499 unlock but cannot reach a
checkout. This is a dead link and a misleading purchase path.

**Concrete fix:** Register/configure the exact product checkout route with the
factory billing API, then add a live-safe integration test or a release check
that follows the link and expects the documented checkout response. Until it
works, remove the price and purchase call to action.

#### F-1-04 — First-screen headline and action do not state the job or a tryable next step

**Location/evidence:** The sole h1 is **“Frame it. Hear it.”**
(`src/main.ts:38`); the root title is **“TapRead Canvas — frame it, hear it”**
(`src/main.ts:32`). The first action is **“Read an image,”** but it only
anchors to an empty reader, as confirmed in the cold-click test.

**Why this fails:** The h1 is a metaphor/mood slogan. A first-time visitor has
to infer both “select image text and hear it” and the distinction between the
Android overlay and web fallback from a 35-word paragraph. The action promises
no result and does not enter a working example.

**Concrete fix:** Use `h1` **“Hear text from any Android screen”** (or
**“Read selected image text aloud”** for an honest web-only surface), title
**“TapRead Canvas — hear selected image text”**, and a primary **“Try it with
sample data”** action. Use one ≤22-word supporting sentence that names Android
users and the before/after result.

#### F-1-05 — Unknown URLs do not have a designed 404

**Location/evidence:** `/no-such-route` and `/404.html` both returned HTTP 200
and rendered the normal home page (`h1` **“Frame it. Hear it.”**). There is no
404 source file, and `src/main.ts:10-15` treats every path other than
`/privacy` and `/terms` as the product page.

**Why this fails:** A broken or mistyped URL silently presents a different
place. It fails the required designed 404 and makes route errors impossible to
recognize.

**Concrete fix:** Implement a styled `/404` screen with title **“Page not
found — TapRead Canvas”**, an h1 **“Page not found”**, a plain explanation, and
a **“Go to TapRead Canvas”** link. Configure the host to return/rewrite it as
a 404, while preserving SPA fallback only for declared application routes.

#### F-1-06 — Material visitor claims have no test entry (unlisted claims)

Each row is a separate unlisted-claim finding because the claims register is
missing. The proposed fix in every row is: add this exact claim to
`.factory/claims.json` with a uniquely tagged, clean-demo observable test, or
remove/rewrite it as non-claim copy.

| ID | Exact quote and location | Why it needs a test |
| --- | --- | --- |
| F-1-08a | “On Android, TapRead can frame text over a game, stream, image, or custom canvas after your explicit screen-share approval.” — hero | Core Android workflow and consent promise. |
| F-1-08b | “This web app is the private screenshot fallback.” — hero | Product/privacy positioning. |
| F-1-08c | “OCR and speech stay on this device.” — hero | Privacy/local-processing promise. |
| F-1-08d | “No account.” — hero | Account requirement promise. |
| F-1-08e | “No upload.” — hero | Privacy/network promise. |
| F-1-08f | “Works after the first offline install.” — hero | Offline promise. |
| F-1-08g | “On Android, the companion offers the same framing control directly over a screen you choose to share.” — reader introduction | Native workflow promise. |
| F-1-08h | “Screenshot or image, up to 20 MB.” — Load step | Quantitative file-size promise. |
| F-1-08i | “Tight regions read faster.” — Frame step | Performance claim. |
| F-1-08j | “Nothing leaves your browser.” — reader status | Privacy/network promise. |
| F-1-08k | “TapRead never bypasses Android or DRM capture protections; protected content may appear black.” — protected-screen notice | Security/protected-content behaviour. |
| F-1-08l | “A smaller frame reduces noise and makes local English OCR faster.” — How it works | Performance/quality claim. |
| F-1-08m | “Android remembers your last frame for the next reading.” — How it works | Persistence behaviour. |
| F-1-08n | “TapRead speaks through your device’s own voices.” — How it works | TTS behaviour. |
| F-1-08o | “Android can repeat the last reading; this fallback lets you edit OCR mistakes before replaying.” — How it works | Native/web behaviour. |
| F-1-08p | “English OCR runs in WebAssembly on this device.” — privacy section | Local-processing promise. |
| F-1-08q | “Speech uses your browser or Android system voice.” — privacy section | TTS implementation promise. |
| F-1-08r | “The most recent image and result are stored only in local app storage.” — privacy section | Storage/privacy promise. |
| F-1-08s | “No analytics, advertising IDs, account, or cloud OCR.” — privacy section | Privacy/network promise. |
| F-1-08t | “Reading, repeating, editing, data export and offline use are always free.” — pricing | Entitlement/offline/export promise. |
| F-1-08u | “The supporter unlock adds a private list of your last 25 recognized passages.” — pricing | Entitlement/count/privacy promise. |
| F-1-08v | “No subscription or usage meter.” — pricing | Billing promise. |
| F-1-08w | “Sociobot/Dodo is merchant of record.” — pricing | Merchant/billing promise. |
| F-1-08x | “The native companion uses an `AccessibilityService` only to host the user-visible TapRead overlay; it does not inspect accessibility trees or window content.” — README opening | Security/privacy promise. |
| F-1-08y | “Pixels enter only after Android’s `MediaProjection` consent dialog.” — README opening | Consent/privacy promise. |
| F-1-08z | “A first online load is required to install approximately 9 MB of local OCR runtime/model data; subsequent readings make no OCR network call.” — README Privacy and limitations | Quantitative/offline/network promise. |

The README also repeats or extends these promises in its feature list and
Android/billing sections. Those repetitions must point to the same registered
claim IDs in the ledger; no untested paraphrase should remain.

### Major

#### F-1-07 — Required metadata, header/footer skeleton, and route announcement are incomplete

**Location/evidence:** Root has no canonical link, Open Graph metadata,
Twitter-card metadata, or `apple-touch-icon`; the live DOM reported all absent.
The root title is a slogan rather than “Product — what it does.” The header
contains only **How it works** and **Unlock** (`src/main.ts:20`), not a Demo or
Privacy route; the footer lacks **Built by Param Factory** and a version/build
id (`src/main.ts:24-28`). The sitemap omits `/demo` and `/404`.

After clicking the footer Privacy link, the live browser had
`document.activeElement === BODY` and no route announcement. `src/main.ts`
uses full render/page navigation but never focuses the incoming h1 or supplies
an application-level `aria-live` route announcement.

**Concrete fix:** Add canonical, OG title/description/image, Twitter card,
and a 180px Apple touch icon. Use plain route-specific titles. Put Demo and
Privacy in the consistent header, and the required Param Factory/build
information in the footer. Add declared routes to sitemap. On every route
change, set focus to a temporarily focusable h1 and announce the new page in a
polite live region; test direct links and back/forward.

#### F-1-09 — Copy uses slogans, metaphors, vague headings, generic verbs, and inconsistent terms

**Location/evidence:** See the complete copy inventory below. The clearest
examples are **“Frame it. Hear it.”**, **“Tune in to the words,”** **“No image
on the glass,”** **“Three moves, then back to what mattered,”** and **“Local
from lens to voice.”** They do not name a section or convey a usable fact.
**“Verify”** does not say what result it produces; **“Unlock”** hides that it
opens pricing. The reader uses *frame*, *rectangle*, *region*, and *pixels* for
the same selection; it uses *web fallback*, *screenshot fallback*, and *local
reader* for the web product.

**Concrete fix:** Apply the terminology table below. Rename headings and
buttons as shown, split every README sentence over 22 words, and preserve only
plain, testable facts.

| Current | Problem | Concrete replacement |
| --- | --- | --- |
| Frame it. Hear it. | Mood slogan, no job | Hear selected image text aloud |
| Tune in to the words | Metaphor | Read a screenshot or image |
| No image on the glass | Metaphor | No image loaded |
| Three moves, then back to what mattered | Mood slogan | How to read text aloud |
| Local from lens to voice | Metaphor | What stays on your device |
| Your pixels stay yours | Slogan | Privacy and local processing |
| Unlock | Vague nav verb | Pricing |
| Read an image | Does not state actual result/action | Try it with sample data |
| Use sample | Does not name result | Load sample image |
| Verify | Vague verb | Verify license token |
| frame / rectangle / region / pixels | One concept, four words | **selection** everywhere |
| local reader / web fallback / screenshot fallback | One product surface, three names | **web image reader** everywhere |

#### F-1-10 — A live accessibility scan has a remaining moderate landmark issue

**Location/evidence:** A live mobile Axe scan reported
`landmark-complementary-is-top-level` (moderate), one node: the unnamed
`<aside class="notice">` at `src/main.ts:64`. Serious/critical results were
zero, but the stated acceptance standard is zero findings.

**Concrete fix:** Make this notice ordinary content (for example a labelled
`section`) or give the complementary landmark a clear accessible name and
place it where the landmark structure is meaningful. Re-run Axe at 390px.

## Demo and privacy sandbox check

There is no demo entry point to validate. On a fresh live context, the normal
sample flow made only same-origin HTTP(S) requests; first load made only
same-origin requests for HTML, CSS, JavaScript, self-hosted font, mark, and
hero image. This is useful evidence for the cold load, but it does **not**
verify the advertised privacy/offline claims because a clean demo flow does not
exist and no claims tests exist. No third-party cold-load request was observed.

## Earlier-review history check

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files.
I read `.factory/verification.md`, `.factory/verification-2.md`, and the
previous handoff.

| Earlier item | Recheck result |
| --- | --- |
| Verification 1 P0: native Android accessibility workflow missing | **Fixed in source, not device-recompiled here.** `rg` confirms `TapReadAccessibilityService`, `BIND_ACCESSIBILITY_SERVICE`, `TYPE_ACCESSIBILITY_OVERLAY`, `MediaProjection`, ML Kit `TextRecognition`, Android `TextToSpeech`, and protected-buffer handling. Live copy also identifies the web page as a fallback. The container still lacks Java/Android SDK, so an APK/device exercise remains unperformed as already documented. |
| Verification 1 P2: CSP, permissions policy, framing, immutable cache | **Fixed.** Live root and asset responses contain CSP with `frame-ancestors 'none'`, Permissions-Policy, `X-Frame-Options: DENY`, nosniff/referrer/COOP; hashed JS returns `Cache-Control: public, max-age=31536000, immutable`. |
| Verification 2 P2 boundary: Android-capable test needed before APK promotion | **Still an environment boundary.** It is not presented as done by this review; `java`, `ANDROID_HOME`, and Android SDK are unavailable here. |

## Copy audit

Word counts use visible text and count words/numbers, not punctuation. This is
the full landing-page text inventory; headings, labels, and buttons are
included so that non-sentence copy can be audited too. `M` marks a
metaphor/vague heading; `B` marks a non-result-naming button; `C` marks a
claim that must be in the claims ledger; `J` marks unexplained technical
jargon.

### Landing page

| # | Words | Exact text | Flag |
| --- | ---: | --- | --- |
| L01 | 4 | Skip to main content | — |
| L02 | 2 | TapRead Canvas | — |
| L03 | 3 | How it works | — |
| L04 | 1 | Unlock | B |
| L05 | 5 | Private on-device reading aid | C |
| L06 | 2 | Frame it. | M |
| L07 | 2 | Hear it. | M |
| L08 | 20 | On Android, TapRead can frame text over a game, stream, image, or custom canvas after your explicit screen-share approval. | C |
| L09 | 8 | This web app is the private screenshot fallback. | C |
| L10 | 7 | OCR and speech stay on this device. | C, J |
| L11 | 3 | Read an image | B |
| L12 | 2 | Install app | B |
| L13 | 2 | No account. | C |
| L14 | 2 | No upload. | C |
| L15 | 6 | Works after the first offline install. | C |
| L16 | 7 | One precise gesture, like tuning an instrument. | M |
| L17 | 3 | The local reader | inconsistent term |
| L18 | 5 | Tune in to the words | M |
| L19 | 9 | This web fallback uses a screenshot or saved image. | inconsistent term |
| L20 | 17 | On Android, the companion offers the same framing control directly over a screen you choose to share. | C |
| L21 | 2 | Ready locally | vague |
| L22 | 5 | No image on the glass | M |
| L23 | 14 | Load a screenshot, paste an image, or use the sample to learn the controls. | — |
| L24 | 4 | Drag to frame text. | inconsistent term |
| L25 | 6 | Keyboard: arrows move; Shift + arrows resize. | — |
| L26 | 7 | Screenshot or image, up to 20 MB. | C |
| L27 | 3 | Choose an image | — |
| L28 | 2 | Use sample | B |
| L29 | 1 | Clear | B |
| L30 | 5 | A frame appears after loading. | inconsistent term |
| L31 | 4 | Tight regions read faster. | C; inconsistent term |
| L32 | 2 | Reset frame | inconsistent term |
| L33 | 2 | Speech speed | — |
| L34 | 3 | Read framed text | inconsistent term |
| L35 | 3 | Repeat last reading | — |
| L36 | 2 | Recognized text | — |
| L37 | 3 | editable before speaking | — |
| L38 | 3 | Speak edited text | — |
| L39 | 2 | Stop speech | — |
| L40 | 4 | Waiting for an image | — |
| L41 | 4 | Nothing leaves your browser. | C |
| L42 | 4 | Sensitive or protected screens: | — |
| L43 | 6 | check the screenshot before loading it. | — |
| L44 | 13 | TapRead never bypasses Android or DRM capture protections; protected content may appear black. | C, J |
| L45 | 5 | A narrow tool by design | vague |
| L46 | 7 | Three moves, then back to what mattered | M |
| L47 | 3 | Choose the pixels | inconsistent term |
| L48 | 17 | In the Android companion, enable TapRead once, tap its floating button, and approve Android’s screen-share prompt. | C |
| L49 | 12 | In this web fallback, take a screenshot or choose one from Photos. | inconsistent term |
| L50 | 4 | Frame only the words | inconsistent term |
| L51 | 3 | Draw one rectangle. | inconsistent term |
| L52 | 11 | A smaller frame reduces noise and makes local English OCR faster. | C, J |
| L53 | 9 | Android remembers your last frame for the next reading. | C |
| L54 | 3 | Listen or correct | vague |
| L55 | 7 | TapRead speaks through your device’s own voices. | C |
| L56 | 15 | Android can repeat the last reading; this fallback lets you edit OCR mistakes before replaying. | C, J |
| L57 | 4 | Your pixels stay yours | M |
| L58 | 5 | Local from lens to voice | M |
| L59 | 8 | English OCR runs in WebAssembly on this device. | C, J |
| L60 | 8 | Speech uses your browser or Android system voice. | C |
| L61 | 13 | The most recent image and result are stored only in local app storage. | C |
| L62 | 8 | No analytics, advertising IDs, account, or cloud OCR. | C, J |
| L63 | 3 | Optional supporter unlock | jargon |
| L64 | 5 | Keep the core reader free | vague |
| L65 | 1 | ₹499 | C |
| L66 | 3 | one-time purchase | C |
| L67 | 11 | Reading, repeating, editing, data export and offline use are always free. | C |
| L68 | 13 | The supporter unlock adds a private list of your last 25 recognized passages. | C |
| L69 | 5 | One device-local reading history | C |
| L70 | 5 | No subscription or usage meter | C |
| L71 | 6 | Sociobot/Dodo is merchant of record | C, J |
| L72 | 3 | Buy supporter unlock | — |
| L73 | 3 | Restore a purchase | — |
| L74 | 10 | Paste the license token from your receipt or another device. | J |
| L75 | 2 | License token | J |
| L76 | 1 | Verify | B |
| L77 | 3 | Free reader active. | C |
| L78 | 2 | Recent passages | — |
| L79 | 3 | Your local data | — |
| L80 | 7 | Move or inspect it whenever you want. | vague |
| L81 | 2 | Export JSON | J |
| L82 | 2 | Import JSON | J |
| L83 | 7 | Private, local reading assistance for inaccessible pixels. | C; inconsistent term |
| L84 | 16 | The product illustration is original AI-generated artwork; it depicts the interaction, not protected-content capture. | provenance claim |
| L85 | 5 | A new version is ready. | C |
| L86 | 1 | Update | B |
| L87 | 11 | TapRead Canvas needs JavaScript to process images locally in your browser. | C, J |

### README

The README’s headings are: **TapRead Canvas**, **What is included**,
**Develop**, **Test and build**, **Android handoff**, **Billing configuration**,
and **Privacy and limitations**. They are mostly contextual; the product title
is not a plain job headline. The inventory below preserves each prose sentence
and each feature-list item. `>22` is over the hard cap.

| # | Words | Exact text | Flag / proposed rewrite |
| --- | ---: | --- | --- |
| R01 | 20 | TapRead Canvas is a private Android reading aid for text trapped in games, streams, remote desktops, images, or custom canvases. | C; “Android tool that reads selected screen text aloud.” |
| R02 | 31 | In the Android companion, turn on the explicitly described accessibility service, tap its floating TapRead button, approve Android's screen-share prompt, draw one rectangle, and hear it through the device voice. | >22, C, J; split into three steps. |
| R03 | 10 | OCR runs locally; images and recognized text are never uploaded. | C, J; “Text recognition runs on your device. Images and text are not uploaded.” |
| R04 | 9 | The installable web app remains a screenshot/image fallback. | inconsistent term; “The web image reader is a screenshot fallback.” |
| R05 | 11 | The artifact is an installable PWA plus a Capacitor Android companion. | J; state user-facing install options, not stack. |
| R06 | 23 | The native companion uses an `AccessibilityService` only to host the user-visible TapRead overlay; it does not inspect accessibility trees or window content. | >22, C, J; split and explain “screen text.” |
| R07 | 8 | Pixels enter only after Android's `MediaProjection` consent dialog. | C, J; “Tap Start capture, then approve Android’s screen-share dialog.” |
| R08 | 34 | It uses on-device ML Kit text recognition and Android text-to-speech, remembers the last frame/text for repeat, and refuses blank protected captures instead of attempting to bypass `FLAG_SECURE` or DRM. | >22, C, J; split into four plain statements. |
| R09 | 10 | Local English OCR with a self-hosted Tesseract WebAssembly model | C, J; “Reads English text on your device.” |
| R10 | 7 | Pointer, touch, and keyboard-adjustable reading frame | inconsistent term; “Adjust the selection with touch or keyboard.” |
| R11 | 10 | Device text-to-speech, editable results, stop and repeat controls | “Hear, edit, stop, and repeat text.” |
| R12 | 11 | Local persistence of the latest image, frame, text, and speech speed | C; “Saves the latest image, selection, text, and speed on this device.” |
| R13 | 9 | Installable offline PWA with update notification and offline fallback | C, J; “Install the web image reader for offline use.” |
| R14 | 8 | JSON export/import and no analytics or tracking | C, J; “Export or import your data. The app has no analytics.” |
| R15 | 21 | Optional ₹499 one-time supporter license for a 25-item local history; the core accessibility workflow and export are never gated | C, J; split price/history/free-core facts. |
| R16 | 5 | Direct `/privacy` and `/terms` pages | implementation detail; “Read Privacy and Terms.” |
| R17 | 28 | Capacitor 7 Android project with native accessibility overlay, MediaProjection consent flow, local ML Kit OCR, Android TTS, and repeat-last-region at `android/` | >22, J; move stack details to developer notes. |
| R18 | 6 | Requirements: Node.js 20+ and npm. | — |
| R19 | 20 | `predev` copies the version-pinned OCR worker, WebAssembly core, and English model from `node_modules` into the local public directory. | J; developer-only but split or document terms. |
| R20 | 5 | No runtime CDN is used. | C; “The app loads no runtime CDN assets.” |
| R21 | 9 | The exact production build command is `npm run build`. | — |
| R22 | 12 | Static output lands in `dist/` with `dist/index.html` at its root. | — |
| R23 | 25 | End-to-end tests cover desktop and 390px mobile layouts, Axe serious/critical issues, keyboard framing, real local OCR, legal routes, and an offline reload. | >22, J; split test scope. |
| R24 | 5 | To preview the production output: | — |
| R25 | 12 | After a web build, sync it into the checked-in Capacitor skeleton: | J; “Copy the web build into the Android project:” |
| R26 | 18 | The application id is `in.sociobot.tapreadcanvas`; Android package identifiers cannot contain the hyphens in the factory slug. | developer detail; split. |
| R27 | 27 | After installation, open the app, follow Android's accessibility-service disclosure, then tap the floating TapRead button and approve the system screen-share prompt for each capture session. | >22, C; split into numbered user steps. |
| R28 | 12 | Release signing must use the factory keystore and must never be committed. | developer policy; — |
| R29 | 17 | Checkout and verification use the Sociobot billing API with the product slug, never a payment provider SDK. | J; developer detail. |
| R30 | 4 | Production is the default. | ambiguous; name the environment. |
| R31 | 8 | To use the registered test product on staging: | J; developer detail. |
| R32 | 9 | The factory registers the product and return URL separately. | developer detail. |
| R33 | 8 | No product id or secret is stored here. | C; developer detail. |
| R34 | 15 | The browser stores only user-chosen content in IndexedDB and the license token in localStorage. | C, J; “The browser stores chosen content and license token on this device.” |
| R35 | 24 | A first online load is required to install approximately 9 MB of local OCR runtime/model data; subsequent readings make no OCR network call. | >22, C, J; split and test number/offline behaviour. |
| R36 | 7 | Protected Android surfaces may produce black captures. | C; plain but needs test. |
| R37 | 14 | TapRead refuses those frames and does not attempt to bypass DRM or `FLAG_SECURE`. | C, J; define protected screen in user terms. |
| R38 | 14 | OCR can be wrong, so safety-critical text must be checked against its source. | useful safety statement; OCR is J. |
| R39 | 5 | Licensed under the MIT License. | — |

## What would make this perfect

Make the actual Android selection-to-speech workflow demonstrable in one tap
with realistic sample text and strict demo storage isolation. Replace the
slogan-led landing page with a job-led first screen, register and test every
claim, restore the checkout route, and finish the route/metadata/404/accessibility
details. Then re-run this full review from a fresh browser context and an
Android-capable worker before claiming a PASS.

## Verification record

Commands and live checks performed:

```sh
npm ci
npm test                 # 8 passed
npm run build            # passed; dist/ produced
npm run test:e2e         # 9 passed, 1 intentional duplicate skip
```

Live checks covered 390px and desktop cold loads, the primary action, `/demo`,
`?demo=1`, `/privacy`, `/terms`, unknown routes, request logs, sample storage,
headers, metadata, link crawl, route focus, and a mobile Axe scan. The live
cold-load request log contained same-origin URLs only; no console/page errors
were observed. The root has `lang`, one h1, main landmark, favicon, and a
distinct mid-century instrument identity; those items are not findings.
