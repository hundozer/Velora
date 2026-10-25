# Production migration filename alignment

## 25 October: sorting failure and completed normalization

The filename-only fix in PR #108 was incomplete: post-merge Supabase still failed on main `286ae6769bb63ed4368da9f51f87bcab61090ca5`. Set equality missed an ordering requirement. CLI lists local files in filename order but compares extracted versions against database version order. For example, `20261022044018_queue.sql` sorts before `20261022_member.sql`, while version `20261022` sorts before `20261022044018`. Its two-pointer comparison consequently reports an existing migration missing.

Source inspected: Supabase CLI `apps/cli-go/pkg/migration/list.go` and `apply.go` on develop. The regression test reproduces that exact comparison and rejects mixed-length filenames.

The owner instructed “Fix it” after the production-history issue was identified. All 35 legacy eight-digit source versions are now padded with six zeros; SQL content is unchanged. All executable test/script references follow the renames. The three existing 14-digit source versions stay unchanged. This is identifier normalization, not a claim that old migrations executed at midnight.

Guarded operational SQL is retained in `supabase/ops/20261025_normalize_production_versions.sql` and its staging counterpart, outside the automatic migration directory. Each pins the complete observed ledger (versions, names, stored SQL hashes), takes a bounded exclusive ledger lock, refuses destination collisions or unexpected triggers, checks the exact update count and asserts every non-version field is identical before/after. Both ran successfully inside rollback-only transactions first, then committed through execute_sql. No migration SQL was rerun or marked applied, no receipt row was added/deleted, and no application schema, grants or member data changed.

Production normalized 35 existing identifiers, retains 38 ledger rows, and now has only 14-digit versions. Staging normalized 34 existing identifiers, retaining 42 rows and its distinct recovery receipts. Its missing earlier blocking migration remains absent; its later superseding definition was not relabelled as proof of earlier execution. The scripts intentionally refuse a second execution against an already-normalized ledger. Reversal, if required, must use the reviewed mapping and collision checks; do not blindly truncate every identifier.

Validation: 243 tests pass, including mixed-length failure reproduction and zero-pending comparison for canonical files. Production version/name order matches the 38 canonical filenames exactly. Historical notes below describe the superseded filename-only attempt. Final hosted policy/build/Preview results are attached to the repair PR; the production integration can be confirmed only after merge. Staging still has recovery-only receipts and three distinct application receipts, so a blind staging push remains unsupported. Fresh chronological replay remains outside this repair.

On main `ea540bbc03102eadc75b8c81768a2f25bffd81d8`, Supabase's post-merge check failed with “Remote migration versions not found in local migrations directory.” Production application deployment was READY and public health passed. A read-only comparison of all 38 production ledger rows identified exactly three versions missing from the repository. Their SQL matches byte-for-byte; the migration tool assigned execution timestamps instead of retaining CLI filename timestamps.

| Migration | Previous source version | Production / new filename version | Raw SQL MD5 |
| --- | --- | --- | --- |
| durable_unread_message_emails | 20261021200009 | 20261022044018 | 6961890acc3b3a1eaa1716f81cd63002 |
| durable_interest_access_alerts | 20261024153700 | 20261024201630 | 771edca4f99bf30ee38fd2929415a06c |
| scene_company_plans | 20261024202832 | 20261024205326 | 3e31516aacb0309c4723fb61b1bc7956 |

This fix renames those files and updates executable test/CI references. SQL bytes are unchanged. Historical reports retain names observed at the time; this document supersedes statements that the source filenames remain unchanged. No ledger rows, schema, grants, functions, member records or scheduler settings are changed. Matching the complete production version set leaves no pending migration SQL. The post-merge integration is the final live confirmation; Preview success cannot prove it.

Production is `bkdyjdbmtucqvgebqadp`; staging is `fuczjjcwtxzzvoxilrme`. Staging retains its original receipts: unread `20261021200009`, social `20261024155242`, company `20261024203726`. Social SQL differs only by the previously documented header comment. Staging also retains recovery-specific receipts and the missing earlier blocking receipt superseded by the later definition. This fix does not label recovery operations canonical or edit history. Do not blindly push to staging or relabel its receipts.

This is production history alignment, not a clean-database bootstrap repair. Older future-dated files still impose non-chronological dependencies; existing disposable policy tests use an explicit prerequisite order. Full fresh-project replay is not claimed. Future migrations must follow prerequisites and use one canonical version across environments; inspect returned receipts immediately after applying them.

Validation: all 38 production version/name pairs match the 38 resulting filenames, with no missing or extra files. The three renamed SQL files and restrictive message-read migration match raw stored SQL hashes. Three other stored migrations (media variants, Plan start times and introductions) have different raw hashes but match after removing line comments and normalizing whitespace; no executable drift was found by that comparison. Older rows lack stored SQL, so filename agreement does not prove schema equivalence. All 241 tests pass. Hosted PostgreSQL policy checks exercise the renamed paths. No production write or migration repair command is needed.
