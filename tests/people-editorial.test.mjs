import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { metaLine, ownWords, possessive, statusLine, subject } from "../src/lib/peopleCopy.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("words about a member follow what they declared, and never invent activity", () => {
  assert.equal(possessive({ gender: "FEMALE" }), "her");
  assert.equal(possessive({ gender: "MALE" }), "his");
  assert.equal(possessive({ gender: "NON_BINARY" }), "their");
  assert.equal(possessive({ gender: "FEMALE", isCoupleProfile: true }), "their");
  assert.equal(subject({}), "they");
  assert.equal(statusLine({ presence: "ONLINE", areaName: "Praha 7", age: 29 }), "Here now · Praha 7 · 29");
  assert.equal(statusLine({ presence: null, areaName: "Praha 7", age: 29 }), "Praha 7 · 29", "hidden activity shows nothing");
  assert.equal(statusLine({ presence: null, areaName: null, age: 29 }), "29");
  assert.equal(metaLine({ isCoupleProfile: true, age: 33, areaName: "Praha 2" }), "Couple · Praha 2");
  assert.equal(ownWords({ headline: "  " }), null);
});

test("the index groups hidden members as 'Other people nearby' and shows no time for anyone", async () => {
  const index = await read("src/components/people/PeopleIndex.tsx");
  assert.match(index, /ACTIVITY_GROUPS\.map/);
  assert.doesNotMatch(index, /ago|lastActive|last_active/, "no relative times");
  assert.match(index, /IntersectionObserver/);
  assert.match(index, /content-visibility:auto/);
  assert.match(index, /Back to top/);
});

test("People never shows member counts and keeps the editorial patterns", async () => {
  const files = ["src/components/people/MemberPeople.tsx", "src/components/people/PeopleIndex.tsx", "src/components/people/PeopleFilters.tsx", "src/components/people/IntroductionSpread.tsx"];
  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(source, /\.length\}\s*(members|people)|members found|>\s*\{[^}]*\.length\}/i, `${file} shows a count`);
    assert.doesNotMatch(source, /rounded-full border px-3 text-xs/, `${file} uses pill chips`);
  }
  const people = await read("src/components/people/MemberPeople.tsx");
  assert.match(people, /Introductions/);
  assert.match(people, /Everyone nearby/);
  const filters = await read("src/components/people/PeopleFilters.tsx");
  assert.match(filters, /Showing <Word/);
  assert.match(filters, /Name or neighbourhood/);
  assert.match(filters, /Show people/);
});

test("text navigation marks the current place with a dot and darkens over introductions", async () => {
  const nav = await read("src/components/layout/MobileNavigation.tsx");
  assert.match(nav, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(nav, /bg-velora-copper/);
  assert.match(nav, /useNavTone\(\)/);
  assert.doesNotMatch(nav, /lucide-react/, "words, not icons");
  const spread = await read("src/components/people/IntroductionSpread.tsx");
  assert.match(spread, /Scrim keeps the words at 4\.5:1/);
  assert.match(spread, /href=\{`\/messages\?user=\$\{person\.id\}`\}/);
});
