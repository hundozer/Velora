import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const file = p => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("manual Founding Member welcome requires server verified Super Admin and MFA", () => {
  const api = file("src/app/api/admin/users/membership/welcome/route.ts");
  assert.match(api, /requireAdminPermission\(req, "admin_roles:manage"\)/);
  assert.match(api, /auth.actor.role !== "SUPER_ADMIN"/);
  assert.match(api, /membership_level !== "FOUNDING_MEMBER"/);
  assert.match(api, /Resend did not confirm acceptance/);
  assert.match(api, /sendFoundingMemberPromotionEmail/);
  assert.doesNotMatch(api, /Gmail|gmail/);
});

test("welcome delivery ledger is private and idempotent", () => {
  const sql = file("supabase/migrations/20261108170000_founding_member_welcome_deliveries.sql");
  assert.match(sql, /profile_id uuid primary key/);
  assert.match(sql, /force row level security/);
  assert.match(sql, /revoke all on public.founding_member_welcome_deliveries from public, anon, authenticated/);
});

test("admin membership editor has a confirmation button for previously promoted founders", () => {
  const ui = file("src/components/admin/AdminMembershipEditor.tsx");
  assert.match(ui, /member.membership_level === "FOUNDING_MEMBER"/);
  assert.match(ui, /membership\/welcome/);
  assert.match(ui, /SEND FOUNDING WELCOME/);
});
