# Intimo DPIA preparation

Status: technical preparation for qualified Czech/EU legal review. This is not
a completed DPIA, legal advice, or a claim of GDPR compliance.

## Processing map

| Category | Examples | Purpose | Primary store/processors | Draft retention |
|---|---|---|---|---|
| Account identity | Auth0 subject, email, verification state | Authentication, security, account recovery | Auth0; Intimo PostgreSQL mapping | Account life plus documented deletion workflow |
| Profile data | display name, age, gender, languages, relationship preferences | Adult social discovery | Supabase PostgreSQL | Account life |
| Special-category/intimate data | sexual orientation, interests, intimate preferences | User-controlled profile and discovery | Supabase PostgreSQL | Account life or consent withdrawal/deletion workflow |
| Location | country, city, approximate distance preference | Geographic discovery | Supabase PostgreSQL | Account life; exact coordinates must not reach public APIs |
| Communications | direct messages and attachments | User-to-user interaction and safety | Supabase PostgreSQL; object storage | Draft 365 days, subject to user controls/legal hold review |
| Adult media | profile photos, albums, video metadata | User profile/content | Object storage plus PostgreSQL metadata | Account life; orphan/deletion cleanup target 30 days |
| Safety data | blocks, reports, moderation evidence, appeals | Abuse prevention, notice and action, legal defense | Supabase PostgreSQL | Draft 3 years, with necessity/legal-hold review |
| Security logs | auth, API and privileged-action audit events | Security, incident response, accountability | Auth0/Vercel/application logs | Auth 180 days; audit 730 days draft |
| Consent records | type, version, status, timestamps | Demonstrate and manage processing choices | Supabase PostgreSQL | While relevant plus legal limitation review |

## Processors and transfers to review

- Auth0: identity and authentication.
- Supabase: PostgreSQL and potentially storage.
- Vercel: application hosting and request logs.
- Cloudflare R2, if enabled: user media storage.
- Resend: transactional email.
- Any analytics provider: disabled until optional-cookie consent and a
  privacy-preserving event inventory are approved.

For each processor, counsel/owner must verify role allocation, DPA, subprocessor
list, storage region, transfer mechanism, deletion capability and incident terms.

## Implemented technical controls

- Auth0 SDK session boundary and cryptographic JWT/JWKS verification.
- Server-derived identity and ownership for sensitive APIs.
- Deny-by-default RLS migration prepared for an Auth0/server-boundary model.
- Explicit versioned sensitive-data consent records and withdrawal history.
- Age declaration state separated from stronger age verification.
- User privacy settings and authenticated data export APIs.
- Public profile mapper excludes exact identity, date of birth and private
  sensitive fields; location is limited to city/country or hidden.
- Central free-MVP monetization disablement.

## High-risk questions for the formal DPIA

- Appropriate Article 6 and Article 9 bases for each processing purpose and
  whether consent is freely given when a feature depends on it.
- Stronger age-assurance method, explicit-content access threshold and provider.
- Risks of outing, stalking, coercion, scraping, re-identification and location
  inference; effectiveness of blocking and visibility controls.
- Adult-content participant age/consent evidence, NCII and suspected-CSAM
  escalation procedures.
- Automated/deterministic ranking transparency and whether any profiling has
  significant effects.
- Czech AVMS / Video-Sharing Platform Classification for adult video/live use.
- Retention/legal-hold balance and handling of rights requests involving other
  message participants or safety evidence.
- International transfers and sensitive-data exposure in infrastructure logs.

## Required owner/legal decisions before production

Name the controller and privacy contact/DPO position; approve purposes and legal
bases; approve consent text/version; select and assess age assurance; approve
retention schedule; complete legitimate-interest assessments where used; approve
processor DPAs/transfers; complete the formal DPIA and any supervisory-authority
consultation; approve rights-request procedures and final policy text.
