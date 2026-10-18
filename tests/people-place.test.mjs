import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PEOPLE_SNAPSHOT_TTL_MS, clearPeopleSnapshots, readSnapshot, snapshotKey, takeSnapshot, writeSnapshot } from "../src/lib/peopleSession.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function memoryStorage() {
  const map = new Map();
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(k, String(v)); },
    removeItem: (k) => { map.delete(k); },
  };
}

test("a snapshot restores once for the same filters and expires", () => {
  const storage = memoryStorage();
  const now = 1_000_000;
  writeSnapshot(storage, "who=WOMEN", { people: [{ id: "a" }], cursor: "c", rails: { active: [] }, scrollY: 812.6 }, now);
  assert.equal(readSnapshot(storage, "who=MEN", now), null, "different filters never restore");
  assert.equal(readSnapshot(storage, "who=WOMEN", now + PEOPLE_SNAPSHOT_TTL_MS + 1), null, "stale snapshots are ignored");
  const snapshot = takeSnapshot(storage, "who=WOMEN", now + 1000);
  assert.deepEqual(snapshot.people, [{ id: "a" }]);
  assert.equal(snapshot.scrollY, 813);
  assert.equal(takeSnapshot(storage, "who=WOMEN", now + 2000), null, "taking consumes it, so a later reload is fresh");
});

test("storage failures never break browsing", () => {
  const broken = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("quota"); }, removeItem: () => {}, length: 0, key: () => null };
  assert.equal(writeSnapshot(broken, "", { people: [], cursor: null, rails: null, scrollY: 0 }), false);
  assert.equal(readSnapshot(broken, ""), null);
  assert.equal(readSnapshot(null, ""), null);
  const storage = memoryStorage();
  storage.setItem(snapshotKey(""), "{not json");
  assert.equal(readSnapshot(storage, ""), null);
});

test("signing out clears every People snapshot and nothing else", async () => {
  const storage = memoryStorage();
  writeSnapshot(storage, "", { people: [{ id: "a" }], cursor: null, rails: null, scrollY: 0 });
  writeSnapshot(storage, "who=MEN", { people: [{ id: "b" }], cursor: null, rails: null, scrollY: 0 });
  storage.setItem("intimo:discreet", "on");
  clearPeopleSnapshots(storage);
  assert.equal(storage.length, 1);
  assert.equal(storage.getItem("intimo:discreet"), "on");
  const auth = await read("src/context/AuthContext.tsx");
  assert.match(auth, /clearPeopleSnapshots\(window\.sessionStorage\)/);
});

test("People keeps filters in the URL and restores its place only when coming back", async () => {
  const people = await read("src/components/people/MemberPeople.tsx");
  assert.match(people, /filtersFromParams\(new URLSearchParams\(searchParams\?\.toString\(\) \?\? ""\)\)/);
  assert.match(people, /router\.replace\(query \? `\/people\?\$\{query\}` : "\/people", \{ scroll: false \}\)/);
  assert.match(people, /takeSnapshot<Person, typeof rails>\(window\.sessionStorage, query\)/);
  assert.match(people, /document\.addEventListener\("click", onClick, true\)/);
  assert.doesNotMatch(people, /pagehide/, "reloads must fetch fresh results");
  const page = await read("src/app/people/page.tsx");
  assert.match(page, /<React\.Suspense fallback=\{null\}><MemberPeople \/><\/React\.Suspense>/);
});

test("blocking from a profile returns to People instead of a missing page", async () => {
  const profile = await read("src/app/profile/[id]/page.tsx");
  assert.match(profile, /router\.push\("\/people"\)/);
  assert.doesNotMatch(profile, /"\/discover"/);
});
