# Security authorization matrix

All decisions are server-side. Browser roles, local storage and caller-supplied owner IDs are non-authoritative.

Administrative access requires a verified Auth0 identity, a server-owned role assignment, and either an Auth0 MFA assertion or a valid Intimo TOTP MFA session. God Mode additionally requires `SUPER_ADMIN`, verified email, authentication within five minutes, explicit typed intent, an operational reason, and a fresh TOTP code. Intimo TOTP credentials and sessions are service-role-only database records protected by forced RLS.

| Resource/action | Anonymous | Authenticated adult member | Owner/participant | Moderator/admin | Control/status |
|---|---|---|---|---|---|
| Public/legal/health | Read | Read | Read | Read | Public routes; legal drafts flagged |
| Privacy rights/delete | No | Own only, even if age state fails | Own | Restricted support | Verified session and profile ownership; deletion worker partial |
| Discovery/member profile | No | Visibility/block qualified | Own | Authorized review | Server actor + adult gate + minimized serializer |
| Profile update | No | No other profiles | Own allowlisted fields | Separate privileged route only | Authority fields stripped |
| Connections/blocks | No | Target validated/block-aware | Own relation | Read only when justified | Server-derived actor |
| Messages | No | No arbitrary conversation | Participants only | Policy/legal access only | Pair-derived conversation + block checks; attachments disabled until safely implemented |
| Media upload/read | Approved public media after signed adult declaration | Upload after adult gate/declaration | Owner/private entitlement | Moderation/verification evidence entitlement when recorded | Size/type/rate limits, signed URLs and audited evidence views; scanning incomplete |
| Unified search | No member-only results | Block/privacy-qualified deterministic results | Own visible records | Same visibility rules | No AI ranking or client-side authority |
| Report/create | No | Create structured report | Reporter can view own where exposed | Assigned reviewers | Critical escalation; universal UI incomplete |
| Moderation/copyright decision | No | Appeal/notice only | Appeal own affected case | DB-admin plus Auth0-sub allowlist | MFA and granular scopes missing; immutable events staged |
| Monetization/payment | No | No | No | No | Centrally disabled and middleware blocked |
| Live/events/creator studio | No | No | No | No production bypass | MVP safety-disabled |

Production prerequisites: apply/review least-privilege migrations; use server-only credentials; validate MFA and short sessions in production; alert on critical actions; and test horizontal/vertical authorization, IDOR, blocked-user behavior, expired sessions and failure paths against a real test database.

## Administrative permissions

Legend: ✓ allowed, — denied. Every allowed action also requires Auth0 authentication, administrative MFA in production, server-side role validation and a durable reasoned audit event where sensitive.

| Action | Support | Content moderator | Trust & safety | Privacy | Community | System |
|---|---:|---:|---:|---:|---:|---:|
| View basic account | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View sensitive verification metadata | — | — | ✓ | — | — | ✓ |
| Warn user | ✓ | — | ✓ | — | — | ✓ |
| Restrict/suspend/ban/reactivate | — | — | ✓ | — | — | ✓ |
| Remove/restore content | — | ✓ | ✓ | — | ✓ | — |
| Review suspected-minor/NCII/exploitation case | — | — | ✓ | — | — | — |
| Decide verification | — | — | ✓ | — | — | — |
| Process privacy request/deletion lifecycle | — | — | — | ✓ | — | — |
| Moderate communities/events | — | — | — | — | ✓ | — |
| View privileged audit log | — | — | ✓ | ✓ | — | ✓ |
| Manage feature flags/security settings | — | — | — | — | — | ✓ |
| Change admin role | — | — | — | — | — | ✓ (never own role) |

Active roles are `SYSTEM_ADMIN`, `TRUST_AND_SAFETY_ADMIN`, `CONTENT_MODERATOR`, `PRIVACY_ADMIN`, `SUPPORT_ADMIN`, and `COMMUNITY_ADMIN`. There is no finance role in the free MVP. `MONETIZATION_ENABLED` cannot be enabled through the admin API.

### SUPER_ADMIN / God Mode

`SUPER_ADMIN` is not inherited by `SYSTEM_ADMIN`. Normal admin permissions remain active, but God Mode additionally requires verified email, MFA evidence, authentication within five minutes at entry, explicit reason/confirmation and an active 15-minute elevated server session. The random elevation token is httpOnly and only its SHA-256 hash is stored.

God Mode can manage admin assignments, view the platform-wide operational dashboard, use critical system flags and request case-bound sensitive access. It cannot delete or rewrite audit history, expose secrets, access passwords, open unrestricted SQL, silently authenticate as another user, fabricate consent, or enable monetization. The last active SUPER_ADMIN cannot suspend or revoke their own assignment.
