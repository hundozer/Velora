# Intimo roadmap

Effort: S ≤2 days · M ≤1 week · L ≤2 weeks · XL >2 weeks (one senior full-stack engineer).
Each item below is a GitHub issue (ID = issue title prefix) grouped by milestone.
`→` marks a dependency.

---

## Product thesis

Intimo is not a Tinder clone and should not become a prettier adult classifieds site.
The target is a **local sex-positive network for Prague** where people can discover compatible people,
express intent, understand boundaries, build trust, communicate privately, and find reasons to return even
when they are not actively dating.

The product should combine:
- **Amateri's local immediacy and explicit intent**,
- **Feeld-style identity / relationship / desire sophistication**,
- **FetLife-style community gravity**, but with a dramatically cleaner, more private, mobile-first experience.

The core loop is:

**Create profile → express desires/boundaries → discover compatible people → show intent / post a Plan → request private access / message → receive feedback → return because people, Plans and the local scene changed.**

The scarce side of the marketplace is women, couples, queer members, experienced community members and organisers.
Product decisions should optimise for their safety, control and willingness to stay, not for maximising raw male sign-ups.

### Product principles
1. **Intent over endless swiping.** Plans / Tonight are core.
2. **Compatibility over proximity alone.** Shared desires, boundaries and relationship context matter.
3. **Control is the product.** Private media, visibility and messaging permissions are first-class.
4. **Sex-positive does not mean boundary-free.** Consent and limits should be visible, understandable and easy to respect.
5. **Never expose emptiness.** Low-density Prague launch surfaces must gracefully widen recency and hide empty rails.
6. **Community before monetisation.** Phase 1 is free.
7. **PWA/web first.** Do not let native app-store restrictions distort the product.
8. **Fewer, finished capabilities.** Build a small number of connected behaviours that create repeat use.

---

## Phase 0: Rescue and simplification  (milestone `M0-rescue`, ~2 weeks)
**Objective:** one working production path, one identity, no dead code.

| ID | Issue | Effort | Depends |
|---|---|---|---|
| P0-01 | **Restore production DB:** keep Supabase production available and confirm DB-backed public endpoints return 200 | S | — |
| P0-02 | **Verify RLS lockdown in prod** (`SECURITY_AND_MODERATION.md` §1); keep anon access minimized and record verification | S | P0-01 |
| P0-03 | **Schema parity:** production/staging match canonical `supabase/migrations`; record state in `supabase/APPLIED.md` | M | P0-01 |
| P0-04 | **Production env:** R2, Resend and required server-only secrets configured in Vercel Production | S | — |
| P0-05 | **Canonical branch:** `main` is production source of truth; protect `main` and require CI | S | — |
| P0-06 | **Dead-code cleanup:** remove remaining unreachable legacy/auth/monetisation modules and duplicate schemas | S | P0-05 |
| P0-07 | **Vercel consolidation:** one Intimo production project, previews use staging | S | P0-05 |
| P0-08 | **Supabase Auth migration** complete: one identity, one session, `profiles.id = auth.uid()` | L | P0-03 |
| P0-09 | **Remove Auth0 completely:** code, package, env vars and tenant references | S | P0-08 |
| P0-10 | **Admin simplification:** only `ADMIN` / `MODERATOR`, Supabase MFA, no God Mode/internal MFA stack | M | P0-08 |
| P0-11 | **Code quality:** Prettier + ESLint + typecheck in CI | S | P0-06 |
| P0-12 | **Velora → Intimo rename:** package, storage keys, project labels, remaining visible copy | S | P0-06 |
| P0-13 | **CI / smoke:** GitHub Action + Playwright smoke on preview | M | P0-05 |

**Delete:** remaining dead legacy code, Auth0, God Mode, duplicate schemas, unused monetisation surfaces.

**Acceptance:** intimo.live loads real data; sign-up → confirm → onboarding → upload → sign out/in works; no Auth0 runtime references remain; one production deployment path; CI green on `main`.

---

## Phase 1: Functional MVP + Prague chemistry  (milestone `M1-mvp`, ~5–6 weeks)
**Objective:** launch a product that feels useful with only 100–200 Prague members and creates reasons to return.

| ID | Issue | Effort | Depends |
|---|---|---|---|
| P1-00 | **Benchmark validation:** hands-on Amateri / Feeld / FetLife product teardown; update parity notes with observed behaviour, not assumptions | S | — |
| P1-01 | **Member RLS:** authenticated member tables keyed by `auth.uid()`; service role restricted to admin/cron paths | L | P0-08 |
| P1-02 | **Onboarding v3:** single/couple, partner DOB, identity, relationship structure, looking-for, Prague area, first photo, privacy defaults | M | P0-08 |
| P1-03 | **Prague areas:** districts + nearby cities, approximate distance only, never precise GPS exposure | S | P0-03 |
| P1-04 | **Presence:** throttled `last_active_at`, online/recent buckets, privacy-aware visibility | S | P0-08 |
| P1-05 | **Discovery v3:** server-side filters, keyset pagination, home rails, low-density empty-state rules | M | P1-03, P1-04 |
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
| P1-16 | **Mobile navigation:** Home · Browse · Tonight · Messages · Me, with Activity integrated prominently | S | P1-05 |
| P1-17 | **Full-loop E2E:** register → onboard → desires → media → discover → interest → Plan → private access → realtime message → notification → block → delete | M | P1-09 |
| P1-18 | **Moderation operations:** photo review SLA, first-Plan review, report context, organiser/event moderation hooks | S | P0-10 |
| P1-19 | **Desire Graph v1:** structured interests with states `Love it / Into it / Curious / Not for me / Hard limit`; profile display and discovery filters | L | P1-02, P1-01 |
| P1-20 | **Shared chemistry:** profile-level compatibility summary based on shared desires, looking-for and non-conflicting limits; transparent rules, no black-box AI | M | P1-19, P1-05 |
| P1-21 | **Boundaries & approach preferences:** `Comfortable with / Ask me first / Not interested` for messaging, explicit media and common interaction types | M | P1-19 |
| P1-22 | **Relationship links v1:** individual profiles can optionally link a partner / couple context without forcing shared credentials | M | P1-02 |
| P1-23 | **Prague Scene v0:** curated lightweight listing of sex-positive events / munches / workshops / parties with venue, date, organiser and outbound link; no full event platform yet | M | P1-03 |
| P1-24 | **Trust signals v1:** photo verified, established profile, optional organiser/community verification; no public reputation score | M | P1-18 |
| P1-25 | **PWA baseline:** manifest, installability, app-like shell, privacy-conscious notification permission flow; push itself may follow in P2 | S | P1-16 |

### MVP launch experience
The product should feel like this on day one:

1. Create a profile that communicates identity, relationship context, desires and boundaries.
2. See compatible people in Prague without endless swipe mechanics.
3. Understand *why* someone may be relevant: shared desires, shared intent, overlapping availability.
4. Post **Tonight / Plans** to make current intent visible.
5. Request private media using an explicit consent handshake.
6. Exchange realtime messages once contact is welcome.
7. Receive meaningful return triggers: visits, interest, access requests and messages.
8. Discover a small curated slice of the real Prague sex-positive scene, even before Intimo itself has huge density.

### Migration work
- `connections` / `friendships` → `interests`
- simplify `dating_ads` into Plans
- add `desires`, `member_desires`, `boundaries`, `profile_links`
- add `album_access_grants`, `profile_views`, `conversations`, `areas`
- keep location approximate
- remove legacy monetisation columns where safe

### Explicitly not MVP
Generic feed, chat rooms, groups/forums, blogs, livestreaming, creator economy, credits, video calls, webcam rooms, algorithmic swiping, public popularity scores.

### Acceptance
- all full-loop journeys pass in Playwright on production-like staging
- 375 px mobile layout is clean
- discovery p95 < 300 ms at 10k profiles
- blocked users disappear everywhere immediately
- private media is never retrievable by an unauthorised viewer
- no zero-count / dead-community UI surfaces

**→ Launch gate:** invite-only Prague beta with 100–200 recruited members, deliberately weighted toward women, couples, queer members and recognised community participants/organisers.

---

## Phase 2: Social density and daily return  (milestone `M2-density`, ~4–6 weeks after launch)
**Objective:** turn Intimo from a useful discovery product into something members check several times a week.

- **New photos / activity feed**, Prague-first, with reactions and comments (M)
- **Web push** for messages, mutual interest, access request and Plan reply (M)
- Typing indicators + message reactions (S)
- Personalised weekly **New in Prague / Tonight this week** digest (S)
- Automated media safety scanning before broad public-feed distribution (M)
- Favourites lists; “who favourited me” remains private (S)
- Verification v2: faster review + clearer trust state (S)
- **Desire Graph v2:** better compatibility explanations, saved filters, negative-limit filtering (M)
- **Safe Meet:** optional private meeting card/share-to-trusted-contact + post-meet “all good?” check, with no public rating system (M)
- **Scene v1:** organiser profiles, RSVP / interested, recurring events, event safety/reporting (M)
- **Explore editorial:** short practical sex-positive / kink education and Prague-scene guides (M)

**Acceptance:** D7 return ≥35%; ≥3 sessions/week for activated members; measurable usage of Plans, Activity and Scene beyond direct messages.

---

## Phase 3: Community gravity  (milestone `M3-community`)
**Entry criterion:** enough local density that synchronous/community surfaces will not look dead; target guideline ≥1,000 active Prague-area members or proven demand from Phase 2 behaviour.

**Objective:** make Intimo a place people belong to, not only a place they search.

- One moderated **Prague Tonight** room, then thematic rooms only if usage supports them (L)
- Event / club organiser tooling, richer RSVP and recurring series (L)
- Topic circles / groups only where the local audience exists (L/XL)
- Text posts / writings (M)
- Optional relationship constellations beyond one partner link (M)
- Community moderation tools and organiser trust model (M)

**Do not** create dozens of empty groups or rooms in advance.

**Acceptance:** ≥20% of WAU engage with Scene/community surfaces monthly; community features improve retention rather than merely adding inventory.

---

## Phase 4: Rich media / realtime  (milestone `M4-media`)
**Objective:** add richer intimacy only after moderation, density and trust operations work reliably.

- Video upload with transcoding + moderation (XL)
- Ephemeral / one-time media (M)
- Stories only if the feed demonstrates demand (M)
- 1:1 video calls with consent prompts and abuse controls (L)
- Webcam rooms only after separate legal, moderation and infrastructure review (XL)

---

## Phase 5: Monetisation  (milestone `M5-monetization`, only after usage justifies it)
**Entry criterion:** ≥5,000 MAU in Czechia with stable retention and proven repeat usage.

Potential premium value:
- visibility / discovery boosts
- advanced compatibility filters
- convenience features
- optional enhanced discreet mode features

Never paywall:
- blocking
- reporting
- essential privacy
- account deletion/export
- core consent/safety functionality

Adult-compatible payment provider and legal/entity review are required before implementation.
Creator monetisation remains a separate future programme with dedicated compliance/KYC requirements.

---

## UX / brand direction

Intimo should feel like a **private late-night Prague club**, not porn and not generic dating SaaS.

- dark charcoal / warm neutral palette, restrained oxblood/wine accents
- editorial typography and intimate photography
- attraction through anticipation, confidence, touch and atmosphere rather than explicit anatomy
- no neon cyber-sex aesthetic
- no card-heavy admin/dashboard feel in member UX
- no swipe-first interaction model

The emotional promise is not “more sex”. It is:

> **A private place to be honest about what you are into, discover people who understand it, and stay in control of how far things go.**

---

## Sequencing summary
```text
P0 foundation
  └─► P1-01 RLS / auth boundary
       ├─► P1-06 Private Album Handshake
       ├─► P1-08 Visitors / Interest
       ├─► P1-09 Realtime Messaging ─► P1-10 Image Messages
       └─► P1-19 Desire Graph ─► P1-20 Shared Chemistry / P1-21 Boundaries

P1-03 Prague Areas ─► P1-05 Discovery
                  ├─► P1-07 Tonight / Plans
                  └─► P1-23 Prague Scene v0

P1-02 Onboarding ─► P1-19 Desire Graph / P1-22 Relationship Links
P0-04 Email env ─► P1-11 Return Triggers
P1-16 Mobile shell ─► P1-25 PWA baseline

Launch ─► P2 social density / push / Safe Meet / Scene v1
      ─► P3 community rooms & organiser tooling only when density proves demand
      ─► P4 rich media
      ─► P5 monetisation only after retention and scale
```
