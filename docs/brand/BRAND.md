# Intimo brand

The reference for how Intimo looks and sounds: the website, app icons, social media
(TikTok, Instagram), print, emails and anything else carrying the name.
**Anyone changing the brand changes this file first.**

Visual overview: [`intimo-logo-board.pdf`](./intimo-logo-board.pdf)

---

## 1. Logo — “The overlap”

Two rings are two people. Only where they overlap is lit: chemistry where both say yes.
It is the brand line — *Hranice první. Pak chemie.* (Boundaries first. Then chemistry.) — as a picture.

| Part | What it is |
|---|---|
| **Symbol** | Two outlined rings; the overlap filled ice blue. |
| **Wordmark** | `intimo`, lowercase, Plus Jakarta Sans ExtraBold (800), outlined. The first i-dot is ice blue, the second matches the letters. |
| **Lockup** | Symbol left, wordmark right. The default. |

### In the website code

Always use the component — never type the name as text in a heading, and never recreate it.

```tsx
import { Logo } from "@/components/brand/Logo";

<Logo />                                     // full lockup, h-8
<Logo className="h-7 w-auto" />              // set the size with a height class
<Logo variant="symbol" className="h-6 w-auto" />
<Logo variant="wordmark" className="h-6 w-auto" />
```

Rings and letters use `currentColor` (set it with `text-velora-ink`, or `text-velora-onPhoto`
over photos); the lit overlap and the first i-dot use the theme’s `--accent`. The component
is generated from font outlines, so it never depends on a font loading.

### Files

| Use | File |
|---|---|
| Website header, documents (dark background) | `public/brand/intimo-logo-dark.svg` · `@3x.png` |
| Light backgrounds, print | `public/brand/intimo-logo-light.svg` · `@3x.png` |
| On your own background | `public/brand/intimo-logo-transparent.svg` · `@3x.png` |
| Wordmark only | `public/brand/intimo-wordmark-dark.svg` / `-light.svg` |
| Symbol only | `public/brand/intimo-symbol.svg` |
| Social profile picture, app icon | `public/brand/intimo-icon-512.png` · `intimo-icon.svg` |
| PWA icons | `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` |
| Favicon (heavier rings for small sizes) | `public/icons/favicon.svg`, `favicon-32.png`, `favicon-16.png` |

### Rules

- **Clear space:** keep at least the height of one ring free on every side.
- **Minimum size:** full logo 96 px wide; symbol 16 px, and below 48 px use the favicon files (thicker rings).
- **Do not:** stretch or rotate it, change the ring colour, light both rings, add effects or shadows,
  put it on a busy photo without a dark scrim, or set “intimo” in another font.
- **Retired:** the old `intimo↗` arrow wordmark and the serif “Intimo” headline. Don’t use them.
- **Trademark:** two overlapping rings are a common motif. Run a trademark search before
  registering the mark or printing at scale.

---

## 2. Colour

Values match `src/app/globals.css`; use the CSS variables / Tailwind `velora-*` tokens in code.

| Name | Hex | Token | Use |
|---|---|---|---|
| Graphite | `#191C20` | `--paper` | Page background, app icon |
| Surface | `#252B31` | `--surface` | Raised surfaces |
| Night | `#12161A` | `--night` / `--sunken` | Deepest background, scrims |
| Mist | `#EDF1F4` | `--ink` | Primary text, logo on dark |
| Ice | `#A8D5EF` | `--accent` | The one bright accent: overlap, first i-dot, key actions |
| Ice on light | `#5FAED8` | — | Ice on light backgrounds (contrast) |
| Secondary text | `#C1CAD2` / `#AAB7C3` | `--ink-2` / `--muted` | Supporting text |

Ice is used sparingly — one lit thing per view, like the logo.

## 3. Type

- **Plus Jakarta Sans** — everything: headings ExtraBold/Bold with tight tracking, body Regular/Medium.
- **Instrument Serif Italic** — only for people’s own words and quotes (“Mám ráda pomalé večery…”).

## 4. Voice

- Short, warm, direct. Consent and boundaries first, never pushy.
- Brand line: **Hranice první. Pak chemie.** / *Boundaries first. Then chemistry.*
- Czech first for Prague, English for expats.
- Never show member counts or invent activity; never promise what the product doesn’t do.

## 5. Social media

- Templates and the first 10 TikTok posts follow this brand (graphite, ice, Plus Jakarta Sans,
  the end card with the brand line and `intimo.live`).
- Profile picture: `public/brand/intimo-icon-512.png`.
- Keep everything non-explicit: no nudity, lingerie or fetish imagery, no hook-up language.
  Restrict posts to 18+ where the platform allows.
- Only stock/AI imagery or people who have given written consent; never real members.
