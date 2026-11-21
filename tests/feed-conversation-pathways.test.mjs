import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("feed offers a direct room and member discovery path rather than another messaging system", () => {
  const feed = read("src/components/community/MemberActivityFeed.tsx");
  const actions = read("src/components/community/FeedConversationActions.tsx");
  assert.match(feed, /<FeedConversationDiscovery \/>/);
  assert.match(feed, /<FeedCardActions type=\{item\.type\} href=\{item\.href\} actorId=\{item\.actor\.id\} selfId=\{profile\?\.id\} targetId=\{item\.id\.split\(":"\)\[1\]\} \/>/);
  assert.match(actions, /href="\/rooms"/);
  assert.match(actions, /href="\/people"/);
  assert.match(actions, /isRoom \? "Enter conversation"/);
  assert.match(actions, /href=\{href\}/);
  assert.match(actions, /\/messages\?user=\$\{encodeURIComponent\(actorId\)\}/);
  assert.doesNotMatch(actions, /fetch\(|supabase|localStorage|grantAccess/);
});

test("feed cannot prompt someone to message themselves or an unowned room event", () => {
  const actions = read("src/components/community/FeedConversationActions.tsx");
  assert.match(actions, /actorId !== selfId/);
  assert.match(actions, /!isRoom && type !== "EVENT"/);
  assert.match(actions, /!!actorId/);
});

test("narrow PWA feed actions have accessible navigation and 44px minimum targets", () => {
  const actions = read("src/components/community/FeedConversationActions.tsx");
  assert.match(actions, /min-h-11/);
  assert.match(actions, /flex flex-wrap items-center/);
  assert.match(actions, /aria-label=\{t\("Activity actions"\)\}/);
  assert.match(actions, /focus-visible:outline/);
  const api = read("src/app/api/feed/route.ts");
  assert.match(api, /canShowFeedAudience/);
  assert.match(api, /const visibleAlbums =/);
  assert.match(api, /\.eq\("locked", false\)/);
  assert.match(api, /"Cache-Control": "private, no-store"/);
});
