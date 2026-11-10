# Intimo invitation-to-activation audit — 10 November 2026

## Baseline: production, point-in-time

Counts are small, not reliable conversion rates. Avoid interpreting them as product-market fit.

| Measure | Confirmed |
|---|---:|
| Active member profiles | 3 |
| Active profiles with profile photo | 1 |
| Active profiles with looking-for preferences | 3 |
| Active members who have sent at least one direct message | 1 |
| Active members who have recorded an interest | 0 |
| Active members who have received at least one direct message | 1 |
| Recorded invitations, SENT or REDEEMED | 1 |
| Invitations redeemed through tracked invite path | 0 |

## Verified journey

- Member invitation: privileged `/api/member/invitations` claims a hashed recipient + token, sends via Resend and stores provider acknowledgement.
- Registration: `/api/auth/email` validates a token and binds it to the verified email. A link alone is insufficient; `/api/profile/me` redeems the token after creating a valid profile and recording required consent.
- Redemption creates `REDEEMED`, `redeemed_at`, and `redeemed_auth_id`. This, **not an email click**, defines "Joined".
- First contact is a direct message or recorded interest after redemption, not a page view, media upload, or invitation send.
- New member landing experience is `MemberActivityFeed`, **not** `/dashboard`. The added first-steps panel belongs on the actual feed.

## Implemented V2

- Private inviter-only metrics for issued, joined and awaiting signup; latest 20 invitation events. Address hashes, emails and tokens are never sent to the browser.
- Derived expired state for unredeemed links whose 30-day window ended; sent means provider acceptance, not inbox delivery.
- Observed first contact (message or interest) shown only on joined invitation records.
- Account-specific first steps for the first 14 days: profile photo, looking-for preferences, and first real contact. No new tracking cookie or speculative event.
- Founding Members retain unlimited invitations. Regular members retain three in rolling three calendar months.

## Measurement limitations / next gate

- There is **no historical session-event stream**, so seven-day retention and exact profile-to-contact latency cannot be reported reliably. Do not infer D7 return rate from `last_active_at`.
- Invitation acceptance is counted only when an invite token was redeemed. An existing or manually provisioned member is not silently attributed to the inviter.
- Pending invitations do not prove recipient inbox delivery; check Resend delivery webhooks or events before introducing a Delivered label.
- The first-contact marker for the *latest 20* invitations is based on the currently available message/interest records (up to 500 each); it is not a universal historical analytics warehouse.
- Future development, once more member activity exists: consent-aware delivery event ingestion, completion funnel trends, first-reply rate with conversation semantics, privacy-preserving D7 active retention cohorts, and rate-limit load tests.

## Release safeguards

- No schema migration needed. Existing private ledger and first-party interaction tables are used.
- Never display invited addresses or invitee activity details to the inviter; only aggregate/boolean outcomes.
- Do not contact invitees or create synthetic users as a test.
