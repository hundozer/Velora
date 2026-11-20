# Intimo Social V1 — connected experience rollout

Owner-approved direction: equal product priority for **Connect / Belong / Express**.
This file tracks work, not evidence of release.

## Existing features — do not rebuild
- Connect: `/api/friends`, `/api/friends/list`, `/connections`, mutual interest in `/api/activity`, `/people`.
- Belong: existing built-in and member-created `/rooms`, room APIs and expiry/locking.
- Express: approved media albums, Stories, and existing `/api/feed` with newest/followed/friends filters.
- Private media and Stories use dedicated authorization endpoints; the feed must never imply media access.

## Slice A — discovery links (this PR)
- Present the three equal pillars on authenticated member home with existing routes.
- No database migration, no relationship mutation, no new feed source and no change to privacy grants.
- Keyboard focus, mobile breakpoints and link destinations covered by source contract tests.
- Release after CI + PWA device review.

## Slice B — relationship flow and permission review
- Verify end-to-end REQUEST → ACCEPT / DECLINE / REMOVE and blocked/member-hidden cases.
- Add explicit declined/cancelled feedback and pending request affordances where missing.
- Validate that friendship never grants private-photo access, bypasses blocked messaging or broadens story audience.
- Run real staging two-member tests with cleanup. No production fixtures.

## Slice C — community continuity
- Audit existing room ACLs, locked-room semantics, host controls, member discovery and member blocking.
- Add durable membership and host moderation only after a reviewed migration/RLS design.
- Verify former/blocked members lose access and room expiration remains enforced.

## Slice D — integrated feed and content
- Improve feed information architecture using existing `/api/feed` and content types first.
- Audit audience selection in newest/followed/friends for FOLLOWERS_ONLY, FRIENDS_ONLY and private media.
- Gate all thumbnails and links through the underlying content/media authorization; no private snippets in metadata, notifications or logs.
- Add pagination only with stable visibility-safe cursoring and regression coverage.

## Shipping requirements
1. TypeScript, ESLint, unit/policy tests and Next production build pass on current head.
2. Authenticated installed iPhone PWA review: safe areas, scroll, tab navigation, empty states and 44px touch targets.
3. Access tests for adults, blocked members, pending/removed friends and revoked private-album grants.
4. No tracking of intimate preferences or message/media text in analytics.
5. DB changes require migration receipt, staging RLS tests and an explicit deployment gate before merge.
6. Measure seven-day returning members, accepted connections, room participation, and authorized content engagement; use baseline before setting targets.

## Why split delivery
The codebase already has most named features. A full rewrite would introduce multiple independent access-control changes in a privacy-sensitive application. Ship discovery first, then verify existing journeys, then expand membership and feed capabilities behind audited gates.
