import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { presenceBucket, shouldTouchActivity } from "../src/lib/presence.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const now = new Date("2026-10-17T20:00:00Z");
const ago = (minutes) => new Date(now.getTime() - minutes * 60_000).toISOString();

test("presence is a coarse bucket and respects the member's choice", () => {
  assert.equal(presenceBucket(ago(5), true, now), "ONLINE");
  assert.equal(presenceBucket(ago(60), true, now), "TODAY");
  assert.equal(presenceBucket(ago(60 * 48), true, now), "WEEK");
  assert.equal(presenceBucket(ago(60 * 24 * 8), true, now), null);
  assert.equal(presenceBucket(ago(5), false, now), null);
  assert.equal(presenceBucket(null, true, now), null);
});

test("activity is written at most every five minutes", () => {
  assert.equal(shouldTouchActivity(null, now), true);
  assert.equal(shouldTouchActivity(ago(4), now), false);
  assert.equal(shouldTouchActivity(ago(5), now), true);
});

test("presence is recorded server-side and exposed only as buckets", async () => {
  const actor = await read("src/lib/auth/serverActor.ts");
  assert.match(actor, /shouldTouchActivity\(data\.last_active_at\)/);
  const mapper = await read("src/lib/supabase/publicProfile.ts");
  assert.match(mapper, /presenceBucket\(row\.last_active_at, row\.show_online_status === true\)/);
  assert.doesNotMatch(mapper, /lastActiveAt:/);
  assert.match(await read("src/app/api/profile/me/route.ts"), /show_online_status: true,/);
});
