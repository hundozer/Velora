import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/rooms/access.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const memberId = "78100500-0000-4000-8000-000000000001";
function helper({ signedIn = true, adult = true, admin = false, owner = false, approved = false, expired = false, locked = true } = {}) {
  const calls = [];
  const room = { id: "private", title: "Private room", description: "Test", creator_id: owner ? memberId : "other", builtin: false, locked, expires_at: expired ? "2020-01-01T00:00:00Z" : null };
  const db = { from(table) { calls.push(table); return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: table === "rooms" ? room : approved ? { profile_id: memberId } : null, error: null }) }; } };
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(name => ({
    "next/server": { NextResponse: { json: (body, { status = 200 } = {}) => Response.json(body, { status }) } },
    "@/lib/auth/serverActor": { resolveServerActor: async () => signedIn ? { status: "authenticated", actor: { profileId: memberId, accountStatus: "ACTIVE" } } : { status: "unauthenticated" }, hasAdultAccess: () => adult, isAdminActor: () => admin },
    "@/lib/supabase/server": { getServerSupabase: () => db },
  })[name], mod, mod.exports);
  return { ...mod.exports, calls };
}
test("rooms reject anonymous and inactive actors without database reads", async () => {
  for (const [options, status] of [[{ signedIn: false }, 401], [{ adult: false }, 403]]) {
    const route = helper(options); const r = await route.roomAccess({}, "private"); assert.equal(r.error.status, status); assert.deepEqual(route.calls, []);
  }
});
test("locked room checks approved membership; creator and Intimo admin always enter", async () => {
  for (const [options, allowed] of [[{}, false], [{ approved: true }, true], [{ owner: true }, true], [{ admin: true, adult: false }, true]]) {
    const route = helper(options); const r = await route.roomAccess({}, "private"); assert.equal(!("error" in r), allowed);
    assert.equal(route.calls.includes("room_members"), !options.owner && !options.admin);
  }
});
test("expiry stops entry for owner and Intimo admin", async () => {
  for (const options of [{ owner: true, expired: true }, { admin: true, expired: true }]) assert.equal((await helper(options).roomAccess({}, "private")).error.status, 404);
});

function settingsRoute({ owner = false, admin = false, builtin = false } = {}) {
  const source = readFileSync(new URL("../src/app/api/rooms/[id]/settings/route.ts", import.meta.url), "utf8");
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  let writes = 0;
  const actor = { profileId: memberId, userId: memberId };
  const db = { from() { writes++; throw Error("Unauthorized database access"); } };
  const mod = { exports: {} };
  new Function("require", "module", "exports", js)(name => ({
    "next/server": {},
    "@/lib/rooms/access": { roomAccess: async () => ({ actor, db, admin, room: { builtin, creator_id: owner ? memberId : "someone-else" } }), roomReply: (body, status = 200) => Response.json(body, { status }) },
    "@/lib/auth/durableAudit": { appendDurableAudit: async () => true },
  })[name], mod, mod.exports);
  return { ...mod.exports, get writes() { return writes; } };
}
test("member cannot lock, invite or remove people from somebody else's room", async () => {
  const route = settingsRoute(); const req = { nextUrl: new URL("https://intimo.test/api/rooms/private/settings?profileId=" + memberId), json: async () => ({ locked: true, username: "someone" }) };
  for (const method of ["GET", "PATCH", "POST", "DELETE"]) assert.equal((await route[method](req, { params: { id: "private" } })).status, 403);
  assert.equal(route.writes, 0);
});
test("built-in rooms cannot be locked or receive hand-picked members", async () => {
  const route = settingsRoute({ owner: true, builtin: true }); const req = { nextUrl: new URL("https://intimo.test/api/rooms/prague/settings"), json: async () => ({ locked: true, username: "someone" }) };
  for (const method of ["PATCH", "POST", "DELETE"]) assert.equal((await route[method](req, { params: { id: "prague" } })).status, 403);
  assert.equal(route.writes, 0);
});
