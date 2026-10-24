# Mutual-interest and private-photo return alerts

Base main: `d567846a07e4eee04d9db5bde771340114b78067` (merged #105). Scope: existing INTEREST/PRIVATE_ACCESS categories on the durable message-email queue. No new channels, paid provider, historical backfill or public activity feed.

## Behavior

New server-only database transactions save the interaction, in-app notification and queued email together. One-sided interest still creates an in-app notification; mutual interest queues both members. A private-photo request queues its owner, an approval queues the viewer. Denial and revocation remain silent. Repeated signals/requests/grants do not create duplicate notices or extend an active once-only grant.

Reference rows link pending jobs to a specific in-app notice and the current interaction. Reading/removing a notice, withdrawing interest, answering a request, revoking access, expiry, either block direction, inactive/demo identities or current opt-out suppress sending. Existing queue behavior retains the two-minute delay, ten-minute activity deferral, three-hour category throttle, leased claims, exact retry payload, provider idempotency and bounded retries. Terminal jobs clear relationship references and provider payloads. No names, photos, messages or private storage links appear in email; Preview links stay on Preview. Private-photo emails open Notifications, which links to the relevant request/profile.

Existing Settings and signed category/global unsubscribe remain authoritative. Labels now accurately say Mutual interest and Private photo requests and approvals. No direct provider send remains in the interaction routes.

## Migration and rollout

CLI generated `20261024153700_durable_interest_access_alerts.sql`. Apply after canonical interests, private-access and durable-unread migrations, despite historical filename ordering. It extends the outbox category check, adds server-only reference rows and RPCs, and delegates social eligibility from the existing worker. Installation alone creates no new alerts: old application writes remain on their old path until the new API starts using the transactional RPCs. No scheduler, secret, deployment protection or production worker setting is changed by this migration.

Staging applied through the migration tool as receipt `20261024155242`, name `durable_interest_access_alerts`. Source filename retains CLI version `20261024153700`; no ledger history was inserted or edited. Applied raw SQL MD5: `ddff6a880355a1b1a888823b0baf8e6d`. One repository header comment was then corrected to say schema first, matching the final transactional RPC design; executable SQL is unchanged. Current source raw MD5: `771edca4f99bf30ee38fd2929415a06c`. SQL normalized by removing comment lines/collapsing whitespace matches exactly on both sides: `278e51675118a44625e5e757fb0264b7`. No compatibility SQL or schema adjustment was needed.

Production application requires explicit approval after staging evidence. Do not merge/deploy new RPC callers into production before the schema dependency is installed. Keep the existing minute worker; do not create another scheduler or blindly replay the migration. On an ambiguous migration response, inspect ledger and objects before retrying.

## Verification

Local: 237 tests, TypeScript and lint passed. Production build result is recorded with the PR. New worker/template/unsubscribe behavior tests use synthetic responses, not inbox-delivery evidence.

`tests/sql/social-return-email-disposable.sql` loads the real old queue core and new migration in disposable PostgreSQL. Hosted PostgreSQL and actual staging `tests/sql/social-return-email-staging.sql` passed: service/anonymous/member privileges, mutual recipients, repeat suppression, live source/read state, both blocks, inactivity, expiry/revocation/denial, category/global opt-out, prepare-time checks, retry stability, acknowledgement cleanup, throttling and existing message behavior. Independent staging counts after rollback: zero fixture profiles, outbox jobs or reference rows, and zero active staging worker jobs. Initial head `8e7471965700d8329d5675ceeaefe3004aa42077` passed CI, Message RLS (including social SQL) and protected Preview smoke. Live acceptance remains pending; no inbox delivery is claimed.
