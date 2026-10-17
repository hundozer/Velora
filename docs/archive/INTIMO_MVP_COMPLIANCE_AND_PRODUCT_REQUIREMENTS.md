# INTIMO MVP COMPLIANCE AND PRODUCT REQUIREMENTS

**Document purpose:** Engineering and product specification for Codex  
**Product:** Intimo  
**Website:** https://intimo.live  
**Transactional email:** noreply@intimo.live  
**Support email:** contact@intimo.live  
**Scope:** Free, non-monetized MVP  
**Jurisdictional focus:** European Union and Czech Republic  
**Status:** Engineering specification for legal review, not legal advice

---

## 1. Product Scope

Intimo is an adults-only social discovery platform for consenting adults.

The MVP is free. It does not support:

- paid subscriptions
- paid creator content
- paid livestreams
- tips
- paid events
- wallets
- payouts
- commissions
- checkout
- invoices
- Stripe or other payment processing
- creator monetization

Any payment-related implementation retained in the codebase must be disabled behind a central feature flag and inaccessible to users.

Recommended feature flag:

```text
MONETIZATION_ENABLED=false
```

The MVP focuses on:

- adult user registration
- age assurance
- profile creation
- profile photos and galleries
- sexual orientation and preference fields
- location-based discovery
- advanced filtering
- messaging
- favourites/follows
- creators as free content contributors
- free videos and livestreams where supported
- privacy controls
- blocking
- reporting
- moderation
- communities/events where already implemented
- multilingual UI

---

# 2. Compliance Architecture Principles

Codex must treat compliance requirements as product requirements.

Every relevant requirement below should be mapped to:

1. frontend behavior
2. backend enforcement
3. database representation
4. auditability
5. testing
6. administrative tooling where applicable

Do not rely on frontend-only restrictions.

For each requirement, Codex should identify whether the current codebase:

- COMPLIES
- PARTIALLY COMPLIES
- DOES NOT COMPLY
- REQUIRES LEGAL REVIEW

---

# 3. Regulatory Reference Set

The implementation should be designed with reference to:

## EU GDPR
Regulation (EU) 2016/679.

Official text:
https://eur-lex.europa.eu/eli/reg/2016/679/oj

Particularly relevant:

- Article 5: principles
- Article 6: lawful basis
- Article 9: special-category data
- Articles 12–22: data subject rights
- Article 25: privacy by design/default
- Article 30: records of processing
- Article 32: security
- Articles 33–34: breach notification
- Article 35: DPIA

## EDPB Consent Guidance
Guidelines 05/2020 on consent.

https://www.edpb.europa.eu/documents/guideline/guidelines-052020-consent-under-regulation-2016679_en

## Digital Services Act
Regulation (EU) 2022/2065.

https://eur-lex.europa.eu/eli/reg/2022/2065/oj

Relevant areas include:

- notice and action
- illegal-content reporting
- moderation transparency
- complaint/appeal mechanisms where applicable
- platform governance

## EU Age Verification / Minor Protection
European Commission resources:

https://digital-strategy.ec.europa.eu/en/policies/eu-age-verification

## Audiovisual / Video-Sharing Platform Rules
Directive 2010/13/EU as amended by Directive (EU) 2018/1808.

https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02010L0013-20181218

Czech implementation and applicability to Intimo must be reviewed by Czech counsel before significant adult video/livestream launch.

## Czech Digital Services Coordination
Czech Telecommunications Office / ČTÚ:

https://ctu.gov.cz/en/european-digital-services-act-dsa

## Accessibility
European Accessibility Act:

https://eur-lex.europa.eu/eli/dir/2019/882/oj

Target for product implementation:

WCAG 2.2 AA

---

# 4. Critical Launch Requirements

The following are MVP launch blockers unless explicitly accepted by qualified legal/security leadership.

| ID | Requirement | Priority |
|---|---|---|
| CR-AGE-001 | Adults-only access architecture | Critical |
| CR-GDPR-001 | Special-category data handling | Critical |
| CR-GDPR-002 | Privacy-by-design controls | Critical |
| CR-GDPR-003 | Data deletion workflow | Critical |
| CR-GDPR-004 | Data export/access workflow | High |
| CR-GDPR-005 | Consent records | Critical |
| CR-DSA-001 | User reporting mechanism | Critical |
| CR-DSA-002 | Moderation workflow | Critical |
| CR-DSA-003 | Illegal-content escalation | Critical |
| CR-SAFETY-001 | Suspected-minor escalation | Critical |
| CR-SAFETY-002 | Non-consensual intimate content policy/workflow | Critical |
| CR-SEC-001 | Backend authorization | Critical |
| CR-SEC-002 | Private-media access protection | Critical |
| CR-SEC-003 | Blocking enforcement | High |
| CR-COOKIE-001 | Cookie consent controls | High |
| CR-LEGAL-001 | Terms and Privacy Policy reviewed by counsel | Critical |
| CR-AVMS-001 | Czech video-sharing-platform legal assessment | Critical before major video/live launch |

---

# 5. Age Assurance

## CR-AGE-001 — Adults Only

**Requirement**

Intimo must be restricted to adults aged 18 or older.

A basic self-declaration may be used as an initial onboarding step, but the architecture must support stronger age assurance.

**Database**

Recommended fields:

```text
age_verification_status
age_verified_at
age_verification_method
age_verification_provider_reference
```

Recommended statuses:

```text
UNVERIFIED
AGE_DECLARED
AGE_VERIFIED
FAILED
REVIEW_REQUIRED
```

**Frontend**

- Clearly display 18+ requirement.
- Require age declaration before account creation or access to adult functionality.
- Do not expose explicit adult material before the appropriate access check.
- Provide clear rejection behavior for underage users.

**Backend**

Every route requiring adult access should evaluate age/access status where appropriate.

Do not rely only on route hiding.

**Acceptance criteria**

- A user without the required age state cannot access restricted adult content.
- Direct API calls do not bypass the age gate.
- Age status is auditable.

**Legal review**

The exact level of age verification required for Intimo's final content model and markets must be reviewed before production launch.

---

# 6. GDPR and Sensitive Data

## CR-GDPR-001 — Special-Category Data

Intimo may process:

- sexual orientation
- sex-life information
- sexual preferences
- intimate interests

These must be treated as highly sensitive information.

**Engineering requirement**

Do not store such data casually alongside general analytics/event payloads.

Use explicit domain models and access controls.

---

## CR-GDPR-002 — Explicit Consent Architecture

Where explicit consent is the selected lawful basis, the system must be capable of recording it independently of general Terms acceptance.

Recommended model:

```text
UserConsent
-----------
id
user_id
consent_type
policy_version
status
granted_at
withdrawn_at
source
```

Example consent types:

```text
SPECIAL_CATEGORY_PROFILE_DATA
LOCATION_DISCOVERY
OPTIONAL_ANALYTICS
MARKETING
```

**Acceptance criteria**

- Consent version is recorded.
- Withdrawal is possible.
- Consent history is auditable.
- Withdrawal triggers appropriate downstream handling.

Do not assume that clicking "Accept Terms" covers Article 9 processing.

---

## CR-GDPR-003 — Data Minimization

Only collect information necessary for clearly defined product purposes.

Codex should review every user/profile field and classify it:

```text
REQUIRED
OPTIONAL
UNNECESSARY
```

Optional sensitive fields should not be mandatory merely because they improve search.

---

## CR-GDPR-004 — Purpose Limitation

Sensitive profile data must not automatically be reused for:

- advertising
- unrelated analytics
- external profiling
- marketing segmentation

without an appropriate lawful basis and explicit product/legal decision.

---

## CR-GDPR-005 — Privacy by Default

New accounts should default to privacy-protective settings.

Examples:

- no exact location exposure
- private/sensitive data not exposed beyond intended audience
- optional marketing disabled by default where required
- private media protected

---

# 7. Privacy Controls

## CR-PRIV-001 — Field-Level Visibility

Sensitive profile fields should support visibility states where appropriate.

Suggested:

```text
EVERYONE
MEMBERS_ONLY
MATCHING_USERS
APPROVED_USERS
PRIVATE
```

Codex should avoid implementing visibility only in frontend components.

The API serializer/query must respect visibility.

---

## CR-PRIV-002 — Private Media

Private media must not have permanent public URLs.

Recommended architecture:

```text
private object storage
+
backend entitlement check
+
short-lived signed URL
```

Check before issuing access:

- requesting user authenticated
- resource exists
- owner permissions
- visibility rule
- block relationship
- approval state if applicable

---

## CR-PRIV-003 — Location Protection

Public APIs must never expose exact residential/user coordinates.

Use:

- city
- approximate distance
- coarse geospatial buckets
- intentionally shifted/generalized map representation

Exact coordinates must remain private backend data if collected.

---

# 8. Data Subject Rights

## CR-RIGHTS-001 — Privacy Center

Create a Privacy Center accessible from account settings.

Functions:

- view stored account information
- correct account/profile information
- export data
- manage consent
- manage privacy settings
- request deletion

---

## CR-RIGHTS-002 — Data Export

Create an authenticated export workflow.

Export should cover appropriate user data such as:

- account information
- profile
- preferences
- consent history
- media metadata
- messages where legally/technically appropriate
- community activity

The system must prevent one user from exporting another user's data.

---

## CR-RIGHTS-003 — Account Deletion

Account deletion must not merely set:

```text
deleted=true
```

Define a lifecycle such as:

```text
DELETION_REQUESTED
DEACTIVATED
RETENTION_HOLD_IF_REQUIRED
ANONYMIZATION_IN_PROGRESS
DELETED
```

Determine which records require retention for legitimate legal/security reasons.

This retention policy requires legal review.

---

# 9. Data Retention

## CR-RET-001 — Configurable Retention

Create documented/configurable retention for:

- inactive accounts
- deleted users
- messages
- photos/videos
- moderation evidence
- reports
- authentication logs
- audit logs
- age/identity verification records

Avoid indefinite retention by default.

Create:

```text
DATA_RETENTION.md
```

This should list:

- data category
- purpose
- proposed period
- deletion/anonymization method
- legal-review status

---

# 10. DPIA Readiness

## CR-DPIA-001

Prepare a technical data map for legal/privacy review.

Generate:

```text
DPIA_TECHNICAL_INPUT.md
```

Include:

- system components
- data categories
- special-category fields
- processing purposes
- user flows
- data recipients/processors
- Auth0 usage
- Resend usage
- hosting/storage
- logs
- retention
- security controls
- privacy risks
- mitigating controls

Do not claim the DPIA is legally approved.

---

# 11. Cookies and Tracking

## CR-COOKIE-001

Cookie manager must distinguish:

```text
NECESSARY
ANALYTICS
MARKETING
```

Required UI:

- Accept All
- Reject Non-Essential
- Manage Preferences

Optional tracking must not start before consent where consent is required.

---

## CR-COOKIE-002 — Sensitive Analytics Restrictions

Do not send these to third-party analytics:

- sexual orientation
- sexual preferences
- private messages
- precise location
- private image/video identifiers
- intimate search criteria
- raw profile bios containing sensitive information

Prefer anonymous/aggregated event data.

Good example:

```text
event: discovery_filter_applied
filter_count: 4
```

Bad example:

```text
event: bisexual_user_searching_bdsm_couples_prague
```

---

# 12. DSA Notice and Action

## CR-DSA-001 — Report Anything Relevant

Users should be able to report:

- profile
- photo
- video
- livestream
- message/conversation
- post
- comment
- community
- event

---

## CR-DSA-002 — Report Categories

Minimum:

```text
SUSPECTED_MINOR
NON_CONSENSUAL_INTIMATE_CONTENT
HARASSMENT
THREATS
IMPERSONATION
SCAM_OR_FRAUD
EXPLOITATION_OR_TRAFFICKING
ILLEGAL_CONTENT
COPYRIGHT
PRIVACY_VIOLATION
COMMERCIAL_SEX_SERVICES
SPAM
OTHER
```

---

## CR-DSA-003 — Moderation Case

Recommended model:

```text
ModerationCase
--------------
id
reporter_id
reported_user_id
resource_type
resource_id
reason
description
created_at
priority
status
assigned_moderator_id
decision
decision_reason
decision_at
appeal_status
```

Statuses:

```text
OPEN
UNDER_REVIEW
ACTION_REQUIRED
RESOLVED
REJECTED
APPEALED
ESCALATED
```

---

## CR-DSA-004 — Moderation Decision History

Never overwrite moderation history.

Every action should produce an immutable/logged event.

Example:

```text
case_id
actor_id
action
reason
timestamp
```

---

# 13. Critical Safety Escalations

## CR-SAFETY-001 — Suspected Minor

Any report indicating a suspected minor must receive highest-priority escalation.

The platform should support:

- immediate content restriction
- account restriction
- evidence preservation subject to legal policy
- senior moderator escalation

Exact legal reporting obligations must be reviewed with counsel.

---

## CR-SAFETY-002 — Non-Consensual Intimate Content

Provide a dedicated report route.

Actions must support:

- rapid restriction/removal
- account suspension
- evidence preservation
- appeal handling
- repeat-offender tracking

---

## CR-SAFETY-003 — Exploitation / Trafficking

Support dedicated escalation for:

- coercion
- trafficking
- exploitation
- forced content/activity

Do not mix these only into a generic "Other" category.

---

# 14. Prohibited Content

Create a platform content taxonomy.

At minimum prohibit:

- minors
- CSAM
- suspected CSAM
- exploitation
- trafficking
- non-consensual intimate content
- covert intimate recording
- sexual coercion
- unlawful threats/violence
- doxxing
- impersonation for abuse
- unlawful sexual deepfakes/non-consensual synthetic intimate content
- other illegal content

Create:

```text
CONTENT_POLICY.md
```

Mark final wording:

```text
REQUIRES LEGAL REVIEW BEFORE PRODUCTION
```

---

# 15. Participant Consent for Uploaded Adult Content

## CR-CONSENT-001

When intimate content includes another identifiable participant, support a declaration that:

- every participant is 18+
- recording was consensual where relevant
- publication/upload is consensual

Potential model:

```text
ContentParticipantDeclaration
-----------------------------
content_id
uploader_id
all_participants_adults
recording_consented
publication_consented
declared_at
```

For higher-risk content, moderation must be able to request additional evidence.

Do not expose verification evidence publicly.

---

# 16. Commercial Sexual Services

## CR-CSEX-001

The free MVP must be a social/discovery platform, not a marketplace for prostitution or paid offline sexual services.

Do not build:

- hourly service rates
- escort bookings
- incall/outcall
- service menus
- transactional booking for sexual services

Add moderation category:

```text
COMMERCIAL_SEX_SERVICES
```

Legal policy details require Czech/EU counsel review.

---

# 17. Messaging Safety

## CR-MSG-001 — Authorization

Conversation access must require membership in that conversation.

Example:

```text
conversation.participants contains authenticated_user_id
```

Never trust conversation/user IDs from frontend alone.

---

## CR-MSG-002 — Blocks

If A blocks B:

B cannot:

- message A
- follow A
- favourite A
- interact with A through normal product routes
- access private media belonging to A
- bypass via direct endpoint calls

The inverse visibility behavior should be explicitly defined.

---

## CR-MSG-003 — Media

Private message attachments should use private storage and access checks.

Do not expose raw public object-storage URLs.

---

# 18. Authentication

Auth0 remains the identity provider.

Auth0 handles:

- signup
- login
- logout
- passwords
- reset
- email verification
- sessions
- tokens
- MFA readiness

Do not implement enterprise SSO for MVP.

---

# 19. Authorization

## CR-SEC-001

Intimo backend remains the authorization authority for business logic.

Recommended roles:

```text
GUEST
MEMBER
VERIFIED_MEMBER
CREATOR
VERIFIED_CREATOR
MODERATOR
ADMIN
```

Do not rely only on roles.

Use resource/attribute checks.

Examples:

```text
canEditProfile(user, profile)
canViewMedia(user, media)
canReadConversation(user, conversation)
canManageContent(user, content)
canModerate(user, resource)
```

---

## CR-SEC-002 — IDOR Prevention

Audit every endpoint accepting resource identifiers.

Test attempts to access:

- another user's profile editing route
- another user's private media
- another conversation
- another creator's content
- another user's verification records
- admin endpoints

Backend must reject unauthorized access.

---

# 20. Admin Security

Admin access should be more restrictive than ordinary users.

Minimum:

- MFA
- explicit permissions
- audit logs
- least privilege

Recommended separation:

```text
SUPPORT_ADMIN
CONTENT_MODERATOR
SYSTEM_ADMIN
```

Finance-related roles are not required for the free MVP.

---

# 21. Audit Logging

Audit at minimum:

- authentication/security events
- role changes
- account suspension
- moderation decisions
- verification changes
- consent changes
- sensitive admin actions

Recommended fields:

```text
id
actor_id
action
resource_type
resource_id
metadata
created_at
```

Avoid storing unnecessary sensitive raw content in logs.

---

# 22. Video and Livestream Legal Review

## CR-AVMS-001

If Intimo provides significant user-uploaded adult video or livestream functionality, perform a formal Czech legal assessment of whether Intimo is a video-sharing platform service under applicable Czech/EU audiovisual law.

Until reviewed:

- preserve age controls
- preserve reporting/moderation
- preserve video access controls
- document live/video architecture

Generate:

```text
LEGAL_REVIEW_VIDEO_PLATFORM.md
```

Include questions for counsel rather than making legal conclusions.

---

# 23. Copyright

## CR-COPY-001

Provide copyright reporting functionality.

Track:

```text
claimant
contact_details
resource
claim
submitted_at
status
action
resolution
```

Create policy placeholder:

```text
COPYRIGHT_POLICY.md
```

Final process and legal wording require review.

---

# 24. Accessibility

Target:

```text
WCAG 2.2 AA
```

Prioritize:

- login
- registration
- age gate
- onboarding
- profile editing
- discovery filters
- messaging
- privacy settings
- report dialogs
- consent dialogs
- account deletion

Test:

- keyboard navigation
- focus states
- screen reader labels
- contrast
- responsive text
- form errors
- modal accessibility

---

# 25. Internationalization

Required languages:

```text
en
cs
hu
ro
sk
de
```

All legal/compliance UI must be translated through the existing i18n system:

- age gate
- consent
- privacy
- cookies
- reports
- moderation messages
- blocking
- account deletion
- data export
- safety notices

Do not implement AI translation.

Legal text translations require professional/legal review before final production release.

---

# 26. Policy Pages Required

Create or preserve routes for:

```text
/terms
/privacy
/cookies
/community-guidelines
/content-policy
/age-policy
/copyright
/safety
/moderation
```

Generated drafts must display development/legal status internally:

```text
REQUIRES LEGAL REVIEW
```

Do not publish unreviewed generated legal wording as final approved legal policy.

---

# 27. Monetization Disabled

## CR-MVP-001

There must be no active monetization in the MVP.

Search for and disable/hide:

- Premium
- VIP
- pricing
- subscriptions
- purchase
- checkout
- wallets
- balances
- earnings
- payouts
- tips
- commissions
- billing
- invoices
- Stripe
- paid content
- paid streams
- paid events

Do not destructively delete architecture where future reuse is sensible.

Central flag:

```text
MONETIZATION_ENABLED=false
```

All relevant backend routes must also enforce disabled state.

---

# 28. Creators in Free MVP

Creator Mode may remain.

Creators may:

- create creator profiles
- publish free albums
- publish free videos
- gain followers
- host free livestreams if enabled
- message/interact
- join communities/events

Creators may not:

- charge
- receive tips
- sell subscriptions
- earn payouts

For MVP, content visibility should use:

```text
PUBLIC
MEMBERS_ONLY
FOLLOWERS_ONLY
PRIVATE
APPROVED_USERS_ONLY
```

Paid entitlement modes should be disabled.

---

# 29. Required Technical Documents

Codex should create/update:

```text
COMPLIANCE_MATRIX.md
DPIA_TECHNICAL_INPUT.md
DATA_RETENTION.md
CONTENT_POLICY.md
MODERATION_POLICY.md
AGE_ASSURANCE_ARCHITECTURE.md
PRIVACY_DATA_MAP.md
LEGAL_REVIEW_VIDEO_PLATFORM.md
FUTURE_MONETIZATION.md
SECURITY_AUTHORIZATION_MATRIX.md
```

---

# 30. Compliance Matrix Format

`COMPLIANCE_MATRIX.md` should contain:

| Requirement | Status | Frontend | Backend | Database | Tests | Legal Review |
|---|---|---|---|---|---|---|

Example:

| CR-GDPR-002 | PARTIAL | Consent UI exists | Withdrawal missing | Table exists | Missing | Yes |

---

# 31. Testing Requirements

Automated/integration tests should include:

## Identity and authorization

- unauthenticated private route access
- expired/invalid Auth0 token
- another-user profile edit
- conversation IDOR
- private media IDOR
- moderator/admin escalation attempts

## Privacy

- hidden field not returned by API
- exact coordinates never returned publicly
- blocked-user access denied

## Consent

- consent recorded
- consent version recorded
- consent withdrawal
- sensitive preference handling after withdrawal

## Moderation

- report creation
- critical-priority report
- moderator assignment
- decision log
- appeal flow

## Data rights

- data export limited to requester
- deletion request lifecycle

## Monetization

- payment routes unavailable
- checkout unavailable
- premium UI absent
- monetization flag cannot be bypassed client-side

---

# 32. MVP End-to-End Validation

Codex must validate this exact journey:

```text
Visitor
↓
18+ / age assurance
↓
Auth0 registration
↓
email verification
↓
profile creation
↓
sensitive-data consent
↓
privacy preferences
↓
photo upload
↓
location setup
↓
discovery
↓
advanced filtering
↓
profile view
↓
favourite/follow
↓
message
↓
block/report when required
↓
return usage
```

All of this must work without any payment interaction.

---

# 33. Final Review Required From Codex

Before declaring MVP ready, produce:

## A. Technical compliance status

For each requirement:

```text
PASS
PARTIAL
FAIL
LEGAL REVIEW
```

## B. Launch blockers

Rank:

```text
CRITICAL
HIGH
MEDIUM
LOW
```

## C. MVP readiness score

Score:

```text
0–100
```

## D. Recommendation

One of:

```text
GO
CONDITIONAL GO
NO-GO
```

Explain every condition.

---

# 34. Explicit Legal Boundary

Codex must not state:

"Intimo is GDPR compliant"

"Intimo is DSA compliant"

"Intimo is legally approved"

solely because code has been implemented.

Use wording such as:

```text
Technical control implemented.
Requires legal validation before production.
```

The final legal review must be performed by qualified Czech/EU counsel.

---

# 35. Future Monetization

Monetization is outside the MVP.

Document future considerations only in:

```text
FUTURE_MONETIZATION.md
```

Topics for later assessment:

- payment provider suitability for adult platforms
- seller/creator legal status
- VAT
- OSS
- DAC7
- consumer rights
- digital-content withdrawal rules
- refunds
- chargebacks
- creator payouts
- KYC
- platform commission
- marketplace trader verification

Do not activate these flows during the free MVP.

---

# 36. Product Principle

The current priority is not revenue extraction.

The priority is:

```text
TRUST
+
SAFETY
+
PRIVACY
+
USEFUL DISCOVERY
+
NETWORK DENSITY
+
RETENTION
```

The MVP should be the simplest version of Intimo capable of validating whether adults will join, create profiles, discover compatible people, interact, and return.

Compliance, privacy, and safety controls must be part of that MVP rather than postponed until monetization.
