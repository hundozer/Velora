import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("beta reward is based on redeemed allowlisted codes, never a link click",async()=>{
 const sql=await read("supabase/migrations/20261123150000_beta_tester_bonus_invites.sql");
 assert.match(sql,/beta_eligible_invitation_codes/);
 assert.match(sql,/invitation_code_redemptions/);
 assert.match(sql,/AFTER INSERT ON public\.invitation_code_redemptions/);
 assert.match(sql,/source_label ~ '\^Carolinka/);
 assert.match(sql,/revoked_at IS NULL/);
 assert.match(sql,/ON CONFLICT \(profile_id\) DO NOTHING/);
 assert.match(sql,/bonus_total smallint NOT NULL DEFAULT 3/);
 assert.match(sql,/available_at timestamptz NOT NULL DEFAULT '2027-01-01/);
});
test("beta extras and rolling allowance are independent across both paths",async()=>{
 const sql=await read("supabase/migrations/20261123150000_beta_tester_bonus_invites.sql");
 assert.match(sql,/ADD COLUMN IF NOT EXISTS is_beta_bonus boolean NOT NULL DEFAULT false/g);
 assert.equal((sql.match(/v_is_bonus := true/g)||[]).length,2);
 assert.equal((sql.match(/bonus_used=bonus_used\+1/g)||[]).length,2);
 assert.equal((sql.match(/pg_advisory_xact_lock/g)||[]).length,2);
 assert.equal((sql.match(/is_beta_bonus=false AND created_at/g)||[]).length,4);
 assert.match(sql,/bonus_used<bonus_total/);
 assert.match(sql,/REVOKE ALL ON public\.beta_tester_invite_rewards FROM PUBLIC, anon, authenticated/);
 const route=await read("src/app/api/member/invitations/route.ts");
 assert.match(route,/beta_tester_invite_rewards/);
 assert.equal((route.match(/\.eq\("is_beta_bonus", false\)/g)||[]).length,2);
});
test("reward UI communicates future unlock without granting early bonus",async()=>{
 const ui=await read("src/components/community/FoundingMemberInvites.tsx");
 const cs=JSON.parse(await read("src/locales/cs/phrases.json"));
 assert.match(ui,/betaReward\.available/);
 for(const key of ["Beta thank-you: 3 extra invitations unlock in January.","Beta thank-you: {count} of 3 extra invitations left."])
   assert.ok(cs[key],`Missing Czech translation: ${key}`);
});
