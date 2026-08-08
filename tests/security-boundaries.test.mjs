import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Auth0 source contains no embedded credential fallback", async () => {
  const source = await read("src/lib/auth0/config.ts");
  assert.doesNotMatch(source, /AUTH0_CLIENT_SECRET\s*\|\|/);
  assert.doesNotMatch(source, /AUTH0_SECRET\s*\|\|/);
  assert.match(source, /required\("AUTH0_CLIENT_SECRET"\)/);
  assert.match(source, /required\("AUTH0_SECRET"\)/);
});

test("account deletion derives its target from the verified session", async () => {
  const source = await read("src/app/api/auth/delete-account/route.ts");
  assert.match(source, /getVerifiedIdentity\(req\)/);
  assert.match(source, /identity\.sub/);
  assert.doesNotMatch(source, /body\?\.auth0UserId|body\?\.email/);
});

test("media presigning requires identity and enforces size and type allowlists", async () => {
  const source = await read("src/app/api/media/presign-upload/route.ts");
  assert.match(source, /resolveServerActor\(req\)/);
  assert.match(source, /hasAdultAccess\(actor\.actor\)/);
  assert.match(source, /ALLOWED_MIME_TYPES\.has\(fileType\)/);
  assert.match(source, /fileSize > maxBytes/);
  assert.match(source, /NODE_ENV === "production" && !isR2Configured/);
  assert.match(source, /content_participant_declarations/);
  assert.match(source, /publicUrl: `\/api\/media\/\$\{media\.id\}`/);
  assert.doesNotMatch(source, /publicUrl: presigned\.publicUrl/);
});

test("production auth middleware has a fail-closed response", async () => {
  const source = await read("src/middleware.ts");
  assert.match(source, /NODE_ENV === "production"/);
  assert.match(source, /status: 503/);
});

test("RLS lockdown removes public allow-all policies and revokes browser roles", async () => {
  const source = await read("supabase/migrations/20260807_lock_down_auth0_boundary.sql");
  assert.doesNotMatch(source, /create\s+policy[\s\S]*using\s*\(true\)/i);
  assert.doesNotMatch(source, /create\s+policy[\s\S]*with\s+check\s*\(true\)/i);
  assert.match(source, /revoke all on table public\.profiles from anon, authenticated/i);
  assert.match(source, /force row level security/i);
});

test("admin route is guarded by server-derived database authority", async () => {
  const layout = await read("src/app/admin/layout.tsx");
  const actor = await read("src/lib/auth/serverActor.ts");
  const serverDb = await read("src/lib/supabase/server.ts");
  assert.match(layout, /resolveServerActor\(\)/);
  assert.match(layout, /isAdminActor\(result\.actor\)/);
  assert.match(serverDb, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(actor, /\.eq\("auth_id", identity\.sub\)/);
  assert.match(actor, /INTIMO_ADMIN_AUTH0_SUBS/);
  assert.match(actor, /adminAuthorized/);
  assert.doesNotMatch(layout, /localStorage|sessionStorage/);
});

test("browser role switching cannot grant ADMIN", async () => {
  const source = await read("src/context/AuthContext.tsx");
  assert.match(source, /fetch\("\/api\/auth\/session"/);
  assert.match(source, /if \(newRole === "ADMIN"\)/);
  assert.match(source, /cannot be selected in the browser/);
});

test("profile updates are owner-derived and strip authority fields", async () => {
  const route = await read("src/app/api/profile/me/route.ts");
  const context = await read("src/context/AuthContext.tsx");
  assert.match(route, /getVerifiedIdentity\(req\)/);
  assert.match(route, /\.eq\("auth_id", identity\.sub\)/);
  assert.match(route, /delete update\.role/);
  assert.match(route, /delete update\.verification_status/);
  assert.match(route, /MAX_BODY_BYTES/);
  assert.match(context, /fetch\("\/api\/profile\/me"/);
});

test("onboarding creates a verified-session-owned adult profile without self-granting creator or premium", async () => {
  const route = await read("src/app/api/profile/me/route.ts");
  const onboarding = await read("src/app/onboarding/page.tsx");
  assert.match(route, /if \(!identity\.emailVerified\)/);
  assert.match(route, /age < 18/);
  assert.match(route, /member_tier: "FREE"/);
  assert.match(route, /profileType === "COUPLE" \? "COUPLE" : "MEMBER"/);
  assert.match(route, /verification_level: "LEVEL_1_EMAIL"/);
  assert.match(onboarding, /method: "POST"/);
  assert.match(onboarding, /Date of Birth \(18\+ required\)/);
});

test("discovery is authenticated, visibility-filtered, and deterministically ordered", async () => {
  const route = await read("src/app/api/discovery/profiles/route.ts");
  const page = await read("src/app/discovery/page.tsx");
  assert.match(route, /resolveServerActor\(req\)/);
  assert.match(route, /\.in\("profile_visibility", \["EVERYONE", "MEMBERS_ONLY"\]\)/);
  assert.match(route, /created_at.*ascending: false/);
  assert.match(route, /id.*ascending: true/);
  assert.match(route, /\.neq\("auth_id", actorResult\.actor\.auth0Sub\)/);
  assert.match(page, /fetch\("\/api\/discovery\/profiles"/);
  assert.doesNotMatch(page, /MOCK_PROFILES/);
});

test("member profile pages load through the authenticated visibility boundary", async () => {
  const route = await read("src/app/api/profiles/[id]/route.ts");
  const page = await read("src/app/profile/[id]/page.tsx");
  assert.match(route, /\["EVERYONE", "MEMBERS_ONLY"\]\.includes\(data\.profile_visibility\)/);
  assert.match(route, /isAdminActor\(actorResult\.actor\)/);
  assert.match(route, /\.eq\("id", id\)/);
  assert.match(page, /fetch\(`\/api\/profiles\/\$\{encodeURIComponent\(profileId\)\}`/);
});

test("onboarding records declared age separately from stronger verification and requires explicit consent", async () => {
  const route = await read("src/app/api/profile/me/route.ts");
  const onboarding = await read("src/app/onboarding/page.tsx");
  assert.match(route, /age_verification_status: "AGE_DECLARED"/);
  assert.match(route, /age_verification_method: "DATE_OF_BIRTH_DECLARATION"/);
  assert.match(route, /explicitSensitiveDataConsent !== true/);
  assert.match(route, /consent_type: "SPECIAL_CATEGORY_PROFILE"/);
  assert.match(onboarding, /I explicitly consent/);
});

test("privacy APIs derive ownership from the server actor and public profiles minimize sensitive data", async () => {
  const consents = await read("src/app/api/privacy/consents/route.ts");
  const settings = await read("src/app/api/privacy/settings/route.ts");
  const exportRoute = await read("src/app/api/privacy/export/route.ts");
  const publicProfile = await read("src/lib/supabase/publicProfile.ts");
  assert.match(consents, /profile_id: actor\.actor\.profileId/);
  assert.match(settings, /\.eq\("id", actor\.actor\.profileId\)/);
  assert.match(exportRoute, /profileId = actor\.actor\.profileId/);
  assert.doesNotMatch(publicProfile, /dateOfBirth:/);
  assert.match(publicProfile, /locationVisible/);
});

test("dating ads derive authorship and deletion ownership from the server actor", async () => {
  const collection = await read("src/app/api/dating-ads/route.ts");
  const item = await read("src/app/api/dating-ads/[id]/route.ts");
  assert.match(collection, /author_id: actor\.actor\.profileId/);
  assert.match(collection, /author_name: profile\.display_name/);
  assert.match(collection, /minAge < 18/);
  assert.match(item, /\.eq\("author_id", actor\.actor\.profileId\)/);
  assert.match(collection, /require_vip: false/);
});

test("free MVP centrally disables and server-blocks monetization routes", async () => {
  const features = await read("src/lib/features.ts");
  const middleware = await read("src/middleware.ts");
  const navbar = await read("src/components/layout/Navbar.tsx");
  assert.match(features, /MONETIZATION_ENABLED = false/);
  assert.match(features, /"\/membership"/);
  assert.match(features, /"\/wallet"/);
  assert.match(middleware, /!MONETIZATION_ENABLED && isMonetizationRoute\(pathname\)/);
  assert.match(middleware, /isMvpSafetyDisabledRoute\(pathname\)/);
  assert.doesNotMatch(navbar, /href="\/wallet"/);
  assert.doesNotMatch(navbar, /href="\/(membership|events|live|creator-studio|referrals)"/);
});

test("active dating ads cannot advertise commercial sexual services or require VIP", async () => {
  const createPage = await read("src/app/dating/create/page.tsx");
  const collection = await read("src/app/api/dating-ads/route.ts");
  assert.doesNotMatch(createPage, /offering services|Erotic services|Incall apartments|S\/M studios/i);
  assert.doesNotMatch(createPage, /Require VIP Membership/);
  assert.match(collection, /require_vip: false/);
});

test("blocking is server-owned and enforced in discovery, profiles, and messages", async () => {
  const blocks = await read("src/app/api/blocks/route.ts");
  const discovery = await read("src/app/api/discovery/profiles/route.ts");
  const profile = await read("src/app/api/profiles/[id]/route.ts");
  const messages = await read("src/app/api/messages/route.ts");
  assert.match(blocks, /blocker_id: actor\.actor\.profileId/);
  assert.match(discovery, /from\("user_blocks"\)/);
  assert.match(profile, /from\("user_blocks"\)/);
  assert.match(messages, /await blocked\(supabase, actor\.actor\.profileId, receiverId\)/);
  assert.match(messages, /sender_id: actor\.actor\.profileId/);
});

test("reports use structured categories and immediately escalate critical harms", async () => {
  const reports = await read("src/app/api/reports/route.ts");
  const modal = await read("src/components/safety/ReportModal.tsx");
  assert.match(reports, /SUSPECTED_MINOR/);
  assert.match(reports, /NON_CONSENSUAL_INTIMATE_CONTENT/);
  assert.match(reports, /EXPLOITATION_TRAFFICKING/);
  assert.match(reports, /priority === "CRITICAL" \? "ESCALATED"/);
  assert.match(modal, /fetch\("\/api\/reports"/);
  assert.doesNotMatch(modal, /userStore\.submitReport/);
});

test("follow and favorite operations are server-owned and block-aware", async () => {
  const route = await read("src/app/api/connections/route.ts");
  const favorites = await read("src/app/favorites/page.tsx");
  assert.match(route, /follower_id: actor\.actor\.profileId/);
  assert.match(route, /from\("user_blocks"\)/);
  assert.match(route, /toMemberVisibleProfile/);
  assert.match(favorites, /fetch\("\/api\/connections\?type=favorite"/);
  assert.doesNotMatch(favorites, /MOCK_PROFILES/);
});

test("legacy client admin and monetization overlays are not mounted", async () => {
  const layout = await read("src/app/layout.tsx");
  const admin = await read("src/app/admin/layout.tsx");
  assert.doesNotMatch(layout, /AdminSystemOverlay/);
  assert.match(admin, /return <AdminCommandCenter/);
  assert.doesNotMatch(admin, /return children/);
});

test("admin console enforces MFA, granular permissions, audit history, and free-MVP settings", async () => {
  const actor = await read("src/lib/auth/serverActor.ts");
  const authorization = await read("src/lib/auth/adminAuthorization.ts");
  const api = await read("src/lib/auth/adminApi.ts");
  const userActions = await read("src/app/api/admin/users/[id]/route.ts");
  const settings = await read("src/app/api/admin/settings/route.ts");
  const migration = await read("supabase/migrations/20260811_admin_command_center.sql");
  assert.match(actor, /INTIMO_ADMIN_ROLE_ASSIGNMENTS/);
  assert.doesNotMatch(actor, /FINANCE_ADMIN/);
  assert.match(api, /adminMfaSatisfied/);
  assert.match(api, /hasAdminPermission/);
  assert.match(authorization, /PRIVACY_ADMIN/);
  assert.doesNotMatch(authorization, /payment|payout|wallet|billing/i);
  assert.match(userActions, /Administrators cannot apply privileged account actions to themselves/);
  assert.match(userActions, /Reason and category are required/);
  assert.match(userActions, /admin_action_events/);
  assert.match(settings, /Monetization cannot be enabled in the free MVP/);
  assert.match(migration, /revoke all on table public\.admin_action_events/);
});

test("God Mode is a short-lived, MFA-backed, audited SUPER_ADMIN elevation without a backdoor", async () => {
  const god = await read("src/lib/auth/godMode.ts");
  const session = await read("src/app/api/admin/god/session/route.ts");
  const admins = await read("src/app/api/admin/god/admins/route.ts");
  const sensitive = await read("src/app/api/admin/god/sensitive-access/route.ts");
  const migration = await read("supabase/migrations/20260812_super_admin_elevation.sql");
  assert.match(god, /GOD_MODE_TTL_SECONDS = 15 \* 60/);
  assert.match(god, /createHash\("sha256"\)/);
  assert.match(god, /httpOnly: true/);
  assert.match(god, /sameSite: "strict"/);
  assert.match(god, /actor\.role !== "SUPER_ADMIN"/);
  assert.match(session, /adminSessionFresh\(auth\.actor, 5 \* 60\)/);
  assert.match(session, /confirmation !== "ENTER GOD MODE"/);
  assert.match(session, /GOD_MODE_ENTERED/);
  assert.match(session, /GOD_MODE_EXITED/);
  assert.match(admins, /last active SUPER_ADMIN cannot remove or suspend themselves/i);
  assert.match(sensitive, /valid moderation or privacy case reference is required/);
  assert.match(sensitive, /NO_CREDENTIAL_ACCESS/);
  assert.match(migration, /revoke all on table public\.admin_assignments/);
  assert.doesNotMatch(god + session, /master password|bypass URL|hardcoded.*email/i);
});

test("production member surfaces do not inject fabricated profiles, feeds, relationships, or visitors", async () => {
  const dashboard = await read("src/app/dashboard/page.tsx");
  const profile = await read("src/app/profile/[id]/page.tsx");
  const search = await read("src/components/discovery/SearchBar.tsx");
  const features = await read("src/lib/features.ts");
  const connections = await read("src/lib/social/connectionStore.ts");
  const visitors = await read("src/lib/social/visitorStore.ts");
  assert.doesNotMatch(dashboard, /MOCK_PROFILES|INITIAL_FEED_POSTS|RECENT_VISITORS|localStorage/);
  assert.doesNotMatch(profile, /MOCK_PROFILES\[0\]/);
  assert.doesNotMatch(search, /MOCK_PROFILES/);
  assert.match(features, /"\/creators"/);
  assert.match(features, /"\/communities"/);
  assert.match(connections, /new Set\(\)/);
  assert.match(visitors, /visitors: ProfileVisitor\[\] = \[\]/);
});

test("legacy admin route cannot mount browser authority or fabricated operational data", async () => {
  const page = await read("src/app/admin/page.tsx");
  const center = await read("src/components/admin/AdminCommandCenter.tsx");
  assert.doesNotMatch(page, /localStorage|userStore|MOCK_|impersonate|wallet|payout/i);
  assert.doesNotMatch(center, /\["\/admin\/communities"|\["\/admin\/events"|\["\/admin\/live"/);
});

test("legacy profile gallery fixtures and browser caches are development-only", async () => {
  const profile = await read("src/app/profile/[id]/page.tsx");
  assert.match(profile, /useState<UserPhotoAlbumItem\[\]>\(process\.env\.NODE_ENV === "development" \? \[/);
  assert.match(profile, /useState<UserVideoItem\[\]>\(process\.env\.NODE_ENV === "development" \? \[/);
  assert.match(profile, /useState<\{ id: string; title: string; category: string; description: string; date: string \}\[\]>\(process\.env\.NODE_ENV === "development" \? \[/);
  assert.match(profile, /process\.env\.NODE_ENV === "development" && typeof window !== "undefined"/);
  assert.doesNotMatch(profile, /videoUrl: row\.video_url \|\| "https:\/\/commondatastorage/);
});
