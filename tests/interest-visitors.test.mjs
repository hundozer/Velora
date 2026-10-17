import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("migration: one view per viewer per day, server-written, owner-read", async () => {
  const sql = await read("supabase/migrations/20261024_interest_visitors.sql");
  assert.match(sql, /primary key \(viewer_id, viewed_id, viewed_on\)/);
  assert.match(sql, /primary key \(from_id, to_id\)/);
  assert.match(sql, /revoke all on public\.profile_views from anon, authenticated;/);
  assert.match(sql, /revoke all on public\.interests from anon, authenticated;/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)/i);
  assert.match(sql, /add column if not exists browse_invisibly boolean not null default false/);
});

test("views are recorded server-side, never for invisible browsers or owners", async () => {
  const route = await read("src/app/api/profiles/[id]/route.ts");
  assert.match(route, /if \(!isOwner && !isAdmin\) \{[\s\S]*viewer\.browse_invisibly !== true[\s\S]*onConflict: "viewer_id,viewed_id,viewed_on"/);
});

test("interest is block-aware and notifies once; activity hides blocked members", async () => {
  const interests = await read("src/app/api/interests/route.ts");
  assert.match(interests, /if \(blockError \|\| block \|\| !target \|\| target\.account_status !== "ACTIVE"/);
  assert.match(interests, /ignoreDuplicates: true/);
  assert.match(interests, /if \(inserted && inserted\.length > 0\)/);
  assert.match(interests, /"MUTUAL_INTEREST"/);
  const activity = await read("src/app/api/activity/route.ts");
  assert.match(activity, /\.filter\(\(id\) => !blocked\.has\(id\)\)/);
  assert.match(activity, /const invisible = self\?\.browse_invisibly === true;/);
});

test("interest data is exported and erased with the account", async () => {
  assert.match(await read("src/lib/privacy/retention.ts"), /\["interests", "from_id"\], \["interests", "to_id"\]/);
  assert.match(await read("src/app/api/privacy/export/route.ts"), /interestsSent: supabase\.from\("interests"\)/);
  assert.match(await read("src/app/api/privacy/settings/route.ts"), /browse_invisibly: input\.browseInvisibly === true/);
});
