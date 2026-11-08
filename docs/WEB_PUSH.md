# Web push (device notifications)

Status: built 2026-11-09, **off until configured**. First step of the mobile plan:
an installable web app (PWA) before any app-store app (ROADMAP principle 7).

## What members get
- A discreet notification for the same four return categories as email: new message,
  mutual interest, private photo request/approval, plan reply.
- Text is always generic ("Intimo — Someone wrote to you."), in the member's language.
  Never names, photos, desires or message text, because it can show on a lock screen.
- At most one per category every 2 minutes; newer ones replace older ones (`tag`).
- Tapping opens the right screen. The home-screen icon gets a badge, cleared on open.
- iPhone/iPad: works only once Intimo is added to the Home Screen (iOS 16.4+).
  The UI says so instead of offering a button that can't work.

## Where it lives
| Piece | File |
|---|---|
| Table + opt-out column | `supabase/migrations/20261109000000_web_push.sql` |
| Policy (endpoint allowlist, copy, opt-outs) | `src/lib/notifications/pushPolicy.mjs` |
| Sender (best effort, never fails the action) | `src/lib/notifications/webPush.ts` |
| Device + preferences API | `src/app/api/push/subscription/route.ts` |
| Browser helpers | `src/lib/notifications/pushClient.ts` |
| Service worker `push` / `notificationclick` | `public/sw.js` |
| UI | `AppOnThisDevice` (Me + Settings) and `PushPreferences` (Settings) |

Events: `api/messages` (MESSAGE / PLAN_REPLY), `api/interests` (new mutual interest only),
`api/private-access` (request to owner; first grant to viewer). Denials stay silent.

## Safety
- Subscriptions are server-only (RLS on, no anon/authenticated grants).
- Only real push-service hosts are accepted (FCM, Mozilla, Apple, Windows), so a member
  can't make the server call an arbitrary URL.
- No push across a block, to inactive or demo accounts, or for an opted-out category.
- Sign-out removes this device's subscription, so a shared phone doesn't keep notifying.
- Dead subscriptions (404/410 or 5 failures) are deleted.

## Turning it on
1. Apply the migration to staging, then production.
2. Generate keys once: `npx web-push generate-vapid-keys`.
3. In Vercel (Preview and Production, separate keys are fine) set
   `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY` (sensitive) and
   `WEB_PUSH_SUBJECT=https://intimo.live`. Redeploy.
4. Test on a real Android phone (Chrome) and a real iPhone with Intimo on the Home Screen:
   Me → "Allow discreet notifications", then have a second account message you while the app is closed.

Rotating the keys invalidates every subscription; members would need to tap "Allow" again.
Rollback: unset the env vars (sending stops immediately); the migration has a rollback note.
