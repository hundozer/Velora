import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ageFromDateOfBirth, eligibilityText, planAudienceText, planReplyEligibility, replySymbolFor } from "../src/lib/planEligibility.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const now = new Date("2026-10-18T19:05:00Z");
const plan = { author_id: "author", status: "active", moderation_status: "APPROVED", expires_at: "2026-10-18T23:30:00Z", allowed_reply_genders: [], min_age: 18, max_age: 99, require_verified: false, require_media: false };
const man = { id: "viewer", gender: "MALE", is_couple_profile: false, date_of_birth: "1991-05-01", verification_status: "VERIFIED" };
const check = (p, v = man, media = false) => planReplyEligibility({ plan: { ...plan, ...p }, viewer: v, viewerHasApprovedMedia: media, now });

test("an open, live plan accepts replies from any adult member", () => {
  assert.deepEqual(check({}), { canReply: true, reason: null });
});

test("each rule the messages route enforced is applied, in the same order", () => {
  assert.equal(check({ status: "closed" }).reason, "NOT_LIVE");
  assert.equal(check({ moderation_status: "REJECTED" }).reason, "NOT_LIVE");
  assert.equal(check({ expires_at: "2026-10-18T19:05:00Z" }).reason, "NOT_LIVE");
  assert.equal(check({ author_id: "viewer" }).reason, "OWN_PLAN");
  assert.equal(check({ allowed_reply_genders: ["♀", "👫"] }).reason, "PROFILE_TYPE");
  assert.equal(check({ allowed_reply_genders: ["♀", "👫"] }, { ...man, is_couple_profile: true }).canReply, true);
  assert.equal(check({}, { ...man, gender: null }).reason, "PROFILE_TYPE", "unknown profile type cannot reply");
  assert.equal(check({ min_age: 36 }).reason, "AGE");
  assert.equal(check({}, { ...man, date_of_birth: null }).reason, "AGE", "unknown age cannot reply");
  assert.equal(check({ require_verified: true }, { ...man, verification_status: "UNVERIFIED" }).reason, "VERIFIED");
  assert.equal(check({ require_verified: true }, { ...man, verification_status: "UNVERIFIED", verification_level: "LEVEL_3_PROFILE_BIOMETRIC" }).canReply, true);
  assert.equal(check({ require_media: true }).reason, "MEDIA");
  assert.equal(check({ require_media: true }, man, true).canReply, true);
});

test("profile types and ages are derived the same way as before", () => {
  assert.equal(replySymbolFor("FEMALE", false), "♀");
  assert.equal(replySymbolFor("MALE", false), "♂");
  assert.equal(replySymbolFor("COUPLE_MF", false), "👫");
  assert.equal(replySymbolFor("NON_BINARY", false), "⚧");
  assert.equal(replySymbolFor("FEMALE", true), "👫");
  assert.equal(ageFromDateOfBirth("2000-10-19", now), 25);
  assert.equal(ageFromDateOfBirth("2000-10-18", now), 26);
});

test("the indicator reads as a sentence and never reveals more than the plan's own rules", () => {
  assert.equal(planAudienceText(plan), "everyone");
  assert.equal(planAudienceText({ ...plan, allowed_reply_genders: ["♀", "👫"] }), "women and couples");
  assert.equal(planAudienceText({ ...plan, require_verified: true, min_age: 28, max_age: 40 }), "verified members, 28 to 40");
  assert.equal(eligibilityText(plan, { canReply: true, reason: null }), "You can reply — open to everyone.");
  assert.equal(eligibilityText({ ...plan, allowed_reply_genders: ["♀", "👫"] }, { canReply: false, reason: "PROFILE_TYPE" }), "This invitation is for women and couples.");
});

test("one rule for both sides: the messages route enforces it and the plans API reports it", async () => {
  const messages = await read("src/app/api/messages/route.ts");
  const plans = await read("src/app/api/dating-ads/route.ts");
  assert.match(messages, /import \{ isVerifiedMember, planReplyEligibility \} from "@\/lib\/planEligibility\.mjs"/);
  assert.match(plans, /planReplyEligibility\(\{ plan: row, viewer: viewerForEligibility, viewerHasApprovedMedia, now \}\)/);
  assert.doesNotMatch(messages, /function profileReplySymbol|function ageFromDateOfBirth/, "no second copy of the rule");
  // Display only: the plans API never lets a client claim eligibility.
  assert.doesNotMatch(plans, /body\.canReply|canReply: body/);
});

test("start times arrive through an additive migration and the API falls back until it is applied", async () => {
  const sql = await read("supabase/migrations/20261102_plan_start_times.sql");
  assert.match(sql, /add column if not exists starts_at timestamptz/);
  assert.match(sql, /update public\.dating_ads set starts_at = created_at where starts_at is null/);
  assert.match(sql, /check \(expires_at > starts_at\)/);
  assert.match(sql, /Rollback:/);
  const plans = await read("src/app/api/dating-ads/route.ts");
  assert.match(plans, /first\.error\?\.code === UNDEFINED_COLUMN \? buildQuery\(LEGACY_PLAN_COLUMNS, false\)/);
  assert.match(plans, /if \(error\?\.code === UNDEFINED_COLUMN\)/);
  assert.match(plans, /startsAt: planStartsAt\(row\)/);
});

test("feeds, search and saved items use the plan's real end time", async () => {
  for (const file of ["src/app/api/search/route.ts", "src/app/api/saved-items/route.ts", "src/app/api/feed/route.ts"]) {
    const source = await read(file);
    assert.doesNotMatch(source, /validity_days \* 86_400_000/, file);
    assert.match(source, /expires_at/, file);
  }
});
