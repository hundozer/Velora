# Intimo remediation plan

Status date: 2026-08-07. Durable handoff memory for Codex, Antigravity, and the owner.

## Non-negotiable release gate

Do not commit, deploy, or apply production migrations until the owner rotates the Auth0 client secret and session secret that were embedded in source, updates the deployment environment, and confirms old credentials are revoked. Source removal does not rotate a credential or erase it from Git history.

## Architecture decisions

- Auth0 is the only identity provider. The Auth0 Next.js SDK owns OAuth state/nonce validation and an encrypted, `httpOnly`, `SameSite=Lax`, secure-in-production session cookie.
- Browser storage is an optional display cache only. It never grants a role, ownership, verification state, admin access, or impersonation authority.
- Sensitive writes cross a Next.js server API boundary. The server derives the actor from the verified Auth0 session and performs authorization and ownership checks. Direct browser writes to privileged Supabase tables are not an accepted production architecture.
- Because Auth0 subjects are not native Supabase `auth.uid()` identities in the current setup, protected tables use a deny-by-default RLS posture and server-only service-role access. The service-role key must never enter client code or a `NEXT_PUBLIC_*` variable.
- The smallest safe persistence target is PostgreSQL/Supabase as the durable database, with Prisma as the canonical schema and server data-access layer. `supabase/migration.sql` becomes deployment migration input; `db/schema.sql` is legacy reference until reconciled and then removed. In-memory/localStorage stores remain demo fixtures only and must not back production behavior.
- Discovery and ranking are deterministic, documented, and testable. No AI features are in scope.

## Phases

1. **Identity and secret containment (in progress):** remove credential fallbacks; use supported Auth0 SDK session/callback/logout behavior; fail closed in production; secure account deletion, verification, and media presigning; add focused tests.
2. **Authorization and data boundary (in progress):** deny-by-default RLS migration prepared; server actor, admin route guard, session reconciliation, profile ownership/visibility APIs, deterministic discovery, and create-once 18+ onboarding implemented. Remaining: content APIs, durable admin operations, impersonation removal, and durable audit storage.
3. **Canonical persistence:** reconcile Prisma, Supabase migration, and legacy SQL; migrate profile and onboarding reads/writes; document forward and rollback procedures.
4. **Durable MVP loop:** register/login, email verification, onboarding/profile/photo, deterministic discovery/filtering, profile view, messaging/interactions, and returning sessions.
5. **Localization and brand:** consolidate one i18n system for English, Czech, Hungarian, Romanian, Slovak, and German; progressively remove hardcoded UI strings; complete Intimo naming and document migration-only Velora identifiers.
6. **Quality gate:** real test runner plus auth/security/API integration tests, build/type/lint commands, and CI.
7. **Free MVP and compliance foundation (in progress):** monetization is centrally disabled; payment-only routes and VIP dating gates are blocked. Complete age assurance, explicit sensitive-data consent, privacy controls/rights, blocking, reporting, moderation/appeals, copyright workflow, retention, policy drafts, cookies, accessibility, and six-language UI. Future monetization is documentation-only in `FUTURE_MONETIZATION.md`.

Each phase includes verification evidence, remaining risks, rollback notes for schema changes, and exact owner-only actions. No external provider configuration, rotation, migration, or deployment is complete without verification.
