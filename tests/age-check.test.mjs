// FM-06: nobody is let in to the community until an admin has checked their age.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import ts from "typescript";
import * as ageCheck from "../src/lib/auth/ageCheck.mjs";
import * as identity from "../src/lib/identity.mjs";

const { hasVerifiedAccess, hasSetupAccess, isVisibleMember, newChallengeCode, challengeIsFresh, profileStatusForDecision, memberAgeCheckState, ageCheckOpenPath, CODE_PATTERN, CODE_ALPHABET } = ageCheck;
const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(file, mocks) {
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => (name in mocks ? mocks[name] : require(name)), module, module.exports);
  return module.exports;
}
const PROFILE = "12345678-1234-4123-8123-123456789012";
const MEDIA = "22345678-1234-4123-8123-123456789012";
const REVIEW = "32345678-1234-4123-8123-123456789012";

test("only active, age-checked members get community access or are shown to others", () => {
  assert.equal(hasVerifiedAccess({ accountStatus: "ACTIVE", ageVerificationStatus: "AGE_VERIFIED" }), true);
  for (const status of ["AGE_DECLARED", "PENDING", "REVIEW_REQUIRED", "FAILED", "UNVERIFIED", undefined]) {
    assert.equal(hasVerifiedAccess({ accountStatus: "ACTIVE", ageVerificationStatus: status }), false, String(status));
    assert.equal(isVisibleMember({ account_status: "ACTIVE", age_verification_status: status }), false, String(status));
  }
  assert.equal(hasVerifiedAccess({ accountStatus: "SUSPENDED", ageVerificationStatus: "AGE_VERIFIED" }), false);
  assert.equal(isVisibleMember({ account_status: "ACTIVE", age_verification_status: "AGE_VERIFIED" }), true);
  assert.equal(isVisibleMember({ account_status: "ACTIVE" }), false, "a row loaded without the column is never visible");
  // Waiting members may still set up their own profile; refused ones may not.
  for (const status of ["AGE_DECLARED", "PENDING", "REVIEW_REQUIRED", "AGE_VERIFIED"]) assert.equal(hasSetupAccess({ accountStatus: "ACTIVE", ageVerificationStatus: status }), true, status);
  for (const status of ["FAILED", "UNVERIFIED"]) assert.equal(hasSetupAccess({ accountStatus: "ACTIVE", ageVerificationStatus: status }), false, status);
  assert.equal(hasSetupAccess({ accountStatus: "BANNED", ageVerificationStatus: "AGE_DECLARED" }), false);
});

test("hasAdultAccess means age-checked, so every community API now requires the check", () => {
  const actor = read("src/lib/auth/serverActor.ts");
  assert.match(actor, /export function hasAdultAccess\(actor: ServerActor\): boolean \{\n  return hasVerifiedAccess\(actor\);\n\}/);
  assert.doesNotMatch(actor, /ageVerificationStatus === "AGE_DECLARED"/);
});

test("codes are six unambiguous characters, single-use and valid for 24 hours", () => {
  const codes = new Set();
  for (let i = 0; i < 200; i++) {
    const code = newChallengeCode(randomBytes);
    assert.match(code, CODE_PATTERN);
    codes.add(code);
  }
  assert.ok(codes.size > 195, "codes don't repeat in practice");
  assert.doesNotMatch(CODE_ALPHABET, /[01OIL]/, "no characters that are confused when handwritten");
  // Bytes 248-255 are skipped so every character is equally likely.
  let calls = 0;
  const biased = () => { calls++; return calls === 1 ? Buffer.alloc(16, 250) : Buffer.alloc(16, 0); };
  assert.equal(newChallengeCode(biased), "AAAAAA");
  const now = Date.parse("2026-11-18T12:00:00Z");
  assert.equal(challengeIsFresh("ABC234", "2026-11-18T00:00:01Z", now), true);
  assert.equal(challengeIsFresh("ABC234", "2026-11-17T12:00:00Z", now), false, "expired after 24 hours");
  assert.equal(challengeIsFresh("ABC234", "2026-11-19T12:00:00Z", now), false, "not issued in the future");
  assert.equal(challengeIsFresh("abc234", "2026-11-18T11:00:00Z", now), false);
  assert.equal(challengeIsFresh(null, "2026-11-18T11:00:00Z", now), false);
});

test("admin decisions map to the member's state; pages other than setup show the prompt", () => {
  assert.equal(profileStatusForDecision("VERIFIED"), "AGE_VERIFIED");
  assert.equal(profileStatusForDecision("FAILED"), "FAILED");
  assert.equal(profileStatusForDecision("RETRY_REQUESTED"), "REVIEW_REQUIRED", "a retry lets the member submit again");
  assert.equal(profileStatusForDecision("REVIEW_REQUIRED"), "PENDING", "a second opinion keeps them waiting");
  assert.equal(profileStatusForDecision("APPROVED"), null);
  assert.equal(memberAgeCheckState("AGE_DECLARED"), "REQUIRED");
  assert.equal(memberAgeCheckState("REVIEW_REQUIRED"), "RETRY");
  assert.equal(memberAgeCheckState("UNVERIFIED"), "UNAVAILABLE");
  for (const path of ["/verify-age", "/me", "/me/identity", "/settings/privacy", "/privacy", "/terms", "/admin/verification", "/onboarding"]) assert.equal(ageCheckOpenPath(path), true, path);
  for (const path of ["/", "/dashboard", "/people", "/messages", "/profile/abc", "/tonight", "/rooms", "/merch", "/meet"]) assert.equal(ageCheckOpenPath(path), false, path);
});

/** The member age-check API against a recording fake database. */
function api({ row, media = { id: MEDIA, owner_id: PROFILE, media_type: "IMAGE", upload_status: "AVAILABLE", visibility: "PRIVATE" }, actor = {}, claim = true, reviewError = null, selectError = null } = {}) {
  const calls = [];
  const audits = [];
  const db = { from(table) {
    const call = { table, op: "select", values: null, filters: [] }; calls.push(call);
    const q = {
      select() { return q; }, maybeSingle() { return q; }, single() { return q; },
      insert(values) { call.op = "insert"; call.values = values; return q; },
      update(values) { call.op = "update"; call.values = values; return q; },
      eq(column, value) { call.filters.push(["eq", column, value]); return q; },
      in(column, value) { call.filters.push(["in", column, value]); return q; },
      then(resolve) {
        if (table === "profiles" && call.op === "select") return resolve({ data: row, error: selectError });
        if (table === "profiles" && call.op === "update") return resolve({ data: claim ? { id: PROFILE, age_check_code: call.values.age_check_code, age_check_code_issued_at: call.values.age_check_code_issued_at } : null, error: null });
        if (table === "media_objects") return resolve({ data: media, error: null });
        if (table === "verification_reviews") return resolve(reviewError ? { data: null, error: reviewError } : { data: { id: REVIEW, status: "PENDING", submitted_at: "now" }, error: null });
        resolve({ data: null, error: null });
      },
    };
    return q;
  }};
  const route = load("src/app/api/age-check/route.ts", {
    "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: PROFILE, userId: PROFILE, accountStatus: "ACTIVE", ageVerificationStatus: row?.age_verification_status, ...actor } }) },
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true, resetInSeconds: 0 }) },
    "@/lib/auth/durableAudit": { appendDurableAudit: async (_db, entry) => { audits.push(entry); return true; } },
    "@/lib/identity.mjs": identity,
    "@/lib/auth/ageCheck.mjs": ageCheck,
  });
  return { route, calls, audits };
}
const get = () => ({ nextUrl: new URL("https://example.test/api/age-check"), headers: new Headers() });
const post = (body) => ({ ...get(), json: async () => body });
const fresh = () => new Date(Date.now() - 60_000).toISOString();
const member = (patch = {}) => ({ id: PROFILE, age_verification_status: "AGE_DECLARED", is_couple_profile: false, partner_display_name: null, age_check_code: null, age_check_code_issued_at: null, ...patch });

test("a member waiting for the check gets a stored code; a pending member gets none", async () => {
  let fake = api({ row: member() });
  let response = await fake.route.GET(get());
  let body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.state, "REQUIRED");
  assert.match(body.code, CODE_PATTERN);
  const saved = fake.calls.find((call) => call.op === "update");
  assert.equal(saved.values.age_check_code, body.code, "the code is kept on the server, not trusted from the browser");
  assert.deepEqual(saved.filters.find((f) => f[1] === "age_verification_status"), ["in", "age_verification_status", ["AGE_DECLARED", "REVIEW_REQUIRED"]]);

  fake = api({ row: member({ age_check_code: "QWE234", age_check_code_issued_at: fresh(), is_couple_profile: true, partner_display_name: "Eva" }) });
  body = await (await fake.route.GET(get())).json();
  assert.equal(body.code, "QWE234", "an unexpired code is reused");
  assert.equal(body.couple, true);
  assert.equal(body.partnerName, "Eva");
  assert.equal(fake.calls.some((call) => call.op === "update"), false);

  fake = api({ row: member({ age_verification_status: "PENDING" }) });
  body = await (await fake.route.GET(get())).json();
  assert.equal(body.state, "PENDING");
  assert.equal(body.code, undefined);

  fake = api({ row: null, selectError: { code: "42703" } });
  assert.deepEqual(await (await fake.route.GET(get())).json(), { available: false }, "before the migration the page explains it isn't ready");
});

test("submitting spends the code, queues one AGE review with the code, and audits without the photo", async () => {
  const fake = api({ row: member({ age_check_code: "QWE234", age_check_code_issued_at: fresh(), is_couple_profile: true }) });
  const response = await fake.route.POST(post({ mediaId: MEDIA }));
  assert.equal(response.status, 201);
  const claim = fake.calls.find((call) => call.table === "profiles" && call.op === "update");
  assert.deepEqual(claim.values, { age_verification_status: "PENDING", age_check_code: null, age_check_code_issued_at: null });
  assert.ok(claim.filters.some((f) => f[1] === "age_check_code" && f[2] === "QWE234"), "only the request holding the current code wins");
  const review = fake.calls.find((call) => call.table === "verification_reviews");
  assert.deepEqual(review.values, { profile_id: PROFILE, verification_type: "AGE", status: "PENDING", provider_method: "MANUAL_SELFIE_CODE", provider_reference: MEDIA, challenge_code: "QWE234" });
  assert.deepEqual(fake.audits[0].metadata, { method: "MANUAL_SELFIE_CODE", couple: true });
});

test("submissions with an expired code, someone else's photo or a public photo are refused", async () => {
  let fake = api({ row: member({ age_check_code: "QWE234", age_check_code_issued_at: "2026-01-01T00:00:00Z" }) });
  let response = await fake.route.POST(post({ mediaId: MEDIA }));
  assert.equal(response.status, 409);
  assert.equal((await response.json()).codeExpired, true);

  for (const media of [null, { id: MEDIA, owner_id: PROFILE, media_type: "IMAGE", upload_status: "AVAILABLE", visibility: "MEMBERS_ONLY" }, { id: MEDIA, owner_id: PROFILE, media_type: "VIDEO", upload_status: "AVAILABLE", visibility: "PRIVATE" }]) {
    fake = api({ row: member({ age_check_code: "QWE234", age_check_code_issued_at: fresh() }), media });
    response = await fake.route.POST(post({ mediaId: MEDIA }));
    assert.equal(response.status, 400);
    assert.equal(fake.calls.some((call) => call.op === "update" || call.op === "insert"), false);
  }

  fake = api({ row: member({ age_verification_status: "PENDING" }) });
  assert.equal((await fake.route.POST(post({ mediaId: MEDIA }))).status, 409, "one check at a time");
  fake = api({ row: member({ age_verification_status: "FAILED" }), actor: { ageVerificationStatus: "FAILED" } });
  assert.equal((await fake.route.POST(post({ mediaId: MEDIA }))).status, 403, "a refused member can't resubmit");
  fake = api({ row: member({ age_check_code: "QWE234", age_check_code_issued_at: fresh() }), claim: false });
  assert.equal((await fake.route.POST(post({ mediaId: MEDIA }))).status, 409, "a lost race doesn't queue a second review");
  assert.equal(fake.calls.some((call) => call.table === "verification_reviews"), false);
});

test("if the review can't be saved the member is put back with the same code", async () => {
  const issued = fresh();
  const fake = api({ row: member({ age_check_code: "QWE234", age_check_code_issued_at: issued }), reviewError: { code: "23505" } });
  assert.equal((await fake.route.POST(post({ mediaId: MEDIA }))).status, 502);
  const updates = fake.calls.filter((call) => call.table === "profiles" && call.op === "update");
  assert.deepEqual(updates[1].values, { age_verification_status: "AGE_DECLARED", age_check_code: "QWE234", age_check_code_issued_at: issued });
});

test("admins decide age checks with the code and the people on the profile in front of them", () => {
  const admin = read("src/app/api/admin/verification/route.ts");
  assert.match(admin, /const ageStatus = profileStatusForDecision\(status\);/);
  assert.match(admin, /age_verified_at: new Date\(\)\.toISOString\(\), age_verification_method: "MANUAL_SELFIE_CODE"/);
  assert.match(admin, /This age check is already decided/);
  assert.match(admin, /select\("id,display_name,age,is_couple_profile,partner_display_name,partner_age,avatar_url"\)/);
  assert.match(admin, /if \(isMissingColumnError\(result\.error\)\) result = await list\(REVIEW_COLUMNS\);/);
  assert.match(read("src/app/api/admin/verification/[id]/evidence/route.ts"), /in\("verification_type", \["IDENTITY", "AGE"\]\)/);
  const inbox = read("src/components/admin/AdminWorkInbox.tsx");
  assert.match(inbox, /Code they must hold up:/);
  assert.match(inbox, /<strong>Both<\/strong> must be in the selfie/);
});

test("an admin can approve a member by hand, with a confirmation, a reason and a history record", () => {
  const users = read("src/app/api/admin/users/[id]/route.ts");
  assert.match(users, /APPROVE_AGE: \{ permission: "verification:decide", highRisk: true \}/);
  assert.match(users, /age_verification_status: "AGE_VERIFIED", age_verified_at: new Date\(\)\.toISOString\(\), age_verification_method: "ADMIN_ATTESTATION"/);
  assert.match(users, /provider_method: "ADMIN_ATTESTATION", reason, reviewed_by: auth\.actor\.profileId/);
  assert.match(users, /Administrators cannot apply privileged account actions to themselves/);
  assert.match(read("src/components/admin/AdminAccountAction.tsx"), /\['SUSPEND', 'BAN', 'REACTIVATE', 'APPROVE_AGE'\]\.includes\(action\)/);
});

test("members who aren't age-checked are hidden from discovery, search, profiles, messages and media", () => {
  for (const file of ["src/app/api/discovery/profiles/route.ts", "src/app/api/discovery/introductions/route.ts", "src/app/api/search/route.ts", "src/app/api/activity/route.ts", "src/app/api/messages/route.ts", "src/app/api/public/community/route.ts", "src/app/api/public/profiles/[id]/route.ts", "src/app/api/public/media/route.ts", "src/app/api/public/media/[id]/route.ts", "src/app/api/public/search/route.ts"]) {
    assert.match(read(file), /\.eq\("age_verification_status", "AGE_VERIFIED"\)/, file);
  }
  for (const file of ["src/app/api/public/albums/route.ts", "src/app/api/public/albums/[id]/route.ts"]) assert.match(read(file), /\.eq\("age_verification_status","AGE_VERIFIED"\)/, file);
  for (const file of ["src/lib/profiles/memberProfileAccess.ts", "src/app/api/interests/route.ts", "src/app/api/friends/route.ts", "src/app/api/media/[id]/route.ts", "src/app/api/profiles/[id]/route.ts"]) assert.match(read(file), /isVisibleMember\(/, file);
  for (const file of ["src/app/api/personal-ads/route.ts", "src/app/api/dating-ads/route.ts", "src/app/api/saved-items/route.ts", "src/app/api/albums/[id]/route.ts"]) assert.match(read(file), /age_verification_status === "AGE_VERIFIED"|age_verification_status !== "AGE_VERIFIED"/, file);
  // Before the check a member opens only their own profile.
  assert.match(read("src/app/api/profiles/[id]/route.ts"), /!\(hasSetupAccess\(actorResult\.actor\) && id === actorResult\.actor\.profileId\)/);
});

test("the selfie is admin-only evidence: never in albums, private sharing or the photo queue", () => {
  const media = read("src/app/api/media/[id]/route.ts");
  assert.match(media, /if \(!isOwner && "category" in media && media\.category === "AGE_CHECK"\) return/);
  assert.match(media, /Age check photos can't be changed/);
  assert.match(read("src/app/api/media/presign-upload/route.ts"), /: isAgeCheck \? "PRIVATE"/);
  assert.match(read("src/app/api/media/route.ts"), /category\.neq\.AGE_CHECK/);
  assert.match(read("src/app/api/albums/[id]/media/route.ts"), /in\("category", \["STORY", "AGE_CHECK"\]\)/);
  for (const file of ["src/app/api/private-access/route.ts", "src/app/api/private-access/media/route.ts", "src/app/api/admin/media/route.ts"]) assert.match(read(file), /category\.neq\.AGE_CHECK/, file);
  assert.match(read("src/lib/admin/workspace.mjs"), /row\.category !== 'AGE_CHECK'/);
});

test("the migration is additive, allows PENDING and keeps one open age check per member", () => {
  const sql = read("supabase/migrations/20261118150000_age_check.sql");
  assert.match(sql, /-- ROLLBACK/);
  assert.match(sql, /\('UNVERIFIED','AGE_DECLARED','PENDING','AGE_VERIFIED','FAILED','REVIEW_REQUIRED'\)/);
  assert.match(sql, /create unique index if not exists verification_reviews_one_open_age_check/);
  assert.match(sql, /where verification_type = 'AGE' and status in \('PENDING', 'REVIEW_REQUIRED'\)/);
  assert.doesNotMatch(sql, /\bdrop table\b|\bdelete from\b|\bupdate public\./i);
  // The code pattern in SQL matches the one in JavaScript.
  assert.ok(sql.includes(`'^[${CODE_ALPHABET}]{6}$'`));
});

test("new members are sent to the age check and the app explains why pages are locked", () => {
  assert.match(read("src/app/onboarding/page.tsx"), /window\.location\.replace\("\/verify-age"\)/);
  assert.match(read("src/app/layout.tsx"), /<AgeCheckGate>\{children\}<\/AgeCheckGate>/);
  const gate = read("src/components/auth/AgeCheckGate.tsx");
  assert.match(gate, /authState === "ACTIVE" && !isStaff && ageCheckStatus !== null && ageCheckStatus !== VERIFIED && !ageCheckOpenPath\(pathname\)/);
  const page = read("src/app/verify-age/page.tsx");
  assert.match(page, /uploadFileToR2\(file, "photos", setProgress, \{/);
  assert.match(page, /"PRIVATE", "NON_EXPLICIT", "AGE_CHECK"\)/);
});
