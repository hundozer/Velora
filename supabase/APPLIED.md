
## 19 November 2026 — FM-10 / screenshot reporting / view-once production rollout

Owner instructed completion of the four merged founding-member feedback workstreams. GitHub `main` reached merge #170 at `d9b245fd496172cb5fbb170bd0d67ac229f1d8d1`, deployed as Vercel production `dpl_Dyv2y2XDwquipQyyEWd6XpQS6EDc` (READY). After schema rollout, a production redeployment of the same commit was started as `dpl_4UJf1BLQXyZ1rZaVdnPP9ya5MvUD` (READY), to load the new `CRON_SECRET` environment setting. No member credentials or destructive media tests were used.

Three official migrations were applied via connected Supabase tooling, staging first, then production; each reported success. The repository source files were `20261119150000_attributed_invitation_codes.sql`, `20261119160000_nonconsensual_screenshot_reports.sql`, and `20261119170000_view_once_chat_photos.sql`. Connector-generated ledger versions, **not** the repository filename versions:

| Schema change | Staging receipt (`fuczjjcwtxzzvoxilrme`) | Production receipt (`bkdyjdbmtucqvgebqadp`) |
|---|---|---|
| Attributed invitation codes | `20261119145444` | `20261119145539` |
| Non-consensual screenshot report reason | `20261119145446` | `20261119145542` |
| View-once chat photos | `20261119145448` | `20261119145545` |

Independent post-apply queries confirmed both invitation-code tables, the screenshot reason check, and the view-once column in both environments. Staging test: service-only invite validation/redeem RPC grants confirmed; arbitrary unissued token denied; transaction-scoped single-use code could be redeemed once but not twice; test record rolled back leaving zero fixtures. Staging moderation constraint preflight had been applied inside a transaction and rolled back before the official migration. No end-to-end authenticated two-account view-once test, production R2 object deletion, or formal legal review has been recorded.

**Carolinka / C.** Ten correctly formatted 43-character, one-use codes were issued in production for Founding Member profile `d54ebb65-9399-4ee5-960d-43bc5e7eb834` with owner label `Carolinka`, source label `Carolinka — founding member testers — 19 Nov 2026`, and expiry 10 December 2026 UTC. A first 10-code batch had an incompatible token length, was unused, and was revoked before distribution. The replacement batch was independently checked: 10 active, 10 revoked, zero redemptions, `max_uses=1`, valid hashed token and 43-character registration format. Invitation secrets are intentionally **not** stored in this ledger.

**Outstanding before claiming full launch assurance:** authenticated signup-to-age-approval journey; two-user view-once + watermark + denial tests; R2 environment/bucket and age-evidence deletion tests including legal holds; completion and ongoing monitoring of the cron job; ban-evasion response, automatic appeal-sanction reversal safeguards, and DSA legal/out-of-court review. The merged code + schema checks are not equivalent to real-member acceptance tests.

# Applied migrations

18 November FM-07 report outcomes: owner-approved in session ("yes" to "Reply yes and I'll make the database change") and applied with Supabase `apply_migration` from the statements of `supabase/migrations/20261118180000_report_outcomes.sql` (5748 bytes, SHA-256 `a39fec03ab5b1513d7aa71d1c8cbae33489141c72026a8ad75ef8819094acb03`; the comment header is not sent). Staging `fuczjjcwtxzzvoxilrme` first (receipt `20261118140426 report_outcomes`), then production `bkdyjdbmtucqvgebqadp` (receipt `20261118140500 report_outcomes`). Pre-checks on both: the five new `moderation_cases` columns and `intimo_decide_appeal` absent; no moderation cases, appeals or events. Post-checks inside always-rolled-back blocks: an ALBUM report accepted; a member statement under 20 characters rejected; the reported member's appeal accepted after action and refused after no action; the reporter's appeal accepted; `intimo_decide_appeal` returns the case to its decided status with the appeal outcome; anon and authenticated have no EXECUTE on either function. Afterwards production still has 0 cases, appeals, events and moderation notices. Done before merging [hundozer/Velora#162](https://github.com/hundozer/Velora/pull/162). Rollback is in the migration header.

18 November FM-09 identity fields: owner-approved in session ("yes, apply the migration") and applied with Supabase `apply_migration` from the exact source `supabase/migrations/20261118120000_identity_fields.sql` (2519 bytes, SHA-256 `12bb6cfe6c59cbe527d29f90e8b4c253472785b3d7317f2f91c6c182e1675ec9`). Staging `fuczjjcwtxzzvoxilrme` first (receipt `20261118131801 identity_fields`), then production `bkdyjdbmtucqvgebqadp` (receipt `20261118131852 identity_fields`). Pre-checks on both: the four new columns and `profiles_identity_visibility_check` were absent. Post-checks on both: `orientation_note`, `gender_note`, `pronouns` (text, no default) and `identity_visibility` (jsonb, default `'{}'`) present; the check constraint present and, inside an always-rolled-back block, rejecting an unknown audience, an unknown key and a 61-character note; profile rows unchanged (staging 2, production 6) with no identity values set. Application code from [hundozer/Velora#159](https://github.com/hundozer/Velora/pull/159) was already on main. Rollback is in the migration header. intimo.live home 200 and signed-out `/api/profile/me` 401 after the change.

18 November FM-06 age check: owner-approved in session (answer "ywa" to "Reply yes and I'll do steps 1 and 2", read as yes) and applied with Supabase `apply_migration` from the exact source statements of `supabase/migrations/20261118150000_age_check.sql` (2222 bytes, SHA-256 `00b5ddfd855b28de055bfb26c7927d9fc222ef40d5dd8e7042201d83a26873b7`; the comment header is not sent). Staging `fuczjjcwtxzzvoxilrme` first (receipt `20261118134159 age_check`), then production `bkdyjdbmtucqvgebqadp` (receipt `20261118134218 age_check`). Pre-checks on both: `age_check_code`, `age_check_code_issued_at` and `verification_reviews.challenge_code` absent, no verification reviews. Post-checks on both, inside always-rolled-back blocks: a malformed code rejected, `PENDING` accepted, a second open AGE review for the same member rejected by `verification_reviews_one_open_age_check`. **Owner-approved data step (production only):** the 3 `ACTIVE`, `AGE_DECLARED` members (one is the SUPER_ADMIN owner) set to `AGE_VERIFIED` with `age_verification_method = ADMIN_ATTESTATION`, each with a `VERIFIED` AGE `verification_reviews` row and an `APPROVE_AGE` `admin_action_events` row by the SUPER_ADMIN, reason "Existing member approved by hand by the owner, 18 Nov 2026 (FM-06 rollout)". The 3 `DEACTIVATED` profiles keep `AGE_DECLARED` and must take the check if they return. Staging's 2 profiles are `RESTRICTED` and were not changed. Done before merging [hundozer/Velora#161](https://github.com/hundozer/Velora/pull/161), as `docs/AGE_CHECK.md` requires. Rollback is in the migration header.


25 October post-merge Stories activation is complete on production main `89bcbbe8c21beedf457608e870a0e8e368ad5c20`. Dedicated cron `intimo-story-cleanup` is active hourly at minute 7, run `93905cc8-a6dc-4ce9-a27b-746294891a46`; manual tick request `4334` returned HTTP 200 with removed/failed/held all zero. No production member fixtures. See [activation evidence and scoped disable procedure](../docs/PHOTO_STORIES_2026-10-25.md). Earlier pending-activation entries below are historical.

25 October photo Stories production rollout: owner-approved source SQL installed and verified for `private_photo_stories`, `story_author_adult_guard` and `story_cleanup_worker`. Actual tool receipts `20261025045313`, `20261025045318`, `20261025045448` were hash-verified, then aligned with the guarded reviewed operation to canonical source versions `20261025034408`, `20261025042415`, `20261025043422`. RLS/role denials and media guard verified without fixtures. Hourly story-only cleanup is authorized but awaits merged application deployment; no story job is active yet. See [exact hashes, role checks, staging acceptance and rollout evidence](../docs/PHOTO_STORIES_2026-10-25.md).

25 October: owner-authorized identifier normalization is applied to both ledgers. Legacy eight-digit versions now have six trailing zeros; existing 14-digit receipts, names, statements and all other metadata remain intact. See [the repair evidence and guarded operational SQL](../docs/MIGRATION_HISTORY_2026-10-24.md). Earlier version labels below are historical.

24 October production filename reconciliation: see [migration history alignment](../docs/MIGRATION_HISTORY_2026-10-24.md). Three source filenames now match the verified production receipts; SQL bytes and both database ledgers remain unchanged. Historical filenames below describe observations at their original dates. Do not blindly push this directory to recovered staging.

Source of truth for schema: `supabase/migrations/`. This file records what each environment actually has.
Update it in the same PR that ships a migration, after the migration is applied.

## Legacy receipt reconciliation completed — 20 October 2026

Owner approval was received in this session before execution. On 20 October 2026 at 18:35:31 UTC, the exact reviewed 5038-byte SQL (SHA-256 `c38e68d76761da42dc125efabcf8390e072a4e6f479da0a869a5f6c79f796cdd`, source blob `fcb242f390924460e7c4b24e2835c61ec0c1f378`) committed successfully through Supabase execute_sql on production `bkdyjdbmtucqvgebqadp`. No wrapper migration receipt was created and no legacy SQL was executed.

Independent post-commit queries verified:
- Active legacy receipt `20260922033815`: absent; private archive: exactly one complete original receipt, JSON MD5 `597eba0cdea5dd99818c549c9a74060b`, identical to the preflight full-row hash.
- All35 repository migration versions match the active production versions: no missing or extra versions. This verifies version reconciliation, not byte-identical replay of every historical migration.
- Canonical ledger hash `f6a323bcfebc40001fbe602c87b5adfc`, profiles hash `c79210679352712160de1d67e6a8e637` and media hash `acb1a03cd08a8e79a1a0852f21cfdd97` match preflight. The transaction also checked message-policy hashes unchanged.
- Message helper MD5 remains `b5410de5cebab3460e5fe0566ca59367`; RESTRICTIVE `member_message_safety` remains alongside the permissive participant policy.
- Archive RLS enabled. Actual anon/authenticated/service_role roles all have neither schema USAGE nor table SELECT.
- Production `intimo.live` remains READY at main `1eda06588dc4ed5166db43c445f08f3de23a5e05`, deployment `dpl_ejmCK9nHr58PMeoAjB6TXmJXFRNs`.

The latest main Supabase check observed is `118807445098`, **SKIPPED**, created at18:26UTC before this repair: “This git branch is not associated with any Supabase Branch.” It supersedes the earlier failed check display but is not a successful migration validation, and was not caused by this repair. The connectors expose no supported Supabase check-rerequest operation; a fresh successful integration run remains unproven. No integration or protection setting was changed.

Fresh post-repair public smoke on authoritative main passed **1/1** (35.5-second test,36.2-second total): `E2E_BASE_URL=https://intimo.live E2E_HTTP_PROXY="${HTTPS_PROXY:-${HTTP_PROXY:-}}" npx playwright test --config=playwright.smoke.config.ts --trace=off`. It verified application home200, real public-community200/no demo content, anonymous profile/discovery/messages/admin401 and signed age cookie200. No production member account, content or upload was created.

## Production — Supabase `Velora` (`bkdyjdbmtucqvgebqadp`)
Ledger and effective schema re-inspected 20 October 2026 after owner-approved dashboard application. All35 canonical version entries through `20261104` are present. The legacy bootstrap receipt is preserved privately rather than in the active ledger, as verified after the separately approved repair above. `20261104_block_aware_message_reads` is **applied and verified**: restrictive policy/helper and exact canonical ledger source match staging. No production member records were changed. Earlier per-row owner attributions below are historical records, not newly verified actors.

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

## 21 October unread-message queue (staging only)

Staging migration tool receipt `20261021200009`, name `durable_unread_message_emails`, source MD5
`6961890acc3b3a1eaa1716f81cd63002`, matches the repository source statement. Adds the unread outbox,
restricted worker RPCs and scheduling helpers; pg_cron/pg_net installed. No scheduled job or Vault
configuration is created by the migration. Preserved profile/media hashes are unchanged; rollback-only
SQL behavioral/role tests passed. See `docs/UNREAD_EMAIL_DELIVERY.md` for exact evidence and failures.
Actual two-account staging messages → minute cron → Resend acceptance → owner-confirmed single inbox
delivery → category/global unsubscribe passed. Fixtures, queue, cron and Vault config independently
verified absent afterward. Production has **not** received this migration. Its application requires
separate reviewed approval.


### 22 October 2026: production unread-message queue

Owner-approved official application on `bkdyjdbmtucqvgebqadp`: actual receipt `20261022044018`, name `durable_unread_message_emails`, source MD5 `6961890acc3b3a1eaa1716f81cd63002`. Repository/staging version is `20261021200009`. Exact SQL, different tool-generated receipt timestamp; no manual ledger repair. Do not blindly replay the file. Production RLS/function grants/trigger and rollback-only real-role denial checks verified. Scheduler remains unconfigured pending PR #100 deployment. See `docs/UNREAD_EMAIL_PRODUCTION_2026-10-22.md`.

## 25 October: invitation links in photo Stories (PR #114)

Staging `fuczjjcwtxzzvoxilrme` applied `story_plan_invitations` as receipt `20261025062004`; repository filename aligned to that actual receipt from CLI-generated `20261025061806` with exact SQL bytes unchanged. MD5 `340554efc682460026c9f6a7c83d0fb3`. Nullable Plan FK and service-only atomic wrapper only; no new table/member grants. Independently verified anon/authenticated EXECUTE false. Production `bkdyjdbmtucqvgebqadp` rechecked: receipt and column both absent. Production approval remains pending for this migration; earlier cleanup approval did not cover it. See `docs/TAKE_US_OUT_2026-10-25.md` for behavior and verification limits.
