# Intimo roadmap

Effort: S ≤2 days · M ≤1 week · L ≤2 weeks · XL >2 weeks (one senior full-stack engineer).
Each item is a GitHub issue whose title starts with its ID, grouped by milestone. `→` marks a dependency.
`PRODUCT_VISION.md` (why) and `MVP_DEFINITION.md` (what launches) describe the same product as this file (when).

---

## Product thesis

Intimo is not a Tinder clone and should not become a prettier adult classifieds site.
The target is a **local, private, sex-positive network for Prague** where people can discover compatible people,
express intent, understand boundaries, build trust, communicate privately, and find reasons to return even
when they are not actively dating.

The product combines:
- **Amateri's local immediacy and explicit intent**,
- **Feeld-style identity / relationship / desire sophistication**,
- **FetLife-style community gravity**, with a dramatically cleaner, more private, mobile-first experience.

The core loop:

**Create profile → express desires/boundaries → discover compatible people → show intent / post a Plan → request private access / message → receive feedback → return because people, Plans and the local scene changed.**

The scarce side of the marketplace is women, couples, queer members, experienced community members and organisers.
Product decisions optimise for their safety, control and willingness to stay, not for maximising raw male sign-ups.

### Product principles
1. **Intent over endless swiping.** Tonight / Plans is core.
2. **Compatibility over proximity alone.** Shared desires, boundaries and relationship context matter.
3. **Control is the product.** Private media, visibility and messaging permissions are first-class.
4. **Sex-positive does not mean boundary-free.** Consent and limits are visible, understandable and easy to respect.
5. **Never expose emptiness.** Low-density launch surfaces widen recency and hide empty rails.
6. **Community before monetisation.** Phase 1 is free.
7. **PWA/web first.** Do not let native app-store restrictions distort the product.
8. **Fewer, finished capabilities.** A small number of connected behaviours that create repeat use.

---

## Phase 0: Rescue and simplification  (milestone `M0-rescue`)
**Objective:** one working production path, one identity, no dead code.

Status is evidence-based (verified 2026-10-17), not merge-based. ✅ done · 🟡 partial · ⬜ not started.

| ID | Issue | Effort | Depends | Status (evidence) |
|---|---|---|---|---|
| P0-01 | **Restore production DB:** keep Supabase production available; DB-backed public endpoints return 200 | S | — | ✅ `/api/public/community` returns 200 from the `Velora` project; real sign-up wrote auth user + profile |
| P0-02 | **Verify RLS lockdown in prod**; keep anon access minimized and record verification | S | P0-01 | ✅ 0 tables readable/writable by `anon`; 0 member write grants; results recorded in #2 |
| P0-03 | **Schema parity:** production/staging match canonical `supabase/migrations`; record state in `supabase/APPLIED.md` | M | P0-01 | 🟡 production matches (23 migrations recorded); staging project is paused and not in parity |
| P0-04 | **Production env:** R2, Resend and required server-only secrets configured in Vercel Production | S | — | 🟡 all configured; Resend verified by a real confirmation email; **R2 upload not yet exercised in production** |
| P0-05 | **Canonical branch:** `main` is production source of truth; protect `main` and require CI | S | — | 🟡 production deploys from `main`; CI runs on PRs and `main`; branch protection not configured |
| P0-06 | **Dead-code cleanup:** remove unreachable legacy/auth/monetisation modules and duplicate schemas | S | P0-05 | ✅ reachability scan finds 0 unreachable source files; Prisma, `db/schema.sql`, legacy bootstrap removed |
| P0-07 | **Vercel consolidation:** one Intimo production project, previews use staging | S | P0-05 | ⬜ empty `intimo` project still exists; previews have no working database |
| P0-08 | **Supabase Auth migration:** one identity, one session, `profiles.id = auth.uid()` | L | P0-03 | ✅ owner completed register → confirm → onboarding → sign-in on intimo.live; DB constraint enforces `auth_id = id` |
| P0-09 | **Remove Auth0 completely:** code, package, env vars and tenant references | S | P0-08 | 🟡 code + package gone; Auth0 env vars remain in Vercel and CI; tenant not deleted |
| P0-10 | **Admin simplification:** only `ADMIN` / `MODERATOR`, Supabase MFA, no God Mode/internal MFA stack | M | P0-08 | ⬜ owner bootstrapped as admin; God Mode and internal TOTP still present |
| P0-11 | **Code quality:** Prettier + ESLint + typecheck in CI | S | P0-06 | 🟡 ESLint + typecheck + tests + build run in CI; no Prettier, codebase still minified in places |
| P0-12 | **Velora → Intimo rename:** package, storage keys, project labels, remaining visible copy | S | P0-06 | ⬜ ~450 `velora` identifiers remain (mostly Tailwind tokens) |
| P0-13 | **CI / smoke:** GitHub Action + Playwright smoke on preview | M | P0-05 | 🟡 GitHub Action exists and is green; no Playwright smoke |

**Acceptance:** intimo.live loads real data; sign-up → confirm → onboarding → upload → sign out/in works; no Auth0 runtime references remain; one production deployment path; CI green on `main`.

---

## Phase 1: Functional MVP + Prague chemistry  (milestone `M1-mvp`)
**Objective:** the smallest product that 100–200 real Prague members can use repeatedly and that feels alive, private, safe and distinctly sex-positive.

**Scope guard:** Phase 1 is closed. A new idea enters Phase 1 only if something of equal effort leaves it.

| ID | Issue | Effort | Depends |
|---|---|---|---|
| P1-00 | **Benchmark validation:** hands-on Amateri / Feeld / FetLife teardown; update parity notes with observed behaviour | S | — |
| P1-01 | **Member RLS:** member tables keyed by `auth.uid()`; service role restricted to admin/cron paths *(part 1 shipped: owner-only reads + Realtime publication)* | L | P0-08 |
| P1-02 | **Onboarding v3:** single/couple, partner DOB, identity, relationship structure, looking-for, Prague area, first photo, privacy defaults | M | P0-08, P1-03 |
| P1-03 | **Prague areas:** districts + nearby cities, approximate distance only, never precise GPS exposure | S | P0-03 |
| P1-04 | **Presence:** throttled `last_active_at`, online/recent buckets, privacy-aware visibility | S | P0-08 |
| P1-05 | **People (discovery) v3:** server-side filters incl. desires, keyset pagination, home rails, low-density empty-state rules | M | P1-03, P1-04 |
| P1-06 | **Private Album Handshake:** request / grant once / grant until revoked / deny; immediate revoke; optional personalised watermarking | M | P1-01 |
| P1-07 | **Tonight / Plans:** 6 intent categories, 24 h / 72 h / 7 d expiry, area, who may reply, home/profile surfaces | M | P1-03 |
| P1-08 | **Interest + Visitors:** activity tab, mutual interest, profile views, invisible-browsing rules | M | P1-01 |
| P1-09 | **Realtime messaging:** Supabase Realtime, Requests folder, unread state, block enforcement | L | P1-01 |
| P1-10 | **Image messages:** private media pipeline, expiring authenticated delivery, never public URLs | M | P1-09 |
| P1-11 | **Return triggers:** email outbox + Resend for unread message, mutual interest, access request/grant, plan reply; preferences/unsubscribe | M | P0-04 |
| P1-12 | **Photo reactions:** lightweight likes on approved media | S | P1-01 |
| P1-13 | **Postgres rate limiting:** replace per-instance/in-memory limits | S | P0-03 |
| P1-14 | **Privacy Center:** discreet mode, invisible browsing, profile visibility, message permissions, activity visibility, delete/export | M | P0-08 |
| P1-15 | **Landing + positioning:** explain Intimo as Prague's private sex-positive network; no empty-community exposure | M | — |
| P1-16 | **Mobile navigation:** Home · People · Tonight · Messages · Me; Activity integrated prominently *(Me tab shipped; `Dating` becomes `Tonight` with P1-07)* | S | P1-07 |
| P1-17 | **Full-loop E2E:** register → onboard → desires/boundaries → media → discover → interest → Plan → private access → realtime message → notification → block → delete | M | P1-09 |
| P1-18 | **Moderation operations:** photo review SLA, first-Plan review, report context, Scene listing review | S | P0-10 |
| P1-19 | **Desire Graph v1:** structured interests with states `Love it / Into it / Curious / Not for me / Hard limit`; profile display; discovery filters | L | P1-02, P1-01 |
| P1-20 | **Boundaries & approach preferences:** `Comfortable with / Ask me first / Not interested` for messaging, explicit media and common interaction types; enforced in messaging and private-media requests | M | P1-19 |
| P1-21 | **Prague Scene v0:** curated listing of sex-positive events / munches / workshops / parties with venue, date, organiser and outbound link; admin-curated, no event platform | M | P1-03 |
| P1-22 | **Trust signals v1:** photo verified, established profile, optional organiser/community verification; no public reputation score | M | P1-18 |
| P1-23 | **PWA baseline:** manifest, installability, app-like shell, privacy-conscious notification permission flow (push itself is Phase 2) | S | P1-16 |

### MVP launch experience
On day one a member can:

1. Create a profile that communicates identity, relationship context, desires and boundaries.
2. See compatible people in Prague without swipe mechanics.
3. See shared desires and intent on a profile (explicit "why you match" summaries arrive in Phase 2).
4. Post **Tonight / Plans** to make current intent visible.
5. Request private media through an explicit consent handshake.
6. Exchange realtime messages once contact is welcome, within the other person's boundaries.
7. Receive meaningful return triggers: visits, interest, access requests and messages.
8. Discover a curated slice of the real Prague sex-positive scene, even before Intimo has density.

### Migration work
- `connections` / `friendships` → `interests`
- simplify `dating_ads` into Plans
- add `areas`, `desires`, `member_desires`, `member_boundaries`, `scene_events`
- add `album_access_grants`, `profile_views`, `conversations`
- keep location approximate
- remove legacy monetisation columns where safe

### Explicitly not MVP
Generic feed, compatibility summaries, relationship links between profiles, chat rooms, groups/forums, blogs, livestreaming, creator economy, credits, video calls, webcam rooms, algorithmic swiping, public popularity scores.

### Acceptance
- all full-loop journeys pass in Playwright on production-like staging
- 375 px mobile layout is clean
- discovery p95 < 300 ms at 10k profiles
- blocked users disappear everywhere immediately
- private media is never retrievable by an unauthorised viewer
- a hard limit or `Not interested` boundary is never overridden by an unsolicited request
- no zero-count / dead-community UI surfaces

**→ Launch gate:** Prague beta with an initial recruitment target of 100–200 members, deliberately weighted toward women, couples, queer members and recognised community participants/organisers. Owner decision, 20 October 2026: use the normal shareable signup link (`https://intimo.live/register`), with open registration rather than invite-only admission. This changes the admission plan; the remaining safety and operational launch checks retain their verified or owner-deferred status in the readiness report.

---

## Phase 2: Social density and daily return  (milestone `M2-density`, ~4–6 weeks after launch)
**Objective:** turn Intimo from a useful discovery product into something members check several times a week.

| ID | Issue | Effort | Depends |
|---|---|---|---|
| P2-01 | **Shared chemistry:** profile-level compatibility summary from shared desires, looking-for and non-conflicting limits; transparent rules, no black-box AI *(moved from Phase 1: needs real members and desire data to be meaningful)* | M | P1-19, P1-05 |
| P2-02 | **Relationship links v1:** individual profiles can optionally link a partner / couple context without shared credentials *(moved from Phase 1: couple profiles cover the launch case)* | M | P1-02 |

Further Phase 2 work (tracked in the M2 epic):
- **New photos / activity feed**, Prague-first, with reactions and comments (M)
- **Web push** for messages, mutual interest, access request and Plan reply (M)
- Typing indicators + message reactions (S)
- Personalised weekly **New in Prague / Tonight this week** digest (S)
- Automated media safety scanning before broad public-feed distribution (M)
- Favourites lists; "who favourited me" remains private (S)
- Verification v2: faster review + clearer trust state (S)
- **Desire Graph v2:** better compatibility explanations, saved filters, negative-limit filtering (M)
- **Safe Meet:** optional private meeting card / share-to-trusted-contact + post-meet "all good?" check; no public ratings (M)
- **Scene v1:** organiser profiles, RSVP / interested, recurring events, event safety/reporting (M)
- **Explore editorial:** short practical sex-positive / kink education and Prague-scene guides (M)

**Acceptance:** D7 return ≥35%; ≥3 sessions/week for activated members; measurable use of Plans, Activity and Scene beyond direct messages.

---

## Phase 3: Community gravity  (milestone `M3-community`)
**Entry criterion:** enough local density that synchronous/community surfaces will not look dead; guideline ≥1,000 active Prague-area members or proven demand from Phase 2 behaviour.

- One moderated **Prague Tonight** room, then thematic rooms only if usage supports them (L)
- Event / club organiser tooling, richer RSVP and recurring series (L)
- Topic circles / groups only where the local audience exists (L/XL)
- Text posts / writings (M)
- Relationship constellations beyond one partner link (M)
- Community moderation tools and organiser trust model (M)

**Do not** create dozens of empty groups or rooms in advance.

**Acceptance:** ≥20% of WAU engage with Scene/community surfaces monthly; community features improve retention rather than merely adding inventory.

---

## Phase 4: Rich media / realtime  (milestone `M4-media`)
- Video upload with transcoding + moderation (XL)
- Ephemeral / one-time media (M)
- Stories only if the feed demonstrates demand (M)
- 1:1 video calls with consent prompts and abuse controls (L)
- Webcam rooms only after separate legal, moderation and infrastructure review (XL)

---

## Phase 5: Monetisation  (milestone `M5-monetization`, only after usage justifies it)
**Entry criterion:** ≥5,000 MAU in Czechia with stable retention and proven repeat usage.

Potential premium value: visibility / discovery boosts, advanced compatibility filters, convenience features, optional enhanced discreet-mode features.

Never paywall: blocking, reporting, essential privacy, account deletion/export, core consent/safety functionality.

Adult-compatible payment provider and legal/entity review are required before implementation.
Creator monetisation remains a separate future programme with dedicated compliance/KYC requirements.

---

## UX / brand direction

Intimo should feel like a **private late-night Prague club**, not porn and not generic dating SaaS.

- **Keep the existing Intimo design system:** dark charcoal and warm neutrals with the established Intimo gold as the primary accent
- restrained secondary tones only where they add meaning (e.g. status, boundaries); no new primary accent colour
- editorial typography and intimate, editorial photography
- attraction through anticipation, confidence, touch and atmosphere rather than explicit anatomy
- no neon cyber-sex aesthetic
- no card-heavy admin/dashboard feel in member UX
- no swipe-first interaction model

The emotional promise is not "more sex". It is:

> **A private place to be honest about what you are into, discover people who understand it, and stay in control of how far things go.**

---

## Sequencing summary
```text
P0 remainder (parallel, small): P0-03 staging · P0-04 R2 check · P0-09 env cleanup · P0-10 admin · P0-12/13

P1-03 Prague Areas ─► P1-02 Onboarding v3 ─► P1-19 Desire Graph ─► P1-20 Boundaries
                  ├─► P1-05 People v3 (also needs P1-04 Presence)
                  ├─► P1-07 Tonight / Plans ─► P1-16 Nav rename ─► P1-23 PWA
                  └─► P1-21 Prague Scene v0

P1-01 RLS ─► P1-09 Realtime Messaging ─► P1-10 Image Messages
         ├─► P1-06 Private Album Handshake
         └─► P1-08 Visitors / Interest, P1-12 Reactions

P0-04 Email ─► P1-11 Return Triggers
P0-10 Admin ─► P1-18 Moderation ops ─► P1-22 Trust signals
All ─► P1-17 Full-loop E2E ─► Launch gate

Launch ─► P2 chemistry / relationship links / push / Safe Meet / Scene v1
      ─► P3 community rooms & organiser tooling only when density proves demand
      ─► P4 rich media
      ─► P5 monetisation only after retention and scale
```
