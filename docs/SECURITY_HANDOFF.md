# Security handoff

## Owner actions completed on 2026-08-07

The owner confirmed the following through the Auth0 and Vercel dashboards:

1. The exposed Auth0 application client secret was rotated and the replacement saved in `.env.local` and Vercel.
2. A new 32-byte, hex-encoded Auth0 session secret was generated and saved in `.env.local` and Vercel.
3. Auth0 revoked the previous client secret during rotation. The prior session secret will cease to validate sessions when a reviewed deployment activates the replacement.
4. Auth0 callback, logout, and web-origin allowlists include the Intimo production domain, localhost development URLs, and retained legacy Vercel migration URLs.
5. Auth0 Management API Client Access shows exactly 3 of 272 scopes granted: `read:users`, `update:users`, and `delete:users`.

No deployment was performed. Vercel environment changes only become active on a subsequent deployment.

## Remaining release actions

1. Verify Vercel `AUTH0_BASE_URL` or `APP_BASE_URL` resolves to `https://intimo.live` in Production (not localhost).
2. Complete the unresolved application authorization, RLS, persistence, and test risks below.
3. Review the combined Antigravity and remediation diff before any commit.
4. Perform an explicitly approved controlled deployment and Auth0 login/logout/account-flow smoke test only after the remaining release blockers are resolved.

Do not place secret values in tickets, chat, documentation, source, client bundles, or `NEXT_PUBLIC_*` variables.

## Required runtime variables

See `.env.example`. Production requires `AUTH0_SECRET`, `AUTH0_BASE_URL` (or `APP_BASE_URL`), `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET`. `AUTH0_AUDIENCE` is required only when requesting an application API access token. Resend, Supabase, and R2 variables are required when their server features are enabled.

## Known unresolved risks

- Existing Antigravity admin and impersonation UX derives authority from client state/localStorage. It is preserved as uncommitted user work but is not production-safe and must be connected to server-authorized, durable, audited operations in phase 2.
- `/admin` now has a fail-closed server layout. During the RLS transition it grants access only when the verified Auth0 `sub` appears in server-only `INTIMO_ADMIN_AUTH0_SUBS`; it deliberately ignores browser-writable `profiles.role` for admin grants. This bootstrap allowlist must be removed after canonical server-managed roles are migrated.
- Existing-profile reads and edits now have an Auth0 owner-derived `/api/profile/me` boundary using the server-only Supabase client. Client reconciliation and `updateUserProfile` use it; legacy login and other content services still require migration before RLS lockdown.
- Onboarding now creates a profile exactly once through the same Auth0-owned API, requires an Auth0-verified email and server-calculated age of at least 18, and cannot self-grant Premium, Creator, Admin, or biometric verification. Creator selection records intent in the audit event but creates a standard member pending a future approval workflow.
- Discovery now reads durable public profiles through an authenticated server API with a documented deterministic order (`created_at` descending, then `id` ascending), a fixed result cap, self-exclusion, and no synthetic online/compatibility signals. Individual profile reads enforce public visibility, ownership, or server-authorized admin access and validate identifiers before querying.
- Dating ads now use authenticated collection/item APIs. Authorship, author display data, verification state, and ownership are server-derived; creation is validated/rate-limited and deletion requires the exact profile owner. Legacy localStorage dating-ad authority was removed from the primary create/list/delete flow.
- CI is defined in `.github/workflows/ci.yml` and runs install, security tests, type checking, lint, and production build with nonfunctional build-only identity placeholders.
- Supabase policies and browser data access remain permissive pending phase 2.
- A deny-by-default migration now exists at `supabase/migrations/20260807_lock_down_auth0_boundary.sql`. It has not been applied because existing browser-direct profile/content flows must first move behind authenticated server APIs. Applying it early would intentionally deny those calls.
- Audit logging is process memory and is not durable.
- Multiple mock/localStorage stores and conflicting schemas remain pending consolidation.
