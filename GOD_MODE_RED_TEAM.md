# God Mode adversarial review

Date: 2026-08-07. Repository review only; migrations and Auth0 claims are not production-verified.

## MFA implementation

God Mode does not depend on Auth0's paid MFA add-on. Intimo enrolls only server-authorized administrators in RFC 6238-compatible TOTP. The shared secret is encrypted with AES-256-GCM using the server-only `INTIMO_ADMIN_MFA_ENCRYPTION_KEY`; browser roles and Supabase browser roles have no table access. Five invalid attempts lock verification for 15 minutes. A verified admin session lasts 30 minutes, while entering God Mode always requires an additional fresh TOTP code and creates a separate 15-minute elevation session.

Losing the encryption key requires administrator re-enrollment. Never copy the key into client configuration, logs, source control, or Supabase. No bypass endpoint exists.

| Attack | Result | Evidence / residual risk |
|---|---|---|
| Member/moderator/SYSTEM_ADMIN calls God API | PASS (code) | `requireGodMode` requires internal `SUPER_ADMIN` role |
| Frontend or Auth0 metadata forges role | PASS (code) | Role comes from server environment bootstrap or locked server database assignment |
| SUPER_ADMIN without MFA elevates | PASS (production code) | Existing admin API gate requires MFA; entry also requires verified email and fresh authentication |
| Reuse expired elevation | PASS (code) | Server checks expiry/revocation on every call; TTL 15 minutes |
| Steal database token | PASS (design) | Only SHA-256 token hash is stored; cookie is httpOnly, secure in production and SameSite Strict |
| Direct API bypass | PASS (code) | God endpoints call `requireGodMode`; ordinary API authorization remains unchanged |
| Delete/rewrite audit | PASS (application boundary) | No audit mutation endpoint; browser roles revoked |
| Retrieve password/Auth0 secret | PASS | No endpoint or UI returns credentials or secret values |
| Steal user session through view-as | PASS | Read-only context simulation; no Auth0 token, credentials, sending or mutation |
| Unrestricted private message/media access | PASS (boundary) | Sensitive-access request requires valid case, reason and confirmation; resource evidence endpoint remains separate |
| Silent sensitive access | PASS (code) | `sensitive_access_events` insert must succeed first |
| Remove last SUPER_ADMIN | PASS (code) | Active count prevents final self-revoke/suspension |
| Self-grant from browser | PASS (code) | Requires active God Mode; database browser roles revoked |
| Enable monetization | PASS | Existing settings endpoint refuses enabling the flag; runtime compile-time gate remains false |

## Remaining high risks

1. Role assignment and its audit insertion are not yet a single database transaction.
2. Environment bootstrap assignments can only be changed through infrastructure access; document dual control and recovery ownership.
3. Intimo TOTP enrollment, lockout and session expiry must be integration-tested against staging; Auth0 `auth_time` must also be verified.
4. Session revocation across Auth0 devices is not implemented.
5. Evidence-retrieval endpoints for messages/private media should enforce exact case-resource linkage, not merely a valid case.
6. Emergency feature flags exist but user-facing services do not all consume them yet.
7. Real multi-role integration, expiry, replay, CSRF and concurrency tests require a staging database and Auth0 test tenant.

Technical God Mode readiness: **64/100 — NO-GO for production, CONDITIONAL GO for a private staging security exercise after applying migrations.**
