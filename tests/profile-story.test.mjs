import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { approachFor, boundarySentences } from "../src/lib/approach.mjs";
import { resolveBoundaries } from "../src/lib/boundaries.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const rows = (pairs) => Object.entries(pairs).map(([kind, preference]) => ({ kind, preference }));

test("boundaries read as sentences, and the one that applies to the viewer is marked", () => {
  const b = resolveBoundaries(rows({ FIRST_MESSAGE_MEN: "ASK_FIRST", FIRST_MESSAGE_OTHER: "NOT_INTERESTED" }));
  const sentences = boundarySentences(b, { subject: "she", viewerCategory: "FIRST_MESSAGE_MEN" });
  const text = sentences.map((s) => s.text).join(" ");
  assert.match(text, /First messages from women and couples are welcome\./);
  assert.match(text, /Men: introduce yourself before anything else\./);
  assert.match(text, /Not taking first messages from non-binary and trans people\./);
  assert.match(text, /Explicit photographs only after she has replied\./, "default ASK_FIRST for explicit photos");
  assert.deepEqual(sentences.filter((s) => s.appliesToViewer).map((s) => s.kind), ["FIRST_MESSAGE_MEN"]);
  assert.match(boundarySentences(resolveBoundaries([]), { subject: "they" }).map((s) => s.text).join(" "), /from anyone are welcome.*only after they have replied/);
});

test("the profile's write rule mirrors what POST /api/messages enforces", () => {
  const open = resolveBoundaries([]);
  const man = { gender: "MALE", isCoupleProfile: false, verified: true };
  const recipient = { allow_direct_messages: true, message_permission: "MEMBERS_ONLY" };
  assert.deepEqual(approachFor({ name: "Lena", boundaries: open, recipient, viewer: man, established: false, friends: false }), { canWrite: true, line: null });
  const ask = resolveBoundaries(rows({ FIRST_MESSAGE_MEN: "ASK_FIRST" }));
  assert.equal(approachFor({ name: "Lena", boundaries: ask, recipient, viewer: man, established: false, friends: false }).line, "Lena asks men to introduce themselves first.");
  const closed = resolveBoundaries(rows({ FIRST_MESSAGE_MEN: "NOT_INTERESTED" }));
  assert.deepEqual(approachFor({ name: "Lena", boundaries: closed, recipient, viewer: man, established: false, friends: false }), { canWrite: false, line: "Lena isn't accepting first messages from men." });
  assert.equal(approachFor({ name: "Lena", boundaries: closed, recipient, viewer: man, established: true, friends: false }).canWrite, true, "once she has written, he can reply");
  assert.equal(approachFor({ name: "Lena", boundaries: open, recipient: { ...recipient, allow_direct_messages: false }, viewer: man, established: true, friends: false }).canWrite, false);
  assert.equal(approachFor({ name: "Lena", boundaries: open, recipient: { ...recipient, message_permission: "PRIVATE" }, viewer: man, established: false, friends: false }).canWrite, false);
  assert.equal(approachFor({ name: "Lena", boundaries: open, recipient: { ...recipient, message_permission: "FRIENDS_ONLY" }, viewer: man, established: false, friends: true }).canWrite, true);
  assert.equal(approachFor({ name: "Lena", boundaries: open, recipient: { ...recipient, message_permission: "VERIFIED_ONLY" }, viewer: { ...man, verified: false }, established: false, friends: false }).canWrite, false);
  const unverified = resolveBoundaries(rows({ FIRST_MESSAGE_UNVERIFIED: "NOT_INTERESTED" }));
  assert.equal(approachFor({ name: "Lena", boundaries: unverified, recipient, viewer: { ...man, verified: false }, established: false, friends: false }).canWrite, false);
});

test("the approach endpoint is member-only, block-aware and read-only", async () => {
  const route = await read("src/app/api/profiles/[id]/approach/route.ts");
  assert.match(route, /resolveMemberProfileAccess\(req, params\.id\)/, "auth, adult access, blocks and visibility");
  assert.match(route, /\.eq\("sender_id", targetId\)\.eq\("receiver_id", viewerId\)/, "established = they wrote to the viewer");
  assert.doesNotMatch(route, /\.insert\(|\.update\(|\.upsert\(|\.delete\(/);
  const messages = await read("src/app/api/messages/route.ts");
  assert.match(messages, /firstMessageDecision\(resolveBoundaries\(boundaryRows\)/, "messages stay authoritative");
});

test("the profile opens as a sheet over People and still loads on its own", async () => {
  const layout = await read("src/app/people/layout.tsx");
  assert.match(layout, /\{children\}\{sheet\}/);
  const intercept = await read("src/app/people/@sheet/(..)profile/[id]/page.tsx");
  assert.match(intercept, /<ProfileSheet id=\{id\} \/>/);
  const sheet = await read("src/components/profile/ProfileSheet.tsx");
  assert.match(sheet, /router\.back\(\)/);
  assert.match(sheet, /event\.key === "Escape"/);
  const page = await read("src/app/profile/[id]/page.tsx");
  assert.match(page, /<ProfileStory id=\{id\} variant="page"/);
  const story = await read("src/components/profile/ProfileStory.tsx");
  // One parallel round of requests instead of a waterfall.
  assert.match(story, /await Promise\.all\(\[\s*fetch\(`\/api\/profiles\/\$\{key\}`/);
  for (const words of ["Begin a conversation", "Back to People", "Photographs", "boundaries", "(you too)", "You can ask again in a few days.", "kept private."]) assert.ok(story.includes(words), words);
  assert.doesNotMatch(story, /declined/i, "cooldown copy stays neutral");
  assert.doesNotMatch(story, /rounded-full border px-3 py-1/, "no chips");
});

test("profile place is coarse: area and distance bucket only, never when hidden", async () => {
  const route = await read("src/app/api/profiles/[id]/route.ts");
  assert.match(route, /const hidden = data\.location_precision === "HIDDEN";/);
  assert.match(route, /areaName: hidden \? null/);
  assert.match(route, /DISTANCE_BUCKET_LABELS\[bucket\]/);
});
