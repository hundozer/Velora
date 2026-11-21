import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { explainItem, rankChemistryFeed, EXPLANATIONS } from "../src/lib/feed/chemistry.mjs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const when = "2026-11-20T08:00:00.000Z";
const item = (id, type, actor, occurredAt=when) => ({
  id, type, actor: {id:actor,displayName:actor}, occurredAt,
  title: "Content", href: "/rooms",
});

test("Chemistry explanations only use explicit social relations and item types",()=>{
  assert.equal(explainItem(item("a","PROFILE","friend"),{friends:new Set(["friend"])}),EXPLANATIONS.friend);
  assert.equal(explainItem(item("a","ALBUM","follow"),{following:new Set(["follow"])}),EXPLANATIONS.follow);
  assert.equal(explainItem(item("a","ROOM","unknown")),EXPLANATIONS.room);
  assert.equal(explainItem(item("a","ALBUM","unknown")),EXPLANATIONS.album);
  assert.equal(explainItem(item("a","PROFILE","unknown")),EXPLANATIONS.newMember);
  assert.equal(explainItem(item("a","POST","unknown")),EXPLANATIONS.recent);
  const source=read("src/lib/feed/chemistry.mjs");
  assert.doesNotMatch(source,/looking_for|sexual_orientation|date_of_birth|desires|kink|gender|religion/);
});

test("trusted relationship signals matter but all cards remain authorized by upstream feed",()=>{
  const data=[
    item("PROFILE:f","PROFILE","friend"),
    item("ROOM:o","ROOM","other"),
    item("ALBUM:x","ALBUM","follow"),
  ];
  const ordered=rankChemistryFeed(data,{following:new Set(["follow"]),friends:new Set(["friend"])},Date.parse("2026-11-21T00:00:00Z"));
  assert.deepEqual(ordered.map(x=>x.id),["PROFILE:f","ALBUM:x","ROOM:o"]);
  assert.equal(ordered[0].why,EXPLANATIONS.friend);
  assert.ok(ordered.every(x=>!("score" in x)));
  assert.equal(data[0].why,undefined,"original authorized input must not mutate");
});

test("For You contains different kinds of content instead of one prolific author",()=>{
  const data=[
    item("ALBUM:1","ALBUM","alpha"),
    item("ALBUM:2","ALBUM","alpha"),
    item("ALBUM:3","ALBUM","alpha"),
    item("ROOM:1","ROOM","beta"),
    item("PROFILE:1","PROFILE","gamma"),
  ];
  const result=rankChemistryFeed(data,{},Date.parse("2026-11-21T00:00:00Z"));
  assert.equal(result.length,5);
  assert.ok(result.findIndex(x=>x.id==="ALBUM:3")>result.findIndex(x=>x.id==="PROFILE:1"));
  assert.equal(rankChemistryFeed(data,{},Date.parse("2026-11-21T00:00:00Z"),2).length,2);
});

test("For You scope retains Newest visibility whitelist and all moderation, age, and blocks",()=>{
  const api=read("src/app/api/feed/route.ts");
  const audience=read("src/lib/feed/audience.ts");
  assert.match(api,/\(scope === "newest" \|\| scope === "for_you"\) \? \["PUBLIC", "MEMBERS_ONLY"\]/);
  assert.match(api,/const visibleAlbums = \(albumRows \|\| \[\]\)\.filter\(row => allowed/);
  assert.match(api,/const visiblePosts = \(postRows \|\| \[\]\)\.filter\(row => allowed/);
  assert.match(api,/const visibleMedia = candidateMedia\.filter/);
  assert.match(api,/!excluded\.has\(authorId\)/);
  assert.match(api,/hasAdultAccess\(auth.actor\)/);
  assert.match(api,/\.eq\("moderation_status", "APPROVED"\)/);
  assert.match(api,/\.eq\("locked", false\)/);
  assert.match(api,/rankChemistryFeed\(filtered, \{following, friends\}/);
  assert.match(audience,/return false/);
  assert.doesNotMatch(api,/\.select\([^)]*looking_for/);
});

test("For You UI has real destinations, save using existing ACLs and no fake matches",()=>{
  const ui=read("src/components/community/MemberActivityFeed.tsx");
  const actions=read("src/components/community/FeedConversationActions.tsx");
  const saved=read("src/app/api/saved-items/route.ts");
  assert.match(ui,/useState\("for_you"\)/);
  assert.match(ui,/\['for_you','For You'\]/);
  assert.match(ui,/item\.why/);
  assert.match(ui,/new since your last visit/);
  assert.match(ui,/localStorage\.setItem\("intimo.feed.lastVisit.v1", String\(Date\.now\(\)\)\)/);
  assert.doesNotMatch(ui,/localStorage\.setItem\([^,]+,\s*(JSON\.stringify|profile)/);
  assert.ok(actions.includes("encodeURIComponent(actorId)"));
  assert.match(actions,/\/api\/saved-items/);
  assert.match(saved,/resolveContentTarget/);
  assert.match(actions,/href="\/rooms"/);
  assert.doesNotMatch(ui+actions,/compatibilityScore|percentMatch|AI matches/);
});

test("Czech copy covers Chemistry reasons, fallback and return visits",()=>{
  const cs=JSON.parse(read("src/locales/cs/phrases.json"));
  for(const label of ["For You","Your Chemistry Feed","Why you're seeing this",
    "You're connected","You follow this member","A conversation you can join",
    "New to Intimo","new since your last visit","Your feed will fill up as members share. Explore People and Rooms to get started."])
    assert.ok(cs[label],label);
});
