# Message read policy rollout

`20261104_block_aware_message_reads.sql` is **not applied** to production or staging by this PR. Do not add it to APPLIED.md until each actual environment is verified.

Problem: the participant SELECT policy allowed direct Supabase REST/Realtime reads even after either party blocked the other. Application API checks do not protect direct database API access.

The additive restrictive SELECT policy requires the caller to be a participant, both profiles active, and no block in either direction. A schema-qualified, fixed-search-path security-definer helper can inspect incoming block rows that the caller's own RLS hides. It exposes only a decision for a caller's own pair, grants no table writes, and cannot be called by anon. Existing policies and retained evidence are preserved. A deployment using a role that cannot bypass the underlying forced RLS needs privilege inspection before rollout; do not weaken table RLS to accommodate it.

CI's Message RLS workflow uses a fresh PostgreSQL 16 service and tests the actual migration against role/grant/forced-RLS fixtures, including incoming blocks, outgoing blocks, both participants, third parties, inactive accounts, anon denial and member-write denial. This tests PostgreSQL decisions, not Supabase Realtime's end-to-end behavior or the complete production schema.

Before applying: restore isolated staging and inspect all existing policies, grants and function ownership. Apply canonical migrations through this file in order; verify the definer is owned by the intended migration role. Test a known message with A and B JWTs directly through `/rest/v1/direct_messages`: readable before block, no rows for either after each block direction, no rows after account deactivation, no member writes. Subscribe both clients to Realtime and prove unauthorized events are not delivered after block/session revocation. Repeat on the final approved production commit with dedicated hidden fixtures and cleanup.

Rollback removes only the new restrictive policy and helper (commands in migration header). It restores the older, less restrictive read behavior, so rollback requires an access restriction/incident decision; do not silently reopen message reads.
