# Applied migrations

Source of truth for schema: `supabase/migrations/`. This file records what each environment actually has.
Update it in the same PR that ships a migration, after the migration is applied.

## Pending legacy receipt reconciliation (20 October 2026)

Main `1eda065` (#91/#92 merged) is deployed and public production smoke passes. The Supabase integration rejects unmatched historical version `20260922033815` (`001_initial_schema`), absent from active repository migrations. It remains in production with source MD5 `09afadcde71d6378ece68b69ac5811b4`; canonical20261104 source/helper/restrictive policy remain verified. **No ledger repair is applied yet.** The guarded archive-and-remove proposal and rollback-only staging evidence are in `docs/LEGACY_BOOTSTRAP_LEDGER_REPAIR.md`. This is outside the prior20261104 approval and requires new production approval. Do not mark the receipt archived until the archive and active ledger are independently verified after execution.

## Production — Supabase `Velora` (`bkdyjdbmtucqvgebqadp`)
Ledger and effective schema re-inspected 20 October 2026 after owner-approved dashboard application. Canonical entries through `20261104` and legacy bootstrap are present. `20261104_block_aware_message_reads` is **applied and verified**: restrictive policy/helper and exact canonical ledger source match staging. No production member records were changed. Earlier per-row owner attributions below are historical records, not newly verified actors.

| Version | Migration | Applied via |
|---|---|---|
| 20260805 | drop_legacy_bootstrap | SQL editor bundle (owner) |
| 20260806 | canonical_base_schema | SQL editor bundle (owner) |
| 20260807 | lock_down_auth0_boundary | SQL editor bundle (owner) |
| 20260808 | free_mvp_privacy_foundation | SQL editor bundle (owner) |
| 20260809 | safety_moderation_foundation | SQL editor bundle (owner) |
| 20260810 | critical_compliance_controls | SQL editor bundle (owner) |
| 20260811 | admin_command_center | SQL editor bundle (owner) |
| 20260812 | super_admin_elevation | SQL editor bundle (owner) |
| 20260813 | internal_admin_mfa | SQL editor bundle (owner) |
| 20260814 | public_community_content | SQL editor bundle (owner) |
| 20260815 | retention_execution | SQL editor bundle (owner) |
| 20260816 | transactional_safety_actions | SQL editor bundle (owner) |
| 20260817 | canonical_media_albums | SQL editor bundle (owner) |
| 20260818 | transactional_blocking | SQL editor bundle (owner) |
| 20260819 | demo_content_marker | SQL editor bundle (owner) |
| 20260820 | mutual_friendships | SQL editor bundle (owner) |
| 20260821 | reconcile_canonical_media_schema | SQL editor bundle (owner) |
| 20260822 | album_audience_and_interaction_rules | SQL editor bundle (owner) |
| 20260823 | explicit_media_and_photo_verification | SQL editor bundle (owner) |
| 20261017 | emergency_revoke_client_table_access | SQL (MCP, revoke only) |
| 20261018 | supabase_auth_identity | SQL editor bundle (owner) |
| 20261019 | member_read_rls | SQL editor (owner) |
| 20261020 | prague_areas | SQL editor (owner) |
| 20261021 | desire_graph | SQL editor (owner) |
| 20261022 | member_boundaries | SQL editor (owner) |
| 20261023 | tonight_plans | SQL editor (owner) |
| 20261024 | interest_visitors | SQL editor (owner), verified 2026-10-18 |
| 20261025 | private_access | SQL editor (owner), verified 2026-10-18 |
| 20261026 | return_emails | SQL editor (owner), verified 2026-10-18 |
| 20261027 | scene_events | SQL editor (owner), verified 2026-10-18 |
| 20261028 | rate_limits | SQL editor (owner), verified 2026-10-18 |
| 20261101 | media_variants | Supabase MCP (Claude, at owner's request), verified 2026-10-18 |
| 20261102 | plan_start_times | Supabase MCP (Claude, at owner's request), verified 2026-10-18 |
| 20261103 | introductions | Supabase MCP (Claude, at owner's request), verified 2026-10-19 |
| 20261104 | block_aware_message_reads | Owner-approved dashboard SQL editor, applied and independently verified 2026-10-20; exact canonical ledger source |
| 20260922033815 | 001_initial_schema | legacy bootstrap, superseded by 20260805 |

## Staging — Supabase `Intimo Staging` (`fuczjjcwtxzzvoxilrme`)

Restored and ACTIVE_HEALTHY, freshly verified 2026-10-19. Schema and Preview database connection recovered. Disposable member journeys and direct JWT REST/Realtime policy checks exercised; see the readiness report for exact runs, failures and remaining beta gates. Production safety migration was subsequently approved, applied and independently verified on 20 October; see completion evidence below. See `docs/BETA_READINESS_2026-10-19.md` for live evidence, differences and blockers.

| Versions | Observed history |
| --- | --- |
| `20260805` | Verified no-op explanation; not recorded as exact SQL replay |
| `20260806`–`20260810` | Ledger statement text matches repository files |
| `20260811` | Compatibility replay expands intermediate media statuses; later canonical steps restore final constraint |
| `20260812`–`20260817` | Ledger statement text matches repository files |
| `20260818` | **Not applied separately.** Previous misleading skip row moved to restricted `intimo_migration_audit.superseded_migrations`; final function installed by `20260820` |
| `20260819`–`20260823` | Ledger statement text matches repository files; final blocking function and media constraints verified |
| `20261017`–`20261019` | Canonical ledger statements and current identities/member-read policies inspected |
| `20261020`–`20261022` | Exact canonical SQL executed together, each canonical version registered transactionally |
| `20261023`–`20261028` | Exact canonical SQL executed after preserving incompatible legacy advert in private archive |
| `20261101`–`20261103` | Exact canonical SQL executed in dependency order |
| `20261104` | Exact canonical function and restrictive policy applied; actual-role rollback test passed; ledger statement text rechecked after escaping correction |

Additional real management ledger entries, retained as recovery history:

| Actual version | Name | Purpose |
| --- | --- | --- |
| `20261019133739` | `staging_legacy_identity_quarantine` | Earlier preservation of two Auth0 identity mappings, restricted profiles |
| `20261019182633` | `staging_recovery_prague_reference_and_boundaries` | Wrapper executing canonical `20261020`–`20261022` |
| `20261019182733` | `staging_recovery_prague_plans_and_dependencies` | Archives incompatible advert; executes `20261023`–`20261103` |
| `20261019182832` | `staging_block_aware_message_reads` | Wrapper executing canonical `20261104` |
| `20261019182949` | `staging_reconcile_skipped_blocking_history` | Preserves skipped-step evidence and removes false applied `20260818` row |

Canonical replay groups use repository SQL and insert each actually executed canonical version/name/statement into `supabase_migrations.schema_migrations` inside the same transaction. Supabase management also records its generated wrapper version. These extra staging-only recovery entries are intentional and are not migrations to apply to production; **do not blindly use `db push` or invent matching repository files**. Compare effective objects and this documented history first.

Retained state: 2 restricted/private legacy profiles, 2 original identity mappings, 5 media rows, 1 archived legacy advert. No Auth users or acceptance accounts. SQL-role fixtures, their message/blocks and the deliberately permissive probe policy all rolled back; independent cleanup query returned zero leftovers. All audit tables have no anon/authenticated grants.

20 October live acceptance: `dpl_5ymbA83Z4cunBkaKtCcufNGKsgDz` at harness `06a5460880a229fe6d0be6900204f91d7cd44305`, targeting merged-main Preview `0ffcb84`, passed actual JWT REST/Realtime checks in both block directions (four-second event-denial windows), inactive REST denial and full member/cleanup checks. Independent database counts returned the preserved baseline: Auth0, restricted legacy profiles2, media5, messages/Plans/blocks/private grants0. All eight pre-existing R2 objects exactly matched the before-run inventory. This is staging evidence only; production `20261104` still absent at read-only20October preflight. See readiness report for earlier failed repeats and remaining gates.

## Production rollout completed — 20 October 2026

20 October 2026, approximately 06:30 UTC (08:30 Prague): after explicit migration approval and explicit permission for dashboard fallback, the guarded transaction was executed through the production Supabase SQL editor. The entered transaction was copied back and matched byte-for-byte before Run. It executed the canonical schema SQL plus canonical bookkeeping atomically. Canonical ledger `20261104`, name `block_aware_message_reads`, contains one statement with exact source MD5 `1cd73751c6f9ce761e65999956296e0b`; no management-wrapper receipt was generated or invented. The two earlier expired-request-state attempts had been checked and caused no change.

Independent read-only `execute_sql` verification: production and staging helper definitions share MD5 `b5410de5cebab3460e5fe0566ca59367`; owner postgres, STABLE SECURITY DEFINER, empty search_path, ACL only postgres/authenticated/service_role (no PUBLIC or anon). Authenticated helper execution true; anon false. RLS remains enabled; `member_message_safety` is RESTRICTIVE SELECT for authenticated alongside the original permissive participant policy. Authenticated table grant remains SELECT only; anon has no table grants. Production counts remain profiles1/Auth1/media4/messages0. No production acceptance fixtures or member-data writes were used. Supabase is ACTIVE_HEALTHY; Vercel production `dpl_GDAAJj42WEomuYqiVqnd8NjTENp4` remains READY at app main `0ffcb84b1be72f05d7725b941126a02a0d121235`.

Fresh HTTP checks: homepage200 with Intimo content, public-community200 with `demoContentPresent:false`, profile/discovery/messages/admin401 anonymously. Individual parallel curl checks took about6.7–6.8seconds. The full Playwright smoke's initial45-second aggregate budget expired; a120-second-budget repeat retains all assertions, including the signed age cookie. Repeat passed: **1/1**, 43.9-second test /44.6-second total. Command: `E2E_BASE_URL=https://intimo.live E2E_HTTP_PROXY="$HTTPS_PROXY" npx playwright test --config=playwright.smoke.config.ts --trace=off --timeout=120000`. All original assertions retained; no member credentials, account creation or destructive data test.

Security advisor after application:32 INFO for intentionally server-only RLS tables without policies, one WARN for deliberate authenticated execution of the uid-guarded security-definer helper, and one WARN for disabled Auth leaked-password protection. The latter is recorded for separate Auth review; no unrelated Auth setting was changed. See [password-protection remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) and [helper advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Beta remains NO-GO pending operational gates; this schema rollout does not prove signup/email, admission, moderator operation, scheduled erasure or resolution of the earlier intermittent profile-edit failure.

## Earlier production execution attempts (superseded)

20 October 2026 production attempt: owner explicitly approved only canonical `20261104_block_aware_message_reads.sql`. Source on authoritative main `0ffcb84b1be72f05d7725b941126a02a0d121235` still matches SHA-256 `cc428966e904b3116dc31153fb492e0c28561c92b7ee4927f8838e911f88201b`. Two `apply_migration` calls returned `Invalid or expired requestState`; after each, `execute_sql` independently confirmed no canonical/wrapper ledger receipt, no helper and no restrictive policy. No third unchanged retry. Production remains at profiles1/Auth1/media4/messages0, original participant policy and authenticated SELECT-only grant; no member fixture or member-data write occurred. Vercel production `dpl_GDAAJj42WEomuYqiVqnd8NjTENp4` remains READY at main `0ffcb84`. Migration approval is granted; execution is blocked by the connector. No Supabase CLI is installed. Dashboard SQL editor is the prepared fallback, pending permission to use Browser after repeated connector failure.

`20261104` must remain outside the applied-production table until successful execution and effective-object verification. The prepared, guarded fallback transaction is reviewable in `docs/PRODUCTION_MESSAGE_RLS_ROLLOUT.md`.
