# Intimo pre-launch audit

Assessment started: 2026-08-07. Branch: `codex/intimo-secure-mvp`.

This is an engineering audit, not legal approval. The initial recommendation is **NO-GO**. The repository contains a materially improved authenticated/security foundation, but several visible member experiences still render fabricated data or rely on browser-only persistence.

## Initial status

- Authentication, onboarding, owned profile updates, deterministic discovery API, connections, blocking, basic direct messages, reports, private media, admin MFA and God Mode have real server boundaries.
- Monetization routes are centrally disabled and `MONETIZATION_ENABLED=false`.
- Events, live, creator studio and referrals are already safety-disabled.
- Production-facing mock imports remain in 17 files. Visible critical examples include the dashboard feed, creators, communities and profile fallback.
- Notifications, parts of profiles/albums, community chat and legacy overlays still use local storage.
- No clean two-user end-to-end test has yet been completed against production-like data.

## CRITICAL

### MOCK / DEMO DATA

1. The authenticated `/dashboard` contains hardcoded people, posts, albums, engagement, visitors and activity. A new account therefore sees fabricated social activity.
2. `/profile/[id]` falls back to `MOCK_PROFILES[0]` when a real remote profile is unavailable. A missing or forbidden profile can be misrepresented as another person.
3. `/creators` and `/communities` are visible in primary navigation but read mock collections.

### AUTHORIZATION / STATE CONSISTENCY

4. Profile albums/videos/comments retain browser-local persistence paths that are not canonical database state and cannot reliably harmonize with God Mode.
5. Community chat and membership use browser storage rather than participant-authorized server state.

## HIGH

### FUNCTIONALITY

1. Creator, community and several profile media controls visually promise durable behavior that is incomplete or disconnected.
2. Notification storage is local to one browser; cross-device delivery, genuine event creation and read state are not durable.
3. Discovery search and map components include mock-dependent paths; every visible filter has not yet been proven against the API.
4. Profile upload records media, but the surrounding gallery/album model still mixes Supabase rows, local storage and static fallback content.

### GOD MODE

5. Some God Mode views are real, while the legacy admin page still imports mock live/community metrics. User and admin surfaces therefore do not always observe the same state.

### UX / MOBILE

6. The media participant declaration was functionally clarified but needs a designed React modal and responsive visual pass.
7. Empty, loading and failure states are inconsistent across major routes.

## MEDIUM

- Multiple user-facing strings remain hardcoded outside the canonical localization system.
- Legacy payment, wallet, tipping and checkout source remains dormant and must stay unreachable.
- Some placeholder images and development fallbacks remain in source.
- Error handling sometimes logs failures without useful inline feedback.

## LOW

- Legacy Velora package/internal identifiers remain for migration compatibility.
- Auth0 SDK emits a non-fatal dynamic dependency build warning.

## Controlled correction order

1. Remove fabricated dashboard/profile behavior and hide mock-backed production routes.
2. Make core profile/discovery/messaging/media states truthful and durable.
3. Harmonize moderation/admin effects with the same canonical records.
4. Audit every remaining visible control; fix or hide non-functional behavior.
5. Complete responsive/accessibility/error/loading polish.
6. Run clean-user scenarios, red-team audit, second full audit and fix all resulting CRITICAL/HIGH issues.

## Readiness classification (initial)

| Feature | Initial classification |
|---|---|
| Auth0 login/session/logout | FUNCTIONAL_BUT_NEEDS_POLISH |
| Onboarding/profile creation | FUNCTIONAL_BUT_NEEDS_POLISH |
| Discovery API | FUNCTIONAL_BUT_NEEDS_POLISH |
| Connections/blocking/reports | FUNCTIONAL_BUT_NEEDS_POLISH |
| Basic direct messages | FUNCTIONAL_BUT_NEEDS_POLISH |
| Private media boundary | FUNCTIONAL_BUT_NEEDS_POLISH |
| Admin MFA/God Mode | FUNCTIONAL_BUT_NEEDS_POLISH |
| Dashboard feed | NOT_IMPLEMENTED (mock UI currently visible) |
| Creator directory/studio | HIDDEN_FOR_MVP required |
| Communities | HIDDEN_FOR_MVP required |
| Events/live/referrals | HIDDEN_FOR_MVP |
| Payments/subscriptions/tips/wallet | HIDDEN_FOR_MVP |
# 2026-08-08 public-community direction update

The product direction now permits anonymous community discovery. This does **not** convert every member-visible field or media object into public data. The first implementation slice introduces dedicated minimized public APIs, a content-first home, a paginated People directory, and a guest public-profile summary. See `ROUTE_ACCESS_MATRIX.md` and `PRODUCT_IMPLEMENTATION_MATRIX.md`.

Public explicit media remains unavailable until each object has durable visibility, moderation approval, participant/consent evidence, safe delivery, and the required age/legal controls. The launch recommendation therefore remains **NO-GO** while the complete master hardening program is unfinished.

