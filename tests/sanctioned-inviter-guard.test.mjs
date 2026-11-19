import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../supabase/migrations/20261119180000_sanctioned_inviter_guard.sql", import.meta.url), "utf8");
test("both invite validation and redemption reject sanctioned owners", () => {
  assert.match(source, /CREATE OR REPLACE FUNCTION public\.is_member_invite_valid/);
  assert.match(source, /CREATE OR REPLACE FUNCTION public\.redeem_member_invite/);
  assert.ok((source.match(/inviter\.account_status='ACTIVE'/g) || []).length >= 2);
  assert.ok((source.match(/owner\.account_status='ACTIVE'/g) || []).length >= 2);
  assert.match(source, /account_lifecycle_status/);
  assert.match(source, /owner_profile_id IS NULL/);
  assert.match(source, /REVOKE ALL ON FUNCTION public\.redeem_member_invite/);
  assert.match(source, /GRANT EXECUTE ON FUNCTION public\.redeem_member_invite\(text,text,uuid\) TO service_role/);
});
