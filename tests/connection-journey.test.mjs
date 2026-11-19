import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("member profile exposes connection requests and keeps three signals separate", async () => {
  const src = await read("src/components/profile/ProfileStory.tsx");
  assert.match(src, /\/api\/friends\?targetProfileId=/);
  assert.match(src, /friendAction\("REQUEST"\)/);
  assert.match(src, /friendAction\("ACCEPT"\)/);
  assert.match(src, /friendAction\("DECLINE"\)/);
  assert.match(src, /friendAction\("REMOVE"\)/);
  assert.match(src, /toggleInterest/);
  assert.match(src, /Saved privately/);
  assert.match(src, /href="\/connections"/);
});

test("connection directory only uses authenticated adult member data and excludes blocks", async () => {
  const src = await read("src/app/api/friends/list/route.ts");
  assert.match(src, /resolveServerActor/);
  assert.match(src, /hasAdultAccess\(auth.actor\)/);
  assert.match(src, /user_blocks/);
  assert.match(src, /isVisibleMember/);
  assert.match(src, /Cache-Control": "private, no-store"/);
});

test("saving a favourite never sends a notification to the saved profile", async () => {
  const src = await read("src/app/api/connections/route.ts");
  assert.match(src, /sourceProfile && type === "follow"/);
  assert.match(src, /connection_type: type/);
});

test("connections page offers received, accepted, sent and the relevant actions", async () => {
  const src = await read("src/app/connections/page.tsx");
  for (const value of ["RECEIVED", "CONNECTED", "SENT", "ACCEPT", "DECLINE", "REMOVE"]) assert.ok(src.includes(value), value);
  assert.match(src, /\/api\/friends\/list/);
  assert.match(src, /\/api\/friends"/);
});

test("connections list redacts deliberately hidden city from API responses", async () => {
  const src = await read("src/app/api/friends/list/route.ts");
  assert.match(src, /location_precision/);
  assert.match(src, /location_precision === "HIDDEN" \? null : profile\.city/);
});

test("friendship changes refresh recipient messaging permissions", async () => {
  const src = await read("src/components/profile/ProfileStory.tsx");
  assert.match(src, /action === "ACCEPT" \|\| action === "REMOVE"/);
  assert.match(src, /refreshedApproach/);
  assert.match(src, /setApproach\(refreshedApproach\)/);
});
