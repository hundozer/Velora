# Production migration filename alignment

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
