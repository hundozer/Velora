import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("invitation performance is limited to authenticated inviter's own records", () => {
  const api = read("src/app/api/member/invitations/route.ts");
  assert.match(api, /resolveServerActor\(req\)/);
  assert.match(api, /\.eq\("inviter_profile_id", auth\.actor\.profileId\)/);
  assert.match(api, /\.limit\(20\)/);
  assert.match(api, /status: row\.status === "REDEEMED" \? "JOINED"/);
  assert.match(api, /"EXPIRED"/);
  assert.match(api, /\.gt\("expires_at", new Date\(\)\.toISOString\(\)\)/);
  assert.doesNotMatch(api, /select\(".*recipient_sha256/);
  assert.doesNotMatch(api, /select\(".*token_sha256/);
  assert.match(api, /unlimited: auth\.foundingMember/);
});

test("first contact counts real messages or interests, not clicks or opens", () => {
  const invite = read("src/app/api/member/invitations/route.ts");
  const progress = read("src/app/api/member/activation/route.ts");
  for (const source of [invite, progress]) {
    assert.match(source, /direct_messages/);
    assert.match(source, /interests/);
  }
  assert.match(progress, /\.eq\("id", id\)/);
  assert.match(progress, /14 \* 86400000/);
  assert.match(progress, /firstContactMade/);
});

test("dashboard is private, localized and home shows actionable newcomer steps", () => {
  const invitation = read("src/components/community/FoundingMemberInvites.tsx");
  const steps = read("src/components/community/NewMemberFirstSteps.tsx");
  const feed = read("src/components/community/MemberActivityFeed.tsx");
  assert.match(invitation, /Your invitations/);
  assert.match(invitation, /Recipient addresses and other members/);
  assert.match(invitation, /First contact made/);
  assert.match(steps, /profileId/);
  assert.match(steps, /Start your first conversation/);
  assert.match(feed, /<NewMemberFirstSteps \/>/);
  const cs = JSON.parse(read("src/locales/cs/phrases.json"));
  for (const key of ["Your invitations","Recent invitations","Your first steps","Start your first conversation"]) {
    assert.ok(cs[key], key);
  }
});
