# Mutual-interest and private-photo return alerts

Base main: `d567846a07e4eee04d9db5bde771340114b78067` (merged #105). Scope: existing INTEREST/PRIVATE_ACCESS categories on the durable message-email queue. No new channels, paid provider, historical backfill or public activity feed.

## Behavior

New server-only database transactions save the interaction, in-app notification and queued email together. One-sided interest still creates an in-app notification; mutual interest queues both members. A private-photo request queues its owner, an approval queues the viewer. Denial and revocation remain silent. Repeated signals/requests/grants do not create duplicate notices or extend an active once-only grant.

Reference rows link pending jobs to a specific in-app notice and the current interaction. Reading/removing a notice, withdrawing interest, answering a request, revoking access, expiry, either block direction, inactive/demo identities or current opt-out suppress sending. Existing queue behavior retains the two-minute delay, ten-minute activity deferral, three-hour category throttle, leased claims, exact retry payload, provider idempotency and bounded retries. Terminal jobs clear relationship references and provider payloads. No names, photos, messages or private storage links appear in email; Preview links stay on Preview. Private-photo emails open Notifications, which links to the relevant request/profile.

Existing Settings and signed category/global unsubscribe remain authoritative. Labels now accurately say Mutual interest and Private photo requests and approvals. No direct provider send remains in the interaction routes.

Eligibility is checked at claim and immediately before dispatch. A generic update already handed to the provider cannot be recalled if a member reads a notice or revokes access while the network request is in flight; the email itself grants no access and contains no private evidence.

## Migration and rollout

CLI generated `20261024153700_durable_interest_access_alerts.sql`. Apply after canonical interests, private-access and durable-unread migrations, despite historical filename ordering. It extends the outbox category check, adds server-only reference rows and RPCs, and delegates social eligibility from the existing worker. Installation alone creates no new alerts: old application writes remain on their old path until the new API starts using the transactional RPCs. No scheduler, secret, deployment protection or production worker setting is changed by this migration.

Staging applied through the migration tool as receipt `20261024155242`, name `durable_interest_access_alerts`. Source filename retains CLI version `20261024153700`; no ledger history was inserted or edited. Applied raw SQL MD5: `ddff6a880355a1b1a888823b0baf8e6d`. One repository header comment was then corrected to say schema first, matching the final transactional RPC design; executable SQL is unchanged. Current source raw MD5: `771edca4f99bf30ee38fd2929415a06c`. SQL normalized by removing comment lines/collapsing whitespace matches exactly on both sides: `278e51675118a44625e5e757fb0264b7`. No compatibility SQL or schema adjustment was needed.

Production application requires explicit approval after staging evidence. Do not merge/deploy new RPC callers into production before the schema dependency is installed. Keep the existing minute worker; do not create another scheduler or blindly replay the migration. On an ambiguous migration response, inspect ledger and objects before retrying.

## Verification

Local: 237 tests, TypeScript, lint and production build passed. New worker/template/unsubscribe behavior tests use synthetic responses, not inbox-delivery evidence.

`tests/sql/social-return-email-disposable.sql` loads the real old queue core and new migration in disposable PostgreSQL. Hosted PostgreSQL and actual staging `tests/sql/social-return-email-staging.sql` passed: service/anonymous/member privileges, mutual recipients, repeat suppression, live source/read state, both blocks, inactivity, expiry/revocation/denial, category/global opt-out, prepare-time checks, retry stability, acknowledgement cleanup, throttling and existing message behavior. Independent staging counts after rollback: zero fixture profiles, outbox jobs or reference rows, and zero active staging worker jobs. Initial head `8e7471965700d8329d5675ceeaefe3004aa42077` passed CI, Message RLS (including social SQL) and protected Preview smoke.

## Live staging acceptance, 24 October

Application Preview: `https://velora-9322qudhj-hundozers-projects.vercel.app`, deployment `dpl_hfWBwfeUCDbmXYEPEW2c3EqgFRU7`, application commit `bd2dc1c01c4877e5234879cd70965c060c8379c8`. One-off acceptance deployment `dpl_8NPyPSjqkixMKdKvAq4NESZ392y2` at `de07491cf901eab9e0388d271e0f337e406bf0e0` completed READY. Its deployment-only build command was:

```sh
INTIMO_SOCIAL_ACCEPT_BASE=https://velora-9322qudhj-hundozers-projects.vercel.app node scripts/run-staging-social-alerts.mjs && npm run build
```

Project `velora` / `prj_hZBTijIxLYZCQr2ePituCyOqk7og`, team `team_39Gwdv5nH2S8oUWtobZe6UqV`; target Preview, never Production. The runner refuses any database except `fuczjjcwtxzzvoxilrme` and any target except an immutable project Preview hostname. Preview-only worker enablement is scoped to `codex/durable-interest-access-alerts`. Same-project short-lived Vercel OIDC accessed the protected application; protection remained enabled, and no credentials were printed or committed.

Run `b3679ac0-794f-4a5a-b609-6feb673d7268` created two isolated confirmed Auth fixtures, signed in with real passwords/cookies, passed the signed adult gate and onboarded through the actual application. This is real authenticated HTTP acceptance, not a full browser journey or a fresh confirmation-email registration test. A opted out globally, ensuring its non-deliverable synthetic address was never emailed. B used the previously owner-selected inbox `registration@intimo.live`; no existing staging identity was reused.

Proven through actual application APIs, database queue, minute cron and Resend:

- One-sided and repeated interest queued no email. Simultaneous opposite interest requests both returned 201 and queued each match recipient once.
- Scheduled mutual-interest delivery obtained provider receipt `01a16ea6-bc7a-777b-8590-ba7d32bb5509`. Two concurrent repeat worker calls accepted zero more jobs.
- Private-photo request returned 201; repeating it returned 409. Request email was accepted once. Reverse request and approval returned 201/200; repeating the same once-only grant preserved expiry and one in-app approval notice.
- In-app request and approval links pointed to incoming requests and the correct owner profile. Immediate approval-email delivery was throttled; advancing only the fixture category's send-state timestamp then allowed one approval email.
- Marking notices read and revoking approval before dispatch each prevented email.
- Signed INTEREST/PRIVATE_ACCESS GET confirmed intent without changing preferences. Signed category POST and global POST suppressed subsequent actual match/approval events. Authenticated preference reset also passed.
- Exactly three SENT rows with provider IDs existed for B: mutual interest, request, approval. Terminal payloads were null and terminal relationship references removed. Provider acceptance is not inbox-delivery proof; the three arrivals remain owner-unconfirmed.

Only synthetic activity/due/throttle timestamps were advanced; this does not measure the normal two-minute settling period, ten-minute activity threshold or three-hour real elapsed cooldown. Provider-failure recovery and role denials are covered by behavior tests and actual SQL, not a simulated live provider outage. No photo upload, message, Plan or physical-erasure journey was introduced into this test.

The temporary cron/Vault configuration expired within fifteen minutes and was removed after scheduler verification, with finally cleanup as a second guard. Cleanup passed for both Auth accounts, profiles, interests, private grants, notices, queue/send-state/reference rows, fixture audit records and member-specific rate keys. In-run full profile/media fingerprints exactly matched their pre-test baseline. Independent SQL then confirmed Auth fixtures0, fixture profiles0, profiles2, media5, interests0, grants0, notices0, outbox0, references0, send-state0, cron0 and Vault config0. Existing shared IP rate-limit buckets were not cleared.

At `de07491cf901eab9e0388d271e0f337e406bf0e0`: CI run `40109629352`, PostgreSQL/Message RLS run `40109629317` and protected Preview smoke runs `40109684828` / `40109880020` all passed. One-off build settings did not change the project's normal build command.

## Production decision

Read-only verification: new migration absent, reference table absent, required source tables/queue present, queue categories still MESSAGE/PLAN_REPLY, existing unread worker active. No production data, schema, worker flag, scheduler or secret was changed. Request explicit approval for this exact additive migration, install and verify its ledger/objects/privileges, then merge/deploy the new RPC callers. Existing old writes remain compatible until deployment. This proves the social-alert slice on staging; it does not change the overall Prague beta decision or prove the separate full member/physical-erasure journeys.
