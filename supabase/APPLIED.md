# Applied migrations

Source of truth for schema: `supabase/migrations/`. This file records what each environment actually has.
Update it in the same PR that ships a migration, after the migration is applied.

## Production — Supabase `Velora` (`bkdyjdbmtucqvgebqadp`)
Ledger and effective schema re-inspected 2026-10-19 at 18:34 UTC. Existing canonical entries through `20261103` and legacy bootstrap are present. `20261104_block_aware_message_reads` is **not applied**: restrictive policy/helper absent. No production change performed in this recovery. Earlier per-row owner attributions below are historical records, not newly verified actors.

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
| 20260922033815 | 001_initial_schema | legacy bootstrap, superseded by 20260805 |

## Staging — Supabase `Intimo Staging` (`fuczjjcwtxzzvoxilrme`)

Restored and ACTIVE_HEALTHY, freshly verified 2026-10-19. Schema and Preview database connection recovered. Disposable member journeys and direct JWT REST/Realtime policy checks exercised; see the readiness report for exact runs, failures and remaining beta gates. Production safety migration remains unapplied. See `docs/BETA_READINESS_2026-10-19.md` for live evidence, differences and blockers.

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
