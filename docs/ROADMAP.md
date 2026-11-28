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

## Onboarding UX V2 — five-stage beta journey (28 November 2026)

**Goal:** Tinder-level ease of interaction without Tinder's swiping mechanics or reduced privacy. Consolidate the old eight / nine onboarding screens to five stages for both single and couple profiles, using the same validated fields and existing invitation, email, manual age-verification and server-side consent gates.

| ID | Change | Status |
|---|---|---|
| OB-01 | Stages: Who's joining → Identity + relationship → Nickname + DOB (+ partner details) → Interests + approximate area → Optional profile photo / age check handoff | 🟡 Feature PR candidate; production pending |
| OB-02 | Mobile interaction: compact chips, selectable identity cards, searchable-through-native area select, consistent sticky CTA, flat brand-aligned controls, keyboard-friendly text entry | 🟡 Feature PR candidate; production pending |
| OB-03 | Existing explicit opt-in encrypted seven-day draft; migrate prior draft step IDs at resume; no sensitive browser persistence or implicit tracking | 🟡 Feature PR candidate; test pending |
| OB-04 | Mandatory age check unchanged: private one-time-code selfie, manual review, no member access before approval; photo remains optional | 🟡 Feature PR candidate; E2E pending |
| OB-05 | Release acceptance: tests/typecheck/lint/build; single and couple pathways, expiry/error/recovery, area and interest selection, 320/375/430 px + keyboard, accessible focus and physical-device PWA verification | ⬜ Browser/device walkthrough outstanding |

**Measurement:** no event logging of personal answers. Only after a privacy review consider anonymous aggregate funnel completion by stage, without counting small cohorts or attaching identities.

---

## Prague discovery / Heatmapa-inspired roadmap (24 November 2026)

**Product decision:** borrow Heatmapa's quick, time-sensitive discovery experience, not continuous location tracking. Carolinka cited the *feeling of the app*, not a request for user-tracking heatmaps. The goal is to discover real Prague plans or approved events and safely take action.

**Safety baseline:** Prague-first; no precise GPS, geolocation permission, home pins, member live location, or fabricated activity. All exposed area positions represent published districts, never addresses.

| ID | Phase | Acceptance scope | Status |
|---|---|---|---|
| PD-01 | Sprint 1 · Discovery | List/area toggle within Tonight, district and time filters, real visible member plans and published Scene events; preserve server authorization, blocking, moderation, reply eligibility and event links; truthful empty state | ✅ Production PR #212 merged 25 Nov (CI passed, Vercel READY); browser acceptance outstanding |
| PD-02 | Sprint 1 · Privacy | No member-plan markers or counts on the district diagram; only approved published event areas. No precise or private meeting coordinates. No individual tracking or inferable activity cohorts | ✅ Merged #213, production READY 25 Nov. Two-account browser privacy acceptance outstanding |
| PD-03 | Sprint 2 · Connections | Smooth discovery → plan → eligibility-checked reply, event organiser link; preserve selected filters and report/block controls | ✅ Merged #213, production READY 25 Nov: allowlisted area/time/view filter return, clear eligibility context, event-specific invitations, existing plan-linked Messages validation. Browser interaction acceptance outstanding |
| PD-04 | Sprint 2 · Scene | Curated event supply, controlled public venue labels, and accessible discovery; no private guest-list addresses or inferred attendance | ⬜ Planned |
| PD-05 | Sprint 3 · Community pulse | Consider aggregate activity only with sufficient diversity and privacy protections against small-cohort inference and differencing. No personal real-time heatmap | ⬜ Deferred |
| PD-06 | Validation | Test two-account blocked/allowed plan visibility, event filters, low-density and empty states, accessibility, mobile UX, and member conversion. Evaluate with beta testers before expansion | ⬜ Pending |

**Release gate:** CI unit, TypeScript, lint and build; production READY; browser acceptance for allowed and blocked adult accounts and low-density Prague areas. A successful build alone does not prove the full journey. **Map privacy policy updated 25 Nov:** no heat or member-density indicators from filterable member-plan lists. Only approved published event districts appear on the illustration until an independently audited privacy-preserving aggregate exists. Member plans remain in the permission-filtered list.

---

## Current priority: Founding Member feedback track  (milestone `FM-founding`, from 16 November 2026)
**Source:** Founding Member vision document (Carolinka, November 2026). **Objective:** close the trust,
privacy and safety gaps a founding member must see closed before recruiting, then prepare revenue.
This track runs ahead of the open Phase 1/2 items below; where an item overlaps an existing ID, the existing
ID is listed and the FM item tracks only the gap.

Status is checked against the code on 16 November 2026 and updated as work ships: ✅ done · 🟡 partial · ⬜ not started.
The "Gap" column is the remaining work, not the whole feature.

### Now (weeks 1–2): blockers before any growth
| ID | Issue | Effort | Depends | Status (evidence) · Gap |
|---|---|---|---|---|
| FM-01 | **Consent and privacy plumbing** | M | — | ✅ **Built 18 Nov** (`docs/CONSENT.md`). A single registry (`src/lib/privacy/consents.mjs`) holds each consent's version and exact wording: orientation and identity `sensitive-profile-v2`, desires `desires-v1`. Choices are append-only, timestamped rows. Withdrawing deletes the covered data in the same request. Settings → *Your consents* shows the wording, date, a withdraw button that names what it deletes, and the full history (also in the data export). **Open for legal review:** whether *looking for* and relationship structure need their own consent, how long consent records are kept after deletion, and the controller identity in the policy (needs the legal entity). |
| FM-02 | **Remove AI imagery and fictional example profiles** | S | — | 🟡 **Hidden from the public since 16 Nov** by FM-13: signed-out visitors no longer reach the landing or About pages that use them. They still exist in the code (`public/images/editorial/`, the example cards in `PublicCommunityHome`) and return if the site reopens. **Gap:** replace them with on-brand graphics before `COMING_SOON` is switched off, then update `docs/EDITORIAL_IMAGES.md` and the `landing-truth` e2e test. Parked by owner decision, 16 Nov. |
| FM-03 | **Security baseline** | S | — | ✅ **Done 16 Nov** (`docs/SECURITY_CHECKUP_2026-11.md`). GPS/EXIF stripping and immediate album revocation are proved end to end. Admin selfie evidence no longer redirects to a reusable signed link to the original. Profile creation no longer accepts third-party photo links or the unused intimate fields. Unused storage helpers are removed, and a test blocks new direct storage reads. **17 Nov:** the only bucket (`intimo-staging-media`) is private, but production and previews shared it. `intimo-media` has been created for production; switch-over steps and a copy script are in the doc. **Owner actions:** finish the bucket switch-over, and decide whether to clear existing values in the seven unused intimate columns (query in the doc). |
| FM-04 | **Founding metrics (admin-only)** | M | — | ✅ **Admin → Numbers** (`/admin/numbers`, `users:view_sensitive`, MFA). It shows members, new and active this week, verified share, the women/men/couples/other mix, the mix of invitation requests, invitations sent/joined/waiting/expired, reports per 100 members, an 8-week weekly table, and a "Copy summary" for the founder update. Aggregate counts only, from existing tables (`src/lib/admin/founderMetrics.mjs`). **Gap:** no session history, so no D7 retention yet (see `docs/invitation-activation-audit-2026-11.md`). Move to SQL aggregates above 10,000 rows (the page warns). |
| FM-05 | **Apply to a high-risk payment processor** | S (eng) | FM-01 entity | ⬜ Business task with a long lead time. It gates FM-11. Engineering supplies the policy URLs, the moderation description and the age-assurance description the application asks for. |

### Next (weeks 3–6): trust and safety
| ID | Issue | Effort | Depends | Status (evidence) · Gap |
|---|---|---|---|---|
| FM-06 | **Age verification at vetting** (extends P1-22) | M | FM-01 | ✅ **Live 18 Nov** ([hundozer/Velora#161](https://github.com/hundozer/Velora/pull/161); the 3 existing members approved by hand, see `supabase/APPLIED.md` and `docs/AGE_CHECK.md`). After onboarding a member takes a selfie holding a one-time code (for a couple, both partners in one photo) and an admin approves it in Admin → Verification. Until then they can set up only their own profile, and nobody can see them. Admins can also approve a known member by hand (*Approve age by hand*, with a reason). Every decision records who reviewed it and when. **Merged #168; deployed:** warmer age-check instructions and hold-aware selfie cleanup; daily retention cron secret configured and Vercel redeployed 19 Nov. **Still to test:** staging R2 bucket, actual evidence deletion, legal holds and retries. **Later:** an outside age-check provider (`docs/archive/AGE_ASSURANCE_ARCHITECTURE.md`). |
| FM-07 | **Reporting, moderation and DSA notice-and-action** (extends P1-18) | M | — | ✅ **Live 18 Nov; migration applied (`supabase/APPLIED.md`); [hundozer/Velora#162](https://github.com/hundozer/Velora/pull/162) merged** (see `docs/REPORTS_AND_APPEALS.md`). The reporter gets an outcome notice ("we took action" / "no breach found", never details). When action is taken the reported member gets a statement of reasons (what was done, the guideline, an explanation written for them, decided by a person) in Settings → Privacy Center; open or dismissed reports are never shown to them and nobody learns who reported. Either side can appeal once; admins decide appeals in the work inbox. Response targets shown and enforced in the queue (1 h suspected minor, non-consensual content or trafficking; 12 h everything else), overdue reports rise to the top, and urgent reports email the team at once (`SAFETY_ALERT_EMAIL`). Album reports now work. **Merged #169; database migration applied in staging and production 19 Nov:** chat text copy deterrent and a dedicated screenshot/recording report reason. Browser screenshots cannot be prevented. Authenticated reporting and moderation acceptance tests remain. **Later:** ban-evasion checks on invitations, reversing account actions automatically when an appeal succeeds. |
| FM-08 | **Message controls for every member** | S | — | ✅ **Shipped 16 Nov.** Settings → Who can message you now offers *Verified members* to every member, and the privacy API accepts it. The server and the profile already enforced it, and the Requests folder already holds unreplied conversations. Not gated by gender, which would require processing gender data and raises the same equal-treatment question as gendered pricing. |
| FM-09 | **Orientation and identity fields** | M | FM-01 | ✅ **Live 18 Nov** (migration applied to staging and production, see `supabase/APPLIED.md`). Me → *Orientation & identity* (`/me/identity`) has optional orientation, orientation and gender in the member's own words, and pronouns. Each has its own audience (Members / Friends / Only me), enforced on the server (`src/lib/identity.mjs`). The profile shows only what the viewer may see. Special-category fields need the FM-01 consent, and withdrawing it clears them. Free text refuses links and contact details. |
| FM-10 | **Invite codes with attribution** | M | FM-04 | 🟡 Personal email invitations are hashed tokens with a 30-day expiry, a quota of 3 per rolling 3 months (unlimited for Founding Members), inviter attribution, and admin-reviewed invitation requests. **Merged #167; migration applied in staging and production 19 Nov:** hashed email-independent codes, capped atomic redemption, expiry, owner/source labels, admin tools and source totals. Carolinka's 10 one-use codes issued and validated, expiring 10 Dec 2026. Real signup/admission journey acceptance still required. Existing age verification remains mandatory; admission review policy must be verified with a real signup test before deployment. |
| FM-14 | **Private media watermark and view-once chat photos** | M | FM-06 | 🟡 **Merged #170; schema applied in staging and production 19 Nov:** viewer-name watermarks and explicit one-time chat-image endpoint. **Not yet acceptance-tested:** two-account once-only access, sender opened indication, server watermarks and R2 path. Watermarks deter redistribution but cannot prevent screenshots; native app controls are deferred. |
| FM-13 | **Coming Soon: close the public site** | S | — | ✅ **Shipped 16 Nov** (owner decision, following the founder feedback). Signed-out visitors see only the "Not for everyone. Maybe for you." front page with the invitation request form, the sign-in and invitation flows, and the legal pages. Every other page redirects to `/`, `/api/public/*` answers 404, and the site is `noindex`. Signed-in members are unaffected, and a forged or stale cookie doesn't get through. Reopen with `COMING_SOON = false` in `src/lib/comingSoon.mjs`, after FM-02. The page promises "our first 100 members": that is a target, not a live count. |

### Then (weeks 7–12): revenue (needs the owner's sign-off, see the conflict below)
| ID | Issue | Effort | Depends | Status (evidence) · Gap |
|---|---|---|---|---|
| FM-11 | **Entitlements and Premium** | L | FM-05, FM-01 | 🟡 `membership_level` (`MEMBER` / `FOUNDING_MEMBER` / `VIP`) exists as recognition only, and the `MemberTier` type is unused. **Gap:** server-side entitlements, tiers, a 14-day trial, capped inviter rewards, linked couple profiles (this is P2-02), and a 200-seat Founding Member cap enforced in SQL. Pricing must be the same for every gender. The cap must not show an exact public seat or member count. |
| FM-12 | **Ticketing commission on the Guest List** | M | FM-11, FM-05 | ⬜ The Guest List pilot deliberately has no payments (`docs/GUEST_LIST_PILOT_2026-10-25.md`). **Gap:** paid places, the commission, refunds on cancellation, and the host payout. |

**Deferred:** Journal, "share my plan" check-in (Safe Meet stays in Phase 2), native app (PWA first).

**Open owner decisions**
1. **Monetisation timing.** Phase 5 below says monetisation only after ≥5,000 MAU, but FM-11 and FM-12 put revenue in weeks 7–12. Before FM-11 starts, either amend Phase 5's entry criterion or keep FM-11 and FM-12 behind it.
2. **Legal entity.** Blocks the final privacy policy text (FM-01) and the processor application (FM-05).
3. **Admission.** The launch gate below still records open registration (20 October). Membership has been invitation-only since #142, and since 16 November the public site has been closed behind Coming Soon (FM-13). The first wave is 100 members, chosen by hand. Decide how that relates to the 200-seat Founding Member cap (FM-11), then update the launch gate.

**Acceptance:** no generated or fictional people on any public page. Every sensitive field has its own
consent record and per-field visibility. Every member can restrict who messages them. No member is active
without age verification. A report produces an outcome notice and a statement of reasons. Admins can
read the founding metrics weekly.

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
Generic feed, compatibility summaries, relationship links between profiles, chat rooms, groups/forums, blogs, creator economy, credits, algorithmic swiping, public popularity scores. Video uploads, video streaming, livestreaming, video calls and webcam rooms are excluded from the entire roadmap (see Phase 4 scope decision).

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
- **Web push** for messages, mutual interest, access request and Plan reply (M) *(built, off until VAPID keys are set: `docs/WEB_PUSH.md`)*
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

## Phase 4: Photo-first experiences  (milestone `M4-media`)
- Improve existing photo Stories, subject to adoption and safety evidence (M)
- Ephemeral / one-time **photo** sharing with consent, access controls and moderation (M)
- Review photo moderation capacity, secure delivery and retention before expansion (M)

**Product scope decision (19 November 2026):** Intimo is a photo-first, text-chat adult community. **Video uploads, hosted or user-generated videos, video streaming, livestreaming, video calls and webcam rooms are excluded from the product roadmap across all phases.** This is a deliberate scope boundary, not a postponed feature. Reintroducing any video capability requires a separate explicit product decision and legal/safety assessment.

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
FM track first: FM-02 imagery · FM-03 security · FM-04 metrics · FM-01 consent · FM-05 processor (parallel)
             ─► FM-06 age at vetting · FM-07 DSA reports · FM-08 message controls · FM-09 identity (needs FM-01) · FM-10 codes
             ─► FM-11 Premium (needs FM-05 approval + owner decision on Phase 5) ─► FM-12 Guest List ticketing

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
      ─► P4 photo-first experiences (no video)
      ─► P5 monetisation only after retention and scale
```
