# Intimo free MVP compliance matrix

Technical self-audit updated: 2026-08-08. Source of truth: `INTIMO_MVP_COMPLIANCE_AND_PRODUCT_REQUIREMENTS.md`. Status means repository implementation, not legal compliance. Database migrations are staged only and have not been applied. All policy text is a technical draft requiring counsel.

| Requirement | Status | Repository evidence | Gap / launch condition |
|---|---|---|---|
| CR-AGE-001 universal 18+ gate | PARTIAL | Auth0 session, onboarding DOB declaration, `hasAdultAccess`, adult API gates | Declaration is not strong assurance; existing accounts need migration/backfill; deploy a privacy-preserving provider before explicit-content launch |
| CR-GDPR-001 consent records | PARTIAL | `consent_records`, consent API, onboarding consent | Map every processing purpose/version and localize notices |
| CR-GDPR-002 withdrawal | PARTIAL | consent withdrawal API | Downstream suppression/erasure workflow and UI coverage incomplete |
| CR-GDPR-003 data minimization | PARTIAL | public serializer, server API boundary | Legacy models/client stores and full field-level inventory remain |
| CR-GDPR-004 records/basis | LEGAL REVIEW | `PRIVACY_DATA_MAP.md`, consent purpose codes | Controller, processors, legal bases, transfers and final notices require counsel/DPO |
| CR-GDPR-005 security | PARTIAL | Auth0 verification, fail-closed production, RLS lockdown migrations | Migrations/config not verified in production; legacy browser persistence remains |
| CR-PRIV-001 field visibility | PARTIAL | profile visibility and minimized serializer | Sensitive-field controls are coarse rather than per-field |
| CR-PRIV-002 private media | PARTIAL | `media_objects`, entitlement route, short signed downloads, explicit participant declaration | Migration un-applied; malware/content scanning and video processing provider incomplete |
| CR-PRIV-003 public minimization | PARTIAL | `publicProfile.ts` excludes DOB/auth identifiers | Runtime verification and legacy paths need full integration tests |
| CR-RIGHTS-001 privacy center | PARTIAL | settings Privacy Center and privacy APIs | Correction/objection/restriction workflow incomplete |
| CR-RIGHTS-002 export | PARTIAL | authenticated export endpoint | Export does not yet cover all media, community, preference and moderation data |
| CR-RIGHTS-003 deletion | PARTIAL | self-owned request, Auth0 delete, resumable profile lifecycle | No background erasure/anonymization worker or completion notification |
| CR-RET-001 retention/deletion | PARTIAL | lifecycle columns and `DATA_RETENTION.md` | Scheduled jobs, legal-hold enforcement and deletion evidence absent |
| CR-DPIA-001 DPIA | LEGAL REVIEW | `DPIA_TECHNICAL_INPUT.md` | Owner/DPO/counsel must complete and approve before launch |
| CR-COOKIE-001/002 consent | PARTIAL | necessary/analytics/marketing choices; optional scripts absent | Preferences center/reopen, localization and policy approval incomplete |
| CR-DSA-001 reporting | PARTIAL | structured report API/UI | Reporting affordances are not present on every resource type |
| CR-DSA-002 notice/action | PARTIAL | moderation cases and server-admin console | Notices, statement-of-reasons delivery and regulator workflow incomplete |
| CR-DSA-003 immutable history | PARTIAL | append-only `moderation_events` migration | Case/event write is not transactional; migration un-applied |
| CR-DSA-004 appeals | PARTIAL | appeal endpoint and statuses | User appeal UI, notice delivery and reviewer separation incomplete |
| CR-SAFETY-001 participant declarations | PASS (technical) | Explicit per-upload two-step declaration, server validation, immutable declaration row | Operational review and policy wording still require launch verification |
| CR-SAFETY-002 critical escalation | PARTIAL | critical categories and escalated queue | Automatic provisional restriction and incident runbook execution not verified |
| CR-SAFETY-003 prohibited harms | PARTIAL | policy drafts/report categories | Detection, hash matching, evidence preservation and trained response operation absent |
| CR-CONSENT-001 intimate-content consent | PARTIAL | upload declaration and policy | Evidence request/revocation/takedown operational flow incomplete |
| CR-CSEX-001 no commercial sexual services | PASS (technical) | service menus/VIP removed; API forces free ads | Policy interpretation and final wording require legal review |
| CR-MSG-001/002 messaging authorization | PARTIAL | server-derived sender, participant and block checks, durable unread state and notifications | Pagination and production-like DB/E2E abuse tests remain |
| CR-MSG-003 attachments | PASS (disabled) | No attachment control exposed in the durable messaging path | Keep unavailable until private scanning/authorization/retention is implemented |
| CR-SEC-001/002 authorization/security | PARTIAL | verified Auth0 session only, active-account gate, allowlists, server actor, rate/size/type limits; client role/impersonation/fallback login removed | External configuration and real-database authorization validation remain |
| Admin security | PARTIAL | six least-privilege roles, granular server permissions, production MFA and recent-auth checks | Auth0 MFA claims and staged migration require runtime verification; role changes remain configuration-only |
| Audit logging | PARTIAL | immutable moderation schema and durable admin-action schema | Multi-write operations need database transactions; retention jobs and production validation incomplete |
| CR-AVMS-001 video-platform duties | LEGAL REVIEW | live/events disabled; `LEGAL_REVIEW_VIDEO_PLATFORM.md` | Counsel determination required before enabling video-sharing/live features |
| CR-COPY-001 copyright workflow | PARTIAL | notice API and case storage | Counter-notice UI, claimant notices, repeat-infringer process and legal review incomplete |
| Accessibility | PARTIAL | semantic components and lint | Automated axe plus keyboard/screen-reader/manual review absent |
| I18N-001 six languages | FAIL | locale scaffolding exists | Most product/compliance strings remain English; human/legal translation required |
| Required policy routes | PARTIAL | exact top-level routes redirect to legal drafts | Drafts are incomplete, English-only and not legally approved |
| CR-MVP-001 free MVP | PASS (technical) | `MONETIZATION_ENABLED=false`, middleware route blocks | Dormant legacy payment code remains and must stay unreachable |
| Free creator experience | PARTIAL | creator discovery/profile presentation is free | Creator operation data remains incomplete; no paid controls may be enabled |
| Tests/CI | PARTIAL | Node test runner, typecheck, lint, build workflow | Tests are mostly source-boundary assertions; authenticated DB/E2E suites absent |

## Critical launch blockers

1. Apply and verify the staged Supabase migrations in a controlled non-production environment, with backups and rollback rehearsal.
2. Configure server-only database and R2 credentials; verify Auth0 rotation/configuration without exposing values.
3. Select and integrate stronger, data-minimizing age assurance for explicit adult content; backfill existing accounts.
4. Finish private-media upload completion/scanning and explicit participant confirmation.
5. Implement deletion/retention workers and complete data export coverage.
6. Add admin MFA, durable audit logging, critical-content restriction/evidence workflow and runtime integration tests.
7. Complete DPIA and qualified Czech/EU legal review, including AVMS/DSA/GDPR/copyright and all six localized policies.

Current technical readiness: **70/100 — NO-GO** for public explicit-adult launch. The free MVP constraint and core server authorization are enforced; remaining blockers include staged migration application, stronger age assurance, media scanning/video processing, privacy retention/deletion operations, production-like E2E testing, localization, and legal approval. See `FINAL_TECHNICAL_SELF_AUDIT.md`.

## Required end-to-end journey self-audit

| Journey step | Status | Evidence / blocker |
|---|---|---|
| Visitor | PASS | Landing and policy routes build |
| 18+ / age assurance | PARTIAL | DOB declaration and server adult gate; stronger provider absent |
| Auth0 registration/login | PARTIAL | Supported SDK/session path builds; live environment not tested here |
| Email verification | PARTIAL | Auth0/Management API route exists; live delivery/config unverified |
| Profile creation | PARTIAL | Server-owned onboarding API; test database migration/runtime unverified |
| Sensitive-data consent | PASS (technical) | Explicit checkbox plus versioned consent insert |
| Privacy preferences | PARTIAL | Server endpoint/UI present; per-field coverage incomplete |
| Photo upload | PARTIAL | Authenticated limited private architecture; scanning/completion/declaration UI incomplete |
| Location setup | PARTIAL | Approximate location profile fields; privacy validation incomplete |
| Discovery/filtering | PARTIAL | Durable deterministic API; advanced filters and real-DB test incomplete |
| Profile view | PARTIAL | Authenticated visibility/block boundary; real-DB test incomplete |
| Favourite/follow | PARTIAL | Durable server connection API; real-DB test incomplete |
| Message | PARTIAL | Participant/block boundary; attachments and E2E test absent |
| Block/report | PARTIAL | Durable APIs and structured critical categories; all-resource UI incomplete |
| Return usage | PARTIAL | Auth0 session restoration implemented; browser E2E not run |

No step requires payment; monetization routes are blocked by server middleware and navigation is removed.
