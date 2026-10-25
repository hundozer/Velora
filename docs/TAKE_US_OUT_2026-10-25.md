# Take Us Out: connected invitations

Implemented from main `89bcbbe8c21beedf457608e870a0e8e368ad5c20`, following owner approval on 25 October. Related backlog: #110. This is a first slice, not a new date-confirmation workflow.

## Behavior

Tonight and its composer invite members to describe an evening, who may reply, and required start/end times. Publication opens a dedicated, member-protected invitation with profile/boundaries, existing server-computed eligibility, private reply, reporting and owner end controls. The reply is the existing Plan-tagged private conversation; there is no competing inbox, public pitch list or ranking. Couple profiles act as accounts, never as consent on behalf of another adult. Members agree details privately; there is no attendance or mutual-confirmation claim.

Owners can share their live invitation through the existing photo Story composer. It preloads the title but requires a photo, audience selection/confirmation and participant acknowledgement; Friends remains the default. No automatic publication, media reuse, precise location sharing, payments, new scheduler or paid dependency. The Story's photo stays behind existing review, audience, blocking and 24-hour delivery controls. Opening its invitation rechecks the existing Plans API; ended/blocked/unavailable invitations return no card or reply link. Ending an invitation does not delete a separately published photo Story; the author can remove that Story through existing controls.

## Database and deployment

Additive migration `20261025062004_story_plan_invitations.sql` adds nullable `member_stories.plan_id` with ON DELETE SET NULL and an index. A service-only, security-invoker RPC locks/rechecks ownership and a live non-rejected invitation before atomically publishing and linking a Story. Existing Story RPC remains unchanged. No new table/member grants.

Staging `fuczjjcwtxzzvoxilrme`: official apply succeeded. CLI initially generated `20261025061806`, renamed to actual staging receipt `20261025062004`; exact SQL MD5 `340554efc682460026c9f6a7c83d0fb3` matches ledger. No invented receipts or replay. Independent privilege inspection: anon/member execute both false. Existing two legacy profiles/five media and zero Stories remain after fixture attempts.

Production migration is NOT applied or approved by earlier Story cleanup authorization. Hosted PostgreSQL tests, Preview smoke and authenticated staging HTTP acceptance now pass; concrete production migration approval remains required before merge. Normal Stories reads tolerate the absent new column during rollout; linked publication fails closed until migration exists. Supabase's tool repeatedly returned invalid/expired requestState for staging rollback fixture SQL, including a result-capturing attempt: these are NOT recorded as test passes. Independent counts confirmed no leftovers. Use hosted disposable PostgreSQL assertions for deterministic SQL evidence; retain staging script for actual-role verification when capability recovers.

## Verification

- `npm test`: 253 pass, including linked publication identity/audience/invalid ID/denial behavior.
- Typecheck, lint and production build passed during implementation; final hosted checks must cover the final commit.
- `node scripts/verify-invitations.mjs`: PASS at 390 and 1440 px with synthetic API interception: owner controls, attached photo Story draft, Friends default, disabled publication before acknowledgement, private Plan-tagged reply URL, report control, unavailable denial, no horizontal overflow.
- `tests/sql/story-plan-staging.sql`: rollback-only owner/closed/expired/audience/review/block/delete/ACL assertions; included in existing disposable PostgreSQL story suite in CI. Staging fixture execution remains unverified due tool errors.
- These local checks alone do not prove real email signup or authenticated storage. See the final live staging acceptance below for actual HTTP/storage evidence. Do not claim beta GO from this feature.

Deferred from #110: real member invitation pilot, mutually confirmed dates and outcome measurement. Existing photo review/retention/export/erasure mechanisms remain in use; plan FK cascades to NULL without orphaning media.

## Final staging acceptance

Application tested: `2b36b4c7e6f4ebfb9c3f60b47e6e0bb11755831d`, protected Preview `dpl_6N6RqE25tiQv9nBZ2xrzQxmugx5y` (`velora-dshapdmzk-hundozers-projects.vercel.app`). Later application commit `8748add8151c82e9ed7a34d20b5a2ca30e69ecc0` adds title links only, covered by repeated browser rehearsal; its Preview `dpl_464zLWBYnBmth8QCZgUUSzWvBFE4` is READY.

Acceptance source `c4ebfe1864b8323221ab7566a3ea546426a4a82c`, opt-in one-off Preview build `dpl_FSPTiyaH86H46VSdyMwC5Ck5hPLt`, run `b10d21b9-43af-48a5-80a2-1bc6b354160a`. Uses three synthetic confirmed Auth accounts with actual password login/adult declarations/onboarding, real staging R2 uploads and existing protected Preview OIDC access. No real member outreach, production fixtures or protection changes.

Live HTTP PASS: create invitation; eligible member detail; private Plan-tagged pitch (201); linked photo Story publication; visible invitation ID only through authorized Story listing; synthetic photo approval followed by actual sanitized image proxy; selected/excluded/anonymous denial; view markers; exports; generic media/repurpose bypass denial; block hides invitation and photo; unblock; delete Story; end invitation removes detail; expiry hides photo/ring; actual scheduled expired-photo cleanup.

Logs explicitly returned `invitation_create_detail_private_pitch_story_link_block_end=PASS`, `scheduled_expired_photo_cleanup=PASS`, `real_auth_upload_R2_audiences_review_rings_views_GPS_proxy_block_delete_expiry=PASS`, and `cleanup=PASS accounts=3 storedKeys=4 failures=none`. Storage cleanup deletes/HEAD-verifies original and variant keys; database baseline hashes include profiles, media, Stories/views, invitations and messages. Separate Supabase counts confirmed two legacy profiles/five media preserved; zero Stories/views, synthetic invitations/messages/Auth accounts, temporary Story cron jobs and Vault configurations.

Earlier run `b6abecbe-4120-4c2a-9b4e-ebc863b70d5d` passed journeys but reported cleanup failure from an incorrect test-table name (`messages` vs `direct_messages`), leaving one synthetic pitch. Deleted that exact synthetic message, independently verified zero, corrected the harness and reran fully to the clean PASS above. Initial hosted SQL fixture also omitted the final Plan argument; corrected test, then hosted policy suite passed. None of these failed runs is counted as a clean acceptance pass.

Final application/test head `c4ebfe1864b8323221ab7566a3ea546426a4a82c`: hosted `verify`, `policy` and Preview `smoke` all success. Local 253 tests, typecheck/lint/build; mobile390/desktop1440 invitation rehearsal plus existing Scene-company regression both pass. The raw Supabase SQL fixture tool remains unreliable; deterministic actual-role SQL assertions passed hosted PostgreSQL instead. This proves a synthetic authenticated HTTP journey, not human recruitment, manual photo moderation, email registration or mutually agreed/attended dates.
