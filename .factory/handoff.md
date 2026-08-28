# TapRead Canvas polish round 1 handoff

Date: 28 August 2026

Work order: `android-select-speak-canvas-polish-1`

Live URL: <https://android-select-speak-canvas.sociobot.in>

Live demo: <https://android-select-speak-canvas.sociobot.in/demo>

## Delivered

The landing page now states the job directly and opens a working sample in one click.
`/demo` and `?demo=1` preload a realistic image, selection, and recognized text.
Demo storage is isolated from normal reader storage and is deleted on reset or exit.

All retained visitor claims are registered in `.factory/claims.json`.
Each claim has one uniquely tagged observable test.
The dead paid offer and its unprovable billing claims were removed.

The site now has route-specific titles, descriptions, canonical URLs, social metadata, and a 1200×630 preview.
It includes a 180px touch icon, consistent navigation, route focus, announcements, and a designed 404.
Unknown live URLs return HTTP 404 while rendering the product-specific 404 page.

The copy now uses “selection,” “recognized text,” and “web image reader” consistently.
The first screen and all supporting copy meet the plain-language limits in `.factory/copy-audit.md`.
The mid-century listening-instrument identity, colors, typography, texture, and controls remain intact.

## Verification

Clean clone tested at pushed commit `5284d105b3f64fe842e5c89d0e1888246a795651`.
Every tagged claim passed in the full suite.
Every recorded command was also exercised individually across the clean-clone passes.

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

- Unit: 8 passed.
- Build: passed; `dist/` produced.
- Browser: 23 passed across desktop and 390px mobile; 3 duplicate expensive mobile checks skipped by design.
- Claim commands: all passed from a clean clone.
- Live Playwright: all functional assertions passed serially, including actual OCR and offline reload.
- Live Axe CLI: 0 violations on `/`, `/demo`, `/privacy`, and `/terms`.
- `verify-url.sh`: title, `lang`, one h1, main, alt text, labels, and console checks passed.
- Live route status: root/demo/legal 200; unknown path 404.
- Initial JavaScript: 28.49 KB main + 0.51 KB loader; OCR chunk 15.59 KB, all uncompressed.
- Initial CSS: 12.92 KB uncompressed.
- Fonts: 112 KB total.
- Mobile Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100.
- Lighthouse metrics: LCP 2.0 s, CLS 0, TBT 70 ms.

Evidence is in `.factory/evidence/polish-1/`.
The finding-by-finding closure record is `.factory/polish-1.md`.

## Deployment

The static output was deployed through `/opt/fleet/lib/deploy-static.sh`.
Azure deployment `ea13a44f-7486-4b4e-b081-dc5788f2409e` succeeded.
The custom domain returned HTTPS 200 after deployment.
The final cold browser check found no console errors and no false update notice.

## Known gaps

No review finding remains open within this static PWA work order.

The injected stack decision assigns APK production to a later Android-capable work order.
This container has no Java binary or Android SDK, so it cannot compile or run the checked-in Android instrumentation tests.
Native behavior remains covered by source-contract tests and the existing device-test source.
