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

## 2. Supabase Auth settings — none required
Auth emails are generated with the admin API (`/api/auth/email`) and sent through
Resend with token-hash links to `/auth/confirm`, so the Supabase Site URL,
redirect allow-list, email templates and SMTP settings are not used.
Optional later: enable TOTP MFA for admins (issue #10).

## 3. Vercel environment
- Done 2026-10-17: R2 (4) and Resend (2) variables now target Production too.
- `INTIMO_COOKIE_SECRET` is optional; without it the cookie key is derived from the service-role key.
- After cutover, delete `AUTH0_*`, `APP_BASE_URL`, `MONETIZATION_ENABLED` (issue #9).

## 4. Deploy and smoke test
Merge to `main` (issue #5), deploy, then on a phone: register → confirm email →
onboarding → sign out → sign in → password reset → magic link → delete account.

## 5. Decommission Auth0 (issue #9)
Delete the Auth0 application and tenant `intimo.eu.auth0.com` after the smoke test passes.
