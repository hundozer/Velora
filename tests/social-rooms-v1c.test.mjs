import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("room owner cannot add inactive, unverified or blocked people as room members", () => {
  const code = read("src/app/api/rooms/[id]/settings/route.ts");
  assert.match(code, /isVisibleMember\(profile\)/);
  assert.match(code, /!profile\.auth_id \|\| profile\.is_demo/);
  assert.match(code, /from\("user_blocks"\)/);
  assert.match(code, /blocker_id\.eq\.\$\{auth\.actor\.profileId\}/);
  assert.match(code, /blocked_profile_id\.eq\.\$\{auth\.actor\.profileId\}/);
  assert.match(code, /if \(block\) return reply\(\{ error: "Member unavailable" \}, 404\)/);
  assert.match(code, /if \(auth\.room\.builtin \|\| \(auth\.room\.creator_id !== auth\.actor\.profileId && !auth\.admin\)\)/);
});

test("room membership management confirms removal and guards against double submits", () => {
  const ui = read("src/app/rooms/[id]/settings/page.tsx");
  assert.match(ui, /const \[busy, setBusy\] = React\.useState\(false\)/);
  assert.match(ui, /if \(busy\) return/);
  assert.match(ui, /finally \{ setBusy\(false\); \}/);
  assert.match(ui, /window\.confirm\(t\("Remove this member from the room\?"\)\)/);
  assert.match(ui, /setNotice\(method === "POST"/);
  assert.match(ui, /aria-busy=\{busy\}/);
});
