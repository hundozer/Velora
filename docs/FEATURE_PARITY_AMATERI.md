# Feature parity: Amateri → Intimo

Amateri is the **functional** benchmark: behaviour, information architecture and
loops. Do not copy branding, text, design assets or implementation.

## Sourcing caveat (read first)

During the 2026-10-17 audit, `www.amateri.com` could not be fetched: DNS
resolution is blocked from the audit environment. This matrix is built from public
secondary sources (Czech review sites, cs.wikipedia, Trustpilot) and general
domain knowledge. Every "Amateri" cell is marked:

- **S**: stated by at least one secondary source
- **I**: inferred / widely known but **not verified in this audit**

**Open task (issue P1-00):** someone logs in to Amateri with a normal browser and
validates every **I** row, adding screenshots to a private drive (not the repo).

Sources: [recenzer.cz review 2026](https://www.recenzer.cz/seznamky/amateri-com/),
[cs.wikipedia: Amateri.com](https://cs.wikipedia.org/wiki/Amateri.com),
[sedesatka.cz review](https://www.sedesatka.cz/rubriky/recenze/jak-hodnoti-uzivatele-seznamku-amateri-com_2888.html),
[lovino.cz](https://www.lovino.cz/seznamka/amateri-com),
[recenziste.cz](https://recenziste.cz/amateri-com-recenze/),
[Trustpilot](https://www.trustpilot.com/review/amateri.cz).

## What Amateri actually is

A Czech-Slovak adult community running since 2003 (S). It combines user-uploaded
amateur **photos and videos** that others **rate and comment on** (S), **erotic
dating ads** filtered by gender, age, region, city and relationship type (S),
**thematic and regional text chat rooms** (S), webcams (S), **forum, blogs,
magazine and erotic stories** (S), and **voluntary verification** by a photo with a
handwritten card or by phone (S). Registration is free. **VIP** (~83–149 CZK/month)
unlocks full videos, chat and unlimited messages (S). The first dating ad waits for
approval (S). There is no strong native app (S). It self-reports >1M unique users
(LinkedIn, S).

**The behavioural loop it creates:** post content or an ad → get ratings,
comments, visits and replies → come back to see who reacted → browse new content
and ads in your region → message. *Content and intent* drive return visits;
profiles are the destination, not the engine.

## Gap matrix

Intimo-now status: ✅ works in code · 🟡 partial · ❌ missing · 💀 dead/mock.
Priority: P0 launch core · P1 immediately after launch · P2 growth/community · P3 mature.

| Capability | Amateri | Intimo now | MVP? | Priority | Recommendation |
|---|---|---|---|---|---|
| Individual + couple profiles | Yes (I) | ✅ single/couple, partner fields | Yes | P0 | Keep; couple profiles are a differentiator for swinger/couple segment |
| Gender, orientation, relationship status | Yes (I) | ✅ | Yes | P0 | Keep; cut the explicit body-detail fields from onboarding (optional later) |
| "Looking for" / interests | Yes (S: preferences) | 🟡 fields exist, weakly used in discovery | Yes | P0 | Make it a first-class filter and a profile headline chip |
| Region/city location | Yes (S) | 🟡 country/city text, no distance | Yes | P0 | Prague districts + approximate distance (never exact) |
| Profile photo + cover | Yes (I) | 🟡 avatar via media; prod upload broken | Yes | P0 | Fix R2 env; require 1 approved photo to appear in discovery |
| Public + private albums | Yes (S) | 🟡 albums + audience rules exist | Yes | P0 | Private album with **access requests/grants**, the core trust mechanic |
| Bio, online status, last active | Yes (I) | 🟡 `last_active_at` never written | Yes | P0 | Write presence; show "online / today / this week" buckets |
| Profile visitors ("who viewed me") | Yes (I) | 💀 dead `visitorStore` | Yes | **P0** | Build. Cheapest, strongest return trigger |
| Friends / fans / following | Yes (I) | 🟡 three overlapping tables | Partly | P1 | Collapse to **Favourite** (private) + **Interest** (signal to other person) |
| Verification badge | Yes, voluntary (S) | 🟡 admin-reviewed photo verification | Yes | P0 | Keep the selfie-with-code flow, manual review |
| Member search + filters | Yes (S) | 🟡 client-side over newest 100 | Yes | P0 | Server-side: gender, age, type, looking-for, distance, online, has-photo, verified |
| Recently registered / online now | Yes (I) | ❌ | Yes | P0 | "New in Prague" + "Online now" rails on home |
| Recommendations | Weak (I) | ❌ | No | P2 | Simple compatibility sort later |
| Dating ads by category/region | **Core** (S) | ✅ 28 categories, reply rules | Yes | **P0** | Rename "Plans"; ≤6 categories; 24h/72h/7d expiry; Prague areas |
| Reply restrictions on ads | Yes (I) | ✅ | Yes | P0 | Keep (gender/age/verified) |
| Photo upload + feed of new photos | **Core** (S) | 🟡 media + public gallery | Yes | P1 | "New photos" feed; P0 only as profile/album media |
| Ratings / likes / comments on photos | **Core** (S) | 🟡 tables exist (`content_reactions`, `content_comments`) | Partly | P1 | Likes at launch (P0-lite), comments P1 |
| Videos | Yes, VIP-gated (S) | 🟡 legacy `videos` table | No | P3 | Defer: storage, moderation and legal cost |
| Blogs / stories / magazine | Yes (S) | ❌ | No | P3 | Defer |
| Text posts / activity feed | Partly (I) | 🟡 `content_posts`, `/api/feed` | No | P2 | Defer; Plans + photos give enough feed |
| Stories / polls | Unknown (I) | ❌ | No | P3 | Skip |
| Direct messages | Yes, VIP for unlimited (S) | 🟡 text, 15 s polling | Yes | P0 | Realtime, image messages, unread, per-thread block/report |
| Read / typing state | Unknown (I) | 🟡 read state yes | Yes | P1 | Read receipts P0 (exists); typing P1 |
| Chat rooms | **Core** (S) | 💀 mock | No | P2 | One moderated "Prague tonight" room after ~500 members |
| Webcam / video chat | Yes (S) | 💀 | No | P3 | Defer |
| Notifications | Yes (I) | 🟡 in-app only | Yes | **P0** | Email on first unread message, interest and access request; PWA push P1 |
| Groups / clubs / forum | Forum yes (S) | 💀 mock communities | No | P2 | Defer |
| Events / parties | Unknown (I) | 💀 mock | No | P2 | Via Plans first ("event" category) |
| Contests / top lists | Likely (I) | ❌ | No | P3 | Skip |
| Block / report | Yes (I) | ✅ | Yes | P0 | Keep |
| Moderation (ads pre-approval, media review) | Yes (S) | ✅ (heavy) | Yes | P0 | Keep the queue; simplify roles to admin + moderator |
| Privacy: hidden/private media | Yes (S) | ✅ | Yes | P0 | Keep |
| Visibility controls (hide from search, members-only) | Yes (I) | ✅ | Yes | P0 | Keep; add "discreet mode" (no photo in grid until access) |
| "Decent mode" (SFW browsing) | Yes (S) | 🟡 explicit gate | Yes | P0 | Keep the explicit-media blur default |
| Responsive web / app | Responsive, weak app (S) | 🟡 responsive, bottom nav | Yes | P0 | Mobile-first; PWA manifest + install prompt P1 |
| VIP / credits | **Core revenue** (S) | 💀 dormant | No | P3 (Phase 5) | Keep out of the MVP |

## The smallest subset that recreates the loop

1. Profile with couple support and real photos (private album + access requests)
2. Plans (intent posts) in Prague areas
3. Discovery with distance, online-now and "new in Prague"
4. Feedback signals: visitors, interest, photo likes
5. Realtime messaging with images
6. Email return triggers
7. Verification badge
8. Block / report / moderation

That is 8 capabilities. Everything else waits for density.
