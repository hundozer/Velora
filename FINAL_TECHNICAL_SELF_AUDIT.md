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
| Public media | PARTIAL | Requires signed adult declaration, public visibility, completed upload, READY processing, approval and active public owner; staging migration, scanning and video processor remain |
| Member search | PASS for MVP | People, approved media, active dating ads and approved posts; block/privacy enforcement; deterministic newest-first ranking; no AI |
| Dating interactions | PASS for current MVP | Owner-derived creation/deletion/reactivation; durable save; reply enters participant-authorized messages |
| Messaging | PARTIAL | Durable participant/block checks, unread state and notifications; attachments deliberately disabled; pagination and staging E2E remain |
| Follows/blocks/saves/comments/notifications | PASS for implemented lifecycle | Server-owned database state, durable mutation audits, real event sources, and atomic blocks that remove relationships in both directions; staging migration required |
| Identity verification | PARTIAL | Private owner-submitted evidence, durable queue, MFA/granular admin signed access and audit; stronger age-assurance provider remains external |
| Moderation/admin/God Mode | PASS for secure foundation | Server roles, active account, MFA, short elevation, audit and explicit decision forms; real operational staffing remains owner responsibility |
| Privacy export/deletion/retention | PARTIAL | Comprehensive owner export plus legal-hold-aware, R2-first, resumable anonymization and durable run evidence are implemented; migration/scheduling/production evidence remain |
| Accessibility/responsive UX | PARTIAL | Semantic labels, explicit admin decisions, mobile navigation, lint/build pass; formal axe, keyboard and screen-reader test remains |
| Six-language localization | FAIL | Locale framework exists, but broad English hardcoding and professional policy translation remain |
| DPIA | LEGAL REVIEW | Technical input exists; controller/DPO/counsel must complete and approve |
| AVMS/DSA/GDPR/copyright policy | LEGAL REVIEW | Technical controls and drafts exist; qualified counsel approval remains mandatory |

## Verification evidence

- `npm run test`: 47 security boundary tests pass.
- `npm run typecheck`: pass.
- `npm run lint`: pass with no warnings.
- `npm run build`: pass; Auth0 SDK emits a known non-fatal dynamic-dependency warning.
- Repository scan found no embedded Auth0, Supabase service-role, R2 secret, or Resend key fallback.
- Repository scan found no mounted browser impersonation or localStorage chat runtime.
- Mock/local-only community, creator, live, event and referral surfaces remain middleware-disabled.

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
