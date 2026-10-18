import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/api/reactions/route.ts", import.meta.url), "utf8");
const button = readFileSync(new URL("../src/components/media/LikeButton.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../src/app/profile/[id]/page.tsx", import.meta.url), "utf8");

test("reactions reuse the shared content access check", () => {
  assert.match(route, /resolveContentTarget\(auth\.actor, "MEDIA", targetId\)/);
  assert.match(route, /hasAdultAccess\(auth\.actor\)/);
});

test("owners cannot like their own photo and likes are rate limited", () => {
  assert.match(route, /if \(isOwner\) return NextResponse\.json\(\{ error: "You can't like your own photo" \}/);
  assert.match(route, /\(await checkRateLimit\(`reaction:\$\{actor\.userId\}`/);
});

test("like button only shows a count above zero and only to non-owner members", () => {
  assert.match(button, /state\.count > 0 &&/);
  assert.match(profile, /memberView && !isOwner && <LikeButton mediaId=\{item\.id\}/);
});
