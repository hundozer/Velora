# Consent for personal details (FM-01)

Source of truth: `src/lib/privacy/consents.mjs`. This document mirrors it for the privacy policy
and is checked by `tests/consents.test.mjs` (every version and wording below must match the code).

## Principles

- **Separate.** Each category is its own consent, never bundled with the terms or with another
  category. Legal basis: explicit consent, GDPR Art. 9(2)(a), for data about sex life or sexual
  orientation.
- **Recorded.** Every choice appends a row to `public.user_consents`: category, wording version,
  timestamp, given or withdrawn, and where it happened (`ONBOARDING`, `DESIRES_EDITOR` or
  `PRIVACY_CENTER`). Rows are never edited, so the history is the evidence.
- **Versioned.** A version names one exact wording. Changing a wording means a new version, and
  members who agreed to a wording that is no longer accepted see "Given for an earlier wording.
  Please review it." in Settings.
- **Withdrawal deletes.** Withdrawing removes the covered data in the same request: the
  withdrawal is recorded first, then the data is deleted. If the deletion fails, the member sees an
  error and can retry. The withdrawal stays recorded, and nothing covered is shown in the meantime.
- **Visible to the member.** Settings → Privacy Center → *Your consents* shows each consent, its
  exact wording and date, a withdraw button that names what it deletes, and the full history. The
  data export includes the same history.

## Categories

### Orientation and identity details: `SPECIAL_CATEGORY_PROFILE`

- **Current version:** `sensitive-profile-v2` (18 November 2026). Earlier grants under
  `sensitive-profile-v1` and `sensitive-profile-v1-draft` covered the same scope and remain valid.
- **Wording:** "I explicitly consent to Intimo storing my sexual orientation and the identity details I choose to add, and showing them only to the audience I pick. I can withdraw this at any time in Settings, which deletes them."
- **Covers:** `profiles.sexual_orientation`, plus the optional identity fields added in FM-09.
- **Withdrawal deletes:** those profile fields.
- **Asked:** in Settings, and when a member first adds orientation or identity details.

### Desires: `SPECIAL_CATEGORY_DESIRES`

- **Current version:** `desires-v1`.
- **Wording:** "I explicitly consent to Intimo storing my desires and showing the visible ones to signed-in members. I can withdraw this in Privacy settings, which erases them."
- **Covers:** every row in `member_desires`.
- **Withdrawal deletes:** all of the member's desires.
- **Asked:** in the desires editor before the first save.

## Not covered by these consents (open questions for the legal review)

- **Gender and couple type** are collected at onboarding to show profiles and apply members'
  messaging boundaries. They are not special-category data under Art. 9 and are not consent-based.
- **Looking for** (dates, sex partners, friends with benefits, …) and **relationship structure**
  are required at onboarding. They may count as data about a member's sex life. Decide with the
  legal review whether they need their own explicit consent, or whether onboarding should make
  them optional. Until then, the onboarding wording is the notice.
- **Messaging boundaries** (comfortable / ask first / not interested) describe how a member wants
  to be approached, not their sex life, and are treated as settings.

## Retention (owner and legal decision)

- **Consent records** are kept for as long as the account exists, as proof of what was agreed.
  On account deletion the profile is anonymised and the records stay linked only to that anonymous
  id. Proposed: delete them 3 years after account deletion (limitation period for claims). This
  needs the legal entity and the legal review before it goes into the privacy policy.
- **Covered data** is deleted on withdrawal (above) or on account deletion
  (`src/lib/privacy/retention.ts`).
