import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("new dating ads publish immediately for authenticated adult users", () => {
  const route = read("src/app/api/personal-ads/route.ts");
  assert.match(route, /hasAdultAccess\(actor\.actor\)/);
  assert.match(route, /validatePersonalAd\(body\)/);
  assert.match(route, /checkRateLimit/);
  assert.match(route, /insert\(\{ \.\.\.ad, moderation_status: "APPROVED"/);
  assert.match(route, /moderationStatus: "APPROVED"/);
  assert.match(route, /\.neq\("moderation_status", "REJECTED"\)/);
  assert.match(route, /appendDurableAudit/);
});

test("live dating ads remain block-aware and removable with an author notice", () => {
  const member = read("src/app/api/personal-ads/route.ts");
  assert.match(member, /user_blocks/);
  const admin = read("src/app/api/admin/personal-ads/route.ts");
  assert.match(admin, /requireAdminPermission\(req, "content:moderate"\)/);
  assert.match(admin, /body\.decision === "REJECTED" \? "REJECTED" : null/);
  assert.match(admin, /reason\.length < 10/);
  assert.match(admin, /appendDurableAudit/);
  assert.match(admin, /Your dating ad was removed/);
  assert.doesNotMatch(read("src/components/admin/AdminPersonalAdsConsole.tsx"), />Approve</);
});

test("plans remain on the current immediate-publication logic", () => {
  const plan = read("src/app/api/dating-ads/route.ts");
  assert.match(plan, /a member.s first plan no longer goes into a review queue|A member.s first Plan goes live immediately/);
});
