# Intimo free MVP — technical self-audit

Audit date: 2026-08-08  
Branch: `codex/intimo-secure-mvp`  
Scope: repository implementation and preview/staging readiness. This is not legal approval and does not claim that staged migrations, providers, or production configuration have been applied externally.

## Outcome

| Area | Status | Evidence / remaining condition |
|---|---|---|
| Auth0 login/session/logout | PASS (technical) | Supported verified server session is the only identity source; browser fallback login, editable identity cookie, role switching and impersonation were removed |
| Active-account authorization | PASS (technical) | Shared actor boundary requires `account_status=ACTIVE`; admin permission checks use the same boundary |
| Free/non-monetized MVP | PASS | `MONETIZATION_ENABLED=false`; payment, wallet, creator-studio, live/event and other unfinished routes are middleware-disabled |
| Public profiles/community | PASS for MVP scope | Explicit-public active profiles only; canonical responsive profile, safe serializer, deterministic pagination and owner-scoped approved media/albums |
| Public media | PARTIAL | Requires signed adult declaration, public visibility, completed upload, READY processing, approval and active public owner; upload finalization and object-mismatch quarantine are durably audited; staging migration, scanning and video processor remain |
| Public/member search | PASS for MVP | Anonymous search exposes only minimized explicit-public people, approved public media/albums and active public-author dating ads; signed-in search adds block-aware member records and approved posts; deterministic ranking; no AI |
| Dating interactions | PASS for current MVP | Owner-derived creation/deletion/reactivation with durable audit; durable save; reply enters participant-authorized messages and server-enforces the ad's gender, age, verification and approved-media requirements; unsupported local-only attachment input removed |
| Messaging | PARTIAL | Durable participant/block/recipient-preference checks, verified-sender enforcement, bounded message and conversation history, durable send/read audits, real unread state and safe notification navigation; fabricated messages and simulated receipts removed; attachments deliberately disabled; staging E2E remains |
| Follows/blocks/saves/comments/notifications | PASS for implemented lifecycle | Server-owned database state, durable mutation audits, same-origin notification targets, real event sources, and atomic blocks that remove relationships in both directions; staging migration required |
| Identity verification | PARTIAL | Private owner-submitted evidence, durable queue, MFA/granular admin signed access and audit; stronger age-assurance provider remains external |
| Moderation/admin/God Mode | PASS for secure foundation | Server roles, active account, MFA, short elevation, audit and explicit decision forms; real operational staffing remains owner responsibility |
| Privacy export/deletion/retention | PARTIAL | Comprehensive owner export plus legal-hold-aware, R2-first, resumable anonymization and durable run evidence are implemented; migration/scheduling/production evidence remain |
| Accessibility/responsive UX | PARTIAL | Semantic labels, explicit admin decisions, mobile navigation, lint/build pass; formal axe, keyboard and screen-reader test remains |
| Six-language localization | FAIL | Locale framework exists, but broad English hardcoding and professional policy translation remain |
| DPIA | LEGAL REVIEW | Technical input exists; controller/DPO/counsel must complete and approve |
| AVMS/DSA/GDPR/copyright policy | LEGAL REVIEW | Technical controls and drafts exist; qualified counsel approval remains mandatory |

## Verification evidence

- `npm run test`: 52 security boundary tests pass.
- `npm run typecheck`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass; Auth0 SDK emits a known non-fatal dynamic-dependency warning.
- Repository scan found no embedded Auth0, Supabase service-role, R2 secret, or Resend key fallback.
- Repository scan found no mounted browser impersonation or localStorage chat runtime.
- A second reachability audit found no active API or mounted MVP surface using the legacy in-memory identity store; Auth0 email verification now synchronizes only to the canonical durable profile and audit state.
- Remaining mock/local-only community, creator, live, event, referral and monetization fixtures are confined to centrally middleware-disabled future routes or unmounted legacy modules.

## Remaining launch blockers

1. Apply the staged Supabase migrations through `20260818_transactional_blocking.sql` to a backed-up staging project in order; verify schema, forced RLS, revoked browser grants, atomic relationship-ending blocks and rollback rehearsal. No migration application is claimed here.
2. Integrate and validate a privacy-preserving stronger age-assurance provider before explicit-content launch; migrate existing accounts safely.
3. Add malware/content scanning and a real video-processing pipeline. Videos remain non-approvable while processing is not `READY`.
4. Apply migration `20260815_retention_execution.sql`, configure the server-only retention scheduler secret, approve the proposed period, and validate alerts, completion notices and provider backup expiry.
5. Complete six-language product and policy localization and the required human/legal review.
6. Run clean two-member plus moderator browser E2E journeys against the migrated staging database, including blocked users, suspended users, expired sessions, upload approval/rejection and privacy deletion.

## Readiness

MVP readiness score: **73/100**.

Recommendation: **NO-GO** for a public explicit-adult production launch. **CONDITIONAL GO** only for controlled preview/staging testing with non-production data after migrations are applied. Production promotion remains prohibited until credentials are confirmed rotated, the external technical blockers above are verified, and the owner explicitly approves deployment.
# 2026-08-08 UX, marketing, and staging-data addendum

- PASS — Focused desktop and 390 × 844 mobile checks covered the public landing, People directory, and Dating directory.
- PASS — Primary navigation, filters, anonymous/authenticated boundaries, and honest empty states remain understandable at the tested breakpoint.
- PASS — A reversible 100-record staging seed now exists with exact environment/project confirmation, production-ref mismatch protection, reserved identities, and `is_demo` markers.
- PASS — Demo records cannot claim verification, online activity, direct messaging, followers, subscribers, or content activity. Public UI renders an explicit fictional-demo disclosure and per-card Demo labels.
- PASS — No external database was modified, no migration was applied, no deployment occurred, and no image-generation or paid service was used.
- PARTIAL — Empty production community supply remains a conversion risk; synthetic staging fixtures are not a substitute for a consented pilot cohort.
- LEGAL REVIEW — Draft policies and prior legal-review items still prevent an unrestricted public launch.

Recommendation: **CONDITIONAL GO for a closed staging/pilot evaluation; NO-GO for unrestricted public marketing.**
