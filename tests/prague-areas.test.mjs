import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AREAS, areaById, distanceBucket, locationFieldsForArea, areaDistanceKm } from "../src/lib/areas.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("area list covers all 22 Prague districts with unique ids", () => {
  const ids = AREAS.map((area) => area.id);
  assert.equal(new Set(ids).size, ids.length);
  for (let n = 1; n <= 22; n += 1) assert.equal(areaById(`praha-${n}`)?.kind, "PRAGUE_DISTRICT");
  assert.equal(areaById("nowhere"), null);
});

test("migration seed matches src/lib/areas.mjs exactly", async () => {
  const sql = await read("supabase/migrations/20261020_prague_areas.sql");
  const seeded = [...sql.matchAll(/^\s+\('([a-z0-9-]+)', '([^']+)', '([^']+)', '([A-Z_]+)', ([\d.]+|null), ([\d.]+|null), \d+\)/gm)];
  assert.equal(seeded.length, AREAS.length);
  for (const [, id, name, label, kind, lat, lng] of seeded) {
    const area = areaById(id);
    assert.ok(area, `seeded area ${id} missing from areas.mjs`);
    assert.deepEqual([area.name, area.label, area.kind, area.lat, area.lng], [name, label, kind, lat === "null" ? null : Number(lat), lng === "null" ? null : Number(lng)]);
  }
});

test("areas are public reference data but never member-writable", async () => {
  const sql = await read("supabase/migrations/20261020_prague_areas.sql");
  assert.match(sql, /revoke all on public\.areas from anon, authenticated;/);
  assert.match(sql, /grant select on public\.areas to anon, authenticated;/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[^;]*areas/i);
  assert.match(sql, /add column if not exists area_id text references public\.areas\(id\)/);
});

test("distance is only ever a coarse bucket", () => {
  assert.equal(distanceBucket("praha-2", "praha-2"), "SAME_AREA");
  assert.equal(distanceBucket("praha-2", "praha-3"), "UNDER_5");
  assert.equal(distanceBucket("praha-1", "kladno"), "UNDER_25");
  assert.equal(distanceBucket("praha-1", "mlada-boleslav"), "OVER_25");
  assert.equal(distanceBucket("praha-1", "abroad"), null);
  assert.equal(distanceBucket("abroad", "abroad"), null);
  assert.ok(Math.abs(areaDistanceKm("praha-2", "praha-3") - 2.36) < 0.05, "JS and SQL haversine agree (SQL gave 2.36)");
});

test("profile API validates area ids and derives location fields server-side", async () => {
  const route = await read("src/app/api/profile/me/route.ts");
  assert.match(route, /"area_id"/);
  assert.match(route, /if \(!areaId \|\| !areaLocation\) return NextResponse\.json\(\{ error: "Choose your area" \}/);
  assert.match(route, /const derived = locationFieldsForArea\(update\.area_id\);/);
  assert.deepEqual(locationFieldsForArea("praha-2"), { city: "Prague", country: "Czech Republic", location: "Praha 2, Prague" });
});

test("onboarding asks for an area, not a free-form city", async () => {
  const page = await read("src/app/onboarding/page.tsx");
  assert.match(page, /AREAS\.filter\(\(area\) => area\.kind === "PRAGUE_DISTRICT"\)/);
  assert.match(page, /areaId: area,/);
  assert.doesNotMatch(page, /LOCATION_DATA/);
});
