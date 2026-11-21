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
over photos); the lit overlap and the first i-dot use the theme’s `--accent` (ice — never Ember). The component
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

## 2. Colour — “Warm, not obvious”

Same Intimo, warmer: a cool night ground, warm paper-coloured text, the ice-blue overlap,
and one warm detail you don't expect — like a sweater in a field.
Values match `src/app/globals.css`; use the CSS variables / Tailwind `velora-*` tokens in code.

| Name | Hex | Token | Use |
|---|---|---|---|
| Graphite (ground) | `#191C20` | `--paper` | Page background, app icon |
| Surface | `#252B31` | `--surface` | Raised surfaces |
| Night | `#12161A` | `--night` / `--sunken` | Deepest background, scrims |
| Paper | `#F1E8DC` | `--ink` / `--cream` | Primary text and logo on dark; the paper of illustration cards and print |
| Print ink | `#17110F` | `--print-ink` | Lines and text on paper |
| Secondary text | `#CFC7BC` / `#A9A39E` | `--ink-2` / `--muted` | Supporting text (warm greys) |
| Ice (the cool) | `#A8D5EF` | `--accent` | The overlap, the first i-dot, focus rings, small trust marks |
| Ice on light | `#5FAED8` | — | Ice on light backgrounds (contrast) |
| Ember (the warm) | `#E0704F` | `--warm` | The one warm moment per view: the italic line of a headline, its hand-drawn stroke, the main action |

- **One cool, one warm.** Ice stays the logo's light; Ember is the surprise. Never more than one
  warm moment per view, and no lipstick red by default.
- Ember text on graphite and graphite text on an Ember button are both 5.4 : 1 (WCAG AA).
- Ember is not an error colour: errors keep `--danger`.

## 3. Type

- **Instrument Serif** — the voice: headlines, the brand line, captions and people's own words.
  Roman for the statement, *italic* for the turn (“Není pro každého. *Možná pro tebe.*”).
- **Plus Jakarta Sans** — everything practical: navigation, body text, buttons, forms, labels, numbers.
- Small labels: Plus Jakarta Sans, uppercase, 11–12 px, `0.24em` tracking, `--muted`.
- Weights: serif always Regular (400); sans up to SemiBold (600). No Bold or ExtraBold headings.
- In code, `font-display` is the serif headline style (forced to 400); `font-display uppercase`
  falls back to the sans label style.
- The name is never typed as a heading in either font — use the logo (section 1).

## 4. Texture and illustration

- **Human, not perfect.** Lines that wobble, paper with rough edges, a stroke drawn by hand.
  In code: `@/components/brand/HandDrawn` (`HandUnderline`, `PaperCard`) and the `intimo-grain`
  class (a 13 % film-grain overlay). Nothing glossy, no gradients, no drop shadows.
- **Read it twice.** Illustrations are everyday images with a second meaning: ink on paper, one cool
  and one warm note, a title like a gallery print (“Blessed are those who ask.”, “Wine has legs.”,
  “Bound to happen.”). The sketches in code brief the illustrator, who brings the real hand.
- **Mood: the blue hour** (*Modrá hodinka*) — the minute at dawn before anything is assumed.
  Natural light, film grain, a cool night and one warm detail. Consent as the held breath before yes.

## 5. Voice

- Short, warm, direct, a little wry. Consent and boundaries first, never pushy.
- Brand line: **Hranice první. Pak chemie.** / *Boundaries first. Then chemistry.*
- Lines we use: *Není pro každého. Možná pro tebe.* · *No is a full sentence.* ·
  *We ask before we stick.* · *Blessed are those who ask.* · *Ask first.*
- Czech first for Prague, English for expats.
- Sentence case for everything except names of policies and places (“Delete account”, not
  “Delete Account”). No exclamation marks, no emoji in UI text.
- Thank people plainly: “Thank you.” / “Díky.” Confirmations are short: “Saved.”, “Sent for review.”
- Never show member counts or invent activity; never promise what the product doesn't do.

## 6. Interface

How the boards translate to screens. The member pages use the `intimo-member-*` classes in
`src/app/globals.css`; everything else follows the same rules with Tailwind tokens.

| Element | Rule |
|---|---|
| Main action | Pill (`rounded-full`), Ember fill, graphite text, SemiBold. One per view. |
| Other actions | Pill, transparent, `--ink` at 30 % border; text links underlined. |
| Header invite button | The outline pill, so the page's own main action stays the one warm moment. |
| Selected state (chips, toggles, tabs) | Ice fill or an Ember underline on tabs — a mark, not an action. |
| Small marks | Ice: trust dots, unread rings, progress, focus rings, your own chat bubbles. |
| Surfaces | Flat: `--surface` panels or cream paper cards. No drop shadows, no gradients, no glow. |
| Headlines | Serif 400; the turn of a two-part headline in italic Ember. |
| Texture | `intimo-grain` on large pages, `HandUnderline` under one hero headline. |

Admin tools are English-only and exempt from the one-warm-moment rule.

## 7. Social media

- Six posts, one voice: a print, a line, a note, a city, an event, a quote. Same margins, the
  serif for the line, one warm detail, the end card with the brand line and `intimo.live`.
- Profile picture: `public/brand/intimo-icon-512.png`.
- Keep everything non-explicit: no nudity, lingerie or fetish imagery, no hook-up language.
  Restrict posts to 18+ where the platform allows.
- Only stock/AI imagery or people who have given written consent; never real members.
