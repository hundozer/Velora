# Runbook: Supabase Auth cutover (issue #8)

Code on `claude/phase0-audit-cleanup` no longer uses Auth0. Production must not
deploy it until steps 1–3 are done, because the app expects the canonical schema.

## 1. Database migrations — done 2026-10-17
Applied via the SQL editor from a one-time bundle of `supabase/migrations/*` (the MCP
connector cannot run DDL on this project). Verified: 37 tables, 22 migrations recorded,
0 open policies, RLS on every table, no client-role table access.

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
