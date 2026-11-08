import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = p => readFileSync(new URL(`../${p}`, import.meta.url),"utf8");

test("Founding Member email invitation uses server-side membership authorization", () => {
  const api = read("src/app/api/member/invitations/route.ts");
  assert.match(api,/resolveServerActor\(req\)/);
  assert.match(api,/membership_level !== "FOUNDING_MEMBER"/);
  assert.match(api,/accountStatus !== "ACTIVE"/);
  assert.match(api,/emailVerified/);
  assert.match(api,/claim_founder_email_invite/);
  assert.match(api,/permissionConfirmed !== true/);
  assert.match(api,/ResendClient.sendEmail/);
  assert.doesNotMatch(api,/NEXT_PUBLIC_RESEND/);
});

test("Invitation database enforces rate limits without revealing recipient addresses", () => {
  const migration=read("supabase/migrations/20261108160000_unlimited_founder_invites.sql");
  assert.match(migration,/pg_advisory_xact_lock/);
  assert.match(migration,/interval '1 minute'/);
  assert.match(migration,/>= 3/);
  assert.match(migration,/interval '30 days'/);
  assert.match(migration,/recipient_sha256/);
  assert.match(read("supabase/migrations/20261108150000_founding_member_email_invites.sql"),/revoke all on table public.member_email_invites from public, anon, authenticated/);
  assert.match(migration,/revoke all on function public.claim_founder_email_invite/);
  assert.doesNotMatch(migration,/recipient_email/);
  assert.doesNotMatch(migration,/interval '24 hours'/);
});

test("Dashboard includes the invitation widget and Czech translations", () => {
  assert.match(read("src/app/dashboard/page.tsx"), /<FoundingMemberInvites\s*\/>/);
  const widget = read("src/components/community/FoundingMemberInvites.tsx");
  assert.match(widget,/\/api\/member\/invitations/);
  const cs=JSON.parse(read("src/locales/cs/phrases.json"));
  for(const key of ["Founding Member invitations", "Send invitation", "I know this person and they agreed to receive an email invitation."]) {
    assert.ok(cs[key]);
  }
});

test("promotion notices are sent only for real audited Founding Member transitions", () => {
  const route = read("src/app/api/admin/users/membership/route.ts");
  const email = read("src/lib/notifications/foundingMemberPromotion.ts");
  assert.match(route, /before\.membership_level === level/);
  assert.ok(route.indexOf("if (auditError) return") < route.indexOf("sendFoundingMemberPromotionEmail("));
  assert.match(route, /updated\.membership_level === "FOUNDING_MEMBER" && before\.membership_level !== "FOUNDING_MEMBER"/);
  assert.match(route, /promotionEmail = "failed"/);
  assert.match(email, /https:\/\/intimo\.live\/founding-member/);
  assert.match(email, /ResendClient\.sendEmail/);
  assert.match(email, /Your Founding Member privileges/);
  assert.match(email, /Co ti členství přináší/);
});
