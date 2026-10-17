import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DESIRES, cleanDesireSelections, desireById, parseDesireFilter, sharedDesireIds } from "../src/lib/desires.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("migration seed matches the desire catalogue", async () => {
  const sql = await read("supabase/migrations/20261021_desire_graph.sql");
  const seeded = [...sql.matchAll(/^\s+\('([a-z0-9-]+)', '([a-z]+)', '((?:[^']|'')+)', \d+\)/gm)];
  assert.equal(seeded.length, DESIRES.length);
  for (const [, id, category, label] of seeded) {
    const desire = desireById(id);
    assert.ok(desire, `seeded desire ${id} missing from desires.mjs`);
    assert.deepEqual([desire.category, desire.label], [category, label.replace(/''/g, "'")]);
  }
});

test("desire tables are member-read-only and never visible to anon", async () => {
  const sql = await read("supabase/migrations/20261021_desire_graph.sql");
  assert.match(sql, /revoke all on public\.member_desires from anon, authenticated;/);
  assert.match(sql, /grant select on public\.member_desires to authenticated;/);
  assert.match(sql, /using \(profile_id = auth\.uid\(\)\)/);
  assert.match(sql, /check \(state <> 'NOT_FOR_ME' or visibility = 'PRIVATE'\)/);
  assert.match(sql, /references public\.profiles\(id\) on delete cascade/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)/i);
});

test("selections are normalised; 'Not for me' is always private", () => {
  const rows = cleanDesireSelections([
    { desireId: "threesome", state: "LOVE" },
    { desireId: "feet", state: "NOT_FOR_ME", visibility: "MEMBERS" },
    { desireId: "bondage", state: "HARD_LIMIT", visibility: "PRIVATE" },
    { desireId: "made-up", state: "LOVE" },
    { desireId: "oral", state: "MAYBE" },
    { desireId: "threesome", state: "CURIOUS" },
  ]);
  assert.deepEqual(rows, [
    { desire_id: "threesome", state: "CURIOUS", visibility: "MEMBERS" },
    { desire_id: "feet", state: "NOT_FOR_ME", visibility: "PRIVATE" },
    { desire_id: "bondage", state: "HARD_LIMIT", visibility: "PRIVATE" },
  ]);
  assert.deepEqual(cleanDesireSelections("nope"), []);
});

test("shared desires count only positive states on both sides", () => {
  const mine = [{ desire_id: "toys", state: "LOVE" }, { desire_id: "rough", state: "HARD_LIMIT" }, { desire_id: "clubs", state: "CURIOUS" }];
  const theirs = [{ desire_id: "toys", state: "INTO" }, { desire_id: "rough", state: "LOVE" }, { desire_id: "clubs", state: "HARD_LIMIT" }];
  assert.deepEqual(sharedDesireIds(mine, theirs), ["toys"]);
});

test("discovery filter accepts at most five known desires", () => {
  assert.deepEqual(parseDesireFilter("toys,nope,toys,clubs"), ["toys", "clubs"]);
  assert.equal(parseDesireFilter("dating,fwb,casual,oral,toys,clubs").length, 5);
  assert.deepEqual(parseDesireFilter(null), []);
});

test("desire APIs require consent, hide private rows, honour blocks, and erase on withdrawal", async () => {
  const me = await read("src/app/api/desires/me/route.ts");
  const other = await read("src/app/api/profiles/[id]/desires/route.ts");
  const consents = await read("src/app/api/privacy/consents/route.ts");
  const retention = await read("src/lib/privacy/retention.ts");
  const discovery = await read("src/app/api/discovery/profiles/route.ts");
  assert.match(me, /consentRequired: true/);
  assert.match(me, /metadata: \{ count: rows\.length \}/);
  assert.match(other, /eq\("visibility", "MEMBERS"\)/);
  assert.match(other, /resolveMemberProfileAccess\(req, params\.id\)/);
  assert.match(consents, /consentType === DESIRE_CONSENT_TYPE[\s\S]*from\("member_desires"\)\.delete\(\)/);
  assert.match(retention, /\["member_desires", "profile_id"\]/);
  assert.match(discovery, /\.eq\("visibility", "MEMBERS"\)/);
  assert.match(discovery, /\.in\("state", POSITIVE_STATES\)/);
});
