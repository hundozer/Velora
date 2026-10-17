# Intimo MVP definition

> The smallest product that 100–200 real Prague members can use repeatedly and that feels
> **alive, private, safe and distinctly sex-positive.**

The MVP is Phase 1 of `ROADMAP.md` (milestone `M1-mvp`). Every capability below names the
Phase 1 issues that deliver it. Phase 1 is closed: adding something means removing something of equal effort.

## The 10 launch capabilities

### 1. Account, 18+ and onboarding — P1-02, P1-03, P1-15
- **Story:** As a newcomer I understand what Intimo is, confirm I'm 18+, sign up and set up a profile that says who I am, how I relate, and where in Prague I am, in a few minutes.
- **UX:** Landing that explains "Prague's private sex-positive network" without showing emptiness → age gate → email + password or magic link → confirm email → onboarding: single/couple (partner DOB for couples), identity, relationship structure, looking-for chips, Prague area, first photo, privacy defaults.
- **Backend/DB:** Supabase Auth (live); `profiles.id = auth.users.id`; `areas` table (Prague districts + nearby cities, centroid only); server-validated ≥18 for every person on the profile.
- **Acceptance:** sign-up to home works on a 375 px phone with no dead ends; under-18 DOB blocked server-side; precise location never stored or shown.

### 2. Desires and boundaries — P1-19, P1-20
- **Story:** As a member I say what I love, am into, am curious about, am not into, and what is a hard limit, and how I want to be approached, so others know before they reach out.
- **UX:** Curated desire catalogue (no free-text kink lists at launch) with five states: `Love it / Into it / Curious / Not for me / Hard limit`. Approach preferences: `Comfortable with / Ask me first / Not interested` for messaging, explicit media and common interaction types. Profiles show shared desires first; hard limits are visible but never used to rank.
- **Backend/DB:** `desires` (catalogue, admin-managed), `member_desires(profile_id, desire_id, state, visibility)`, `member_boundaries(profile_id, kind, preference)`. Boundaries are **enforced** in messaging and private-media requests, not just displayed.
- **Acceptance:** a `Not interested` / hard-limit boundary blocks the matching unsolicited request server-side; desire filters work in People.

### 3. Profile, private photos and the Album Handshake — P1-06, P1-12
- **Story:** As a member I show who I am, keep explicit photos private, and decide exactly who sees them and for how long.
- **UX:** Profile header (photo, name, age(s), area, presence bucket, trust signals), bio, shared desires, public photos, locked private album → *Request access*. Owner chooses **grant once / grant until revoked / deny**; revoke is immediate. Likes on approved photos.
- **Backend/DB:** R2 media pipeline (live), moderation queue, `album_access_grants(owner, viewer, mode, status, expires_at)`, `content_reactions`.
- **Acceptance:** private media is never served to a non-grantee; revoke takes effect on the next request; production upload verified end to end.

### 4. People: Prague discovery — P1-04, P1-05
- **Story:** As a member I see who's around, new and online, and filter by what matters to me, including desires.
- **UX:** Home rails (Online now, New in Prague, Tonight near you, Shares your desires) and the People grid with filters (type, gender, age, area distance bucket, desires, has photo, verified, online). Empty rails hide; recency windows widen.
- **Backend/DB:** server-side filters with keyset pagination; approximate distance between area centroids; throttled `last_active_at`; blocks excluded both ways.
- **Acceptance:** p95 < 300 ms at 10k profiles; blocked users never appear; no zero counts anywhere.

### 5. Tonight / Plans — P1-07
- **Story:** As a member I post what I'm looking for now ("Tonight, Vinohrady, couple looking for a third for drinks first") and get replies only from people I'd welcome.
- **UX:** 6 intent categories, 24 h / 72 h / 7 d expiry, area, who may reply (type, age, verified only). Tonight is a bottom-nav tab, on Home and on the profile.
- **Backend/DB:** `dating_ads` simplified into Plans (categories, `expires_at`, `area_id`); replies create a conversation tagged with the Plan; first Plan from a new member is reviewed.
- **Acceptance:** ineligible replies rejected server-side; expired Plans disappear; posting takes < 60 s on a phone.

### 6. Activity: interest and visitors — P1-08
- **Story:** As a member I see who looked at me, who's interested, and who asked for my private photos, which is why I come back.
- **UX:** Activity (inside Me and on Home): Visitors (30 days), Interest received, Access requests, Likes; mutual interest highlighted.
- **Backend/DB:** `profile_views` (1 per viewer/day), `interests` (replaces `connections` + `friendships`); invisible browsing suppresses visits.
- **Acceptance:** a view appears within 5 s; mutual interest notifies both; blocked users never appear.

### 7. Messaging — P1-09, P1-10, P1-13
- **Story:** As a member I chat in real time, send photos privately, and unwanted first messages don't land in my main inbox.
- **UX:** Inbox (unread first; All / Unread / Requests / From Plans), realtime thread, image attachments, read state, block/report in thread.
- **Backend/DB:** Supabase Realtime on `direct_messages` (publication + owner-read RLS live), `conversations` with per-user unread; image messages via private media; Postgres rate limits; boundaries checked on first message.
- **Acceptance:** delivery < 1 s; images never publicly addressable; blocked users and `Not interested` boundaries stop delivery.

### 8. Return triggers and PWA — P1-11, P1-23
- **Story:** When I'm not on Intimo, I hear about things worth coming back for, and I can install it like an app.
- **UX:** in-app notifications (live); email for first unread message, mutual interest, access request/grant and Plan reply, batched, per-category unsubscribe; installable PWA with an app-like shell. Web push is Phase 2.
- **Backend/DB:** `email_outbox` + Vercel cron via Resend; `notification_preferences`; manifest + service worker.
- **Acceptance:** email within 10 min of the first unread message; ≤1 email per category per 3 h; installable on iOS and Android.

### 9. Prague Scene v0 — P1-21
- **Story:** As a member I see real sex-positive events in Prague (munches, workshops, parties) even before Intimo itself is busy.
- **UX:** Scene section on Home: date, venue/area, organiser, short description, outbound link. Admin-curated; members can suggest a listing.
- **Backend/DB:** `scene_events` (admin-managed, moderated).
- **Acceptance:** at least 8 upcoming listings at launch; past events disappear automatically.

### 10. Trust, privacy and safety — P1-14, P1-18, P1-22
- **Story:** As a member I control who sees me and can stop anyone instantly; as a moderator I can act fast.
- **UX:** Privacy Center (discreet mode, invisible browsing, profile visibility, who can message me, activity visibility, export, delete); block/report everywhere; trust signals (photo verified, established profile, organiser), no public scores.
- **Backend/DB:** existing transactional block/report, moderation cases, verification review; admin roles simplified (P0-10).
- **Acceptance:** block takes effect everywhere immediately; median report-to-action < 12 h; deletion removes the profile from every surface at once.

## Foundation for all of the above
P1-01 member RLS (part 1 live), P1-16 navigation **Home · People · Tonight · Messages · Me** (Me tab live; `Dating` becomes `Tonight` with P1-07), P1-17 full-loop Playwright test, P1-00 benchmark validation.

## Explicitly out of the MVP
Compatibility summaries (P2-01), relationship links between profiles (P2-02), generic feed, web push, chat rooms, groups/forums, blogs, livestreaming, video calls, webcams, creator monetisation, credits, AI features, swipe decks, public popularity scores.

## Definition of done
Every capability works **in production on a phone**, verified by the P1-17 Playwright journey:
register → onboard → desires/boundaries → upload → discover → interest → post Plan → private access → realtime message → email notification → block → delete account.
