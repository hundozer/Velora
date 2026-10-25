import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENE_KINDS, validateSceneEvent } from "../src/lib/scene.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const now = new Date("2026-10-17T22:00:00Z");
const base = { title: "Monthly munch", kind: "MUNCH", startsAt: "2026-10-24T18:00:00Z", organiser: "Prague Munch", url: "https://example.org/munch" };

test("listings require https links, a future start and a known kind", () => {
  assert.equal(validateSceneEvent(base, now).event.url, "https://example.org/munch");
  assert.match(validateSceneEvent({ ...base, url: "http://example.org" }, now).error, /https/);
  assert.match(validateSceneEvent({ ...base, url: "javascript:alert(1)" }, now).error, /https/);
  assert.match(validateSceneEvent({ ...base, startsAt: "2026-10-01T18:00:00Z" }, now).error, /future/);
  assert.match(validateSceneEvent({ ...base, kind: "ORGY" }, now).error, /kind/);
  assert.match(validateSceneEvent({ ...base, endsAt: "2026-10-24T17:00:00Z" }, now).error, /after the start/);
});

test("migration matches kinds; only published upcoming listings are public", async () => {
  const sql = await read("supabase/migrations/20261027000000_scene_events.sql");
  const kinds = sql.match(/check \(kind in \(([^)]+)\)\)/)[1].split(",").map((item) => item.trim().replace(/'/g, ""));
  assert.deepEqual(kinds, SCENE_KINDS.map((kind) => kind.value));
  assert.match(sql, /check \(url like 'https:\/\/%'\)/);
  assert.match(sql, /revoke all on public\.scene_events from anon, authenticated;/);
  const route = await read("src/app/api/scene/route.ts");
  assert.match(route, /\.eq\("status", "PUBLISHED"\)/);
  assert.match(route, /status: "PENDING_REVIEW", submitted_by: auth\.actor\.profileId/);
  const admin = await read("src/app/api/admin/scene/route.ts");
  assert.equal((admin.match(/requireAdminPermission\(req, "community:moderate"\)/g) || []).length, 3);
  assert.match(await read("src/components/scene/SceneEventCard.tsx"), /rel="noopener noreferrer nofollow"/);
});
