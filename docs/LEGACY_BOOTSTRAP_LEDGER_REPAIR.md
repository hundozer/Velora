# Retire the superseded bootstrap receipt from the active production ledger

**Status: prepared and staging-rehearsed; not applied to production. New owner approval required.**

Target: Supabase production `bkdyjdbmtucqvgebqadp`. Review the exact [manual SQL](sql/archive-legacy-bootstrap-receipt.sql).
SQL SHA-256: `c38e68d76761da42dc125efabcf8390e072a4e6f479da0a869a5f6c79f796cdd`.

## Diagnosis and scope

After #92 merged, main `1eda06588dc4ed5166db43c445f08f3de23a5e05` is live on READY production deployment `dpl_ejmCK9nHr58PMeoAjB6TXmJXFRNs`. Hosted CI verify passed. Full public production smoke passed1/1 (51.6-second total); the goodbye HTTP response contains the corrected deletion-request/deactivation wording.

The Supabase integration check118783303593 failed with `Remote migration versions not found in local migrations directory.` Production's ledger contains all35 repository migration versions plus one unmatched historical version: `20260922033815`, name `001_initial_schema`. Its one stored SQL statement is8949bytes, MD5 `09afadcde71d6378ece68b69ac5811b4`. It created the pre-canonical bootstrap; repository migration20260805 explicitly describes removing that old shape before canonical initialization. The current canonical schema and message safety policy are present.

Do not replay the legacy SQL, manufacture a replacement applied history, or add it to the active migration chain merely to silence the check.

The proposal creates a private `intimo_migration_audit.retired_migration_receipts` table, copies the **entire original ledger row** as JSON (including statements, rollback, created_by and idempotency_key), then removes exactly that old row from the active ledger. It leaves every canonical receipt and application table/policy unchanged. Original execution evidence remains available in the private archive. This file lives under docs/sql rather than supabase/migrations, so merging this PR does not execute the repair automatically or create a wrapper receipt.

## Guards and preservation

The transaction requires the exact old version/name/source hash, an absent archive table, canonical profile shape, canonical ledger anchors, the exact20261104 statement hash and effective helper hash, and the restrictive message policy. It aborts on changed assumptions.

Before mutation it snapshots ordered hashes of the canonical ledger, profiles, media and message policies. After copying/deleting the old receipt it verifies these hashes unchanged, exactly one archived receipt with its original source hash, and no anon/authenticated/service_role table read access. The archive has RLS and no client-facing grants; existing private audit data is not modified. Everything is atomic.

No Auth identity, member profile, media object/file, message, Plan or application migration is created, deleted or replayed. The private audit schema/table and the one active-ledger receipt are the only intended production changes. This approval would cover this exact transaction only, not future migrations.

## Actual staging rehearsal

Staging `fuczjjcwtxzzvoxilrme` does not contain the production bootstrap receipt. A rollback-only fixture used that version/name with a synthetic statement `stage-ledger-repair-fixture` (MD5 `73c2ec84694c4a7e95446bd286f6b71e`). No persistent migration history was fabricated.

The rehearsal executed the proposal with only these harness substitutions: insert the fixture immediately after BEGIN; replace the two expected legacy-source hashes with the fixture hash; replace final COMMIT with ROLLBACK and read back baseline checks. All transaction guards, archive/ledger actions, preservation checks and actual Supabase role privilege checks passed.

After rollback and again in an independent query:
- Complete ledger hash: `bf24a91fe6cacaab30d22e911c45c0d4`, unchanged.
- Legacy profiles hash: `9edb43bfa794d1e0044d11a838ec80dc`, unchanged.
- Media hash: `2a3556551b1e43d0875f8c798e5b7afb`, unchanged.
- Fixture receipts0; archive table absent.

An earlier attempt using the full production receipt payload returned `Invalid or expired requestState`. The database was inspected before retry: baseline hashes unchanged, fixture absent, archive absent. No pass was inferred from that ambiguous failure. The shorter synthetic-fixture rehearsal then returned success. This is equivalent transaction/role testing with explicit fixture substitutions, **not byte-identical production SQL execution**. Production's actual source hash was independently checked read-only.

## Execution and verification after approval

1. Re-read production's old receipt and the safety guards. Verify the reviewed SQL checksum. If anything changed, stop and revise the proposal.
2. Execute the reviewed transaction once on the production project, using a supported SQL path. Do not use apply_migration for this bookkeeping repair: adding a new untracked wrapper receipt would recreate the mismatch.
3. If the tool response is ambiguous, inspect the archive and active ledger before retrying. The transaction intentionally refuses an existing archive table to prevent blind replay.
4. Independently confirm old active receipt absent; archive has exactly one complete original row with matching source hash; canonical ledger/helper/restrictive policy unchanged; private audit grants remain denied.
5. Recheck all production ledger versions against repository filenames. There should be no unmatched remote versions; do not infer the Supabase integration is green until its actual check is rerun and succeeds.
6. Recheck production deployment and public smoke. No destructive production acceptance fixtures.
7. Update APPLIED.md/readiness evidence with the actual outcome, then close this pending proposal.

For an explicitly authorized bookkeeping rollback, restore the original row from the archive using `jsonb_populate_record(null::supabase_migrations.schema_migrations, receipt)`, after confirming the version is still absent. **Never execute receipt.statements.** Keep the private archive as evidence. Restoring the old row also restores the known integration mismatch; no automatic rollback or archive purge is proposed.

Supabase's [migration repair reference](https://supabase.com/docs/reference/cli/supabase-migration-repair) distinguishes history repair from schema rollback. This guarded proposal additionally preserves the complete receipt before removing its active-ledger entry.
