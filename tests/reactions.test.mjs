import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/api/reactions/route.ts", import.meta.url), "utf8");
const button = readFileSync(new URL("../src/components/media/LikeButton.tsx", import.meta.url), "utf8");
const profile = readFileSync(new URL("../src/components/profile/ProfileStory.tsx", import.meta.url), "utf8");

test("reactions reuse the shared content access check", () => {
  assert.match(route, /resolveContentTarget\(auth\.actor, targetType, targetId\)/);
  assert.match(route, /hasAdultAccess\(auth\.actor\)/);
});

test("likes are rate limited and do not self-notify", () => {
  assert.match(route, /if \(!error && !isOwner\)/);
  assert.match(route, /\(await checkRateLimit\(`reaction:\$\{actor\.userId\}`/);
});

test("like button only shows a count above zero and only to non-owner members", () => {
  assert.match(button, /state\.count > 0 &&/);
  assert.match(profile, /memberView && !isOwner && <LikeButton mediaId=\{item\.id\}/);
});

test("feed interactions cover album and notify the owner without bypassing access checks", () => {
  const access = readFileSync(new URL("../src/lib/content/targetAccess.ts", import.meta.url), "utf8");
  const comments = readFileSync(new URL("../src/app/api/comments/route.ts", import.meta.url), "utf8");
  const feed = readFileSync(new URL("../src/components/community/MemberActivityFeed.tsx", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../supabase/migrations/20261026185748_album_feed_interactions.sql", import.meta.url), "utf8");
  assert.match(access, /targetType === "ALBUM"/);
  assert.match(access, /moderation_status === "APPROVED"/);
  assert.match(comments, /type: "NEW_COMMENT"/);
  assert.match(route, /!error && !isOwner/);
  assert.match(feed, /item.type !== "PROFILE" && <FeedInteractions/);
  assert.match(migration, /'DATING_AD','ALBUM'/);
});
