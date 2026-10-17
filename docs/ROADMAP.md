# Intimo roadmap

Effort: S ≤2 days · M ≤1 week · L ≤2 weeks · XL >2 weeks (one senior full-stack engineer).
Each item below is a GitHub issue (ID = issue title prefix) grouped by milestone.
`→` marks a dependency.

---

## Phase 0: Rescue and simplification  (milestone `M0-rescue`, ~2 weeks)
**Objective:** one working production path, one identity, no dead code.

| ID | Issue | Effort | Depends |
|---|---|---|---|
| P0-01 | **Restore production DB:** move Supabase `Velora` to a non-hibernating tier, confirm `/api/public/community` returns 200 | S | — |
| P0-02 | **Verify RLS lockdown in prod** (`SECURITY_AND_MODERATION.md` §1); apply lockdown if open; incident assessment if data was exposed | S | P0-01 |
| P0-03 | **Schema parity:** diff prod schema against `supabase/migrations`; apply missing migrations to staging, then prod; record result in `supabase/APPLIED.md` | M | P0-01 |
| P0-04 | **Production env:** add R2 ×4, Resend ×2, cron secret to Vercel Production; remove `MONETIZATION_ENABLED` env | S | — |
| P0-05 | **Merge `codex/intimo-secure-mvp` → `main`**, set Vercel production branch = `main`, protect `main` | S | — |
| P0-06 | **Delete dead code** per `CLEANUP.md` DELETE NOW (49 files, Prisma, legacy schemas, dormant tests) | S | P0-05 |
| P0-07 | **Vercel consolidation:** delete empty `intimo` project; rename `velora` → `intimo`; staging DB for previews | S | P0-05 |
| P0-08 | **ADR-002 Supabase Auth migration** (schema + trigger + code swap + existing-user recovery emails) | L | P0-03 |
| P0-09 | **Remove Auth0** code, package, env vars, tenant | S | P0-08 |
| P0-10 | **Admin simplification:** `ADMIN`/`MODERATOR` roles + Supabase MFA; delete God Mode and internal TOTP | M | P0-08 |
| P0-11 | **Format codebase** (`prettier --write`, separate commit) + ESLint in CI | S | P0-06 |
| P0-12 | **Velora → Intimo rename** (package, Tailwind tokens, storage keys, project names) | S | P0-06 |
| P0-13 | **CI:** GitHub Action running `npm run check` + Playwright smoke on preview | M | P0-05 |

**Delete:** everything in CLEANUP.md DELETE NOW; Auth0; God Mode; internal MFA.
**Acceptance:** intimo.live loads real data; a new user can sign up → confirm email →
onboard → upload a photo in production; no Auth0 references remain (`grep -ri auth0 src` empty);
one Vercel project; CI green on `main`.
**Parallel:** P0-04/05/07/11/12 run alongside the DB work. P0-08 is the critical path.

---

## Phase 1: Functional MVP  (milestone `M1-mvp`, ~4 weeks)
**Objective:** the 8 capabilities of `MVP_DEFINITION.md` in production.

| ID | Issue | Effort | Depends |
|---|---|---|---|
| P1-00 | Hands-on Amateri validation of every "I" row in `FEATURE_PARITY_AMATERI.md` | S | — |
| P1-01 | RLS policies for member tables keyed by `auth.uid()`; move member routes to the user-scoped client | L | P0-08 |
| P1-02 | Onboarding v2: single/couple, partner DOB, looking-for chips, Prague area, photo step | M | P0-08 |
| P1-03 | `areas` table (Prague districts + nearby) + approximate distance | S | P0-03 |
| P1-04 | Presence: throttled `last_active_at` + online buckets | S | P0-08 |
| P1-05 | Discovery v2: server-side filters, keyset pagination, home rails, empty-state rules | M | P1-03, P1-04 |
| P1-06 | Private albums: `album_access_grants`, request/grant/revoke UX | M | P1-01 |
| P1-07 | Plans: simplify dating ads (6 categories, expiry, area), home + profile surfaces | M | P1-03 |
| P1-08 | Interest + visitors (`interests`, `profile_views`), Activity tab; migrate `connections`/`friendships` | M | P1-01 |
| P1-09 | Realtime messaging (Supabase Realtime), `conversations` table, Requests folder | L | P1-01 |
| P1-10 | Image messages through the media pipeline | M | P1-09 |
| P1-11 | Email outbox + Resend cron: message, mutual interest, access request, plan reply; preferences + unsubscribe | M | P0-04 |
| P1-12 | Photo likes (`content_reactions`) | S | P1-01 |
| P1-13 | Postgres rate limiter replacing in-memory limiter | S | P0-03 |
| P1-14 | Settings consolidation: privacy (discreet mode, invisible browsing, message permission), account (email/password/delete/export) | M | P0-08 |
| P1-15 | Landing page that explains Intimo to a logged-out visitor without exposing emptiness; EN + CS only | M | — |
| P1-16 | Mobile navigation v2: Home · Browse · Plans · Messages · Me, unread badges | S | P1-05 |
| P1-17 | Playwright e2e for the full loop (MVP definition of done) | M | P1-09 |
| P1-18 | Moderation queue tune-up: photo review SLA view, plan pre-approval, report context | S | P0-10 |

**Migration work:** `connections`/`friendships` → `interests`; `dating_ads` column cleanup;
drop monetization columns; add `conversations`.
**Delete:** `/api/connections`, `/api/friends`, legacy `photo_albums`/`videos` tables (after zero-row check), locales de/hu/ro/sk, retention engine automation.
**Acceptance:** all 16 success steps of the brief pass in Playwright against production-like staging; the 375 px layout is clean; p95 discovery < 300 ms.
**Parallel tracks:** (A) data/RLS: P1-01, 06, 08, 12; (B) discovery: P1-03, 04, 05, 07; (C) messaging + email: P1-09, 10, 11; (D) UX: P1-02, 14, 15, 16. Track C waits on P1-01.

**→ Launch gate:** invite-only Prague beta, 100–200 recruited members (couples and women first), weekly "New in Prague" email.

---

## Phase 2: Social density  (milestone `M2-density`, ~4 weeks after launch)
**Objective:** more reasons to return each day.
- New-photos feed (Prague-first) with likes + **comments** (M)
- PWA: manifest, install prompt, web push for messages and interest (M)
- Typing indicators, message reactions (S)
- Weekly digest personalised by looking-for (S)
- Automated media scanning (CSAM hash + nudity classifier) before the public feed (M)
- Favourites lists; "who favourited me" stays private (S)
- Verification v2: faster review, badge in discovery filters (S)
**Acceptance:** D7 return ≥35%; ≥3 sessions/week for active members.

## Phase 3: Community  (milestone `M3-community`)
**Objective:** group gravity once there are ≥1,000 Prague members.
- One moderated "Prague tonight" chat room, then thematic rooms (L)
- Events / parties (clubs, organiser accounts, RSVP) (L)
- Groups / forums: only if room usage proves the demand (XL)
- Text posts / blogs (M)
**Acceptance:** ≥20% of WAU participate in a room or event monthly.

## Phase 4: Rich media / realtime  (milestone `M4-media`)
- Video upload with transcoding + moderation (XL)
- Stories (M)
- 1:1 video calls (WebRTC via a provider) with consent prompts (L)
- Webcam rooms: only with a separate legal review (XL)

## Phase 5: Monetization  (milestone `M5-monetization`, only after usage justifies it)
**Entry criterion:** ≥5,000 MAU in Czechia with stable retention.
- Premium (visibility boost, advanced filters, invisible browsing, unlimited message requests). Never paywall safety features (L)
- Payment provider compliant with adult content (CCBill/Segpay-class), separate legal entity review (L)
- Creator monetization only after a separate compliance programme (2257-style records, payouts, KYC) (XL)

---

## Sequencing summary
```
P0-01 ─► P0-02/P0-03 ─► P0-08 (Supabase Auth) ─► P1-01 (RLS) ─► P1-06/08/09/12 ─► P1-10/17 ─► Launch
P0-04, P0-05 ─► P0-06/07/11/12/13 (parallel)          └► P0-09/P0-10
P1-03 ─► P1-05/P1-07 (parallel with RLS track)        P1-11 (after P0-04, parallel)
```
