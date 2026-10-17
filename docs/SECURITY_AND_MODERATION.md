# Security and moderation

Canonical as of 2026-10-17. Detailed earlier work (DPIA input, retention matrix,
God Mode red-team, compliance matrix) is in `docs/archive/` and remains useful
reference, but **this file is what we enforce**.

## Immediate security actions (Phase 0, blocking)
1. **Verify the RLS lockdown in production.** Production historically ran `supabase/migration.sql` with `Allow all select/insert/update` policies on `profiles`, `dating_ads`, `photo_albums`, `videos`, `chat_messages` etc. The publishable key is committed in git (`src/lib/supabase/client.ts`). When the DB is awake, run:
   ```sql
   select schemaname, tablename, policyname, roles, cmd, qual
   from pg_policies where schemaname = 'public' order by tablename;
   select relname, relrowsecurity, relforcerowsecurity
   from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';
   ```
   Any policy granting `anon`/`authenticated` broad access → apply `20260807_lock_down_auth0_boundary.sql` (or its Supabase-Auth successor) **immediately**, and treat the data as potentially exposed (assess GDPR Art. 33 notification).
2. **Rotate credentials** that archived docs say were once embedded in source: the Auth0 client secret and `AUTH0_SECRET`. Rotate the Supabase service-role key as well if it was ever committed (check `git log -p` history).
3. **Run the Supabase security advisor** and fix every ERROR-level item.
4. Remove the hard-coded Supabase URL/key fallback from source.

## Authentication and sessions
- Supabase Auth only (see `ARCHITECTURE.md` ADR-002). Email confirmation is required before member APIs.
- Sessions: httpOnly cookie, refreshed in middleware; logout revokes the refresh token.
- Admin and moderator accounts require TOTP MFA (`aal2`), checked server-side on every `/admin` request.
- Account deletion: immediate soft-delete (hidden everywhere), hard-delete of profile, media objects (R2) and messages content within 30 days; keep minimal moderation records where legally required.

## Authorization
- **Status (2026-10-17, #15):** members have owner-only SELECT policies on profiles, direct_messages, notifications, saved_items, user_blocks, media_objects, user_consents and privacy_requests (`20261019_member_read_rls.sql`). No member INSERT/UPDATE/DELETE grants exist; all writes go through server routes. `/api/profile/me` GET and `/api/notifications` GET already read as the member.
- RLS on every table, keyed by `auth.uid()`; default deny.
- Service-role client is importable only from `src/lib/supabase/admin.ts`, which only `/api/admin/*` and `/api/cron/*` may import (enforced by test).
- Blocks are enforced in SQL (discovery, profile view, messages, plans, activity), not just in UI.

## 18+ controls
- Age gate (low assurance) → DOB at onboarding, server-validated ≥18 (both partners for couples) → optional photo verification (selfie holding a code; manual review) for the verified badge.
- Any report of a minor is a P0 case: immediate account restriction, media hidden, escalation within 1 h.
- Stronger age assurance (ID/estimation provider) is a Phase 3+ legal decision, documented in `docs/archive/AGE_ASSURANCE_ARCHITECTURE.md`.

## Media moderation
- Pipeline: upload (private) → `PENDING_REVIEW` → moderator approves or rejects → visible per its visibility. A member's first 5 photos are always manually reviewed; after that, sampled review plus all reported items.
- Explicit media is blurred by default for viewers who haven't opted in.
- Private media is served only via short-lived signed URLs after a grant check. No public bucket URLs exist.
- Uploader declares that they are 18+, are the person depicted (or have consent of everyone depicted), and that everyone consented to publication. **One** declaration step, not a multi-screen legal maze.
- Phase 2: automated nudity/CSAM hash matching (e.g. PhotoDNA/Cloudflare CSAM scanning on R2) before any public feed exists.

## Reports and moderation workflow
- Report reasons: underage, non-consensual/revenge content, harassment, spam/scam, fake profile, illegal content, other.
- Queue sorted by severity, then age. Actions: dismiss, warn, remove content, restrict messaging, suspend, ban. Every action records reason + actor in `admin_action_events`.
- The reporter is notified of the outcome; the affected member can appeal once.
- Targets: underage/non-consensual < 1 h; everything else < 12 h.

## Privacy controls (member-facing)
- Profile visibility: members only (default) / hidden from discovery.
- Discreet mode: public photos are blurred to non-favourites.
- Who can message me: everyone / verified only / people I've shown interest in.
- Browse invisibly (no visitor trace).
- Data export and deletion self-service.

## Logging
- Audit admin actions and sensitive access (viewing private evidence). **Do not** audit routine member actions (message read, view), because that is personal data with no safety value.
- No PII in Vercel logs.
