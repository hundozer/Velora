# User capability matrix

Status reflects the initial pre-launch audit and must be updated as corrections are verified.

| ID | Capability | Frontend route | API endpoint | Canonical model | Auth | Verification | Privacy impact | God Mode visibility/action | Audit | Status | Mock risk | UX | Issues |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ACC-01 | Register/login/logout | `/`, `/login`, `/register`, `/goodbye` | Auth0 SDK routes | Auth0 identity/session | Yes | Email for member access | High | User status/session controls | Auth/admin events | Functional | Low | Partial | Redirect polish and full expiry/recovery test pending |
| ACC-02 | Email verification | `/verify-email` | `/api/auth/verify-status`, `/api/auth/resend-verification` | Auth0 user | Yes | Required | Medium | Verification queue/status | Required | Functional | Medium | Partial | Legacy verification store must remain non-authoritative |
| PROF-01 | Create/edit profile | `/onboarding`, `/profile/[id]` | `/api/profile/me`, `/api/profiles/[id]` | `profiles` | Yes | Adult gate | Very high | Inspect/restrict/hide | Required for admin | Partial | Critical | Poor | Mock profile fallback and local state remain |
| MEDIA-01 | Upload/read media | `/profile/[id]` | `/api/media/presign-upload`, `/api/media/[id]`, completion | `media_objects`, participant declarations | Yes | Adult gate | Very high | Inspect/hide/remove/restore planned | Required | Functional | Medium | Partial | Gallery state/delete/reorder/scanning incomplete |
| DISC-01 | Discover/search/filter | `/discovery` | `/api/discovery/profiles` | `profiles`, blocks | Yes | Adult gate | High | Restricted/hidden states enforced | Read events as needed | Partial | High | Partial | Every visible filter/map path not verified |
| SOC-01 | Follow/favourite | profile/discovery/favourites | `/api/connections` | `connections` | Yes | Adult gate | Medium | Relationship visibility when justified | Sensitive admin access | Functional | Medium | Partial | Counts/notifications need full persistence test |
| MSG-01 | Direct messages | `/messages` | `/api/messages` | `direct_messages`, blocks | Yes | Adult gate | Very high | Case-bound policy/legal access only | Required for privileged access | Partial | Medium | Partial | Read/unread, attachments and delivery feedback incomplete |
| SAFE-01 | Block/report/appeal | profile/messages/report modal | `/api/blocks`, `/api/reports`, appeal | blocks, moderation cases/events | Yes | Adult gate | Very high | Review/resolve/restrict/suspend | Required | Functional | Low | Partial | User history/appeal coverage incomplete |
| PRIV-01 | Privacy/export/delete | `/settings`, legal/privacy pages | privacy APIs, delete account | privacy requests/settings/consents | Yes | Session ownership | Very high | Privacy-admin workflow | Required | Partial | Medium | Worker/object cleanup and operational SLA incomplete |
| NOTIF-01 | Notifications | navbar, `/notifications` | None canonical | Browser local storage | Yes | No | Medium | None canonical | Missing | Not production ready | High | Partial | Must become durable or remain limited to truthful system state |
| DASH-01 | Member home/feed | `/dashboard` | None canonical | Hardcoded arrays | Yes | Adult gate | High | Disconnected | Missing | Not implemented | Critical | Polished but misleading | Must remove fabricated activity |
| CREATOR-01 | Free creator mode/directory | `/creators`, `/creator-studio` | Incomplete | profiles/media/connections intended | Yes | Stronger controls intended | Very high | Intended moderation | Required | Not production ready | Critical | Misleading | Hide until durable |
| COMM-01 | Communities | `/communities` | None canonical | Browser/mock | Yes | Adult gate intended | High | Mock legacy controls | Missing | Not implemented | Critical | Misleading | Hide until durable |
| EVENT-01 | Events/live | `/events`, `/live` | None canonical | Mock | Yes | Legal/age review | Very high | Mock legacy controls | Missing | Hidden for MVP | High | N/A | Keep safety-disabled |
| PAY-01 | Monetization | `/membership`, `/wallet` | Disabled | Dormant future models | No active access | N/A | Very high | Cannot enable | Required if future | Hidden for MVP | High | N/A | `MONETIZATION_ENABLED=false` |

