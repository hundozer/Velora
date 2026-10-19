# Prague beta decision: NO-GO, Preview and member acceptance remain blocked

Current evidence: 19 October 2026, 18:34 UTC (20:34 Prague). Audited `main`: `30cea2f5ae3cbb5719cca2fc6dc5942ab624e007`, including merged #83–88. This update supersedes the older audit below where status differs. No application redesign or production database change was made.

## Preview connection recovered after owner configuration

Update: 19 October 2026, 18:57 UTC (20:57 Prague). Owner added `SUPABASE_SERVICE_ROLE_KEY` for Preview only; production retains its separate existing entry. Key values were not retrieved or printed. Fresh Preview `dpl_HveRMM7QLtJ1ze3GVFbWZYhHNd6r` is READY at merged main `0ffcb84b1be72f05d7725b941126a02a0d121235`, URL `https://velora-pmetp3frm-hundozers-projects.vercel.app`. Vercel API labels this Preview target `staging`; no production promotion was performed.

Authorized protected HTTP checks: home 200 with Intimo content; `/api/public/community?limit=1` **200**, empty profiles/Plans and `demoContentPresent:false`; `/api/profile/me`, `/api/discovery/profiles`, `/api/messages` and `/api/admin/overview` each **401** anonymously. This closes the missing service-credential/public database connection blocker. The age-declaration POST from the complete Playwright smoke was not run in these connector GET checks, so this is a partial HTTP smoke, not a full smoke-suite pass.

**Beta remains NO-GO.** R2 entries still target Preview and production together; isolated staging storage is not established. Disposable member fixtures, controlled inbox confirmation and protected browser access still need configuration before real acceptance and cleanup. No signup/login/member journey, uploaded-file cycle or erasure was exercised; no production SQL was applied. Earlier 503 and missing-key observations below are historical as of their stated timestamp, not current Preview status.

## Live environment evidence

| Environment | Exact target | Observed result |
| --- | --- | --- |
| Vercel project | `velora`, `prj_hZBTijIxLYZCQr2ePituCyOqk7og`, team `team_39Gwdv5nH2S8oUWtobZe6UqV` | Production READY at audited main |
| Production deployment | `dpl_4t8GFo369s98aWVfU1nKYJRSJJom`, `intimo.live` | `/login` 200; `/api/public/community?limit=1` 200, empty public inventory, `demoContentPresent:false` |
| Preview inspected | `dpl_J4zfEBYChMijrW8Ffh3Za7HJFFMu`, `velora-b67ftg6x6-hundozers-projects.vercel.app` | READY at `78570dd38318e9e79b8570196d170df4decc40f2` (merged #88 parent); `/login` 200; DB endpoint application 503 even after staging recovery |
| Production Supabase | `bkdyjdbmtucqvgebqadp`, EU Central | ACTIVE_HEALTHY; public login JS contains this exact project URL; 1 profile, 1 Auth user, 4 media rows |
| Staging Supabase | `fuczjjcwtxzzvoxilrme`, EU West | ACTIVE_HEALTHY; Preview login JS contains this exact project URL; recovered schema and actual-role tests below |

Protected requests used the Vercel connector's authorized fetch; protection remains enabled (`all_except_custom_domains`). The test Preview is identified explicitly rather than being described as an exact-main build. No `AGENTS.md` was present in the checkout or workspace parents. Read `e2e/README.md`, deployment workflows/config, migrations and `supabase/APPLIED.md` before changing staging.

## Code, migration and verification evidence are separate

- **Implemented:** #83–88 are on authoritative main. `npm ci --ignore-scripts` succeeded; `npm test` passed **196/196**, no skips. `npm run typecheck` and `npm run lint` passed (no ESLint warnings/errors). These include mocked/source tests and do not establish the customer journey.
- **Applied on staging:** exact repository SQL for `20261020`–`20261028` and `20261101`–`20261104`, with canonical ledger statements registered in the same transaction as each replay group. Recovery wrappers are also retained in the management ledger; see `supabase/APPLIED.md` for their actual generated versions.
- **Effective schema:** staging and production public columns, constraints and table RLS flags compare equal. Staging additionally has `member_message_safety` and `intimo_can_read_message`; production does not. The existing rate-limit function differs only by a comment in its stored definition. All 47 public tables have RLS; anon has SELECT only on `areas`; anon/authenticated have no direct table-write grants. All 47 tables have service-role SELECT. Inspected member-read policies and privileged function ACLs, not merely migration names. Realtime publication includes messages and notifications; event delivery remains untested.
- **Actual staging database-role verification:** `tests/sql/staging-message-rls.sql` executed through Supabase `execute_sql` against staging. PASS using real `anon`/`authenticated` roles and real `auth.uid()` with simulated request claims. Both participants read before a block. Both are denied after either direction of block, even with a deliberately permissive policy; incoming block rows remain hidden. Inactive viewer/peer, unrelated member, missing uid and anon are denied. Direct profile/message/desire writes and member execution of the privileged block RPC are denied. This is not a real JWT, REST or Realtime acceptance result.
- **Cleanup independently verified:** 2 legacy profiles remain restricted, private and discovery/messaging disabled; 2 identity mappings; 5 media records still owned by those profiles; 0 Auth users, messages, blocks, live Plans or private grants. SQL fixture profile/message counts and temporary probe-policy count are all zero. No files were uploaded by this run. One incompatible legacy advert is preserved in the restricted archive, as described below.
- **Two-member suite:** `npx playwright test --project=member-acceptance` exited 1 at `memberEnvironment()` before sign-in because all seven required E2E variables are unavailable locally. It recorded a failure, not a skip or a journey pass. No acceptance Auth accounts were created. The existing suite intentionally leaves messages/notices/preferences on reusable fixtures; isolated disposable members plus full cleanup verification are still required for the requested pristine acceptance run.

## Migration reconciliation and preservation

1. `20260805` previously recorded a verified no-op explanation, not canonical SQL execution. Its guard would return because restored `profiles.account_status` already exists. Keep this distinction; do not advertise exact replay.
2. `20260811` was replayed with an expanded intermediate media-status constraint to preserve five existing `PENDING_REVIEW` rows. Canonical `20260814`/`20260821` subsequently installed the final constraint. Current validated values are exactly `PENDING_REVIEW, UNDER_REVIEW, APPROVED, REJECTED, HIDDEN, REMOVED`; processing values are `UPLOADING, PROCESSING, READY, FAILED, REJECTED`. This is a documented compatibility replay, not a byte-identical `20260811`.
3. `20260818` was never separately replayed. Its earlier ledger row contained only a skip explanation. That evidence is now in `intimo_migration_audit.superseded_migrations`; the misleading applied row was removed. The `20260820` blocking function is present, service-role-only and removes both connections and friendships. Do not replay the older definition over it or invent an applied history.
4. One restored advert had category `Man seeking woman`, incompatible with canonical Plan categories. Its complete pre-migration JSON is preserved in `intimo_migration_audit.legacy_dating_ads` before removal from the active table. It belongs to a quarantined legacy identity and was not converted into a fabricated new Plan. No profile, identity mapping or media record was deleted. Canonical Plan constraints are validated.
5. `profiles_auth_id_matches_id` is validated (`auth_id = id::text`). Restricted legacy mappings retain their original identities in the private audit schema. No anon/authenticated table grants exist in that schema.
6. The new `20261104` function/policy were executed correctly. A string-escaping error affected only the newly recorded statement text; that ledger text was corrected to the exact executed repository SQL and its MD5 rechecked as `1cd73751c6f9ce761e65999956296e0b`. It was not a schema retry or invented execution.

## Exact blockers and next authorized work

1. **Preview server database credential:** `SUPABASE_SERVICE_ROLE_KEY` exists only for production in Vercel metadata. Preview has no such entry; `getServerSupabase()` returns null without it. Configure a server-only service-role credential belonging specifically to **staging `fuczjjcwtxzzvoxilrme`**, then rebuild a Preview from current main. Never copy production's key. The available Supabase connector exposes publishable keys, not a service-role/secret-key retrieval capability; Vercel single-env/decrypt reads return metadata without usable values. No authenticated Vercel CLI identity or local service credential is available here.
2. **Storage isolation:** R2 account/key/bucket environment entries target both Preview and production. They are shared configuration entries; their values are unavailable. Provide verified staging-only storage before destructive upload/erasure tests. Do not assume a shared bucket is isolated.
3. **Acceptance fixtures and access:** independently allowlisted Preview origin; disposable adult A/B credentials; A's approved PRIVATE non-chat photo ID; controlled test inbox/confirmation capability; protected-browser access through the existing trusted-source/OIDC workflow. Locally absent variables: `E2E_BASE_URL`, `E2E_ALLOWED_ORIGIN`, `E2E_A_EMAIL`, `E2E_A_PASSWORD`, `E2E_B_EMAIL`, `E2E_B_PASSWORD`, `E2E_A_PRIVATE_MEDIA_ID`. Existing GitHub secret values are not readable; their configured state was not established by this local failure.
4. **Still unexercised:** signup and inbox confirmation, real login/onboarding/profile editing, People/profile sheet close, timed Plan creation and reply eligibility, message arrival/Realtime, block/report through APIs, metadata-sensitive media grant/revoke/delivery, export/deactivation/erasure and post-erasure access denial. Do not replace these gates with the SQL result or green unit tests.
5. **Production #87:** direct ledger and policy inspection confirms `20261104` and the restrictive policy/helper remain absent. Exact proposed production change is only `supabase/migrations/20261104_block_aware_message_reads.sql`; it adds the helper and restrictive SELECT policy without data removal. Staging SQL evidence exists, but authenticated REST/Realtime acceptance is not ready. No production authorization is inferred from merged PRs, and no production change/approval request is made before the remaining staging gate is concrete.
6. Controlled admission at both app/Auth boundaries, operator moderation drill, discreet email delivery and scheduled retention remain unproved gates from the original audit. They were not silently closed by schema recovery.

Security advisor: 32 INFO findings for RLS with no policy on intentionally server-mediated tables, and one WARN for authenticated execution of the deliberate message-safety SECURITY DEFINER helper. Its empty search path, uid/participant guard, anon/PUBLIC revocation and unrelated-caller denial were inspected/tested. Do not revoke the authenticated grant to silence the warning and break the restrictive policy. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Supabase changelog was fetched before replay. Relevant PostgreSQL patch/TLS/Realtime notices were inspected; no Realtime internal schema was edited and no project engine upgrade was attempted. All recovery migration calls in this run returned success and were followed by ledger/effective-object inspection. Earlier ambiguous failures were not retried blindly.

## Historical audit before recovery (superseded where noted above)

### Original audit decision: NO

Audited source: `main` at `76fda9d1b60fdc99b8476e85a2bc0876e3dae985`, 19 October 2026. This is an evidence snapshot, not a readiness percentage. Product authority remains PRODUCT_VISION.md, MVP_DEFINITION.md and ROADMAP.md. The approved People/Profile/Messages design is retained.

## What was independently established

- Current production deployment `dpl_k3R8sZLPsr7cyKee76nvPkUX7GCk` is READY from this exact main SHA. The canonical Vercel project is `velora`, project ID `prj_hZBTijIxLYZCQr2ePituCyOqk7og`, with `intimo.live` attached. The connected team's current project list contains no empty `intimo` project. Do not migrate domains or delete a project based on the old handoff.
- GitHub CI run `39196787460` passed for this main SHA. Source CI runs tests, typecheck, lint and build. Locally the original suite passed 186/186. Most existing tests inspect source or use mocked backends; that is not runtime acceptance.
- A new, unmocked HTTP smoke passed against https://intimo.live: home 200; DB-backed `/api/public/community?limit=1` 200; signed age declaration 200; profile, discovery, messages and admin endpoints reject anonymous requests with 401. Its public community response had empty real inventory and `demoContentPresent:false`. This does not establish authenticated member behavior or absence of every demo row.
- With authorized Vercel access, PR #83 Preview `/api/public/community?limit=1` returned application **503**, `Public community is temporarily unavailable`. Build READY is not functional Preview readiness.
- Current Vercel env metadata lists service-role credentials for Production only, not Preview. R2 and Resend entries target both. No Auth0-named env entry is present. No retention cron secret is listed. Values remain unavailable through the connector, including when decryption is requested; presence of a key is not proof of a working value.
- `supabase/APPLIED.md` records 34 canonical migrations plus one superseded bootstrap in production; its old roadmap statement of 23 is stale. The production schema ledger was not independently queried in this audit. Staging is recorded as paused; its actual management state cannot be independently established without Supabase access. Do not describe the ledger as a fresh database inspection.
- Branch-protection read returned GitHub integration 403. It is **unknown**, not proven absent. CI/secret administration and external Auth0 tenant cleanup cannot be established with current access.
- PRs #75–82 are merged and present in local main history. Their descriptions and current implementations were reconciled: image variants; timed Plans; People restoration/discovery/editorial UI; intercepted profile sheet; contextual Messages; sheet strip correction.

## Concrete defects and focused fixes

1. **Media privacy, PR #83.** Widthless delivery and failed variants served raw uploaded originals, retaining EXIF/GPS. Redirects exposed reusable signed storage URLs despite no-store, and member media did not reject deactivated owners or block-query failures. Proxy authorized bytes, strip image metadata at delivery, fail closed, and reject inactive owners. Retains resized variants and streaming/range delivery for non-images. Cost: app bandwidth/CPU and no browser media cache. Previously issued storage URLs expire on their old schedule; downloaded files cannot be recalled. Video metadata stripping is not implemented and is not implied by the image fix.
2. **Erasure, PR #84.** Retention wrote `auth_id=deleted|uuid`, violating `profiles_auth_id_matches_id`. Keep the identity UUID, erase the chosen area, disable discovery/Introductions. Executable worker tests cover the identity constraint, cleanup failure and legal holds. Operational scheduled execution is still unproved.
3. **Acceptance, PR #85.** Existing two-member spec silently skipped without credentials, created contexts without baseURL, and posted obsolete Plans without startsAt/endsAt. Repair these, exercise the real age gate, add unconditional cleanup and explicit staging allowlisting, actual R2 upload/processing and consent-based private delivery, two-way message arrival and real deployment smoke. Registration/inbox/onboarding, email receipt, direct RLS attack tests and account erasure remain separate gates.
4. **Truthfulness and keyboard gate, this branch.** Landing displayed fictional names, online states and a fixed five-hour expiry without example labels. Label illustrative content and remove pretend activity/expiry. State that the selected district is stored; only precise position is not. Trap keyboard focus inside the mandatory age gate. Correct README's stale Auth0 description. These changes do not establish member density.
5. **Direct message RLS remains unsafe after block.** `20261019_member_read_rls.sql` permits participants to SELECT every message, with no account/block predicate. REST handlers check blocks, but a signed-in member can bypass them through Supabase REST/Realtime. PR #87 adds the restrictive policy and actual PostgreSQL 16 role/grant tests, which passed in hosted CI. The migration remains unapplied; verify with two JWTs and live Realtime on isolated staging before rollout. The backend's broad service-role use remains architectural debt; do not rewrite every route before beta, but do not confuse API checks with proof of RLS enforcement.
6. **Invite-only admission is not enforced in source.** Registration and magic-link provisioning are public. An unlisted link does not make this an invite-only beta. Use a deliberate admission rule and test direct Supabase signup too; do not merely hide the Join button. This requires auth configuration verification before recruitment.

## Every P0/P1 roadmap item reconciled

`FUNCTIONAL BUT NEEDS VERIFICATION` means source exists, not that the live journey passed. A merged issue is not automatically DONE.

| Item | Status | Evidence | Customer impact | Action before beta? |
| --- | --- | --- | --- | --- |
| P0-01 DB restoration | DONE | Production public-community real DB request 200 | Public path no longer unavailable | Keep health smoke |
| P0-02 RLS lockdown | FUNCTIONAL BUT NEEDS VERIFICATION | Revoke migrations; earlier ledger evidence; no fresh SQL query | Avoid anonymous/private data exposure | Verify live grants/policies |
| P0-03 parity | BLOCKED EXTERNALLY | Ledger records production; staging paused per ledger; no management connection | No credible test environment | Yes, restore isolated staging and verify ledger |
| P0-04 environment | PARTIAL | Env keys present; production public DB works; R2 loop not executed | First photo may fail | Yes, actual upload through deletion |
| P0-05 canonical branch | PARTIAL | Exact main deployment confirmed; protection read 403 | Deployment discipline | Owner/admin verify protection; no blind rule changes |
| P0-06 dead code | FUNCTIONAL BUT NEEDS VERIFICATION | No Prisma/schema parallel source or Auth0 runtime package; old modules remain intentionally reachable | Reduced complexity | No broad cleanup |
| P0-07 consolidation | PARTIAL | One visible production project, correct domain; Preview DB 503 | Cannot test changes credibly | Fix Preview environment; defer cosmetic project rename |
| P0-08 Supabase Auth | FUNCTIONAL BUT NEEDS VERIFICATION | Current session uses getUser; identity constraint; prior owner signup evidence | Entry and returning login | Re-run exact beta journey |
| P0-09 Auth0 cleanup | PARTIAL | Runtime gone; no Auth0 Vercel env names; README fixed here; external tenant/CI settings unknown | Avoid stale setup | No return to Auth0; owner inventory external cleanup |
| P0-10 admin simplification | PARTIAL | God Mode, internal TOTP, multiple roles reachable behind server permission/MFA checks | Moderation must remain operable | Prove operator can review/report/ban; simplify later |
| P0-11 code quality | PARTIAL | Exact main hosted CI green; no formatter | Maintainability | Do not block invitations on formatting |
| P0-12 rename | PARTIAL | Visible Intimo; package/project still velora; tokens/storage aliases retained | Naming largely internal | Fix visible mistakes only; keep compatibility |
| P0-13 real smoke | PARTIAL | Production smoke pass; Preview 503; repair #85 | Broken deployments otherwise look green | Yes, passing Preview smoke |
| P1-00 benchmark | NO LONGER REQUIRED | Product/design authority already selected; no fresh hands-on competitor teardown | Not a beta safety dependency | Defer research; not deletion from long-term roadmap |
| P1-01 member RLS | PARTIAL | Own-row SELECT policies and Realtime; messages lack block/account checks; service role across member routes | Direct private-data bypass | Yes, tighten policy and attack-test |
| P1-02 onboarding | FUNCTIONAL BUT NEEDS VERIFICATION | Single/couple DOB/identity/area/photo source; prior owner flow | Activation | Yes, new confirmed account on phone |
| P1-03 Prague areas | FUNCTIONAL BUT NEEDS VERIFICATION | Fixed area catalogue, centroid distance buckets; no GPS field in flow | Coarse geography | Verify privacy settings across surfaces |
| P1-04 presence | FUNCTIONAL BUT NEEDS VERIFICATION | Throttled server touch; hidden presence omitted in serializers | Honest activity | Verify two accounts and activity opt-out |
| P1-05 People | FUNCTIONAL BUT NEEDS VERIFICATION | #77–79 code and mocked UI tests; filters/pagination/state | Discovery | Verify real inventory and visibility/blocks |
| P1-06 private access | PARTIAL | Requests/grants exist; signed-URL revocation gap addressed #83 | Consent and privacy | Yes, approved photo grant/revoke real test |
| P1-07 Plans | FUNCTIONAL BUT NEEDS VERIFICATION | #76 explicit start/end, shared server eligibility | Current intent | Yes, create/read/reply/reject/expire |
| P1-08 interest/visitors | FUNCTIONAL BUT NEEDS VERIFICATION | Durable endpoints; invisible browsing branch | Feedback | Verify interest notification; visitors can wait |
| P1-09 messaging | FUNCTIONAL BUT NEEDS VERIFICATION | Durable send/requests/Realtime hooks; context UI #81 | Core value | Yes, two-way delivery and block/RLS tests |
| P1-10 image messages | PARTIAL | Sender/media/boundary checks; media privacy fix #83 | Additional sensitive data path | Safe to withhold for first 20; if exposed, verify |
| P1-11 return triggers | PARTIAL | Direct Resend sends and preferences; no durable retry outbox; upsert is not atomic throttle claim | Missed or duplicate return emails | In-app feedback before beta; verify a discreet email before expansion |
| P1-12 photo reactions | FUNCTIONAL BUT NEEDS VERIFICATION | Durable reaction endpoint and LikeButton | Secondary engagement | Can wait |
| P1-13 rate limiting | PARTIAL | Postgres RPC with five-minute memory fallback | Abuse across instances | Verify RPC in deployed schema; monitor fallback |
| P1-14 privacy/export/delete | PARTIAL | Controls/export/deactivation exist; erasure bug #84, scheduler unproved; media owner bug #83 | Core privacy promise | Yes, real export/deactivate/erase with fixture |
| P1-15 landing | PARTIAL | Current live clarity; false example signals fixed here | Trust and first impression | Yes, honest labels before recruitment |
| P1-16 navigation | FUNCTIONAL BUT NEEDS VERIFICATION | Actual People/Tonight/Messages/You replaces stale five-tab spec | Wayfinding | Keep approved four-tab design; verify phone/back |
| P1-17 full-loop | PARTIAL | Existing spec broken/stale; #85 repairs; no two-member result | Cannot substantiate launch | Yes, real pass; do not close #31 |
| P1-18 moderation operations | PARTIAL | Admin media/Plan/report queues exist; no operator drill/SLA evidence | Safety response | Yes, name duty owner and prove queue/actions |
| P1-19 desires | FUNCTIONAL BUT NEEDS VERIFICATION | Structured catalogue, consent, state/visibility APIs | Compatibility | Verify persistence/filtering with two accounts |
| P1-20 boundaries | FUNCTIONAL BUT NEEDS VERIFICATION | First-message/media/private-request checks server-side; some preferences deliberately display-only | Member control | Yes, positive and negative request tests |
| P1-21 Scene | FUNCTIONAL BUT NEEDS VERIFICATION | Curated durable endpoint/UI; no real event accuracy audit | Local usefulness | Optional for first 20; publish only verified real listings |
| P1-22 trust | FUNCTIONAL BUT NEEDS VERIFICATION | Derived signals/review code; no independent live review proof | Avoid fabricated verification | Basic review capability yes; sophisticated badges later |
| P1-23 PWA | FUNCTIONAL BUT NEEDS VERIFICATION | Manifest/SW/install surface exists; no fresh install QA | Convenience | Can wait |

## Severity and shortest sequence

### P0: do not invite yet

1. Land and verify media/erasure repairs; tighten direct-message RLS. Prove denial after block/revoke/deactivation with real authenticated requests, including direct Supabase calls. Do not apply untested SQL to production.
2. Restore isolated staging, apply canonical migrations in reviewed order, configure Preview with staging-only credentials/storage and working email/test fixtures. Rerun real Preview smoke; it currently returns 503.
3. Pass the two-member loop and remaining signup/onboarding/export/deletion gates. Record actual responses, current commit, environment and cleanup. Do not treat mocked UI tests as acceptance.
4. Enforce controlled admission at both application and identity-provider boundaries. Prove moderation operator access and responsibility. The open signup endpoint currently contradicts invite-only launch.

### P1: before the first 20–50 members

Phone error/retry/loading/back/refresh/stale-session cases on real data; People activity/privacy and Plan audience/expiry; a real discreet return email and unsubscribe; monitored rate limits; operator report/review drill. Fix raw service-role or privileged access defects found by tests; avoid rewriting functioning paths for style.

### P2: during controlled beta

Hands-on competitor research, visitors detail, reactions, advanced trust/album behavior, image messaging (if withheld cleanly), Scene curation depth, email batching/retry polish, PWA/install polish, God Mode replacement, formatter, internal token renames, cosmetic Vercel rename. None justifies delaying first real conversations once the safety/acceptance gates pass.

## Cut line for the first 20

Required: clear honest entry; controlled adult accounts; profile/area; desires and boundaries; approved non-explicit photo; People/profile/back; simple Plans; text conversation and feedback; explicit private-photo consent if exposed; block/report; settings/export/delete; an available moderator.

Broader launch: reliable notification delivery/retry, complete operational retention evidence, all exposed rich-media/privacy cases, appropriate MFA and simpler sustainable admin roles, abuse monitoring and review capacity.

Safe after beta begins: detailed Activity/visitors, reactions, sophisticated trust, extensive Scene/editorial content, PWA polish, image messaging and advanced album modes when not exposed beforehand. These are proposed scope reductions; existing features are not automatically removed.

## Naming classification

- Customer-visible: Intimo already primary; fix stale instructional README and any observed visible copy.
- Deployment/runtime: retain the verified `velora` project/domain attachment and Supabase identity while blocked on test infrastructure. Rename only after recording IDs, aliases, integrations and rollback; a project label is not a customer blocker.
- Storage/API compatibility: existing `/dating-ads`, storage prefixes and legacy age-key fallback are compatible internals. Do not invalidate them for a grep count.
- Design tokens: `velora-*` Tailwind names are internal; no bulk rename.
- Historical migrations/archives: retain history and contextual Auth0 references. They are not runtime auth.

## Owner/access actions and explicit limits

Supabase installation is now confirmed. Its project/SQL tools have not appeared in this session’s callable registry, so no live database action was possible through it in this audit. Use it to verify production ledger/grants, actual staging state, auth admission settings and an isolated migration run. GitHub administration is needed to inspect/configure branch protection and test environment secrets. External Auth0 tenant removal is an owner task, not a runtime dependency. Retention requires the server-only cron secret and authenticated scheduler; neither execution nor configuration is proved here.

No destructive schema change, project/domain move, real-member content publication, production test-member creation, or production erasure was performed. No two-user success, R2 success, delivery SLA, discovery p95, full mobile matrix or complete production security audit is claimed. Public smoke and local UI tests prove only their stated boundaries.

## Validation of the focused PRs

Hosted CI passed for #83 (`7a72e5c`), #84 (`f30855f`), #85 (`0cd895e`) and #86 (`918e6b9`). #87's Message RLS workflow passed on actual disposable PostgreSQL 16. Preview smoke on #85 failed; separately authorized endpoint inspection confirms the application DB boundary is 503. The first four Preview builds are READY, which does not change that failure. No PR has been merged and no SQL has been applied by this takeover.
