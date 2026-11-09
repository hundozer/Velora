import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("already-registered recipients never claim a message was sent", () => {
  const api = read("src/app/api/member/invitations/route.ts");
  assert.match(api, /if \(existing\?\.length\) return NextResponse\.json\(\{ accepted: true \}/);
  assert.doesNotMatch(api, /\{ sent: true \}/);
  assert.match(api, /ResendClient\.sendEmail/);
  assert.match(api, /provider_message_id:sent\.id/);
});

test("invitation page acknowledges requests without claiming inbox delivery", () => {
  const ui = read("src/components/community/FoundingMemberInvites.tsx");
  assert.match(ui, /Request received\. If this person is not already a member/);
  assert.doesNotMatch(ui, /setMessage\(t\("Invitation sent\./);
  const cs = JSON.parse(read("src/locales/cs/phrases.json"));
  assert.ok(cs["Request received. If this person is not already a member, Intimo will send them an invitation."]);
});

test("delivery reference is private and nullable", () => {
  const migration = read("supabase/migrations/20261109060000_invitation_delivery_reference.sql");
  assert.match(migration, /provider_message_id text/);
  assert.match(migration, /unique index/);
});
