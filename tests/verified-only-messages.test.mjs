import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { approachFor } from "../src/lib/approach.mjs";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

// FM-08: every member can limit first messages to verified members from Settings.
test("Settings offers Verified members and the privacy API saves it", async () => {
  const settings = await read("src/app/settings/page.tsx");
  const privacy = await read("src/app/api/privacy/settings/route.ts");
  const migration = await read("supabase/migrations/20260820000000_mutual_friendships.sql");
  assert.match(settings, /\["VERIFIED_ONLY", "Verified members"\]/);
  assert.match(privacy, /MESSAGE_PERMISSION = new Set\(\[[^\]]*"VERIFIED_ONLY"/);
  assert.match(migration, /message_permission in \([^)]*'VERIFIED_ONLY'/);
});

test("the server refuses a first message from an unverified member", async () => {
  const messages = await read("src/app/api/messages/route.ts");
  assert.match(messages, /if \(!invited\) \{[\s\S]*message_permission === "VERIFIED_ONLY" && !verifiedSender\)[\s\S]*status: 403/);
});

test("the profile explains the rule to unverified members and lets verified ones write", () => {
  const boundaries = {};
  const recipient = { allow_direct_messages: true, message_permission: "VERIFIED_ONLY" };
  const viewer = { gender: "MALE", isCoupleProfile: false };
  const blocked = approachFor({ name: "Lena", boundaries, recipient, viewer: { ...viewer, verified: false }, established: false, friends: false });
  assert.equal(blocked.canWrite, false);
  assert.match(blocked.line, /Verify your photo to write/);
  assert.equal(approachFor({ name: "Lena", boundaries, recipient, viewer: { ...viewer, verified: true }, established: false, friends: false }).canWrite, true);
  // An existing conversation keeps working after the setting is switched on.
  assert.equal(approachFor({ name: "Lena", boundaries, recipient, viewer: { ...viewer, verified: false }, established: true, friends: false }).canWrite, true);
});
