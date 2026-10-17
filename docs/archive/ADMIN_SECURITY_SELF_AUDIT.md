# Intimo admin security self-audit

Date: 2026-08-07. Scope: repository controls only; migrations are staged and no production environment was tested.

| Adversarial attempt | Result | Control / remaining risk |
|---|---|---|
| Member opens `/admin` | PASS (code) | Server layout resolves Auth0 identity and database profile, then rejects non-admin subjects |
| Member directly calls admin API | PASS (code) | Every new endpoint uses `requireAdminPermission` |
| Moderator calls system settings | PASS (code) | `settings:view/manage` exists only for `SYSTEM_ADMIN` |
| Support accesses sensitive verification evidence | PASS (code) | Support has basic verification status only; sensitive user-detail fields are permission-filtered |
| Privacy admin bans a user | PASS (code) | Privacy role lacks `users:ban` |
| Content moderator changes roles | PASS (code) | No role-change API is exposed; role assignments are server environment configuration |
| Admin changes own privileged account state | PASS (code) | Target profile equal to actor is rejected |
| Bypass high-risk confirmation | PASS (code) | Suspend/ban/reactivate require exact confirmation and recent Auth0 authentication |
| Bypass MFA | PASS (production code) | Production admin layout and APIs require MFA evidence in Auth0 session claims |
| Modify/delete audit events | PASS (application boundary) | No mutation endpoint; browser DB roles revoked |
| View private evidence unnecessarily | PARTIAL | Verification lists minimize fields; dedicated evidence reveal/access logging is not yet implemented |
| Moderation action without audit | PASS (code path) | Moderation event and admin action event are required, but case/event writes are not yet a single transaction |
| IDOR on user action | PASS (code) | UUID validation, permission check and server-selected target; runtime DB integration test still required |
| Enable monetization | PASS (code) | Compile-time flag, middleware block, immutable admin API rule and staged false DB flag |

## Findings fixed

- Removed the former single unrestricted-admin assumption from active authorization.
- Removed finance roles from active administration.
- Kept legacy localStorage authority, impersonation, wallet and premium controls unmounted.
- Added role-specific permissions, MFA, recent-auth confirmation, self-action prevention, safe account states, reason/category capture and durable audit tables.
- Added privacy, verification, moderation, user and settings boundaries with server checks.

## Remaining high-risk gaps

1. Apply and validate migration `20260811_admin_command_center.sql` in staging; the console intentionally fails when required tables are absent.
2. Configure Auth0 to emit reliable `amr`/`acr` MFA evidence and test timeout/re-authentication behavior.
3. Move multi-write action/audit operations into transactional database functions.
4. Add a separate system-admin role-assignment workflow with two-person approval; current role changes are configuration-only.
5. Add sensitive-media reveal with purpose selection, wellbeing controls and access logging.
6. Add real database integration and browser tests for every role and IDOR path.
7. Add session listing/revocation via supported Auth0 organization/account capabilities.

Technical admin readiness: **68/100 — CONDITIONAL GO only for a private staging pilot; NO-GO for production operations** until items 1–3 and real role tests are complete.
