# Age check at activation (FM-06)

Owner decisions, 18 November 2026: a selfie holding a code, reviewed by hand; members who are
waiting can only set up their own profile; the existing members are approved by hand; a couple
sends one selfie with both partners.

## How it works

1. After onboarding the member lands on **/verify-age**. The server gives them a six-character
   code (no 0/O/1/I/L), kept on their profile for 24 hours and used once.
2. They write it on paper and upload a selfie holding it. For a couple profile, both partners
   are in the photo. The photo is private and tagged `AGE_CHECK`: it never appears in their
   photos, albums, private sharing or the photo moderation queue, and only the owner and the
   admin evidence route can open it.
3. Submitting moves `profiles.age_verification_status` to `PENDING` and queues a
   `verification_reviews` row (type `AGE`, the code, the photo).
4. In **Admin → Verification** the reviewer sees the code they must find, whether it's one person
   or a couple (with declared ages), and opens the selfie. Decisions:
   - **Verified**: `AGE_VERIFIED`, with `age_verified_at` and the method. The member is in.
   - **Retry requested**: the member sees "we need a new selfie" and gets a new code.
   - **Failed**: refused. They can't resubmit; they can still use Settings and delete their account.
   Each decision needs a reason and is written to `admin_action_events` with the reviewer.
5. **Approve age by hand** (Admin → Users) is for people the team knows. It needs
   `CONFIRM APPROVE_AGE`, a recent sign-in and a reason, records an `ADMIN_ATTESTATION` review,
   and can't be used on your own account.

## What "not checked yet" means

`hasAdultAccess` (every community API) now requires `AGE_VERIFIED`. Members with
`AGE_DECLARED`, `PENDING` or `REVIEW_REQUIRED` can still use their own profile, upload photos,
settings, privacy and account deletion (`hasSetupAccess`). Discovery, search, profiles, interest,
friends, messages, ads, saved items, albums and media hide anyone who isn't `AGE_VERIFIED`.
Pages that need community access show a "one last step" prompt instead (`AgeCheckGate`).

Staff accounts are not gated by the page prompt, but the APIs apply to them like anyone else.

## Going live (order matters)

1. Apply `supabase/migrations/20261118150000_age_check.sql` (staging, then production).
2. Approve the existing members (owner-approved): an `ADMIN_ATTESTATION` review and
   `AGE_VERIFIED` for each, recorded in `supabase/APPLIED.md`.
3. Merge the code. Merging before step 2 would lock the existing members out of the community
   until approved.

## Selfie retention (FM-06 follow-up, 19 November 2026)

- **VERIFIED:** after the reviewer records the decision, delete the object and all stored variants immediately, remove the media record and clear the reference in the review. Keep only who decided, when and why. This includes an ADMIN_ATTESTATION review if it happens to contain selfie evidence.
- **FAILED / RETRY_REQUESTED:** keep the evidence for 30 days after the decision so an appeal can be reviewed, then delete it. `/api/cron/age-selfie-retention` runs daily with Vercel CRON_SECRET and retries partial failures. No selfie goes on member profiles.
- If the member is suspected of being underage later, they undergo a fresh age check. The old selfie cannot be retrieved after deletion.
- The owner must verify the production R2 bucket is correct before activating deletion. Evidence removal is irreversible, so test with staging objects first. The decision record persists for accountability.

## Open questions
- **An outside age-check provider** (Yoti, Veriff…) for scale; see
  `docs/archive/AGE_ASSURANCE_ARCHITECTURE.md`. The manual check is the first-100 process.
- **A refused member's account.** Today it stays active but locked. Decide whether a refusal
  should also restrict or close the account.
