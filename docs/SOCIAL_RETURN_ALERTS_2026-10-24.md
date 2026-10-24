# Mutual-interest and private-photo return alerts

Base main: `d567846a07e4eee04d9db5bde771340114b78067` (merged #105). Scope: existing INTEREST/PRIVATE_ACCESS categories on the durable message-email queue. No new channels, paid provider, historical backfill or public activity feed.

## Behavior

New server-only database transactions save the interaction, in-app notification and queued email together. One-sided interest still creates an in-app notification; mutual interest queues both members. A private-photo request queues its owner, an approval queues the viewer. Denial and revocation remain silent. Repeated signals/requests/grants do not create duplicate notices or extend an active once-only grant.

Reference rows link pending jobs to a specific in-app notice and the current interaction. Reading/removing a notice, withdrawing interest, answering a request, revoking access, expiry, either block direction, inactive/demo identities or current opt-out suppress sending. Existing queue behavior retains the two-minute delay, ten-minute activity deferral, three-hour category throttle, leased claims, exact retry payload, provider idempotency and bounded retries. Terminal jobs clear relationship references and provider payloads. No names, photos, messages or private storage links appear in email; Preview links stay on Preview. Private-photo emails open Notifications, which links to the relevant request/profile.

Existing Settings and signed category/global unsubscribe remain authoritative. Labels now accurately say Mutual interest and Private photo requests and approvals. No direct provider send remains in the interaction routes.

## Migration and rollout

CLI generated `20261024153700_durable_interest_access_alerts.sql`. Apply after canonical interests, private-access and durable-unread migrations, despite historical filename ordering. It extends the outbox category check, adds server-only reference rows and RPCs, and delegates social eligibility from the existing worker. Installation alone creates no new alerts: old application writes remain on their old path until the new API starts using the transactional RPCs. No scheduler, secret, deployment protection or production worker setting is changed by this migration.

Staging application and exact ledger/source comparison are pending verification. Production application requires explicit approval after staging evidence. Do not merge/deploy new RPC callers into production before the schema dependency is installed. Keep the existing minute worker; do not create another scheduler or blindly replay the migration. On an ambiguous migration response, inspect ledger and objects before retrying.

## Verification

Local: 237 tests, TypeScript and lint passed. Production build result is recorded with the PR. New worker/template/unsubscribe behavior tests use synthetic responses, not inbox-delivery evidence.

`tests/sql/social-return-email-disposable.sql` loads the real old queue core and new migration in disposable PostgreSQL. `tests/sql/social-return-email-staging.sql` exercises actual service/anonymous/member privileges, mutual recipients, repeat suppression, live source/read state, both blocks, inactivity, expiry/revocation/denial, category/global opt-out, prepare-time checks, retry stability, acknowledgement cleanup, throttling and existing message behavior. Hosted PostgreSQL/staging execution and live acceptance are pending; no successful journey is claimed yet.
