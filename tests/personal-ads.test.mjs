import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PERSONAL_CATEGORIES, validatePersonalAd } from "../src/lib/personalAds.mjs";

const base = { category: "HOOKUP", title: "Sex with someone who knows what they want", body: "Looking for a casual hookup with clear communication.", boundaries: "No surprise guests.", minAge: 25, maxAge: 55, days: 7 };
test("personal categories are explicit, personal and distinct from paid services", () => {
  assert.deepEqual(PERSONAL_CATEGORIES.map(item => item.value), ["HOOKUP", "FUCK_BUDDY", "COUPLES", "GROUP", "KINK", "ONLINE"]);
  assert.ok(PERSONAL_CATEGORIES.every(item => !/service|promot|pay/i.test(item.label)));
  const sql = readFileSync(new URL("../supabase/migrations/20261027053210_20261105000000_personal_dating_ads.sql", import.meta.url), "utf8");
  assert.match(sql, /revoke all on public\.personal_ads from public, anon, authenticated/);
  assert.match(sql, /alter table public\.personal_ads force row level security/);
});
test("personal ad validation bounds life, ages, text and reply types", () => {
  const accepted = validatePersonalAd({ ...base, allowedReplyGenders: ["♀", "♀", "not a profile"], requireVerified: true });
  assert.deepEqual(accepted.ad.allowed_reply_genders, ["♀"]);
  assert.equal(accepted.ad.require_verified, true);
  for (const change of [{ days: 365 }, { minAge: 17 }, { maxAge: 100 }, { minAge: 56 }, { category: "SERVICES" }, { body: "sex" }, { boundaries: "" }]) {
    assert.ok(validatePersonalAd({ ...base, ...change }).error, JSON.stringify(change));
  }
});
