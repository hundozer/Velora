# Intimo architecture

Status: **canonical** (2026-10-17). It supersedes `docs/archive/ADR-001-PERSISTENCE.md`.

## Current state (as audited)
See `AUDIT_2026-10.md` §B. Summary: Next.js 14 on Vercel → Auth0 session →
API routes using the Supabase **service-role** key → Postgres; R2 for media;
15 s polling for messages; Resend wired but not configured in production.

## Target state

```
Browser / PWA
  │  Supabase Auth session cookie (@supabase/ssr, httpOnly, SameSite=Lax)
  ▼
Next.js App Router on Vercel (project: intimo; domain: intimo.live)
  ├─ middleware.ts: refresh Supabase session; gate member routes; 18+ gate
  ├─ server components + route handlers: createServerClient(cookies) → queries run AS THE USER (RLS)
  ├─ src/lib/supabase/admin.ts: service-role client, ONLY imported by /api/admin/* and /api/cron/*
  └─ /api/cron/*: email outbox, plan expiry, retention (Vercel Cron, bearer secret)
  ▼
Supabase (one project, eu-central-1, paid tier: no hibernation)
  ├─ Auth: email+password, magic link, confirm email, reset, TOTP MFA (admins required)
  ├─ Postgres: schema = supabase/migrations/* ONLY; RLS on every table keyed by auth.uid()
  └─ Realtime: direct_messages inserts + conversation unread counters (RLS-filtered)
Cloudflare R2: media objects (presigned PUT, short-lived signed GET checked against grants)
Resend: Supabase Auth SMTP + app email outbox
```

### Invariants
1. **One identity:** `auth.users.id` = `profiles.id` (uuid). No other user id exists.
2. **One session:** the Supabase Auth cookie. No Auth0, no localStorage identity, no in-memory sessions.
3. **One authorization model:** RLS is the source of truth. Route handlers add business rules (eligibility, rate limits) but never widen access. Service role is confined to admin/cron modules and is enforced by a test that greps imports.
4. **One schema source:** `supabase/migrations/`. Every migration is idempotent, has a rollback note, and is applied to staging before production.
5. **No secrets or hosts in source:** env only. `NEXT_PUBLIC_*` holds only the Supabase URL and publishable key.
6. **Monetization off:** `MONETIZATION_ENABLED=false` is hard-coded; no payment code ships in the bundle.

## ADR-002: Replace Auth0 with Supabase Auth

**Decision:** adopt Supabase Auth and remove Auth0 entirely.

**Why:**
- Under Auth0, `auth.uid()` is null, so RLS cannot express "my rows". The app was forced into a service-role-everywhere design where every query bypasses RLS, and any bug in an API route is a data leak.
- Supabase Realtime and Storage policies depend on Supabase Auth identities. Realtime messaging, the most important missing capability, is blocked by Auth0.
- Auth0 adds a second vendor, a second user store (`auth0|…` subs mirrored in `profiles.auth_id`), Management API calls for email-verification resend and deletion, an issuer allowlist, and ~20 files of glue.
- Supabase Auth covers every requirement: sign-up, login, persistent sessions, magic link, email confirmation, password reset, account deletion (admin API), TOTP MFA, and server-side session validation (`auth.getUser()`).

**Rejected alternatives:** keeping Auth0 with custom JWT minting into Supabase (more complexity, not less); NextAuth/Auth.js (a third identity store).

**Migration plan (MIGRATE THEN DELETE):**
1. **Inventory:** count `profiles` rows and real (non-demo) members. Expected: very few, possibly only test accounts.
2. **Schema:** add migration `2026xxxx_supabase_auth.sql`:
   - `profiles.user_id uuid unique references auth.users(id) on delete cascade` (nullable during transition)
   - trigger `on auth.users insert` → create `profiles` with `user_id = new.id` when none exists for that email
   - RLS policies using `user_id = auth.uid()` (owner) and visibility rules (members)
3. **Existing users:** for each real profile, create an `auth.users` row via the admin API (`email_confirm: true`), set `profiles.user_id`, then send a password-recovery email ("We've upgraded sign-in. Set your password."). Auth0 password hashes are not exported.
4. **Code swap (one PR):** `@supabase/ssr` clients; `resolveServerActor()` reads `supabase.auth.getUser()` and looks up by `user_id`; `/login`, `/register`, `/auth/callback`, `/auth/confirm`, `/reset-password` pages; replace `loginWithAuth0` / `logoutWithAuth0` in `AuthContext`.
5. **Admin:** replace the env-var role bootstrap, God Mode elevation and internal TOTP with `admin_assignments` (roles `ADMIN`, `MODERATOR`) plus required Supabase MFA (`aal2`) checked in middleware for `/admin`.
6. **Cutover:** deploy, verify, then **delete** `src/lib/auth0/*`, `@auth0/nextjs-auth0`, all `AUTH0_*` env vars in Vercel (Production and Preview), `INTIMO_ADMIN_AUTH0_SUBS`, `INTIMO_ADMIN_ROLE_ASSIGNMENTS`, `INTIMO_ADMIN_MFA_*`, and the Auth0 tenant/app. Later migration: rename `profiles.auth_id` → drop.
7. **Then** progressively move member route handlers from service-role to the user-scoped client.

## Data model (target, MVP)

| Table | Purpose | Notes |
|---|---|---|
| `profiles` | person or couple | `user_id` (auth), `kind` SINGLE/COUPLE, `area_id`, `looking_for[]`, visibility/privacy flags, `last_active_at`. Remove monetization columns (`monthly_subscription_price`, `subscribers_count`, `member_tier`) |
| `profile_partners` | second person on couple profiles | DOB ≥18 check |
| `areas` | Prague districts + nearby cities | centroid lat/lng for approximate distance (P1-03) |
| `desires`, `member_desires` | Desire Graph v1 | curated catalogue; state `LOVE/INTO/CURIOUS/NOT_FOR_ME/HARD_LIMIT` (P1-19) |
| `member_boundaries` | approach preferences | `COMFORTABLE/ASK_FIRST/NOT_INTERESTED`, enforced in messaging + media requests (P1-20) |
| `scene_events` | Prague Scene v0 | admin-curated events with outbound link (P1-21) |
| `media_objects`, `media_albums`, `media_album_items` | canonical media | keep |
| `album_access_grants` | Private Album Handshake | mode `ONCE/UNTIL_REVOKED`, status, `expires_at` (P1-06) |
| `dating_ads` → "Plans" | intent posts | 6 categories, `expires_at`, `area_id` |
| `interests` | one-tap signal | replaces `connections` + `friendships` |
| `saved_items` | private favourites | keep |
| `profile_views` | visitors | new; 1 per viewer/day |
| `content_reactions` | photo likes | keep |
| `conversations`, `direct_messages` | DMs | add `media_id`; per-user unread |
| `user_blocks`, `moderation_cases`, `moderation_appeals`, `verification_reviews`, `copyright_notices` | safety | keep |
| `notifications`, `email_outbox`, `notification_preferences` | return triggers | outbox and prefs new |
| `admin_assignments`, `admin_action_events` | admin | keep, simplified roles |
| `privacy_requests`, `user_consents` | GDPR | keep |

**To retire (migrate then drop):** `photo_albums`, `videos`, `chat_messages`,
`connections`, `friendships`, `elevated_admin_sessions`, `admin_mfa_credentials`,
`admin_mfa_sessions`, `sensitive_access_events` (fold into `admin_action_events`),
`retention_*` (keep the rules as documentation; run deletion via one cron job),
`system_feature_flags` (env flags suffice), `content_participant_declarations`
(re-evaluate with counsel before video ships).

## Media
Keep **Cloudflare R2**: the presign/complete/moderate/deliver pipeline is the best part of the current code and R2 egress is free. Required production env: `CLOUDFLARE_R2_ACCOUNT_ID`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME`. Do not add Supabase Storage in parallel.

## Rate limiting
The current in-memory limiter is per-lambda and ineffective. Replace it with a
Postgres function `rate_limit_hit(key, window, max)` on an unlogged table. Do not
add a new vendor for this.

## Environments
- **Production:** Vercel project `intimo` (renamed from `velora`), production branch `main`, Supabase `Velora` project (rename to `intimo-prod`) on a paid tier so it never hibernates.
- **Staging/Preview:** Vercel preview deployments + Supabase `Intimo Staging` (restore it, or delete it and use Supabase branching). Never point previews at the production DB.
