# ADR-001: Canonical persistence architecture

Status: accepted for remediation; production migration not yet applied.

## Decision

Intimo uses PostgreSQL hosted by Supabase as the durable database. Versioned SQL
under `supabase/migrations/` is the canonical schema and migration history for
the smallest safe MVP path because current server APIs already use the Supabase
PostgREST client. Prisma is frozen as legacy target/reference until it can be
regenerated from the deployed schema without rewriting working APIs. Auth0
remains the identity provider; `profiles.auth_id` stores its unique `sub`.

Browser code does not connect directly to protected tables. Next.js APIs verify the encrypted Auth0 session, resolve the actor and ownership server-side, then access PostgreSQL through a server-only credential. The Supabase service-role key is never exposed to the browser. RLS remains forced and deny-by-default as defense in depth for this server-boundary architecture.

## Transitional sources

- `prisma/schema.prisma`: legacy, conflicting schema; frozen and not used by runtime code.
- `supabase/migration.sql`: legacy bootstrap snapshot containing unsafe permissive policies; never apply to production.
- `supabase/migrations/*.sql`: canonical forward migration sequence and rollback notes.
- `supabase/migrations/20260807_lock_down_auth0_boundary.sql`: prepared security migration; do not apply until remaining browser calls are migrated.
- `db/schema.sql`: legacy reference only; do not extend.
- in-memory and localStorage stores: demo fixtures only; never authoritative for identity, roles, moderation, money, entitlements, or messaging.

## Migration sequence

1. For a clean environment, apply `20260806_canonical_base_schema.sql`. For an existing environment, inventory the deployed Supabase schema using read-only metadata and do not re-bootstrap it.
2. Verify and uniquely map existing `profiles.auth_id` values to Auth0 subjects.
3. Migrate each browser service to an Auth0-authenticated server API.
4. Backfill canonical identifiers and foreign keys; verify counts and orphan reports.
5. Apply the versioned additive MVP migrations and deny-by-default RLS migration in a reviewed maintenance window.
6. Move the legacy bootstrap SQL and Prisma schema to an archive only after deployed-schema parity is recorded.
7. Remove local runtime stores only after API parity tests pass.

## Rollback

Application rollout can revert to the prior server release while retaining additive schema changes. Never roll back by restoring `USING(true)` or `WITH CHECK(true)` policies. If a server boundary fails, keep protected tables closed and restore service availability by fixing or reverting the server API.
