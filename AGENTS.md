# Instructions for coding agents (Claude, Codex, Copilot, …)

## Brand — read before touching anything visual
The brand reference is **[`docs/brand/BRAND.md`](docs/brand/BRAND.md)**. Follow it for the website,
emails, social media, documents and any generated images.

- **Logo:** always use `import { Logo } from "@/components/brand/Logo"` in the app
  (`<Logo className="h-8 w-auto" />`, `variant="symbol" | "wordmark"`). Never type “Intimo” as a
  stand-in logo, never recreate the mark, and never use the retired `intimo↗` arrow wordmark.
- **Files** outside the app (decks, social, print): `public/brand/` — don’t redraw them.
- **Icons:** `public/icons/` (favicon, PWA, Apple touch icon) are the brand icons; keep them in sync with `public/brand/`.
- **Colours:** use the theme tokens in `src/app/globals.css` (`velora-*` in Tailwind). One cool, one warm:
  ice blue (`--accent`) lights the logo and small trust marks; Ember (`--warm`) is the one warm moment per view.
- **Type:** Instrument Serif for the voice (headlines, brand line, captions, quotes); Plus Jakarta Sans for
  everything practical (nav, body, buttons, forms).
- **Changing the brand** means updating `docs/brand/BRAND.md`, `public/brand/`, `public/icons/` and
  `src/components/brand/Logo.tsx` together in one PR.

## Languages — Czech and English, everywhere
Intimo is fully bilingual. Czech is the default for visitors in the Czech Republic (or with a
Czech browser); everyone can switch with the flag switch (`@/components/i18n/LanguageSwitch`).

- **Every user-facing string** goes through `t()`: `const { t } = useTranslation()` from
  `@/context/LanguageContext`, then `t("Post an ad")` or `t("Reply to {name}", { name })`.
  English text is the key; outside components use `tr()` from `@/lib/i18n/translate`;
  server components use `serverT()` from `@/lib/i18n/server`.
- **Add the Czech** for every new or changed string to `src/locales/cs/phrases.json` in the same
  PR (informal “ty”, same `{placeholders}`). `tests/czech-coverage.test.mjs` fails otherwise.
- Write whole sentences as one key; don’t build them from English fragments or pronouns.
- Dates and times: use `locale` from `useTranslation()` with `Intl`/`toLocale*`, not a fixed `"en-GB"`.
- Admin tools stay English-only.

## Product rules that always apply
- Never display exact public member counts or invent activity.
- Keep privacy, consent and boundary enforcement on the server; the UI only explains it.
- Don’t destroy production data; database migrations are additive with a rollback path.
