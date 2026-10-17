# Security handoff

## Owner actions completed on 2026-08-07

The owner confirmed the following through the Auth0 and Vercel dashboards:

1. The exposed Auth0 application client secret was rotated and the replacement saved in `.env.local` and Vercel.
2. A new 32-byte, hex-encoded Auth0 session secret was generated and saved in `.env.local` and Vercel.
3. Auth0 revoked the previous client secret during rotation. The prior session secret will cease to validate sessions when a reviewed deployment activates the replacement.
4. Auth0 callback, logout, and web-origin allowlists include the Intimo production domain, localhost development URLs, and retained legacy Vercel migration URLs.
5. Auth0 Management API Client Access shows exactly 3 of 272 scopes granted: `read:users`, `update:users`, and `delete:users`.

No deployment was performed. Vercel environment changes only become active on a subsequent deployment.

## Live-domain smoke test on 2026-08-20

Read-only testing against `https://intimo.live` produced a **NO-GO** result. No account was created, no credentials were entered, and no provider settings or deployment state were changed.

- The public home page loads over HTTPS and the Sign In and Join Intimo links reach Auth0 login and signup screens.
- Production redirects to the `simpleafiedeu.eu.auth0.com` tenant with `simpleafiedeu` branding and a different client ID from the reviewed Intimo tenant/application. Production Auth0 environment variables must be corrected and a reviewed redeployment performed before further acceptance testing.
- `/dashboard` presents a sign-in gate while signed out, but `/onboarding` and `/settings` render account forms while signed out. These routes must fail closed or redirect through the canonical account-state guard.
- `/verify-email` remains on “Verifying Email Address...” when opened without a valid authenticated verification context. It needs an explicit signed-out/invalid-context state.
- `/admin` correctly redirects a signed-out visitor to Auth0, but it inherits the same wrong production tenant configuration.
- The deployed onboarding UI is the legacy six-step implementation, not the reviewed three-step mandatory nickname/date-of-birth flow.
- The deployed age gate and footer still contain obsolete age-assurance disclaimers and `Draft` legal labels. The live deployment is therefore behind the reviewed working tree.

The remaining authenticated checks—email verification refresh, onboarding persistence, returning session, logout, and restricted-account routing—are blocked until the production Auth0 tenant/client and deployed revision are corrected. They must not be marked passed based on local tests alone.

## Remaining release actions

1. Correct Production `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET` so they reference the reviewed Intimo Auth0 application; verify `AUTH0_BASE_URL` or `APP_BASE_URL` is `https://intimo.live`. Never copy values into chat or source.
2. Review and deploy the intended revision containing the canonical three-step onboarding, server route guards, production tenant validation, and current legal/age-gate presentation.
3. Complete the unresolved application authorization, RLS, persistence, and test risks below.
4. Review the combined Antigravity and remediation diff before any commit.
5. Repeat the controlled live test with a dedicated test account: signup, verification, onboarding, returning session, logout, restricted account, and protected routes.

Do not place secret values in tickets, chat, documentation, source, client bundles, or `NEXT_PUBLIC_*` variables.

## Required runtime variables

See `.env.example`. Production requires `AUTH0_SECRET`, `AUTH0_BASE_URL` (or `APP_BASE_URL`), `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, and `AUTH0_CLIENT_SECRET`. Intimo currently uses Auth0 as a web application authentication provider. No custom Auth0 API audience is required for the MVP. Resend, Supabase, and R2 variables are required when their server features are enabled.

## Known unresolved risks

- Step 8 now protects `/onboarding` and `/settings` with server-side account-state guards, keeps verification polling inactive without the canonical verification-required state, and provides a restricted-account destination. Production middleware rejects missing Auth0 credentials and any issuer other than the approved `https://intimo.eu.auth0.com` tenant with HTTP 503. These controls are verified locally but are not live until a reviewed deployment is performed.

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
