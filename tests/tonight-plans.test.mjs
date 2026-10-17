import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLAN_CATEGORIES, PLAN_DURATIONS, endsInLabel, isPlanLive, validatePlanInput } from "../src/lib/plans.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const now = new Date("2026-10-17T18:00:00Z");
const base = { category: "DATE", title: "Drinks in Vinohrady", text: "Drinks first, then see where it goes.", validityDays: 1 };

test("migration constraints match the plan categories and durations", async () => {
  const sql = await read("supabase/migrations/20261023_tonight_plans.sql");
  const categories = sql.match(/check \(category in \(([^)]+)\)\)/)[1].split(",").map((item) => item.trim().replace(/'/g, ""));
  assert.deepEqual(categories, PLAN_CATEGORIES.map((item) => item.value));
  const days = sql.match(/check \(validity_days in \(([^)]+)\)\)/)[1].split(",").map((item) => Number(item.trim()));
  assert.deepEqual(days, PLAN_DURATIONS.map((item) => item.days));
  assert.match(sql, /add column if not exists plan_id uuid references public\.dating_ads\(id\) on delete set null/);
  assert.match(sql, /revoke all on public\.dating_ads from anon, authenticated;/);
});

test("plan input is validated and expiry computed server-side", () => {
  const { plan } = validatePlanInput({ ...base, allowedReplyGenders: ["♀", "👫", "♀", "VIP"] }, now);
  assert.equal(plan.expires_at, "2026-10-18T18:00:00.000Z");
  assert.deepEqual(plan.allowed_reply_genders, ["♀", "👫"]);
  assert.equal(plan.min_age, 18);
  assert.match(validatePlanInput({ ...base, category: "Erotic services" }, now).error, /what kind/);
  assert.match(validatePlanInput({ ...base, validityDays: 30 }, now).error, /how long/);
  assert.match(validatePlanInput({ ...base, minAge: 17 }, now).error, /18\+/);
  assert.match(validatePlanInput({ ...base, text: "short" }, now).error, /10–1000/);
});

test("expired, ended or rejected plans are not live", () => {
  const live = { status: "active", moderation_status: "PENDING_REVIEW", expires_at: "2026-10-17T20:00:00Z" };
  assert.equal(isPlanLive(live, now), true);
  assert.equal(isPlanLive({ ...live, expires_at: "2026-10-17T17:59:00Z" }, now), false);
  assert.equal(isPlanLive({ ...live, status: "closed" }, now), false);
  assert.equal(isPlanLive({ ...live, moderation_status: "REJECTED" }, now), false);
  assert.equal(endsInLabel("2026-10-17T20:30:00Z", now), "Ends in 3 h");
  assert.equal(endsInLabel("2026-10-20T18:00:00Z", now), "Ends in 3 days");
});

test("plans are members-only, block-aware, capped, and first plans are queued for review", async () => {
  const collection = await read("src/app/api/dating-ads/route.ts");
  assert.match(collection, /\.filter\(\(row\) => !blocked\.has\(row\.author_id\)\)/);
  assert.match(collection, /live\.length >= MAX_LIVE_PLANS/);
  assert.match(collection, /\? "APPROVED" : "PENDING_REVIEW"/);
  assert.match(await read("src/app/api/public/community/route.ts"), /const datingAds: Array<Record<string, unknown>> = \[\];/);
  const search = await read("src/app/api/public/search/route.ts");
  assert.doesNotMatch(search, /from\("dating_ads"\)/);
  assert.match(await read("next.config.mjs"), /source: "\/dating", destination: "\/tonight"/);
  assert.match(await read("src/components/layout/MobileNavigation.tsx"), /href: "\/tonight", label: t\("nav\.tonight"\)/);
});
