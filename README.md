# Intimo

18+ social discovery and community platform for consenting adults —
https://intimo.live (repository historically named **Velora**).

**Phase 1 is free.** No payments, subscriptions, credits or creator monetization
ship in the product (`MONETIZATION_ENABLED=false`, hard-coded).

## Source of truth
| Document | What it answers |
|---|---|
| [docs/AUDIT_2026-10.md](docs/AUDIT_2026-10.md) | What exists, what's broken, the 12 key questions |
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | What Intimo is, for whom, the core loop |
| [docs/MVP_DEFINITION.md](docs/MVP_DEFINITION.md) | The 8 MVP capabilities with acceptance criteria |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Target architecture, ADR-002 (Supabase Auth), data model |
| [docs/FEATURE_PARITY_AMATERI.md](docs/FEATURE_PARITY_AMATERI.md) | Benchmark matrix and priorities |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases 0–5, issues, dependencies |
| [docs/SECURITY_AND_MODERATION.md](docs/SECURITY_AND_MODERATION.md) | Security, 18+, moderation rules |
| [docs/CLEANUP.md](docs/CLEANUP.md) | DELETE NOW / MIGRATE THEN DELETE / KEEP |

`docs/archive/` holds earlier audits and compliance drafts. They are reference
only and are superseded wherever they conflict with the documents above.

## Stack
Next.js 14 (App Router) on Vercel · Supabase Postgres (schema: `supabase/migrations/`
only) · Cloudflare R2 media · Resend email. Auth is currently Auth0, migrating to
Supabase Auth (ADR-002).

## Develop
```bash
cp .env.example .env.local   # fill in values; never commit secrets
npm ci
npm run dev
npm run check                # tests + typecheck + lint + build
```
Previews must never point at the production database.
