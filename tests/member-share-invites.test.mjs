import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("member links use a privileged atomic, hashed, single-use claim", async () => {
  const sql = await read("supabase/migrations/20261123110000_member_share_links.sql");
  assert.match(sql, /claim_member_share_invite\(p_inviter uuid, p_token_hash text\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /source_label='MEMBER_SHARE_LINK'/);
  assert.match(sql, /max_uses,expires_at,created_by/);
  assert.match(sql, /'MEMBER_SHARE_LINK','Member invitation',p_inviter,1,now\(\)\+interval '30 days'/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public.claim_member_share_invite/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public.claim_member_share_invite.*service_role/);
});

test("email and link quotas combine, founders remain unlimited", async () => {
  const sql = await read("supabase/migrations/20261123110000_member_share_links.sql");
  assert.equal((sql.match(/v_membership IS DISTINCT FROM 'FOUNDING_MEMBER'/g) || []).length, 2);
  assert.equal((sql.match(/source_label='MEMBER_SHARE_LINK'/g) || []).length, 2);
  assert.match(sql, /IF v_issued>=3/);
  const memberApi = await read("src/app/api/member/invitations/route.ts");
  assert.match(memberApi, /\.eq\("source_label", "MEMBER_SHARE_LINK"\)/);
  assert.match(memberApi, /emails\.count.*links\.count/);
});

test("member endpoint cannot reveal raw stored token or trust arbitrary origin", async () => {
  const route = await read("src/app/api/member/share-invite/route.ts");
  assert.match(route, /resolveServerActor\(req\)/);
  assert.match(route, /emailVerified/);
  assert.match(route, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(route, /createHash\("sha256"\)/);
  assert.match(route, /claim_member_share_invite/);
  assert.match(route, /https:\/\/intimo\.live\/register\?invite=/);
  assert.match(route, /private, no-store/);
  assert.doesNotMatch(route, /req\.headers\.get\("host"\)/);
});

test("members get a bilingual copy-first experience without email sending", async () => {
  const component = await read("src/components/community/FoundingMemberInvites.tsx");
  const link = await read("src/components/community/MemberShareInvite.tsx");
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  assert.ok(component.indexOf("<MemberShareInvite />") < component.indexOf("<form onSubmit={send}"));
  assert.match(component, /<details/);
  assert.match(link, /navigator\.clipboard\.writeText/);
  assert.match(link, /readOnly value=\{link\}/);
  assert.ok(cs["Copy my invite link"]);
  assert.ok(cs["Or send an invitation by email"]);
});
