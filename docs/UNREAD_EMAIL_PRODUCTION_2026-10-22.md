# Unread-message email production rollout, 22 October 2026

Owner explicitly approved the reviewed PR #100 production migration and worker activation after merge.
Application source: `1d7399b1f1ec7f975ec0b4a38ed2b5b180757edc`; staging evidence is in `UNREAD_EMAIL_DELIVERY.md`.

## Applied schema and actual history

Production Supabase: `bkdyjdbmtucqvgebqadp`. Official `apply_migration` succeeded after the owner reconnected the integration. Earlier expired-requestState failures were followed by ledger/object checks; no objects or receipt existed before the successful retry.

Actual production receipt: **20261022044018**, name `durable_unread_message_emails`.
Repository and staging receipt: **20261021200009**.
Recorded production SQL MD5: **6961890acc3b3a1eaa1716f81cd63002**, identical to the reviewed repository file and staging.

This is exact SQL replay with a tool-generated receipt-version discrepancy, not identical migration history. No receipt was fabricated, renamed or manually inserted. Do not replay the non-idempotent file against production merely because its filename differs from the receipt. Future CLI migration reconciliation must account for this mapping before db push.

## Verification

- Outbox RLS enabled. No anon/authenticated SELECT privilege; service role has required CRUD.
- All eight unread functions have fixed empty search paths and deny anon/authenticated execution. Scheduler tick is also denied to service_role. Configuration/disable RPCs are service-role-only.
- Message insertion trigger exists and is enabled. Existing `member_message_safety` remains RESTRICTIVE.
- Actual-role rollback-only checks PASS: anon queue SELECT denied; authenticated queue claim and INSERT denied. No member fixtures or messages were created in production.
- Non-destructive production health: `https://intimo.live/` HTTP 200 HTML; `/api/public/community` HTTP 200 JSON after migration.
- Immediately after application: queue rows 0, worker cron jobs 0, worker Vault configs 0.

## Installation checkpoint (superseded by activation below)

PR #100 is not merged at this checkpoint. Worker activation is approved but remains pending application deployment. No active cron or worker configuration was created. Merge only after checks pass; verify the deployed commit, configure the production-only enable flag and purpose-specific worker authorization, then verify scheduler/HTTP results without destructive production fixtures.

This checkpoint proves production schema installation and role restrictions. It does not prove live production email delivery or overall beta readiness.


## Activation verified after PR #100 merge

Merged main: `1917c10effb0dc41b4b8c2f303e4d81d6a5f541d`.
Initial merged deployment `dpl_9kHbbeq9GzDCz6cTBupmHAdUsrNH` reached READY.
Production-only `INTIMO_UNREAD_EMAIL_ENABLED=true` was then saved. The flag-bearing deployment
`dpl_GQNQ5FK26o2wPF51xhvT1ZWUoLT5` / `velora-r2m4l6lod-hundozers-projects.vercel.app`
reached READY on the same exact merged commit.

The inline activation command exceeded Vercel's 256-character build-command limit and was rejected before deployment creation. Instead, this one-off deployment fetched the reviewed operator script by immutable commit `215ffa0f689d31e30eeb0e2a19e8f79c857e95df`, ran the normal build, then configured the scheduler. The script asserts production environment, exact merged application SHA, production Supabase hostname and required credential presence. It derives a purpose-specific HMAC inside Vercel and passes it directly to the existing configuration RPC. No credential was printed, committed or copied to Preview. The setup script is excluded from default build/CI and fails closed on any other app commit.

Actual production evidence at 04:50 UTC / 06:50 Prague, 22 October:

- Exact worker cron job 1 is active, every minute, command `select public.intimo_tick_unread_worker();` with no secret in the command.
- Exactly one encrypted Vault configuration targets `https://intimo.live/api/internal/email/unread`, has a bearer, has no Preview protection token and has no expiration.
- Real cron run succeeded at `2026-10-22T04:50:00.100157+00:00`.
- pg_net received HTTP **200**, body `{"accepted":0,"skipped":0,"retry":0}`, no timeout and no error.
- Queue rows remained 0. No production acceptance fixtures, profiles, messages, Plans or uploads were created. This is an idle scheduler/worker health check, not production inbox-delivery proof.
- Public homepage and community API remain HTTP 200; unsigned worker POST returns 404.

Staging remains the proven real message/provider/inbox acceptance environment. Production activation is complete; overall beta status and deferred operational journeys are unchanged.

Operational disable: call service-only `intimo_disable_unread_worker()` to remove the exact cron/Vault config; set the production flag false and redeploy if the endpoint must also be disabled. If the service-role key is rotated, regenerate the purpose bearer in Vault before expecting subsequent scheduler authentication to work.
