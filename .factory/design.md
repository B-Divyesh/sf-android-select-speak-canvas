# TapRead Canvas visual thesis

## Direction: a mid-century listening instrument

TapRead Canvas should feel like a dependable tabletop receiver built for one
precise operation, not a generic OCR dashboard. A warm enamel chassis, dark
recessed display, calibrated ticks, physical-looking toggles and a single
orange “read” control turn an abstract accessibility workflow into an obvious
instrument: frame the signal, listen, repeat. Decoration is limited to details
that explain state or affordance.

## Tokens

- **Enamel** `#F2E7CE`: main light canvas, chosen from aged instrument faceplates.
- **Paper** `#FBF6E9`: raised controls and reading surfaces.
- **Ink** `#182522`: primary text; 13.1:1 on enamel.
- **Dial green** `#254C45`: panel surface and headings; 8.1:1 on enamel.
- **Signal orange** `#E47743`: primary action and selection rectangle; white text
  is not used on it—ink provides 5.3:1.
- **Brass** `#A17632`: focus and instrument accents; ink provides 5.1:1.
- **Muted** `#59645E`: secondary copy; 5.2:1 on enamel.
- **Success** `#2B694D`, **warning** `#8A5412`, **danger** `#9D352C`.
- Dark treatment uses `#101816` chassis, `#192421` panel, `#F3EAD7` text,
  `#F29A67` signal and `#D6B36A` brass. It follows the OS preference and can
  also be changed from the controls.

## Type and spacing

The display face uses the self-hosted **Atkinson Hyperlegible** regular/bold
pair for differentiated letterforms; small labels and readouts use a system
monospace stack with tabular figures. The scale is 14 / 16 / 20 / 26 / 40 / 56
px and body copy never drops below 16px. Layout follows an 8px rhythm with 4px
for fine dial marks; primary controls are at least 48px. Reading measure is
65ch.

## Interaction grammar

Controls behave like an instrument: pressed buttons move down 1px, status
lamps pair colour with text, and selection edges use solid handles. The main
flow is numbered **1 Load → 2 Frame → 3 Listen**. On narrow screens the image
well precedes the controls; secondary product explanation collapses below the
working instrument. Keyboard users focus the image and use arrows to move the
frame or Shift+arrows to resize it.

## Motion

Panel changes use 180–240ms opacity and transform transitions. The read lamp
pulses once when speech begins; no animation loops. With
`prefers-reduced-motion: reduce`, transitions and smooth scrolling are removed
and changes become instant while preserving layers, outlines and status text.

## Asset plan and provenance

- Hand-authored SVG brand mark and calibration marks are repository-native,
  original assets licensed with the product under MIT.
- Hero illustration: an original 3:2 raster scene generated with the factory
  image model on 2026-08-27 and exported as responsive WebP/AVIF. It is
  atmospheric product explanation only; it does not imply that the web build
  can capture protected content.

### Prompt sheet

**Subject:** close-up tabletop accessibility reading instrument framing one
rectangle of luminous text-like marks on a screen, one large orange button,
speaker grille, no person. **World:** 1960s industrial design studio,
purpose-built assistive device. **Materials:** warm cream enamel, forest-green
painted steel, dark glass, aged brass, orange bakelite. **Light:** soft morning
window light with restrained shadows. **Lens/composition:** orthographic
three-quarter product view, generous negative space, tactile details, 3:2.
**Palette words:** warm oat, pine green, oxidized brass, signal orange,
charcoal. **Negative list:** no readable text, no letters, no watermark, no
logos, no brands, no people, no phone mockup, no neon, no gradient background,
no futuristic hologram, no medical imagery.

Generated source and prompt sidecar live in `assets/src/`; production exports
live in `public/assets/`. Generated imagery is disclosed in the site footer.
