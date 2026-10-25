# Take Us Out: connected invitations

Implemented from main `89bcbbe8c21beedf457608e870a0e8e368ad5c20`, following owner approval on 25 October. Related backlog: #110. This is a first slice, not a new date-confirmation workflow.

## Behavior

Tonight and its composer invite members to describe an evening, who may reply, and required start/end times. Publication opens a dedicated, member-protected invitation with profile/boundaries, existing server-computed eligibility, private reply, reporting and owner end controls. The reply is the existing Plan-tagged private conversation; there is no competing inbox, public pitch list or ranking. Couple profiles act as accounts, never as consent on behalf of another adult. Members agree details privately; there is no attendance or mutual-confirmation claim.

Owners can share their live invitation through the existing photo Story composer. It preloads the title but requires a photo, audience selection/confirmation and participant acknowledgement; Friends remains the default. No automatic publication, media reuse, precise location sharing, payments, new scheduler or paid dependency. The Story's photo stays behind existing review, audience, blocking and 24-hour delivery controls. Opening its invitation rechecks the existing Plans API; ended/blocked/unavailable invitations return no card or reply link. Ending an invitation does not delete a separately published photo Story; the author can remove that Story through existing controls.

## Database and deployment

Additive migration `20261025062004_story_plan_invitations.sql` adds nullable `member_stories.plan_id` with ON DELETE SET NULL and an index. A service-only, security-invoker RPC locks/rechecks ownership and a live non-rejected invitation before atomically publishing and linking a Story. Existing Story RPC remains unchanged. No new table/member grants.

Staging `fuczjjcwtxzzvoxilrme`: official apply succeeded. CLI initially generated `20261025061806`, renamed to actual staging receipt `20261025062004`; exact SQL MD5 `340554efc682460026c9f6a7c83d0fb3` matches ledger. No invented receipts or replay. Independent privilege inspection: anon/member execute both false. Existing two legacy profiles/five media and zero Stories remain after fixture attempts.

Production migration is NOT applied or approved by earlier Story cleanup authorization. Before merge: require passing hosted PostgreSQL tests, Preview checks and authenticated staging HTTP acceptance, then obtain concrete production migration approval. Normal Stories reads tolerate the absent new column during rollout; linked publication fails closed until migration exists. Supabase's tool repeatedly returned invalid/expired requestState for staging rollback fixture SQL, including a result-capturing attempt: these are NOT recorded as test passes. Independent counts confirmed no leftovers. Use hosted disposable PostgreSQL assertions for deterministic SQL evidence; retain staging script for actual-role verification when capability recovers.

## Verification

- `npm test`: 253 pass, including linked publication identity/audience/invalid ID/denial behavior.
- Typecheck, lint and production build passed during implementation; final hosted checks must cover the final commit.
- `node scripts/verify-invitations.mjs`: PASS at 390 and 1440 px with synthetic API interception: owner controls, attached photo Story draft, Friends default, disabled publication before acknowledgement, private Plan-tagged reply URL, report control, unavailable denial, no horizontal overflow.
- `tests/sql/story-plan-staging.sql`: rollback-only owner/closed/expired/audience/review/block/delete/ACL assertions; included in existing disposable PostgreSQL story suite in CI. Staging fixture execution remains unverified due tool errors.
- These checks do not prove real email signup, authenticated storage upload or a new live two-member journey for this slice. Existing Story acceptance evidence is documented separately. Do not claim beta GO from this feature.

Deferred from #110: real member invitation pilot, mutually confirmed dates and outcome measurement. Existing photo review/retention/export/erasure mechanisms remain in use; plan FK cascades to NULL without orphaning media.
