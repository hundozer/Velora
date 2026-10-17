# Intimo MVP definition

> The smallest version of Intimo that a real group of adults in Prague could join
> and use repeatedly.

This replaces the earlier MVP scope (adults-only onboarding, profile, media,
Prague discovery, filters, favourites, messaging, blocking, reporting, settings).
That list was **necessary but not sufficient**: it contained no intent mechanism and
no return triggers. Compared with Amateri, three things are added (**Plans**,
**feedback signals**, **email notifications**) and several are cut (friend graph,
follow, feed, 28 ad categories, multi-role admin, retention engine).

## The 8 MVP capabilities

### 1. Account, 18+ and onboarding
- **Story:** As a new visitor I confirm I'm 18+, create an account with email and password (or magic link), verify my email, and set up a profile in under 3 minutes.
- **UX:** Age gate → sign-up → "check your email" → 4-step onboarding (who you are: single/couple; basics: nickname, DOB, gender(s), orientation; looking for: chips + Prague area; photo) → home. Back navigation, inline validation, progress bar.
- **Backend:** Supabase Auth (email+password, magic link, confirm email, reset). On first sign-in a DB trigger creates the `profiles` row with `id = auth.uid()`. DOB is validated as ≥18 server-side, and for couples both partners must be ≥18.
- **DB:** `profiles` (id = `auth.users.id`), `profile_partners` (couples), `age_declarations`.
- **Moderation/privacy:** age declaration is stored with timestamp and IP hash; there is a self-service account deletion path that hard-deletes within 30 days.
- **Acceptance:** a new user completes sign-up to home on a 375 px phone with no dead ends; an under-18 DOB is blocked server-side; unconfirmed email cannot reach member APIs; password reset and logout work; sessions persist across refreshes and devices.

### 2. Profile and private photos
- **Story:** As a member I show who I am and what I'm looking for, keep explicit photos private, and decide who sees them.
- **UX:** Profile header (photo, name, age(s), area, online bucket, verified badge, looking-for chips), bio, public photos, a locked private album with "Request access", and actions: Message, Interest, Favourite, ⋯ (block/report).
- **Backend:** R2 presigned upload → moderation queue → approved. Private album grants per viewer, revocable.
- **DB:** `media_objects`, `media_albums`, `media_album_items`, `album_access_grants` (new: owner, viewer, status requested/granted/denied/revoked).
- **Moderation/privacy:** every photo goes through the review queue before public visibility; private photos are only served through authenticated, grant-checked URLs; the explicit-media blur default is on.
- **Acceptance:** upload works in production on a phone; a private photo is never served to a non-grantee (tested); revoking a grant removes access immediately; a member without an approved photo is hidden from discovery rails.

### 3. Prague discovery
- **Story:** As a member I see who's around, who's new and who's online, and I can filter for what I want.
- **UX:** Home rails ("Online now", "New in Prague", "Plans near you", "Looking for what you're looking for"), plus a Browse grid with filter sheet (type, gender, age, looking-for, distance bucket, has-photo, verified, online). Empty rails hide; the recency window widens automatically.
- **Backend:** one server-side query with filters, keyset pagination, approximate distance from a stored Prague-district centroid (never GPS precision), blocks excluded both ways.
- **DB:** `profiles.area_id`, `areas` (Prague districts + nearby cities with centroid), `profiles.last_active_at` updated on authenticated requests (throttled to 1/5 min).
- **Acceptance:** filters execute server-side with p95 < 300 ms at 10k profiles; blocked users never appear; no screen shows a zero count.

### 4. Plans (intent posts)
- **Story:** As a member I post what I'm looking for ("Tonight, Vinohrady, couple looking for a woman for drinks then…") and get replies from eligible people.
- **UX:** ≤6 categories (Date, Casual, Couples & threesomes, Kink, Party/event, Chat & online); expiry 24 h / 72 h / 7 days; area; who may reply (gender/type, age range, verified only). Plans appear on home, on the profile and in a Plans tab.
- **Backend:** reuse `dating_ads`; replies create a DM thread tagged with the plan; the first plan from a new member goes through moderation.
- **DB:** `dating_ads` simplified (`category` enum of 6, `expires_at`, `area_id`); drop VIP/credit columns.
- **Acceptance:** an ineligible member cannot reply (server-enforced, already exists); expired plans disappear; posting takes < 60 s on mobile.

### 5. Feedback signals
- **Story:** As a member I see who looked at me, who's interested and who wants my private photos, and that makes me come back.
- **UX:** an Activity tab with Visitors (last 30 days), Interest received, Access requests and Likes on my photos. Mutual interest is highlighted ("You're both interested").
- **Backend:** record a profile view at most once per viewer per 24 h; "Interest" is a one-tap signal (replaces follow/friend); favourites stay private bookmarks.
- **DB:** `profile_views`, `interests` (from, to, created_at, unique), `saved_items` (favourites), `content_reactions` (photo likes). **Delete** `connections` and `friendships` after migration.
- **Privacy:** a "browse invisibly" setting suppresses my visits; blocked users never appear in my activity.
- **Acceptance:** visiting a profile appears in the owner's Visitors within 5 s; mutual interest notifies both sides.

### 6. Messaging
- **Story:** As a member I chat in real time, send photos and know when I've been read.
- **UX:** Inbox (unread first, filters: all / unread / from plans), thread with realtime messages, image attachment (from the private pipeline), read state, and block/report inside the thread. First messages from non-mutual members land in "Requests".
- **Backend:** Supabase Realtime on `direct_messages` inserts (RLS by participant). Image messages reuse the media pipeline with `visibility=MESSAGE`. Rate limits live in Postgres, not in memory.
- **DB:** `direct_messages` (+ `media_id`), `conversations` (participants, last_message_at, per-user unread count). Drop the per-read audit row.
- **Acceptance:** message latency < 1 s; images arrive realtime and are never publicly addressable; blocked users can't message; the unread badge is correct across devices.

### 7. Notifications
- **Story:** As a member who isn't on the site, I find out when something worth returning for happens.
- **UX:** in-app bell; email for the first unread message (batched; no repeat until visited), mutual interest, access request/grant and plan replies; a weekly "New in Prague" digest. Unsubscribe per category.
- **Backend:** `notifications` row plus an email outbox processed by a Vercel cron (every 5 min) via Resend. PWA push in Phase 2.
- **DB:** `notifications`, `email_outbox`, `notification_preferences`.
- **Acceptance:** an email arrives within 10 min of the first unread message; no member receives more than 1 email per category per 3 h; unsubscribe works without login.

### 8. Trust and safety
- **Story:** As a member I can block or report anyone instantly; as a moderator I can act on reports and review photos fast.
- **UX:** block/report everywhere (profile, thread, plan, photo). Settings → Privacy (visibility, discreet mode, who can message, browse invisibly). Settings → Account (email, password, delete account, data export).
- **Backend:** keep the existing transactional block/report, moderation case queue and verification review. Admin = `admin` and `moderator` roles only, with Supabase Auth MFA required.
- **Acceptance:** block takes effect everywhere immediately (discovery, messages, activity, plans); the report queue shows context; account deletion removes the profile from all surfaces at once.

## Explicitly out of MVP
Feed/posts, comments (P1), follow/friends, chat rooms, groups, events, videos,
webcam, stories, blogs, multi-language UI beyond EN + CS, monetization of any
kind, AI features, God Mode, retention engine automation.

## MVP definition of done
All 16 success steps in the brief work **in production on a phone**, with
Playwright end-to-end tests for: sign-up → onboarding → upload → discover →
interest → message (realtime, image) → email notification → block → delete account.
