import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { areaIdsWithin, parsePeopleFilters, whoFilterExpression } from "../src/lib/people.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("filters are parsed defensively", () => {
  const f = parsePeopleFilters(new URLSearchParams("who=WOMEN,COUPLES,BOGUS&minAge=40&maxAge=30&withinKm=7&active=ONLINE&desires=toys,nope&cursor=2026-10-17T18:00:00.000Z|11111111-1111-4111-8111-111111111111&limit=500"));
  assert.deepEqual(f.who, ["WOMEN", "COUPLES"]);
  assert.equal(f.minAge, 40);
  assert.equal(f.maxAge, 40);
  assert.equal(f.withinKm, null);
  assert.equal(f.active, "ONLINE");
  assert.deepEqual(f.desires, ["toys"]);
  assert.equal(f.cursor.id, "11111111-1111-4111-8111-111111111111");
  assert.equal(f.limit, 24);
  assert.equal(parsePeopleFilters(new URLSearchParams("cursor=x;drop")).cursor, null);
});

test("distance uses area centroids only", () => {
  const near = areaIdsWithin("praha-2", 5);
  assert.ok(near.includes("praha-2") && near.includes("praha-3"));
  assert.ok(!near.includes("kladno"));
  assert.equal(areaIdsWithin("abroad", 5), null);
});

test("who filter builds a safe OR expression", () => {
  assert.equal(whoFilterExpression([]), null);
  assert.equal(whoFilterExpression(["COUPLES"]), "is_couple_profile.eq.true");
  assert.match(whoFilterExpression(["WOMEN", "MEN"]), /gender\.eq\.FEMALE.*gender\.eq\.MALE/);
});

test("discovery runs filters in the query, pages by keyset and excludes blocks", async () => {
  const route = await read("src/app/api/discovery/profiles/route.ts");
  assert.match(route, /\.gte\("age", filters\.minAge\)/);
  assert.match(route, /query = query\.in\("area_id", areaIds\)/);
  assert.match(route, /created_at\.lt\.\$\{filters\.cursor\.createdAt\},and\(created_at\.eq\./);
  assert.match(route, /\.select\(DISCOVERY_COLUMNS\)/);
  assert.match(route, /\.eq\("account_status", "ACTIVE"\)/);
  assert.match(route, /query = query\.not\("id", "in", `\(\$\{excludedIds\.join\(","\)\}\)`\)/);
  assert.match(await read("src/lib/discovery/context.ts"), /row\.location_precision === "HIDDEN" \? null/);
  const people = await read("src/components/people/MemberPeople.tsx");
  assert.match(people, /if \(people\.length === 0\) return null; \/\/ Empty rails hide/);
  assert.match(people, /\["ONLINE", "Online now"\], \["DAY", "Active today"\], \["WEEK", "Active this week"\]/);
  assert.match(await read("next.config.mjs"), /source: "\/discovery", destination: "\/people"/);
});
