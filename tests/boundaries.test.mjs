import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOUNDARY_KINDS, cleanBoundaries, establishedDecision, firstMessageDecision, resolveBoundaries, senderCategory } from "../src/lib/boundaries.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("migration kind list matches src/lib/boundaries.mjs", async () => {
  const sql = await read("supabase/migrations/20261022000000_member_boundaries.sql");
  const list = sql.match(/kind text not null check \(kind in \(([^)]+)\)\)/)[1].split(",").map((item) => item.trim().replace(/'/g, ""));
  assert.deepEqual(list, BOUNDARY_KINDS.map((kind) => kind.id));
  assert.match(sql, /revoke all on public\.member_boundaries from anon, authenticated;/);
  assert.match(sql, /using \(profile_id = auth\.uid\(\)\)/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)/i);
  assert.match(sql, /alter column allow_direct_messages set default true/);
  assert.match(sql, /account_status = 'ACTIVE' and deletion_requested_at is null/);
  assert.match(sql, /alter column require_verification_to_message set default false/);
});

test("defaults: open to first messages, explicit photos need an established chat", () => {
  const defaults = resolveBoundaries([]);
  assert.equal(defaults.FIRST_MESSAGE_MEN, "COMFORTABLE");
  assert.equal(defaults.EXPLICIT_MEDIA_IN_CHAT, "ASK_FIRST");
  assert.equal(resolveBoundaries([{ kind: "FIRST_MESSAGE_MEN", preference: "NOT_INTERESTED" }, { kind: "BOGUS", preference: "NOT_INTERESTED" }]).FIRST_MESSAGE_MEN, "NOT_INTERESTED");
  assert.deepEqual(cleanBoundaries([{ kind: "BOGUS", preference: "ASK_FIRST" }, { kind: "MEET_SAME_DAY", preference: "MAYBE" }, { kind: "MEET_SAME_DAY", preference: "NOT_INTERESTED" }]), [{ kind: "MEET_SAME_DAY", preference: "NOT_INTERESTED" }]);
});

test("first messages respect sender type and verification boundaries", () => {
  const noMen = resolveBoundaries([{ kind: "FIRST_MESSAGE_MEN", preference: "NOT_INTERESTED" }]);
  assert.equal(firstMessageDecision(noMen, { gender: "MALE", isCoupleProfile: false, verified: true }).allowed, false);
  assert.equal(firstMessageDecision(noMen, { gender: "FEMALE", isCoupleProfile: false, verified: false }).allowed, true);
  assert.equal(firstMessageDecision(noMen, { gender: "COUPLE_MF", isCoupleProfile: true, verified: false }).allowed, true);
  const verifiedOnly = resolveBoundaries([{ kind: "FIRST_MESSAGE_UNVERIFIED", preference: "NOT_INTERESTED" }]);
  assert.equal(firstMessageDecision(verifiedOnly, { gender: "FEMALE", isCoupleProfile: false, verified: false }).allowed, false);
  assert.equal(firstMessageDecision(verifiedOnly, { gender: "FEMALE", isCoupleProfile: false, verified: true }).allowed, true);
  assert.equal(firstMessageDecision(resolveBoundaries([{ kind: "FIRST_MESSAGE_MEN", preference: "ASK_FIRST" }]), { gender: "MALE", isCoupleProfile: false, verified: false }).allowed, true);
  assert.equal(senderCategory("MALE", true), "FIRST_MESSAGE_COUPLES");
  assert.equal(senderCategory("NON_BINARY", false), "FIRST_MESSAGE_OTHER");
});

test("photo boundaries: not interested never, ask first only once established", () => {
  assert.equal(establishedDecision("NOT_INTERESTED", true), false);
  assert.equal(establishedDecision("ASK_FIRST", false), false);
  assert.equal(establishedDecision("ASK_FIRST", true), true);
  assert.equal(establishedDecision("COMFORTABLE", false), true);
});

test("message sending enforces boundaries server-side for uninvited first messages", async () => {
  const route = await read("src/app/api/messages/route.ts");
  assert.doesNotMatch(route, /require_verification_to_message/);
  assert.match(route, /\.eq\("sender_id", receiverId\)\.eq\("receiver_id", actor\.actor\.profileId\)/);
  assert.match(route, /const invited = Boolean\(repliedBefore\) \|\| Boolean\(datingAdId\);/);
  assert.match(route, /if \(!invited\) \{[\s\S]*message_permission === "PRIVATE"[\s\S]*from\("member_boundaries"\)[\s\S]*firstMessageDecision\(/);
  assert.match(route, /recipient\.allow_direct_messages === false/);
});

test("boundaries are exported, erased with the account, and served behind profile access checks", async () => {
  assert.match(await read("src/app/api/privacy/export/route.ts"), /from\("member_boundaries"\)/);
  assert.match(await read("src/lib/privacy/retention.ts"), /\["member_boundaries", "profile_id"\]/);
  assert.match(await read("src/app/api/profiles/[id]/boundaries/route.ts"), /resolveMemberProfileAccess\(req, params\.id\)/);
  const access = await read("src/lib/profiles/memberProfileAccess.ts");
  assert.match(access, /from\("user_blocks"\)/);
  assert.match(access, /account_status !== "ACTIVE"/);
});
