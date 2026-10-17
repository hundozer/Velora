# Intimo free MVP readiness handoff

Assessment date: 2026-08-07. This is an engineering assessment, not legal
approval. Current recommendation: **NO-GO for production launch**.

## 1. MVP simplification summary

Intimo is now configured as a free adults-only social discovery MVP. The active
foundation centers Auth0 login, email verification, 18+ declaration, profile and
preferences, deterministic discovery, profile viewing, dating ads, durable
follow/favorite/message APIs, blocking, reporting and privacy controls.

## 2. Monetization disabled

Membership, wallet, checkout and paid/VIP dating gates are centrally blocked.
Creator cards are free. Paid visibility choices were removed from active media
controls. Mock live, events, creator-studio and referral routes are withheld
until durable free/safety implementations exist. Dormant source remains for a
future, separately approved phase.

## 3. Principal changed areas

Auth0/session and API authorization; profile/onboarding/discovery/dating APIs;
messaging, connections, blocks, reports, moderation, appeals, copyright and
privacy APIs; versioned Supabase migrations; free creator UI; cookie banner;
draft legal pages; CI/test scripts; architecture, DPIA, retention, analytics,
future-monetization and legal-review documentation.

## 4. Feature flags

- `MONETIZATION_ENABLED=false`
- `MONETIZATION_DISABLED_ROUTES`
- `MVP_SAFETY_DISABLED_ROUTES`

## 5. Retained future payment code

Legacy membership/wallet pages, checkout/tip components, payment types/services,
Prisma money models, and mock admin/creator finance code remain in source but are
not mounted or reachable through enabled routes. See `FUTURE_MONETIZATION.md`.

## 6. GDPR technical status

Implemented: data-minimized member profile mapper, server-derived rights export,
privacy settings, consent history, authenticated deletion boundary, draft
retention configuration and DPIA preparation. Incomplete: production retention
jobs, resumable deletion/anonymization and object cleanup, formal rights-request
operations, processor review, DPA/transfers, formal DPIA and legal bases.

## 7. Special-category data

Onboarding requires separate explicit versioned consent before storing sexual
orientation/preferences. Consent grant/withdrawal history and field visibility
controls exist. Consent wording/version and withdrawal effects require counsel,
product and database-migration review.

## 8. Age assurance

Age calculation enforces 18+ at server profile creation. `AGE_DECLARED` is
separate from `AGE_VERIFIED`; the UI states the distinction. Stronger assurance,
provider selection, explicit-content gating and safeguarding procedure remain
launch blockers.

## 9. DSA/moderation

Structured reports, required categories, automatic critical escalation,
moderation cases, server-authorized admin queue, decisions, appeals and copyright
notices exist. Incomplete: user report-history/appeal UI, moderator notifications,
evidence preservation/upload, independent-review assignment enforcement,
statements of reasons/transparency reporting, operational staffing and emergency
playbooks.

## 10. Privacy controls

Profile/sensitive-field/location/message controls, consent management, data
export, deletion entry point, blocks and reports exist. Exact coordinates are not
returned by member-profile APIs. Some legacy client media/community/profile code
still bypasses the intended server boundary and must be migrated before RLS can
be applied.

## 11. Security

Implemented: supported Auth0 SDK sessions, JWKS verification, no credential
fallbacks, fail-closed production middleware, server actor/ownership checks,
rate/body/type limits, server-only admin allowlist, protected presigning and
deny-by-default RLS migration. Remaining: configure server database credentials,
apply/verify migrations, durable database audit log, eliminate remaining direct
browser Supabase writes, production integration/abuse tests, verification-media
workflow and secret-history review.

## 12. Czech AVMS/video legal review

**Czech AVMS / Video-Sharing Platform Classification** is explicitly registered
for qualified Czech counsel before adult video or livestream functionality is
enabled. Live/events are withheld in the MVP meanwhile.

## 13. Policies requiring counsel

Terms, Privacy, Cookie, Community Guidelines, Acceptable Use, Content, Age,
Copyright and Moderation/Notice & Action pages are incomplete drafts visibly
marked for legal review. Professional Czech, Hungarian, Romanian, Slovak and
German legal translation is required; AI translations were not generated.

## 14. Remaining launch blockers / owner actions

1. Configure server-only `SUPABASE_SERVICE_ROLE_KEY` and canonical `DATABASE_URL`
   locally and in the deployment platform; never expose them as `NEXT_PUBLIC_*`.
2. Provide the Auth0 subject(s) for `INTIMO_ADMIN_AUTH0_SUBS` through secret
   configuration, not source.
3. Review backups and apply the versioned migrations in a non-production clone;
   run API integration tests, validate row counts/orphans and rollback notes.
4. Migrate remaining direct browser Supabase/local-only media, communities,
   notifications and floating-chat behavior before applying production RLS.
5. Select stronger age assurance and approve the adult-content access model.
6. Complete formal Czech/EU legal review, DPIA, processor/transfer review,
   retention schedule, DSA operations and professional policy translations.
7. Configure and test R2/private media lifecycle and Resend delivery in a staging
   environment without exposing credentials.
8. Approve a clean release branch/commit plan that does not absorb unrelated
   Antigravity work.

## 15. Readiness score

**46 / 100.** The local security/product foundation is materially stronger, but
database migrations, staging integration, remaining direct browser persistence,
stronger age assurance, operational moderation and legal approval are unresolved.

## 16. Recommendation

**NO-GO.** Do not deploy or promote a production launch. Continue in staging
after owner credentials and migration authorization are available. A GitHub push
is also withheld because the working tree includes unrelated pre-existing
Antigravity changes and no safe release commit boundary has been approved.
