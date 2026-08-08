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
  assert.match(source, /account_status: "DELETION_REQUESTED"/);
  assert.match(source, /account_status: "DEACTIVATED"/);
  assert.doesNotMatch(source, /body\?\.auth0UserId|body\?\.email/);
});

test("retention execution is secret-authenticated, legal-hold aware, durable, and removes stored media first", async () => {
  const route = await read("src/app/api/internal/retention/run/route.ts");
  const auth = await read("src/lib/security/cronAuth.ts");
  const worker = await read("src/lib/privacy/retention.ts");
  const migration = await read("supabase/migrations/20260815_retention_execution.sql");
  assert.match(route, /isAuthorizedCronRequest\(req\)/);
  assert.match(route, /ANONYMIZATION_IN_PROGRESS/);
  assert.match(auth, /timingSafeEqual/);
  assert.match(auth, /INTIMO_RETENTION_CRON_SECRET/);
  assert.match(worker, /retention_holds/);
  assert.match(worker, /deleteStoredObject/);
  assert.match(worker, /account_lifecycle_status: "DELETED"/);
  assert.match(worker, /sendPrivacyDeletionComplete/);
  assert.match(migration, /retention_execution_events/);
  assert.match(migration, /force row level security/i);
});

test("privacy export covers durable profile, media, interaction, safety, and rights data", async () => {
  const route = await read("src/app/api/privacy/export/route.ts");
  for (const table of ["media_objects", "content_posts", "content_comments", "saved_items", "content_reactions", "notifications", "moderation_cases", "moderation_appeals", "copyright_notices", "verification_reviews", "privacy_requests"]) {
    assert.match(route, new RegExp(`from\\(\\"${table}\\"\\)`));
  }
  assert.match(route, /SELF_SERVICE_JSON/);
  assert.match(route, /third-party rights are protected/);
  assert.doesNotMatch(route, /provider_reference/);
});

test("privacy-rights requests are owner-derived, rate-limited, durable, and auditable", async () => {
  const route = await read("src/app/api/privacy/requests/route.ts");
  const settings = await read("src/app/settings/page.tsx");
  assert.match(route, /resolveServerActor\(req\)/);
  assert.match(route, /privacy-request:\$\{actor\.actor\.auth0Sub\}/);
  assert.match(route, /profile_id: actor\.actor\.profileId/);
  assert.match(route, /MEMBER_RIGHTS_REQUEST/);
  assert.match(route, /appendDurableAudit/);
  assert.match(settings, /Exercise another privacy right/);
  assert.match(settings, /\/api\/privacy\/requests/);
});

test("privacy and consent actions append durable database audit evidence", async () => {
  const helper = await read("src/lib/auth/durableAudit.ts");
  for (const routePath of ["src/app/api/privacy/requests/route.ts", "src/app/api/privacy/export/route.ts", "src/app/api/privacy/consents/route.ts", "src/app/api/privacy/settings/route.ts", "src/app/api/auth/delete-account/route.ts"]) {
    assert.match(await read(routePath), /appendDurableAudit/);
  }
  assert.match(helper, /from\("audit_events"\)\.insert/);
  assert.match(helper, /metadata: event\.metadata \|\| \{\}/);
});

test("shared modal provides dialog semantics, escape handling, and keyboard focus containment", async () => {
  const modal = await read("src/components/ui/Modal.tsx");
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /event\.key === "Escape"/);
  assert.match(modal, /event\.key !== "Tab"/);
  assert.match(modal, /previouslyFocused\?\.focus/);
  assert.match(modal, /aria-label="Close dialog"/);
});

test("six-language mobile navigation uses Intimo keys and migrates the legacy locale preference", async () => {
  const context = await read("src/context/LanguageContext.tsx");
  const mobile = await read("src/components/layout/MobileNavigation.tsx");
  for (const locale of ["en", "cs", "hu", "ro", "sk", "de"]) {
    const dictionary = await read(`src/locales/${locale}/common.json`);
    assert.doesNotMatch(dictionary, /Velora/);
    for (const key of ["home", "people", "dating", "search"]) assert.match(dictionary, new RegExp(`"${key}"`));
  }
  assert.match(context, /localStorage\.setItem\("intimo_lang"/);
  assert.match(context, /localStorage\.removeItem\("velora_lang"/);
  assert.match(mobile, /t\("nav\.home"\)/);
  assert.match(mobile, /aria-label="Mobile navigation"/);
});

test("affected users can see eligible decisions and appeal while dating ads expose reporting", async () => {
  const reports = await read("src/app/api/reports/route.ts");
  const appeal = await read("src/app/api/reports/[id]/appeal/route.ts");
  const settings = await read("src/app/settings/page.tsx");
  const dating = await read("src/app/dating/page.tsx");
  assert.match(reports, /relationship: reported_user_id === actor\.actor\.profileId \? "AFFECTED_USER" : "REPORTER"/);
  assert.match(appeal, /eq\("reported_user_id", actor\.actor\.profileId\)/);
  assert.match(appeal, /\["RESOLVED", "REJECTED"\]/);
  assert.match(settings, /Appeal this decision/);
  assert.match(dating, /contentType="POST"/);
  assert.match(dating, /Report this dating ad/);
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

test("browser identity cannot switch roles or fabricate a fallback login", async () => {
  const source = await read("src/context/AuthContext.tsx");
  const verifyEmail = await read("src/app/verify-email/page.tsx");
  assert.match(source, /fetch\("\/api\/auth\/session"/);
  assert.doesNotMatch(source, /switchRole|impersonateUser|stopImpersonating/);
  assert.doesNotMatch(source, /fallbackUser|LEVEL_3_PROFILE_BIOMETRIC/);
  assert.doesNotMatch(source, /intimo_user_data/);
  assert.doesNotMatch(source, /dateOfBirth: "1998-05-15"/);
  assert.doesNotMatch(source, /setUser\(parsedUser\)/);
  assert.doesNotMatch(verifyEmail, /EmailVerificationService|intimo_user_data|verifyToken/);
  assert.match(verifyEmail, /api\/auth\/verify-status/);
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

test("anonymous community discovery is explicit-public-only and excludes sensitive profile fields", async () => {
  const collection = await read("src/app/api/public/community/route.ts");
  const item = await read("src/app/api/public/profiles/[id]/route.ts");
  const serializer = await read("src/lib/supabase/publicCommunity.ts");
  assert.match(collection, /\.eq\("profile_visibility", "EVERYONE"\)/);
  assert.match(collection, /\.eq\("public_profile_visibility", true\)/);
  assert.match(collection, /\.eq\("account_status", "ACTIVE"\)/);
  assert.match(collection, /\.eq\("discovery_disabled", false\)/);
  assert.match(collection, /\.range\(offset, offset \+ limit - 1\)/);
  assert.match(item, /toAnonymousPublicProfile/);
  assert.doesNotMatch(serializer, /sexual_orientation|interests|lifestyle_tags|looking_for|email|auth_id|gallery_images/);
  assert.doesNotMatch(serializer, /avatar_url|cover_photo_url|date_of_birth/);
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
  const browsePage = await read("src/app/dating/page.tsx");
  const collection = await read("src/app/api/dating-ads/route.ts");
  assert.doesNotMatch(createPage, /offering services|Erotic services|Incall apartments|S\/M studios/i);
  assert.doesNotMatch(createPage, /Require VIP Membership/);
  assert.match(browsePage, /process\.env\.NODE_ENV === "development" \? \[/);
  assert.match(browsePage, /return <PublicDatingBrowse \/>/);
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
  assert.match(reports, /rpc\("intimo_create_report"/);
  assert.match(modal, /fetch\("\/api\/reports"/);
  assert.doesNotMatch(modal, /userStore\.submitReport/);
});

test("report and appeal case transitions are transactional and unavailable to browser roles", async () => {
  const migration = await read("supabase/migrations/20260816_transactional_safety_actions.sql");
  const appeal = await read("src/app/api/reports/[id]/appeal/route.ts");
  assert.match(migration, /create or replace function public\.intimo_create_report/);
  assert.match(migration, /insert into public\.moderation_events/);
  assert.match(migration, /for update/);
  assert.match(migration, /create unique index.*moderation_appeals_case_appellant/i);
  assert.match(migration, /revoke all on function public\.intimo_create_report[\s\S]*from public,anon,authenticated/i);
  assert.match(appeal, /rpc\("intimo_create_appeal"/);
});

test("follow and favorite operations are server-owned and block-aware", async () => {
  const route = await read("src/app/api/connections/route.ts");
  const favorites = await read("src/app/favorites/page.tsx");
  assert.match(route, /follower_id: actor\.actor\.profileId/);
  assert.match(route, /from\("user_blocks"\)/);
  assert.match(route, /toMemberVisibleProfile/);
  assert.match(favorites, /fetch\("\/api\/saved-items"/);
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

test("settings uses durable media uploads and exposes no fake blocked users or push controls", async () => {
  const settings = await read("src/app/settings/page.tsx");
  assert.match(settings, /uploadFileToR2\(file, "avatars"/);
  assert.match(settings, /uploadFileToR2\(file, "covers"/);
  assert.doesNotMatch(settings, /FileReader|MOCK_SAFETY_SETTINGS|spammer_bot_99|unwanted_contact/);
  assert.doesNotMatch(settings, /Mobile Push Notification Controls|Livestream Start Notifications/);
});

test("client identity is restored only from the verified server session", async () => {
  const context = await read("src/context/AuthContext.tsx");
  assert.match(context, /fetch\("\/api\/auth\/session"/);
  assert.doesNotMatch(context, /intimo_user_data/);
  assert.doesNotMatch(context, /setUser\(parsedUser\)/);
  assert.doesNotMatch(context, /dateOfBirth: "1998-05-15"/);
});

test("public media requires signed adult declaration and explicit moderation approval", async () => {
  const declaration = await read("src/lib/auth/ageDeclaration.ts");
  const publicFile = await read("src/app/api/public/media/[id]/route.ts");
  const memberFile = await read("src/app/api/media/[id]/route.ts");
  const migration = await read("supabase/migrations/20260814_public_community_content.sql");
  assert.match(declaration, /createHmac\("sha256"/);
  assert.match(declaration, /timingSafeEqual/);
  assert.match(publicFile, /verifyAgeDeclarationValue/);
  assert.match(publicFile, /\.eq\("visibility", "PUBLIC"\)/);
  assert.match(publicFile, /\.eq\("moderation_status", "APPROVED"\)/);
  assert.match(memberFile, /moderationStatus !== "APPROVED"/);
  assert.match(migration, /PENDING_REVIEW/);
  assert.match(migration, /revoke all on table public\.content_posts/);
});

test("notifications, saves, comments, and unread messages are durable and server-owned", async () => {
  const notifications = await read("src/app/api/notifications/route.ts");
  const notificationPage = await read("src/app/notifications/page.tsx");
  const messages = await read("src/app/api/messages/route.ts");
  const saves = await read("src/app/api/saved-items/route.ts");
  const comments = await read("src/app/api/comments/route.ts");
  assert.match(notifications, /resolveServerActor\(req\)/);
  assert.match(notifications, /\.eq\("user_id", auth\.actor\.profileId\)/);
  assert.doesNotMatch(notificationPage, /localStorage|notificationStore/);
  assert.match(messages, /unreadCount =/);
  assert.match(messages, /type: "NEW_MESSAGE"/);
  assert.match(saves, /resolveContentTarget/);
  assert.match(saves, /profile_id: actor\.actor\.profileId/);
  assert.match(comments, /resolveContentTarget/);
  assert.match(comments, /author_id: actor\.actor\.profileId/);
});

test("shared actor boundary blocks inactive accounts and unified search enforces privacy", async () => {
  const actor = await read("src/lib/auth/serverActor.ts");
  const search = await read("src/app/api/search/route.ts");
  assert.match(actor, /accountStatus/);
  assert.match(actor, /actor\.accountStatus === "ACTIVE"/);
  assert.match(search, /user_blocks/);
  assert.match(search, /account_status", "ACTIVE"/);
  assert.match(search, /ranking: "category_then_published_or_created_desc_then_id_asc"/);
  assert.doesNotMatch(search, /openai|anthropic|embedding|vector/i);
});

test("dating saves and reactivation use durable server APIs", async () => {
  const page = await read("src/app/dating/page.tsx");
  const route = await read("src/app/api/dating-ads/[id]/route.ts");
  assert.match(page, /api\/saved-items/);
  assert.doesNotMatch(page, /intimo_all_dating_ads/);
  assert.match(route, /DATING_AD_REACTIVATE/);
  assert.match(route, /eq\("author_id", actor\.actor\.profileId\)/);
});

test("identity verification evidence is owner-submitted, private, and admin-audited", async () => {
  const submission = await read("src/app/api/verification/route.ts");
  const evidence = await read("src/app/api/admin/verification/[id]/evidence/route.ts");
  const context = await read("src/context/AuthContext.tsx");
  assert.match(submission, /eq\("owner_id", actor\.actor\.profileId\)/);
  assert.match(submission, /media\.visibility !== "PRIVATE"/);
  assert.match(submission, /verification_type: "IDENTITY"/);
  assert.match(evidence, /requireAdminPermission\(req, "verification:view"\)/);
  assert.match(evidence, /VERIFICATION_EVIDENCE_VIEW/);
  assert.doesNotMatch(context, /impersonateUser|fallbackUser|intimo_original_admin_user/);
});

test("privileged admin decisions use explicit inline forms, not ambiguous browser prompts", async () => {
  const consoleSource = await read("src/components/admin/AdminCommandCenter.tsx");
  assert.doesNotMatch(consoleSource, /window\.prompt|\balert\(/);
  assert.match(consoleSource, /Cancel without changes/);
  assert.match(consoleSource, /Auditable reason/);
});

test("messaging entry points use the durable message screen, not a local chat store", async () => {
  const layout = await read("src/app/layout.tsx");
  const dating = await read("src/app/dating/page.tsx");
  assert.doesNotMatch(layout, /FloatingChat/);
  assert.doesNotMatch(dating, /intimo_open_chat|intimo_chat_messages/);
  assert.match(dating, /\/messages\?user=/);
});
