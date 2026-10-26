import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const member = "78100500-0000-4000-8000-000000000001", peer = "78100500-0000-4000-8000-000000000002";
function api({ denied = false, adult = true, db }) {
 const code = ts.transpileModule(readFileSync(new URL("../src/app/api/rooms/prague/route.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 const m = { exports: {} };
 new Function("require", "module", "exports", code)(name => ({
  "next/server": { NextResponse: { json: (body, { status = 200, headers = {} } = {}) => Response.json(body, { status, headers }) } },
  "@/lib/auth/serverActor": { resolveServerActor: async () => denied ? { status: "unauthenticated" } : { status: "authenticated", actor: { profileId: member, userId: member } }, hasAdultAccess: () => adult },
  "@/lib/supabase/server": { getServerSupabase: () => db },
  "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true }) },
  "@/lib/auth/durableAudit": { appendDurableAudit: async () => true },
 })[name], m, m.exports); return m.exports;
}
function query(data) { const q = { select() { return q; }, eq() { return q; }, gte() { return q; }, order() { return q; }, limit() { return q; }, or() { return q; }, in() { return q; }, then: done => Promise.resolve({ data, error: null }).then(done) }; return q; }
test("room denies anonymous and inactive access before touching data", async () => {
 for (const options of [{ denied: true, status: 401 }, { adult: false, status: 403 }]) {
  const route = api({ ...options, db: { from() { throw Error("DB touched"); } } });
  for (const method of ["GET", "POST"]) assert.equal((await route[method]({ nextUrl: new URL("https://intimo.test/api/rooms/prague") })).status, options.status);
 }
});
test("room hides blocked, demo and inactive senders and never reads other rooms", async () => {
 const selected = []; const db = { from(table) { selected.push(table); return query(table === "room_messages" ? [{ id: member, sender_id: member, body: "Hello", created_at: new Date().toISOString() }, { id: peer, sender_id: peer, body: "Blocked", created_at: new Date().toISOString() }] : table === "user_blocks" ? [{ blocker_id: peer, blocked_profile_id: member }] : [{ id: member, display_name: "Me", account_status: "ACTIVE", auth_id: member, is_demo: false }]); } };
 const route = api({ db }); const response = await route.GET({ nextUrl: new URL("https://intimo.test/api/rooms/prague") });
 assert.equal(response.status, 200); assert.deepEqual((await response.json()).messages.map(m => m.body), ["Hello"]); assert.deepEqual(selected, ["room_messages", "user_blocks", "profiles"]);
});
test("room post uses server identity, not submitted sender", async () => {
 let inserted; const db = { from(table) { return table === "profiles" ? { select() { return { eq() { return this; }, maybeSingle: async () => ({ data: { id: member }, error: null }) }; } } : { insert(row) { inserted = row; return { select() { return { single: async () => ({ data: { id: peer }, error: null }) }; } }; } }; } };
 const route = api({ db }); const response = await route.POST({ headers: new Headers(), json: async () => ({ sender_id: peer, body: "Hello Prague" }) });
 assert.equal(response.status, 201); assert.equal(inserted.sender_id, member); assert.equal(inserted.room_id, "prague");
});

test("presence never reads the database for signed-out or inactive members", async () => {
 const source = readFileSync(new URL("../src/app/api/rooms/prague/presence/route.ts", import.meta.url), "utf8");
 const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
 for (const [denied, adult, status] of [[true, true, 401], [false, false, 403]]) {
  const m = { exports: {} };
  new Function("require", "module", "exports", code)(name => ({
   "next/server": { NextResponse: { json: (body, { status = 200, headers = {} } = {}) => Response.json(body, { status, headers }) } },
   "@/lib/auth/serverActor": { resolveServerActor: async () => denied ? { status: "unauthenticated" } : { status: "authenticated", actor: { profileId: member } }, hasAdultAccess: () => adult },
   "@/lib/supabase/server": { getServerSupabase: () => { throw Error("DB touched"); } },
  })[name], m, m.exports);
  for (const method of ["GET", "POST", "DELETE"]) assert.equal((await m.exports[method]({})).status, status);
 }
});
