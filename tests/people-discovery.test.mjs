import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ACTIVITY_GROUPS, INTRODUCTIONS_MAX, allOf, areaIdsMatching, audienceExpression, chooseIntroductions, normaliseSearch, parsePeopleFilters, searchExpression } from "../src/lib/people.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const rows = (prefix, n) => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}` }));

test("Introductions: at most five, online first, then new, then recently active, no repeats", () => {
  const picked = chooseIntroductions({ online: rows("o", 2), fresh: [{ id: "o1" }, ...rows("n", 2)], recent: rows("r", 9) }, { viewerId: "v", day: "2026-10-19" });
  assert.equal(picked.length, INTRODUCTIONS_MAX);
  assert.deepEqual(picked.map((p) => p.reason), ["ONLINE", "ONLINE", "NEW", "NEW", "RECENT"]);
  assert.equal(new Set(picked.map((p) => p.row.id)).size, 5);
});

test("Introductions rotate fairly per viewer and per day instead of always showing the same people", () => {
  const recent = rows("r", 30);
  const first = (viewerId, day) => chooseIntroductions({ recent }, { viewerId, day }).map((p) => p.row.id).join();
  assert.equal(first("v1", "2026-10-19"), first("v1", "2026-10-19"), "stable within a day");
  assert.notEqual(first("v1", "2026-10-19"), first("v1", "2026-10-20"), "changes the next day");
  assert.notEqual(first("v1", "2026-10-19"), first("v2", "2026-10-19"), "differs between viewers");
  // Over many viewers, everyone in the pool gets introduced.
  const shown = new Set();
  for (let v = 0; v < 60; v += 1) for (const p of chooseIntroductions({ recent }, { viewerId: `v${v}`, day: "2026-10-19" })) shown.add(p.row.id);
  assert.equal(shown.size, 30);
});

test("search is sanitised for PostgREST and never matches hidden locations by neighbourhood", () => {
  assert.equal(normaliseSearch("a"), null);
  assert.equal(normaliseSearch("  Lena,(id.eq.x)*  "), "Lena id eq x");
  assert.ok(normaliseSearch("x".repeat(100)).length <= 40);
  assert.deepEqual(areaIdsMatching("holesovice"), ["praha-7"]);
  assert.deepEqual(areaIdsMatching("Žižkov"), ["praha-3"]);
  const expression = searchExpression("zizkov");
  assert.match(expression, /display_name\.ilike\.\*zizkov\*/);
  assert.match(expression, /and\(area_id\.in\.\(praha-3\),location_precision\.neq\.HIDDEN\)/);
  assert.equal(parsePeopleFilters(new URLSearchParams("q=Lena")).q, "Lena");
});

test("FRIENDS_ONLY audiences are part of the query, so pages are never short", () => {
  assert.equal(audienceExpression([]), "profile_visibility.in.(EVERYONE,MEMBERS_ONLY)");
  assert.match(audienceExpression(["f1", "f2"]), /and\(profile_visibility\.eq\.FRIENDS_ONLY,id\.in\.\(f1,f2\)\)/);
  assert.equal(allOf([null, "a.eq.1"]), "a.eq.1");
  assert.equal(allOf(["a.eq.1,b.eq.2", "c.eq.3"]), "and(or(a.eq.1,b.eq.2),or(c.eq.3))");
});

test("activity order: cursors are validated and the hidden group carries no activity", async () => {
  const params = (q) => parsePeopleFilters(new URLSearchParams(q));
  assert.equal(params("sort=activity").sort, "activity");
  assert.equal(params("sort=activity&cursor=nonsense").activityCursor, null);
  assert.deepEqual(params("sort=activity&cursor=R").activityCursor, { phase: "R", at: null, id: null });
  assert.equal(params("cursor=A|2026-10-18T10:00:00Z|00000000-0000-4000-8000-000000000001").cursor, null, "activity cursors don't parse as join-date cursors");
  assert.deepEqual(ACTIVITY_GROUPS.map((g) => g.label), ["Here now", "Earlier today", "This week", "Other people nearby"]);
  const route = await read("src/app/api/discovery/profiles/route.ts");
  // Phase A only ever includes members who show their activity.
  assert.match(route, /currentPhase === "A"\) query = query\.eq\("show_online_status", true\)/);
  // Phase R is ordered by join date, so hidden activity can't influence position.
  assert.match(route, /else query = query\.order\("created_at", \{ ascending: false \}\)/);
  assert.doesNotMatch(route, /count: "exact"|\.count\b/, "never exact counts");
});

test("introductions honour opt-out, blocks, FRIENDS_ONLY and hidden status on the server", async () => {
  const route = await read("src/app/api/discovery/introductions/route.ts");
  assert.match(route, /query = query\.eq\("show_in_introductions", true\)/);
  assert.match(route, /loadViewerContext\(supabase, actorResult\.actor\.profileId\)/);
  assert.match(route, /\.or\(audienceExpression\(context\.friendIds\)\)/);
  assert.match(route, /kind === "online"\) query = query\.eq\("show_online_status", true\)/);
  assert.match(route, /kind === "recent"\) query = query\.eq\("show_online_status", true\)/);
  assert.match(route, /hasAdultAccess\(actorResult\.actor\)/);
  const context = await read("src/lib/discovery/context.ts");
  assert.doesNotMatch(context.match(/DISCOVERY_COLUMNS = \[[\s\S]*?\]/)[0], /email|date_of_birth|auth_id|erogenous|pubic|favourite_sex/);
  const settings = await read("src/app/api/privacy/settings/route.ts");
  assert.match(settings, /show_in_introductions: input\.showInIntroductions !== false/);
  const sql = await read("supabase/migrations/20261103000000_introductions.sql");
  assert.match(sql, /add column if not exists show_in_introductions boolean not null default true/);
});
