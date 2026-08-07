# DPIA technical input — draft

This is engineering input, not a completed DPIA or legal advice. The controller/DPO and qualified Czech/EU counsel must determine necessity, proportionality, legal bases, residual risk acceptance and consultation duties.

## Processing and purpose

Intimo is an adults-only, free social discovery service. It processes Auth0 identity references and verified email state; profile and approximate-location data; sexual orientation/intimate preferences where supplied; consent history; social connections; messages; media metadata; blocks/reports; moderation/copyright cases; security/audit events; and privacy-rights requests. `MONETIZATION_ENABLED=false`; payment, wallet, subscription, tip, payout and paid-content processing is out of scope and inaccessible.

## Data flow and boundaries

The browser authenticates with Auth0. The Next.js server cryptographically verifies the session, resolves the Auth0 subject to an application profile, applies ownership/participant/admin checks, and accesses Supabase using a server-only credential. Browser database roles are revoked by staged migrations. R2 uploads use short-lived presigned PUT URLs; non-public objects are retrieved through an entitlement-checked API that issues a short-lived GET URL. Resend is intended for transactional delivery but external configuration is unverified.

## High-risk factors

- Special-category sexuality/intimacy data and adult media.
- Profiling/discovery, interpersonal messaging and approximate location.
- Risk of minors, NCII, trafficking/exploitation, impersonation and coercion.
- Moderation evidence and potentially criminal/illegal-content reports.
- Identity, storage and email subprocessors and possible international transfers.

## Technical safeguards present

- Auth0 SDK/JWKS verification and fail-closed production behavior.
- Server-derived identity/ownership, admin allowlist, request limits and block checks.
- Separate age declaration status and consent records.
- Public-profile minimization and restricted private-media architecture.
- Structured reporting, critical-priority queue, append-only moderation-event schema and appeals endpoint.
- Monetization and higher-risk live/events routes centrally blocked.

## Residual technical risks / required work

Stronger age assurance is not integrated; migrations are unapplied; legacy client/local storage remains; field-level sensitive visibility is incomplete; media scanning and upload completion are absent; deletion/retention are not automated; export is incomplete; admin MFA and durable general audit logging are absent; localization/accessibility/runtime E2E verification are incomplete. These risks are not accepted by this document.

## Decisions required from owner/DPO/counsel

Confirm controller/representative/DPO details, lawful bases by purpose, special-category condition, age-assurance proportionality, processor/transfer safeguards, retention periods/legal holds, DSA/AVMS status, notice/action and law-enforcement procedures, consent evidence, policy text, children-risk position, and whether prior supervisory-authority consultation is required.
