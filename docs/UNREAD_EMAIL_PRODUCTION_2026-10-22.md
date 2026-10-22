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

## Remaining rollout

PR #100 is not merged at this checkpoint. Worker activation is approved but remains pending application deployment. No active cron or worker configuration was created. Merge only after checks pass; verify the deployed commit, configure the production-only enable flag and purpose-specific worker authorization, then verify scheduler/HTTP results without destructive production fixtures.

This checkpoint proves production schema installation and role restrictions. It does not prove live production email delivery or overall beta readiness.
