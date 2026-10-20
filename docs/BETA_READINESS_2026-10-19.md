# Prague beta decision: NO-GO; staging member journey exercised

Current evidence: 20 October 2026. Authoritative main, freshly fetched: `1eda06588dc4ed5166db43c445f08f3de23a5e05` (merged #92; includes #83–91). The sections below date earlier deployments and evidence explicitly. The owner-approved production message-read migration is now applied and verified after dashboard fallback. Earlier connector failures caused no change. The historical audit below is retained for context; this section supersedes older blocked/pending observations.

## Production ledger repair completed

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

See `LEGACY_BOOTSTRAP_LEDGER_REPAIR.md` for source, rollback-only staging rehearsal and the exact bounded transaction. Beta remains **NO-GO**: controlled admission, moderator operator drill, scheduled retention/physical erasure, discreet return email/unsubscribe, disabled leaked-password protection and the earlier intermittent profile-edit failure remain unresolved or unproven. This repair and public smoke do not re-prove the prior authenticated staging journey.

## Post-merge verification: #91 and #92 (before ledger repair)

20 October2026: authoritative main `1eda06588dc4ed5166db43c445f08f3de23a5e05` includes merged #91/#92. Production `intimo.live` resolves to READY `dpl_ejmCK9nHr58PMeoAjB6TXmJXFRNs` at that SHA; hosted CI verify passed. Fresh public Playwright smoke passed1/1 (51.0-second test,51.6-second total): `E2E_BASE_URL=https://intimo.live E2E_HTTP_PROXY="$HTTPS_PROXY" npx playwright test --config=playwright.smoke.config.ts --trace=off`. No member credentials/fixtures; signed age-cookie POST is the only application POST. The goodbye response contains corrected request-accepted/deactivation wording and neither unsupported permanent-erasure nor no-backups claim. This is HTTP evidence, not a new authenticated deletion journey.

The production Supabase integration check118783303593 **failed**: `Remote migration versions not found in local migrations directory.` Read-only comparison identifies exactly one unmatched receipt: `20260922033815`, `001_initial_schema`, the documented pre-canonical bootstrap. Its stored SQL is8949bytes, MD5 `09afadcde71d6378ece68b69ac5811b4`. All35 repository migration versions are present. Do not replay legacy SQL or invent applied history.

Production safety remains installed: canonical20261104 source MD5 `1cd73751c6f9ce761e65999956296e0b`; helper definition MD5 `b5410de5cebab3460e5fe0566ca59367`; restrictive member_message_safety SELECT remains alongside the permissive participant policy. No production DB write was performed during this verification.

A separate guarded proposal archives the full old receipt privately and removes only its obsolete active-ledger entry. See `LEGACY_BOOTSTRAP_LEDGER_REPAIR.md` and `docs/sql/archive-legacy-bootstrap-receipt.sql`. The staging rehearsal passed with an explicitly synthetic receipt/hash substitution and rolled back; independent queries confirm unchanged ledger/profile/media hashes and no test receipt/archive table. This is not byte-identical production execution. At that checkpoint production repair was unapplied and required explicit approval. The completion section above supersedes that pending state; the operational beta gates remain.

## PR #91 protected smoke repair verified

20 October12:37UTC checkpoint: #91 head `0932a5b277a4873569bd8af767402bf39e7e950f` was open, non-draft and conflict-free. CI verify and Vercel deployment passed; no unresolved review threads. Hosted smoke job118628759186/run39423101013 failed before reaching Intimo because its unauthenticated request followed Vercel's login redirect. Branch-protection configuration was unreadable through the integration (403); the browser later showed the normal Merge pull request control enabled. No branch protection was weakened.

The repair sends a masked short-lived GitHub OIDC token, guards the destination origin, refuses redirects on every request and disables credential-bearing traces. All original application assertions remain. Aggregate timeout120seconds matches prior measured full-smoke evidence; smoke's Node runtime22 matches locked dependencies. Local source checks passed: `npm test`199/199, `npm run typecheck`, `npm run lint`, workflow YAML parse and `git diff --check`.

After explicit owner approval and approved browser fallback, Vercel project's Preview-only external trust rule was installed and read back. Final conditions: issuer `https://token.actions.githubusercontent.com`; audience `https://github.com/hundozer`; repository `hundozer/Velora`; immutable repository_id `1321270415`; workflow `Preview smoke`; event_name accepted values `deployment_status, workflow_dispatch`; target environment Preview only. Existing project self-access and Vercel Standard Protection/Require Log In remain enabled. No production/custom-environment access or static bypass secret was added.

Three early authenticated attempts exposed identity-shape assumptions. Current GitHub subjects include immutable account/repository suffixes. Manual workflow_ref uses a branch ref, while the actual deployment-status run used `preview-smoke.yml@<deployment SHA>`. The initial extra subject condition and branch-only workflow_ref condition were therefore unsuitable. Final trust matches the approved smoke workflow's YAML name and its two event types, with immutable repository identity and Preview-only scope retained. The earlier inference that automatic events still used main's old workflow was incorrect: actual run steps proved that the repaired workflow ran. No claim is made that workflow_ref prefix/wildcard matching is supported.

**Actual protected HTTP smoke passed**, with no member credentials or database fixtures:
- Explicit dispatch run39425483193 attempt2/job118637668572: test source `d785b9470d0c9885c14c07050cce70c1761c68bf`, 1/1 in5.5seconds against fixed independently inspected READY Preview `dpl_F6DXmS1nPkk2cvK5nmy4ZEaiLzxT` / `https://velora-ahvf1vem6-hundozers-projects.vercel.app` (app `5689ff6e739cd26ccb294901451aa826da8042c6`).
- Explicit dispatch run39426023800/job118638684993: final test source `eaff76eed296f91e47586a4be931f2c757484909`, 1/1 in1.9seconds against the same fixed app. Later source changes only added safe diagnostics/documentation.
- **Automatic deployment-status run39426104682 attempt2/job118640378102: SUCCESS**, 1/1 in2.9seconds at12:59UTC. Both workflow/test source and deployed app were `eaff76eed296f91e47586a4be931f2c757484909`; target `dpl_7beDENWBVMHP943xYvdZHuFF38Zo` / `https://velora-5sjt8o47y-hundozers-projects.vercel.app`, independently confirmed READY Preview. CI verify also passed for that SHA.

Homepage/community200, real public database response with no demo inventory, anonymous member/admin401 and signed age-cookie POST remained asserted. Successful runs did not upload trace artifacts. Diagnostics logged only allowlisted non-secret identity claims and redirect host/path, never the token or URL query. This is public HTTP smoke, separate from earlier two-member acceptance and production smoke. Subsequent documentation-only head checks are recorded on the PR. Beta remains NO-GO for remaining operational gates.

## 20 October signup and confirmation-origin recovery

Current application main: `467b4d327d28f5b18dd55ba5ccd12337f17d6486` (merged #90). Production at this commit passed the full public Playwright smoke after merge (1/1,45.5-second total,120-second aggregate budget, all assertions retained); the production canonical ledger/helper/restrictive policy were rechecked unchanged.

The owner first registered `registration@intimo.live` on production. Owner reported email receipt; read-only Auth evidence shows creation20October11:54:49UTC and confirmation/sign-in11:55:15UTC. This is owner-assisted production signup/confirmation evidence, not an isolated staging test. No profile exists for that address in production; the owner's production account is deliberately untouched. No destructive production acceptance or cleanup was authorized/performed.

The owner then registered the same address on staging: created12:01:57UTC. After the corrected resend, the owner reported success; an independent Auth query confirmed email_confirmed_at and last_sign_in_at are set. The owner subsequently completed onboarding; a real staging profile now exists. A reported404 was traced to the confirmation link's old `velora-git-codex-intimo-secure-mvp-hundozers-projects.vercel.app` host. The current staging `/verify-email` page renders correctly in a browser. The original generic own-Vercel-host configuration probe was insufficient: an old Preview host passed it. Raw HTML also contains the fallback404 component in Next's serialized data; checking for that text alone does not prove a rendered404. No route/code defect is claimed from that check.

**Configuration fixed:** Preview-only `NEXT_PUBLIC_APP_URL` entry `SvAUBtZiGppy6ao2` was explicitly set empty, using the existing `appOrigin(req)` request-origin fallback. Production's separate entry was not edited. No key value was retrieved, no authentication implementation changed, and Vercel protection stayed enabled. Document this distinction in `.env.example`; do not pin auth links to an old branch URL.

New staging Preview `dpl_HDdnSNmPV5vqC8JfGo5H8YNJf6fc`, `https://velora-5yu0yd4pb-hundozers-projects.vercel.app`, is READY at main `467b4d3`. Its one-off build asserted an empty canonical override and the expected staging Supabase project `fuczjjcwtxzzvoxilrme`, then completed the normal application build. Log: `STAGING_AUTH_ORIGIN request fallback PASS`. Earlier inspection-only Preview builds `dpl_6wTELv8vwN6QrNejfCe4QjLGFZgr` and `dpl_6LsYttw38vB6r28wnastvqL5LkDU` created no accounts themselves.

Actual browser resend from the new Preview's `/verify-email` page to the owner-designated test address succeeded: UI showed **Sent. The newest link is the one that works.** The resend uses the product's existing magic-link confirmation path. Provider acceptance is not proof of inbox arrival or link completion. The owner subsequently reported the corrected link worked. Independent staging SQL confirmed the exact test address is email-confirmed and has signed in; a subsequent query after owner-completed onboarding confirms a profile exists, account/lifecycle ACTIVE, Supabase identity alignment valid, and discovery/messaging enabled. This closes the assisted signup → inbox confirmation → sign-in → onboarding/profile-creation journey. The owner supplied a bearer confirmation link in chat during diagnosis; it was never opened, repeated, consumed or stored in this report. No token is needed in chat for continuation.

Current staging checkpoint after assisted self-service deletion: Auth users0; the test profile was initially DEACTIVATED with a recorded privacy request, demonstrating identity removal and deactivation rather than permanent erasure. Media/messages/Plans owned by this fixture were all0. The goodbye screen still claimed “Account Permanently Erased” and no backups remaining; these claims are unsupported. Settings also redirected to goodbye after failed deletion requests. Focused [PR #92](https://github.com/hundozer/Velora/pull/92), head `1d40ec51bd97daf93c6b9a7e5d818834ba8e5774`, corrects acceptance-before-logout behavior, provides failure/pending feedback and replaces unsupported permanent-erasure claims. On that branch, `npm test` passed198/198, `npm run typecheck` and `npm run lint` passed. `npm run build` passed with the same non-secret CI Supabase placeholders; this is a source build, not a deployed member-journey result. New component regressions execute the actual Settings handlers with isolated dependencies for HTTP503/network failures, pending-state suppression and a successful retry. Local browser attempts first hit the browser process-singleton restriction (headless shell launched successfully), then separate-process localhost isolation, then Settings' expected server-side login guard when client mocks were used in one process environment. These attempts do not establish deployed UI behavior; no authentication bypass was added.

The fixture was then removed in a guarded staging-only transaction, distinct from the product's scheduled retention worker. Preconditions required the exact known test identity/email, DEACTIVATED status/lifecycle, no remaining Auth identity, no unexpected dependent records, and the previously measured legacy baseline. Only its two audit events and profile were explicitly deleted; its privacy request/consents followed existing cascades. A postcondition inside the transaction and a separate read afterward confirmed Auth0/profiles2/media5/messages0/Plans0/mappings2 and no fixture profile, privacy request, audit events or consents. Full-row ordered JSON hashes for the two legacy profiles and five media records were unchanged; legacy mapping hash also unchanged. No uploaded media belonged to this manual fixture; no object-store deletion or fresh R2 inventory was performed in this cleanup. The earlier complete eight-object R2 inventory proof remains separately dated. No production account or data was modified.

**Decision remains NO-GO.** The assisted staging signup → inbox confirmation → sign-in → onboarding → self-service identity removal/deactivation journey and separate fixture cleanup are complete. This does not prove scheduled physical erasure, controlled admission, moderator operation, the prior intermittent profile-edit failure or remediation of disabled leaked-password protection. The deletion confirmation wording/error-handling fix in PR #92 is pending review; it is not yet part of the deployed main.

## Environments and isolation

- Vercel project `velora`, `prj_hZBTijIxLYZCQr2ePituCyOqk7og`, team `team_39Gwdv5nH2S8oUWtobZe6UqV`. No project rename. Protection remains enabled (`all_except_custom_domains`). Authorized temporary share access establishes an origin-scoped cookie; no protection header is forwarded to storage.
- Production deployment `dpl_GDAAJj42WEomuYqiVqnd8NjTENp4` is READY at main `0ffcb84`; 20 October `/api/public/community?limit=1` returned 200 and `demoContentPresent:false`. The connector classified the member endpoint401 as protection failure, so it is not counted as a fresh application denial check.
- Actual member target: READY Preview `dpl_9DmMQm5SMqNGAWXrAcpurcEdAWiU`, `https://velora-4oex8kgh9-hundozers-projects.vercel.app`, app commit `0ffcb84b1be72f05d7725b941126a02a0d121235`. Vercel API calls this Preview target `staging`. The opt-in build runs a test harness against this fixed, independently inspected deployment, then builds the app normally.
- Staging Supabase `fuczjjcwtxzzvoxilrme`; production `bkdyjdbmtucqvgebqadp`. Preview's staging service-role entry is separate from production. Keys were used inside the guarded Preview build, never retrieved or printed.
- Owner identified R2 staging bucket `intimo-staging-media`, account `e9dfc810ae6979dcf5599cedc3e3baf0`. Preview now has separate bucket/access-key/secret entries; production values were preserved. Owner created a bucket-scoped Object Read & Write account token. A real upload/head/read-back/delete/head-404 probe passed (`dpl_AUz7qKPwm7pSfU8tcgJzXrsg8jKf`). The production bucket name remains opaque; no claim is made that its value was independently read.
- Staging storage contains **eight pre-existing objects**, dated August and 17 October. They are preserved, not test leftovers to delete. Cleanup compares the entire before/after key/size/ETag/modification inventory.
- Protected partial HTTP smoke on `dpl_HveRMM7QLtJ1ze3GVFbWZYhHNd6r` at main `0ffcb84`: home200, public-community200 with empty public inventory and `demoContentPresent:false`; profile/discovery/messages/admin401 anonymously. This closes the earlier application503. This GET evidence is separate from a complete Playwright smoke including age-cookie POST.

No repository/workspace-parent `AGENTS.md` was present. Read current readiness, migrations, `supabase/APPLIED.md`, `e2e/README.md`, package/build settings and deployment workflows before editing.

## Evidence levels

| Level | Directly established |
| --- | --- |
| Implemented code | Merged #83–89 on main; #90 adds guarded opt-in acceptance, protected access helper and failure/cleanup reporting |
| Staging migrations | Prague tables/dependencies and canonical `20261104` installed; compatibility/superseded history explicitly reconciled below |
| Automated source checks | `npm test`:196/196, no skips; `npm run typecheck` and `npm run lint`:pass, freshly repeated 20 October; hosted app build passed in `dpl_CUFb87gF48FpvfvpAJpGWteARJWH` |
| Actual SQL roles | Rollback-only `tests/sql/staging-message-rls.sql` passed on Supabase using real anon/authenticated roles with simulated claims |
| Live member journey | Existing #85 unmocked browser/API suite passed; extra phone-sized onboarding, profile sheet, Plan eligibility, EXIF privacy, JWT REST/Realtime, report/export/self-deletion exercised below |
| Production migration | **Applied and verified** through approved dashboard fallback; canonical ledger/hash and effective function/policy match staging |

SQL-role evidence: both participants read before a block; either block direction denies both; inactive viewer/peer, unrelated/null identity and anonymous reads deny; unauthorized direct profile/message/desire writes and privileged block RPC deny. A deliberately broad permissive policy cannot bypass the restrictive predicate. Everything rolled back. All 47 public tables have RLS, anon SELECT only areas, authenticated no direct table writes, service role SELECT all 47. Effective columns/constraints/RLS match production except this staged policy/helper; rate-limit function differs only in a comment. Final media statuses and identity constraint are listed below.

## Live two-member acceptance

Synthetic adult accounts were provisioned with confirmed email through Auth admin. **Registration and email/inbox confirmation were not tested.** These are not beta members. Real credentials were used against the isolated deployed application; no backend mocks. Traces disabled; temporary secrets/passwords never logged.

- Both members: actual login and onboarding at 390×844, profile creation201 and profile editing200. People opens the other profile sheet and Back to People closes it.
- #85 full-loop: desires/boundaries, People/profile, interest/in-app notice, timed Plan, actual R2 upload/completion/variants/owner delivery, private-photo denial/grant/revoke, two-way UI message arrival and blocking/profile denial.
- Extra Plans: missing required times400; eligible reply201 with canReply true; age-ineligible reply403 with canReply false.
- Generated private image contained synthetic EXIF/GPS. Actual application delivery strips EXIF. Grant/revoke and post-deletion owner/peer denial checked.
- Real member JWTs: direct Supabase REST reads succeed before block and return no messages after either block direction; inactive participant denies both.
- Raw Realtime: both member subscriptions first receive an allowed service-inserted synthetic probe. Neither receives a blocked probe during a **four-second observation window in each direction**. This is bounded live evidence, not an unlimited delivery guarantee.
- Report201, privacy export200, self-service deletion200, subsequent profile401, deleted-owner media denial and direct peer message denial. Self-service deactivation/Auth deletion does not prove scheduled physical retention/erasure.

Earlier complete run `dpl_CUFb87gF48FpvfvpAJpGWteARJWH`, harness `72e73871bf27d9194662c936fd2f1a38a8073f65`: full-loop 56.9s, extra checks/cleanup/app build passed (before raw Realtime probes were added). Detailed run `dpl_CHJZs7HHmHG3qZgbGMQdPh42LqWk`, harness `dfa6dc1e3a32c983f8cc5062812ec0b0d7f68585`: full-loop 57.5s and all of the above REST/Realtime/deletion checks passed; its final storage audit failed because of a test-side sharp resize overload. Accounts/database cleanup independently verified.

Final repeat **passed acceptance and cleanup** on 20 October: `dpl_5ymbA83Z4cunBkaKtCcufNGKsgDz`, harness `06a5460880a229fe6d0be6900204f91d7cd44305`, fixed main app target above. Full-loop passed in 1.1 minutes; all extra onboarding/People/EXIF/Plans/REST/Realtime/report/export/deletion checks passed. Full storage inventory exactly matched its eight-object baseline. Independently queried Supabase afterward: Auth users0, profiles2 (both restricted/private legacy), media5, messages0, Plans0, blocks0, private grants0, synthetic profiles/Auth/reports0. No leftover test accounts, profiles, messages, Plans or uploads. Two branch-only temporary acceptance access values were cleared after completion (entries remain blank; real staging credentials unchanged). The normal application build also completed successfully; deployment READY was rechecked. The earlier intermittent failures remain unresolved observations; this repeat is not proof of their cause or cure.

## Production rollout completed

20 October 2026, approximately 06:30 UTC (08:30 Prague): after explicit migration approval and explicit permission for dashboard fallback, the guarded transaction was executed through the production Supabase SQL editor. The entered transaction was copied back and matched byte-for-byte before Run. It executed the canonical schema SQL plus canonical bookkeeping atomically. Canonical ledger `20261104`, name `block_aware_message_reads`, contains one statement with exact source MD5 `1cd73751c6f9ce761e65999956296e0b`; no management-wrapper receipt was generated or invented. The two earlier expired-request-state attempts had been checked and caused no change.

Independent read-only `execute_sql` verification: production and staging helper definitions share MD5 `b5410de5cebab3460e5fe0566ca59367`; owner postgres, STABLE SECURITY DEFINER, empty search_path, ACL only postgres/authenticated/service_role (no PUBLIC or anon). Authenticated helper execution true; anon false. RLS remains enabled; `member_message_safety` is RESTRICTIVE SELECT for authenticated alongside the original permissive participant policy. Authenticated table grant remains SELECT only; anon has no table grants. Production counts remain profiles1/Auth1/media4/messages0. No production acceptance fixtures or member-data writes were used. Supabase is ACTIVE_HEALTHY; Vercel production `dpl_GDAAJj42WEomuYqiVqnd8NjTENp4` remains READY at app main `0ffcb84b1be72f05d7725b941126a02a0d121235`.

Fresh HTTP checks: homepage200 with Intimo content, public-community200 with `demoContentPresent:false`, profile/discovery/messages/admin401 anonymously. Individual parallel curl checks took about6.7–6.8seconds. The full Playwright smoke's initial45-second aggregate budget expired; a120-second-budget repeat retains all assertions, including the signed age cookie. Repeat passed: **1/1**, 43.9-second test /44.6-second total. Command: `E2E_BASE_URL=https://intimo.live E2E_HTTP_PROXY="$HTTPS_PROXY" npx playwright test --config=playwright.smoke.config.ts --trace=off --timeout=120000`. All original assertions retained; no member credentials, account creation or destructive data test.

Security advisor after application:32 INFO for intentionally server-only RLS tables without policies, one WARN for deliberate authenticated execution of the uid-guarded security-definer helper, and one WARN for disabled Auth leaked-password protection. The latter is recorded for separate Auth review; no unrelated Auth setting was changed. See [password-protection remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) and [helper advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Beta remains NO-GO pending operational gates; this schema rollout does not prove signup/email, admission, moderator operation, scheduled erasure or resolution of the earlier intermittent profile-edit failure.

## Earlier production connector attempts (superseded)

20 October 2026 production attempt: owner explicitly approved only canonical `20261104_block_aware_message_reads.sql`. Source on authoritative main `0ffcb84b1be72f05d7725b941126a02a0d121235` still matches SHA-256 `cc428966e904b3116dc31153fb492e0c28561c92b7ee4927f8838e911f88201b`. Two `apply_migration` calls returned `Invalid or expired requestState`; after each, `execute_sql` independently confirmed no canonical/wrapper ledger receipt, no helper and no restrictive policy. No third unchanged retry. Production remains at profiles1/Auth1/media4/messages0, original participant policy and authenticated SELECT-only grant; no member fixture or member-data write occurred. Vercel production `dpl_GDAAJj42WEomuYqiVqnd8NjTENp4` remains READY at main `0ffcb84`. Migration approval is granted; execution is blocked by the connector. No Supabase CLI is installed. Dashboard SQL editor is the prepared fallback, pending permission to use Browser after repeated connector failure.

## Failed attempts and test repairs

Standard Chromium could not launch on Vercel's builder (missing libnspr/libnss); serverless Chromium141.0.0 works, installed under `/tmp` so application locked dependencies remain intact. One earlier successful acceptance was followed by app-build failure because an in-repository no-save install pruned dev dependencies; the isolated-prefix approach fixed that.

One repeat (`dpl_FcAvjVetLwXiyn92bTKwtdR4GX4s`) failed around 25s and its finally assertion masked the primary error. The original cause cannot be reconstructed; subsequent passes do not diagnose it. The suite now preserves original and named cleanup failures and writes an upload manifest for outer cleanup. A later storage checker incorrectly required an empty bucket and found eight historical objects; none were deleted. The unnecessary recovery script was removed. Final runner compares baseline inventory instead.

A 20 October deployment by raw SHA (`dpl_7DVyeZXP49TD7fHYVUDicrwE24Dx`) failed its target guard before fixture creation because branch-scoped settings were absent. Retry uses the named branch and verifies resolved SHA. The 19 October final-run attempt was not executed because automatic approval review hit its usage limit; no pass was inferred.

20 October baseline-aware run `dpl_8JH7ePdGbGGLrhaY2kZbAm3K1vxM` at `78912059601972163cf25acbfc01d0680bdf0e0f` timed out after 30s in member B's profile-edit PUT. Member A completed onboarding/edit. Its full storage inventory comparison passed (eight old objects unchanged), fixture cleanup passed, and independent SQL confirmed Auth 0/profiles 2/media 5/messages 0/Plans 0. Runtime-log lookup for the target and route returned no records; cause remains unresolved. Playwright included request cookies in its call-log error; all synthetic sessions were removed with the accounts. Error reporting now retains only first-line reasons and excludes original request error objects/headers. No service-role or R2 key was printed. A sanitized repeat is recorded separately below.

Commands: `npm test`; `npm run typecheck`; `npm run lint`; `node --check scripts/run-staging-acceptance.mjs`; actual Supabase rollback SQL via `execute_sql`; optional build override documented in `e2e/README.md` (serverless browser install, guarded runner, `npm run build`). No default application build/CI fixture execution, public diagnostic endpoint or production acceptance fixtures added.

## Remaining gates and production decision

1. Review/merge focused [PR #90](https://github.com/hundozer/Velora/pull/90), including final cleanup evidence. Acceptance's unexplained earlier failure remains disclosed.
2. **Production message-read migration closed:** approved `20261104` was applied and independently verified; see the rollout evidence below and `PRODUCTION_MESSAGE_RLS_ROLLOUT.md`. No additional migration or production fixture was run.
3. Real signup/inbox confirmation, discreet email delivery/unsubscribe, controlled admission at both app/Auth boundaries, moderator operator drill and scheduled retention/physical erasure remain unproved. No beta invitation/launch readiness claim until these have evidence. Full production Playwright public smoke subsequently passed with all assertions; see production rollout evidence.

Security advisor findings:32 INFO for RLS with no policies on server-only tables, one WARN for deliberately authenticated-executable SECURITY DEFINER safety helper. Empty search path, participant guard, no anon/PUBLIC execute and unrelated-caller denial verified; do not remove authenticated execution just to silence the warning.

## Migration reconciliation and preservation

1. `20260805` previously recorded a verified no-op explanation, not canonical SQL execution. Its guard would return because restored `profiles.account_status` already exists. Keep this distinction; do not advertise exact replay.
2. `20260811` was replayed with an expanded intermediate media-status constraint to preserve five existing `PENDING_REVIEW` rows. Canonical `20260814`/`20260821` subsequently installed the final constraint. Current validated values are exactly `PENDING_REVIEW, UNDER_REVIEW, APPROVED, REJECTED, HIDDEN, REMOVED`; processing values are `UPLOADING, PROCESSING, READY, FAILED, REJECTED`. This is a documented compatibility replay, not a byte-identical `20260811`.
3. `20260818` was never separately replayed. Its earlier ledger row contained only a skip explanation. That evidence is now in `intimo_migration_audit.superseded_migrations`; the misleading applied row was removed. The `20260820` blocking function is present, service-role-only and removes both connections and friendships. Do not replay the older definition over it or invent an applied history.
4. One restored advert had category `Man seeking woman`, incompatible with canonical Plan categories. Its complete pre-migration JSON is preserved in `intimo_migration_audit.legacy_dating_ads` before removal from the active table. It belongs to a quarantined legacy identity and was not converted into a fabricated new Plan. No profile, identity mapping or media record was deleted. Canonical Plan constraints are validated.
5. `profiles_auth_id_matches_id` is validated (`auth_id = id::text`). Restricted legacy mappings retain their original identities in the private audit schema. No anon/authenticated table grants exist in that schema.
6. The new `20261104` function/policy were executed correctly. A string-escaping error affected only the newly recorded statement text; that ledger text was corrected to the exact executed repository SQL and its MD5 rechecked as `1cd73751c6f9ce761e65999956296e0b`. It was not a schema retry or invented execution.


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
