import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("connection actions communicate their result and keep the accepted connection visible", () => {
  const page = read("src/app/connections/page.tsx");
  assert.match(page, /setNotice\(resultLabel\)/);
  assert.match(page, /if \(action === "ACCEPT"\) setFilter\("CONNECTED"\)/);
  for (const message of [
    "Request accepted. You are now connected.",
    "Request declined.",
    "Request cancelled.",
    "Connection removed.",
  ]) assert.ok(page.includes(message), message);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /await refresh\(\);\s*const priorStatus/);
});

test("connection actions stay inside existing authenticated API and do not grant private access", () => {
  const page = read("src/app/connections/page.tsx");
  const list = read("src/app/api/friends/list/route.ts");
  const mutation = read("src/app/api/friends/route.ts");
  assert.match(page, /fetch\("\/api\/friends"/);
  assert.match(page, /fetch\("\/api\/friends\/list"/);
  assert.match(mutation, /hasAdultAccess\(auth.actor\)/);
  assert.match(mutation, /intimo_friend_action/);
  assert.match(list, /user_blocks/);
  assert.match(list, /isVisibleMember/);
  assert.doesNotMatch(page, /grantAccess|privatePhoto|supabase/);
});

test("requests and connection actions remain usable on narrow iPhone screens", () => {
  const page = read("src/app/connections/page.tsx");
  assert.match(page, /flex flex-wrap items-center gap-4 py-5 sm:flex-nowrap/);
  assert.match(page, /flex w-full flex-wrap justify-end gap-2 sm:w-auto/);
  assert.match(page, /aria-busy=\{busy === item.peerId\}/);
});
