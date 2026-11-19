import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {founderMetrics} from "../src/lib/admin/founderMetrics.mjs";
const read=(file)=>readFile(new URL(`../${file}`,import.meta.url),"utf8");

test("FM-10 stores hashes only, with capped atomic code claims",async()=>{
 const sql=await read("supabase/migrations/20261119150000_attributed_invitation_codes.sql");
 assert.match(sql,/ROLLBACK/);
 assert.match(sql,/code_sha256 text NOT NULL UNIQUE/);
 assert.match(sql,/UPDATE public\.invitation_codes SET uses=uses\+1/);
 assert.match(sql,/uses<max_uses/);
 assert.match(sql,/revoked_at IS NULL/);
 assert.match(sql,/expires_at>now\(\)/);
 assert.match(sql,/UNIQUE\(code_id,auth_id\)/);
 assert.match(sql,/auth_id uuid NOT NULL UNIQUE/);
 assert.match(sql,/ENABLE ROW LEVEL SECURITY/);
 assert.match(sql,/REVOKE ALL ON public\.invitation_codes/);
 assert.match(sql,/recipient_sha256=p_email_hash/); // old personal links still email-bound
});

test("FM-10 admin controls restrict access and never return stored code hashes",async()=>{
 const route=await read("src/app/api/admin/invite-codes/route.ts");
 assert.match(route,/requireAdminPermission\(req, "users:view_sensitive"\)/);
 assert.match(route,/randomBytes\(32\)\.toString\("base64url"\)/);
 assert.match(route,/createHash\("sha256"\)/);
 assert.match(route,/private, no-store/);
 assert.match(route,/action!=="revoke"/);
 assert.doesNotMatch(route,/select\("[^"]*code_sha256/);
});

test("FM-10 members see aggregate totals only",async()=>{
 const route=await read("src/app/api/member/invitation-code-summary/route.ts");
 assert.match(route,/\.eq\("owner_profile_id",result\.actor\.profileId\)/);
 assert.match(route,/joined:0/);
 assert.doesNotMatch(route,/select\("[^"]*(?:auth_id|code_sha256)/);
});

test("FM-10 source counts are aggregated",()=>{
 const metrics=founderMetrics({
  profiles:[],requests:[],invites:[],reports:[],
  codes:[{source_label:"Carolinka test group",uses:2},{source_label:"Carolinka test group",uses:1},{source_label:"Party partner: X",uses:4}]
 },Date.parse("2026-11-19T12:00:00Z"));
 assert.deepEqual(metrics.invitationCodeSources,[
  {source:"Party partner: X",signups:4},{source:"Carolinka test group",signups:3}
 ]);
});
