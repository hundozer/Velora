# Design migration — 28 November 2026

Status: partial implementation; not approved for release.

Authority: docs/brand/BRAND.md and src/app/globals.css. Authentication and notification templates migrated to Graphite, Paper, Ice and Ember. Email-safe fallback typography retained; no remote logo dependency added to discreet email. Existing links, copy, unsubscribe signatures and permissions unchanged. Legacy aliases remain until all consumers are reviewed. Semantic warning colors are not prohibited.

## Second implementation batch

Shared Button, Card, Input, Badge and Modal migrated to semantic styles. Primary/secondary Button variants added without removing legacy public variants. Navigation, device settings, install banner and installed notification offer updated. Touch targets and modal scrolling improved. No actual browser or device acceptance yet. Legacy token consumers across individual pages remain to be audited; do not remove aliases until that is done.

## Subsequent implementation batches

Account pages, discovery filters, profile stories, chat and plan screens migrated away from targeted gold/copper aliases; Founding Member promotion email palette aligned. Navigation and messaging regression assertions updated to preserve the same checks with Ice tokens. CI passed at 6496e38ac3fe9fce8861e8dcf7def8d8b59cba77 before the latest email and audit changes.

Run `node scripts/audit-design-system.mjs` for the residual inventory; ordinary CI now emits it through tests/design-migration.test.mjs. Strict mode is available but not yet enabled because residual references must be reviewed. The scan is pattern-based, not proof of visual compliance or exhaustive color equivalence. Route checklist remains unverified in browser.

## Route inventory (discovered, not visually verified)

- [ ] `src/app/about/page.tsx`
- [ ] `src/app/account-restricted/page.tsx`
- [ ] `src/app/activity/page.tsx`
- [ ] `src/app/admin-mfa/page.tsx`
- [ ] `src/app/admin/audit/page.tsx`
- [ ] `src/app/admin/beta-feedback/page.tsx`
- [ ] `src/app/admin/communities/page.tsx`
- [ ] `src/app/admin/content/page.tsx`
- [ ] `src/app/admin/events/page.tsx`
- [ ] `src/app/admin/god/admins/page.tsx`
- [ ] `src/app/admin/god/audit/page.tsx`
- [ ] `src/app/admin/god/communities/page.tsx`
- [ ] `src/app/admin/god/content/page.tsx`
- [ ] `src/app/admin/god/emergency/page.tsx`
- [ ] `src/app/admin/god/events/page.tsx`
- [ ] `src/app/admin/god/live/page.tsx`
- [ ] `src/app/admin/god/moderation/page.tsx`
- [ ] `src/app/admin/god/page.tsx`
- [ ] `src/app/admin/god/privacy/page.tsx`
- [ ] `src/app/admin/god/system/page.tsx`
- [ ] `src/app/admin/god/users/page.tsx`
- [ ] `src/app/admin/god/verification/page.tsx`
- [ ] `src/app/admin/guest-list/page.tsx`
- [ ] `src/app/admin/invitations/page.tsx`
- [ ] `src/app/admin/invite-codes/page.tsx`
- [ ] `src/app/admin/live/page.tsx`
- [ ] `src/app/admin/moderation/page.tsx`
- [ ] `src/app/admin/numbers/page.tsx`
- [ ] `src/app/admin/page.tsx`
- [ ] `src/app/admin/plans/page.tsx`
- [ ] `src/app/admin/privacy/page.tsx`
- [ ] `src/app/admin/profile/page.tsx`
- [ ] `src/app/admin/queues/page.tsx`
- [ ] `src/app/admin/reports/page.tsx`
- [ ] `src/app/admin/rooms/page.tsx`
- [ ] `src/app/admin/scene/page.tsx`
- [ ] `src/app/admin/settings/page.tsx`
- [ ] `src/app/admin/users/[id]/page.tsx`
- [ ] `src/app/admin/users/page.tsx`
- [ ] `src/app/admin/verification/page.tsx`
- [ ] `src/app/age-policy/page.tsx`
- [ ] `src/app/album/[id]/page.tsx`
- [ ] `src/app/albums/manage/page.tsx`
- [ ] `src/app/albums/page.tsx`
- [ ] `src/app/beta-feedback/page.tsx`
- [ ] `src/app/community-guidelines/page.tsx`
- [ ] `src/app/community-workspace/page.tsx`
- [ ] `src/app/connections/page.tsx`
- [ ] `src/app/content-policy/page.tsx`
- [ ] `src/app/cookies/page.tsx`
- [ ] `src/app/copyright/page.tsx`
- [ ] `src/app/dashboard/page.tsx`
- [ ] `src/app/dating/new/page.tsx`
- [ ] `src/app/dating/page.tsx`
- [ ] `src/app/favorites/page.tsx`
- [ ] `src/app/founding-member/page.tsx`
- [ ] `src/app/goodbye/page.tsx`
- [ ] `src/app/guest-list/page.tsx`
- [ ] `src/app/legal/[slug]/page.tsx`
- [ ] `src/app/login/page.tsx`
- [ ] `src/app/me/boundaries/page.tsx`
- [ ] `src/app/me/desires/page.tsx`
- [ ] `src/app/me/identity/page.tsx`
- [ ] `src/app/me/invite/page.tsx`
- [ ] `src/app/me/page.tsx`
- [ ] `src/app/me/private-photos/page.tsx`
- [ ] `src/app/member-home/page.tsx`
- [ ] `src/app/messages/page.tsx`
- [ ] `src/app/moderation/page.tsx`
- [ ] `src/app/notifications/page.tsx`
- [ ] `src/app/onboarding/page.tsx`
- [ ] `src/app/page.tsx`
- [ ] `src/app/people/@sheet/(..)profile/[id]/page.tsx`
- [ ] `src/app/people/page.tsx`
- [ ] `src/app/personal-ads/new/page.tsx`
- [ ] `src/app/personal-ads/page.tsx`
- [ ] `src/app/photos/page.tsx`
- [ ] `src/app/privacy/page.tsx`
- [ ] `src/app/profile/[id]/page.tsx`
- [ ] `src/app/register/page.tsx`
- [ ] `src/app/reset-password/page.tsx`
- [ ] `src/app/rooms/[id]/page.tsx`
- [ ] `src/app/rooms/[id]/settings/page.tsx`
- [ ] `src/app/rooms/page.tsx`
- [ ] `src/app/safety/page.tsx`
- [ ] `src/app/scene/page.tsx`
- [ ] `src/app/search/page.tsx`
- [ ] `src/app/settings/page.tsx`
- [ ] `src/app/stories/[owner]/page.tsx`
- [ ] `src/app/stories/new/page.tsx`
- [ ] `src/app/stories/page.tsx`
- [ ] `src/app/terms/page.tsx`
- [ ] `src/app/tonight/invitation/[id]/page.tsx`
- [ ] `src/app/tonight/new/page.tsx`
- [ ] `src/app/tonight/page.tsx`
- [ ] `src/app/update-password/page.tsx`
- [ ] `src/app/verify-age/page.tsx`
- [ ] `src/app/verify-email/page.tsx`
- [ ] `src/app/videos/page.tsx`
- [ ] `src/app/videos/upload/page.tsx`

## Release gates

- Review all legacy utility consumers, shared controls, assets and email renderers.
- Test each route at 320, 375, 390, 430, 768, 1024, 1440 and 1920 px, Czech and English where supported, synthetic member/admin sessions and standalone PWA.
- Capture before/after screenshots without private data; verify contrast, focus, keyboard and safe areas.
- Run npm run check and npm run e2e; preserve PWA cache and security regression tests.
- Remove compatibility aliases only after consumer migration; expand color checks to all source files with explicit semantic exceptions.
