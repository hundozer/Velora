# Intimo Route Access Matrix

Last reviewed: 2026-08-08. This matrix is the application contract, not a claim that every planned route already exists.

| Route | Access | Server enforcement | Public data rule | Status |
|---|---|---|---|---|
| `/` | Public | Public API returns allowlisted fields only | Explicitly public, active, discoverable profiles and safe dating summaries | Implemented |
| `/people` | Public | `/api/public/community` filters visibility/status and paginates | No email, Auth0 ID, intimate preferences, exact location, private media, or social graph | Implemented |
| `/profile/[id]` | Public summary; richer member view | Guest uses `/api/public/profiles/[id]`; member endpoint independently authorizes | Guest summary is minimized; member view respects visibility and blocks | Implemented, richer legacy view requires further consolidation |
| `/dating` | Public browsing target; authenticated contribution | Existing write API requires authenticated adult actor | Public listing currently uses minimized summaries on home; full public page conversion pending | Partial |
| `/photos`, `/videos`, `/albums`, `/album/[id]` | Public only for approved PUBLIC media/albums | Server moderation + visibility checks, signed delivery, active public owner, album-photo approval parity | Never expose raw private object keys, unapproved media, or private album membership | Implemented; video processing remains external |
| `/albums/manage` | Authenticated adult owner | Owner-derived album/media CRUD, transactional ordering, R2 upload validation and durable audit | Private/no-store; public publication still requires moderator approval | Implemented; staging migration required |
| `/login`, `/register`, `/auth/*` | Public | Auth0 SDK callback/session validation | No application data | Implemented |
| `/dashboard`, `/discovery`, `/messages`, `/notifications`, `/favorites`, `/settings` | Authenticated adult | APIs resolve server actor; sensitive endpoints enforce actor/ownership/participants | Private/no-store | Implemented with audit findings remaining |
| `/dating/create`, profile/media mutation | Authenticated; verification gates where required | Server actor, account status, rate/size/type and ownership checks | No client authority | Partial; media upload is gated and auditable |
| `/admin-mfa` | Assigned admin | Server assignment plus internal TOTP enrollment/session | No public data | Implemented |
| `/admin/*` | Assigned admin with MFA | Server layout and every API independently authorize | Private/no-store, audited | Implemented |
| `/admin/god/*` | SUPER_ADMIN + verified email + MFA + recent Auth0 + short elevation | Server God Mode session on every API | Sensitive access is reason-bound and audited | Implemented |
| Monetization routes (`/wallet`, `/membership`, creator commerce) | Disabled | `MONETIZATION_ENABLED=false` and route safety flags | Inaccessible | Implemented invariant |
| Deferred unsafe routes (`/live`, `/events`, `/communities`, `/creators`) | Disabled for MVP | Middleware/feature flags | Inaccessible until durable safety lifecycle exists | Implemented invariant |

## Anonymous public-profile allowlist

Allowed: profile ID, public username/display name, adult age when present, country/city at the selected location precision, headline, shortened bio, individual/couple type, genuine verification state, opted-in recent activity, and join timestamp.

Excluded: email, Auth0 subject, birth date, sexual orientation, sexual/intimate preferences, relationship/looking-for fields, exact location, distance, gallery/media URLs, followers/following, private contact information, verification evidence, reports, blocks, messages, moderation state, and administrative metadata.

## Non-negotiable behavior

- Client hiding is never an authorization control.
- `EVERYONE` plus the compatibility boolean `public_profile_visibility=true` is required for anonymous listing during migration.
- Only `ACTIVE` accounts with `discovery_disabled=false` are public.
- Anonymous results are deterministic and paginated.
- Blocking is enforced for authenticated member views and interactions. Public-profile behavior for blocks remains deliberately separate because anonymous viewers have no proven identity.
- Explicit media is not made public merely because the parent profile is public. Media needs its own PUBLIC visibility and APPROVED moderation state.
