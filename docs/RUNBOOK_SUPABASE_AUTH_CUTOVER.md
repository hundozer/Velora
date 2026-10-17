# Runbook: Supabase Auth cutover (issue #8)

Code on `claude/phase0-audit-cleanup` no longer uses Auth0. Production must not
deploy it until steps 1–3 are done, because the app expects the canonical schema.

## 1. Apply the database migrations (production project `bkdyjdbmtucqvgebqadp`)
Preconditions verified 2026-10-17: legacy tables empty, 0 `auth.users`.

Preferred (Supabase CLI, records history):
```bash
supabase link --project-ref bkdyjdbmtucqvgebqadp
supabase migration repair --status reverted 20260922033815   # legacy 001_initial_schema, superseded
supabase db push --include-all
```
Alternative: paste each file of `supabase/migrations/` in filename order into the
SQL editor. `20260805_drop_legacy_bootstrap.sql` refuses to run if any legacy
table holds data. Every file was replayed locally against a copy of the legacy
schema on 2026-10-17 (37 tables, 0 open policies afterwards).

Verify:
```sql
select count(*) from pg_tables where schemaname = 'public';          -- 37
select count(*) from pg_policies where policyname like 'anon_%';      -- 0
select conname from pg_constraint where conname = 'profiles_auth_id_matches_id';
```

## 2. Supabase Auth settings (Dashboard → Authentication)
- **URL configuration:** Site URL `https://intimo.live`; redirect URLs
  `https://intimo.live/**` and `https://*-hundozers-projects.vercel.app/**` (previews).
- **Providers → Email:** enabled, *Confirm email* ON, minimum password length 10.
- **Email templates** (recommended, enables cross-device links): in *Confirm signup*,
  *Magic link* and *Reset password*, use
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<signup|magiclink|recovery>`.
  Without this the default PKCE links still work through `/auth/callback`, but only
  in the browser that started the flow.
- **SMTP:** set Resend (`smtp.resend.com`, port 465, user `resend`, password = Resend API key,
  sender `noreply@intimo.live`). The built-in mailer allows only a few emails per hour.
- **MFA:** enable TOTP (needed for admins, issue #10).

## 3. Vercel environment (project `velora`, Production + Preview)
- Add `INTIMO_COOKIE_SECRET` (32+ random bytes) — signs the 18+ declaration cookie.
- Add to Production: `CLOUDFLARE_R2_*` (4), `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (issue #4).
- Rename `INTIMO_ADMIN_AUTH0_SUBS` → `INTIMO_ADMIN_USER_IDS` (Supabase user ids) once the
  first admin has signed up.
- Delete: `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`,
  `AUTH0_CLIENT_SECRET`, `APP_BASE_URL` (unused now), `MONETIZATION_ENABLED`.

## 4. Deploy and smoke test
Merge to `main` (issue #5), deploy, then on a phone: register → confirm email →
onboarding → sign out → sign in → password reset → magic link → delete account.

## 5. Decommission Auth0 (issue #9)
Delete the Auth0 application and tenant `intimo.eu.auth0.com` after the smoke test passes.
