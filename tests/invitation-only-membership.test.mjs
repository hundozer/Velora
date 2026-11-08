import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("new registrations require an invitation at signup and profile creation", () => {
 const signup = read("src/app/api/auth/email/route.ts");
 const profile = read("src/app/api/profile/me/route.ts");
 const sql = read("supabase/migrations/20261108190000_invitation_only_membership.sql");
 assert.match(signup,/is_member_invite_valid/);
 assert.match(signup,/onboarding\\?invite=/);
 assert.match(profile,/is_member_invite_valid/);
 assert.match(profile,/redeem_member_invite/);
 assert.match(profile,/identity\.emailVerified/);
 assert.match(sql,/recipient_sha256=p_email_hash/);
 assert.match(sql,/status=\x27SENT\x27/);
 assert.match(sql,/redeemed_auth_id=p_auth_id/);
 assert.match(sql,/revoke execute on function public.claim_founder_email_invite/);
});

test("registered members can sign in without new invitation", () => {
 const api=read("src/app/api/auth/email/route.ts");
 assert.match(api,/action === "recovery"/);
 assert.match(api,/activeMember/);
});

test("signup confirmation and onboarding preserve invitation token", () => {
 assert.match(read("src/app/register/page.tsx"),/inviteToken/);
 assert.match(read("src/app/verify-email/page.tsx"),/inviteToken/);
 assert.match(read("src/app/onboarding/page.tsx"),/inviteToken/);
});

test("members have invitation menu, and founders no longer promise unlimited invites", () => {
 assert.match(read("src/app/me/page.tsx"),/href="\/me\/invite"/);
 assert.match(read("src/components/layout/Navbar.tsx"),/href="\/me\/invite"/);
 assert.doesNotMatch(read("src/lib/notifications/foundingMemberPromotion.ts"),/Unlimited personal invitations/);
 assert.doesNotMatch(read("src/components/community/FoundingMemberInvites.tsx"),/Unlimited invitations/);
});
