# Cleanup register

Classification: **DELETE NOW** (no runtime caller; verified by import-reachability
from every live `page`/`layout`/`route` + `middleware.ts`) · **MIGRATE THEN DELETE** ·
**KEEP**.

## DELETE NOW

### Unreachable source (49 files)
Computed on `codex/intimo-secure-mvp` @ f286f5c: files not reachable from any
enabled route. The routes in `MVP_SAFETY_DISABLED_ROUTES` and
`MONETIZATION_DISABLED_ROUTES` are redirected by middleware and count as unreachable.

- **Monetization:** `src/app/wallet/page.tsx`, `src/app/membership/page.tsx`, `src/components/payment/CheckoutModal.tsx`, `src/components/streaming/TipModal.tsx`, `src/lib/payment/PaymentService.ts`, `src/lib/currency/CurrencyService.ts`, `src/lib/security/payoutProtection.ts`
- **Creators / live / community mocks:** `src/app/creator-studio/page.tsx`, `src/app/creators/page.tsx`, `src/app/live/page.tsx`, `src/app/live/[id]/page.tsx`, `src/app/communities/page.tsx`, `src/app/communities/[id]/page.tsx`, `src/app/events/page.tsx`, `src/app/referrals/page.tsx`, `src/components/creator/CreatorActivationModal.tsx`, `src/components/creator/CreatorCard.tsx`, `src/components/creator/CreatorPreRegistrationModal.tsx`, `src/lib/streaming/LiveStreamService.ts`, `src/lib/data/communitiesChatrooms.ts`, `src/lib/mockData.ts`
- **Dormant second auth/identity layer:** `src/lib/auth/AuthorizationService.ts`, `apiMiddleware.ts`, `destinationRouter.ts`, `emailVerification.ts`, `mediaSecurity.ts`, `permissions.ts`, `sessionStore.ts`, `trustLevels.ts`, `userModel.ts`, `verificationEngine.ts`, `src/lib/auth0/tokenValidator.ts`, `src/lib/auth0/userStore.ts` (in-memory + localStorage user store), `src/lib/auth0/userSync.ts`
- **Unused "engines" / components:** `src/lib/compatibility.ts`, `src/lib/ranking/TransparentRankingEngine.ts`, `src/lib/security/contentModeration.ts`, `fraudDetection.ts`, `locationFuzzing.ts`, `signedUrls.ts`, `src/lib/notifications/PushNotificationService.ts`, `src/lib/social/connectionStore.ts`, `src/lib/social/visitorStore.ts`, `src/lib/supabase/mediaService.ts`, `src/lib/i18n/localizedContent.ts`, `src/components/community/PublicProfileView.tsx`, `src/components/profile/GetVerifiedModal.tsx`, `src/components/security/WatermarkedMedia.tsx`, `src/components/ui/Tabs.tsx`

### Dead schemas and tests
- `prisma/` + deps `prisma`, `@prisma/client` (37 models incl. Wallet/LiveStream/Subscription; never imported)
- `db/schema.sql` (unused)
- `supabase/migration.sql` (legacy bootstrap with "Allow all" RLS policies; **must never be applied**)
- `src/lib/auth/__tests__/*`, `src/lib/storage/__tests__/*`, `tests/authentication.test.ts` (not run by `npm test`; they test the dormant layer)
- In `tests/security-boundaries.test.mjs`, drop the assertions that read `connectionStore.ts`, `visitorStore.ts` and `GetVerifiedModal.tsx`.

### Infrastructure
- Vercel project **`intimo`** (`prj_SMHQhKvme8yDlsmmtXFYtYBuKPsx`): zero deployments; only two Supabase env vars. Delete it, then **rename `velora` → `intimo`** (domains and deployments are kept).
- Vercel Preview env `MONETIZATION_ENABLED` (hard-coded in source; the env var is unused).

### Status
**Done 2026-10-17** (issue #6): all items above except the Vercel actions were deleted; `npm test`, `tsc`, lint and build pass.

## MIGRATE THEN DELETE
| Item | Replacement | Delete when |
|---|---|---|
| Auth0 (`src/lib/auth0/*`, `@auth0/nextjs-auth0`, `/auth/*` SDK routes, `AUTH0_*` env ×6 per env, `INTIMO_ADMIN_AUTH0_SUBS`, `INTIMO_ADMIN_ROLE_ASSIGNMENTS`) | Supabase Auth | ADR-002 cutover verified in prod |
| `profiles.auth_id` (Auth0 sub) | `profiles.user_id` → `auth.users.id` | after cutover + 30 days |
| God Mode (`/admin/god/*`, `elevated_admin_sessions`, `api/admin/god/*`, `GodModeConsole`) | single `ADMIN` role + MFA | with the Supabase Auth admin PR |
| Internal admin TOTP (`adminTotp.ts`, `adminMfaSession.ts`, `admin_mfa_*`, `INTIMO_ADMIN_MFA_*` env) | Supabase Auth MFA (`aal2`) | same PR |
| `connections`, `friendships` (+ `/api/connections`, `/api/friends`) | `interests` + `saved_items` | after data copy |
| `photo_albums`, `videos` (legacy JSON albums with credit pricing) | `media_*` tables | after verifying zero rows / copying |
| `chat_messages` (rooms) | none until P2 | after verifying zero rows |
| `dating_ads.require_vip`, `photo_albums.credits_price`, `profiles.monthly_subscription_price`/`subscribers_count`/`member_tier` | none | in the Plans migration |
| `src/lib/supabase/client.ts` hard-coded URL + publishable key | env-only `@supabase/ssr` browser client | Supabase Auth PR (it is imported by type helpers today) |
| Per-message-read and per-send `appendDurableAudit` | none (admin audit only) | messaging realtime PR |
| In-memory `rateLimiter.ts` | Postgres `rate_limit_hit()` | Phase 1 |
| Retention engine (`retention_*`, `/api/internal/retention/run`) | one deletion cron | Phase 1 |
| 6 locales (de, hu, ro, sk + en, cs) | EN + CS | Phase 1 (Prague) |
| "Velora" naming: package name, `velora-*` Tailwind tokens, `velora_age_verified` key, Supabase project name, Vercel project name, `velora-six-ashen.vercel.app` | "intimo" | Phase 0 rename PR (mechanical) |
| Minified one-line source files | `prettier --write` | Phase 0 (mechanical, separate commit) |

## KEEP
- `supabase/migrations/*` (canonical schema)
- R2 media pipeline (`api/media/*`, `lib/storage/*`)
- Server actor pattern (re-pointed to Supabase Auth)
- Block / report / moderation case / appeal / verification review APIs
- Dating ads → Plans (simplified)
- Messaging API (gets realtime + images)
- `/api/profile/me` owner-only write boundary
- Privacy export/deletion/consents APIs
- `features.ts` route redirects (old links keep redirecting after the pages are deleted)
- Static security-boundary tests (expand them with Playwright e2e)
- `docs/archive/*` legal/DPIA material (reference for counsel)
