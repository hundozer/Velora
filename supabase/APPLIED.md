# Applied migrations

Source of truth for schema: `supabase/migrations/`. This file records what each environment actually has.
Update it in the same PR that ships a migration, after the migration is applied.

## Production — Supabase `Velora` (`bkdyjdbmtucqvgebqadp`)
Verified 2026-10-17 against `supabase_migrations.schema_migrations`.

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
**Not in parity.** Project is paused. Restore it or replace it with Supabase branching before previews use a database (P0-03, P0-07).
