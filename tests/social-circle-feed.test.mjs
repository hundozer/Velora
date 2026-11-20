import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const source = read("src/lib/feed/audience.ts");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", transpiled)(mod, mod.exports);
const { canShowFeedAudience } = mod.exports;
const viewer = "viewer", publisher = "publisher";
const empty = new Set(), follow = new Set([publisher]), friends = new Set([publisher]);

test("private and unknown visibility never enter feed, even for friends and follows", () => {
  for (const visibility of ["PRIVATE", "DRAFT", "UNLISTED", "", "PUBLIC_EVERYWHERE"]) {
    assert.equal(canShowFeedAudience(visibility, publisher, viewer, follow, friends), false);
  }
});
test("followers-only access requires an explicit follow", () => {
  assert.equal(canShowFeedAudience("FOLLOWERS_ONLY", publisher, viewer, empty, friends), false);
  assert.equal(canShowFeedAudience("FOLLOWERS_ONLY", publisher, viewer, follow, empty), true);
});
test("friends-only access requires mutual accepted friendship", () => {
  assert.equal(canShowFeedAudience("FRIENDS_ONLY", publisher, viewer, follow, empty), false);
  assert.equal(canShowFeedAudience("FRIENDS_ONLY", publisher, viewer, empty, friends), true);
});
test("ordinary approved published visibility can be in all permitted social scopes", () => {
  for (const visibility of ["PUBLIC", "MEMBERS_ONLY"]) {
    assert.equal(canShowFeedAudience(visibility, publisher, viewer, empty, empty), true);
  }
});
test("feed API filters audience at author level and before building cards", () => {
  const api = read("src/app/api/feed/route.ts");
  assert.match(api, /scope === "circle"/);
  assert.match(api, /new Set\(\[\.\.\.following, \.\.\.friends\]\)/);
  assert.match(api, /const visiblePosts = \(postRows \|\| \[\]\)\.filter\(row => allowed/);
  assert.match(api, /const visibleAlbums = \(albumRows \|\| \[\]\)\.filter\(row => allowed/);
  assert.match(api, /const visibleMedia = \(mediaRows \|\| \[\]\)\.filter\(row => allowed/);
  assert.match(api, /profile\.profile_visibility === "FRIENDS_ONLY" && !friends\.has\(profile\.id\)/);
  assert.match(api, /\.eq\("age_verification_status", "AGE_VERIFIED"\)/);
  assert.match(api, /\.eq\("locked", false\)/);
  assert.match(api, /excluded\.has\(authorId\)/);
  assert.match(api, /"Cache-Control": "private, no-store"/);
});
test("mobile feed shows dedicated Your circle scope and relationship onboarding", () => {
  const view = read("src/components/community/MemberActivityFeed.tsx");
  assert.match(view, /\['circle','Your circle'\]/);
  assert.match(view, /scope === 'circle'/);
  assert.match(view, /overflow-x-auto border-b/);
  assert.match(view, /"\/connections"/);
});
