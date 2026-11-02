# Instructions for coding agents (Claude, Codex, Copilot, …)

## Brand — read before touching anything visual
The brand reference is **[`docs/brand/BRAND.md`](docs/brand/BRAND.md)**. Follow it for the website,
emails, social media, documents and any generated images.

- **Logo:** always use `import { Logo } from "@/components/brand/Logo"` in the app
  (`<Logo className="h-8 w-auto" />`, `variant="symbol" | "wordmark"`). Never type “Intimo” as a
  stand-in logo, never recreate the mark, and never use the retired `intimo↗` arrow wordmark.
- **Files** outside the app (decks, social, print): `public/brand/` — don’t redraw them.
- **Icons:** `public/icons/` (favicon, PWA, Apple touch icon) are the brand icons; keep them in sync with `public/brand/`.
- **Colours:** use the theme tokens in `src/app/globals.css` (`velora-*` in Tailwind). Ice blue (`--accent`) is the single accent.
- **Type:** Plus Jakarta Sans for everything; Instrument Serif Italic only for quotes / people’s own words.
- **Changing the brand** means updating `docs/brand/BRAND.md`, `public/brand/`, `public/icons/` and
  `src/components/brand/Logo.tsx` together in one PR.

## Product rules that always apply
- Never display exact public member counts or invent activity.
- Keep privacy, consent and boundary enforcement on the server; the UI only explains it.
- Don’t destroy production data; database migrations are additive with a rollback path.
