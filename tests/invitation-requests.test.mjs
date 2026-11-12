import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("landing page asks for an email and at most three questions", () => {
  const home = read("src/components/community/PublicCommunityHome.tsx");
  assert.match(home, /id="request-invitation"/);
  assert.match(home, /<InvitationRequestForm \/>/);
  assert.match(home, /If you want to belong to this community, leave your email and we'll send you a personal invitation\./);
  const form = read("src/components/community/InvitationRequestForm.tsx");
  assert.equal((form.match(/t\("\d\. /g) || []).length, 3, "exactly three numbered questions");
  assert.match(form, /type="email" required/);
  assert.match(form, /adultConfirmed: adult/);
  assert.match(form, /name="website"/, "honeypot for bots");
});

test("public endpoint is rate limited, validates, and never reveals existing members", () => {
  const route = read("src/app/api/invitation-requests/route.ts");
  assert.match(route, /\(await checkRateLimit\(`invitation-request-ip:\$\{ip\}`, 5, 60 \* 60\)/);
  assert.match(route, /parseInvitationRequest\(body\)/);
  assert.match(route, /if \(existing\?\.length\) return received\(\);/);
  assert.match(route, /error\?\.code === "23505"\) return received\(\)/, "duplicate open request does not alert twice");
  const lib = read("src/lib/invitations/requests.ts");
  assert.match(lib, /process\.env\.INVITATION_REQUEST_ALERT_EMAIL \|\| "admin@intimo\.live"/);
  assert.match(lib, /setTimeout\(\(\) => resolve\(null\), 4000\)/);
  assert.match(lib, /b\.adultConfirmed !== true/);
  assert.match(lib, /intent\.length < 10 \|\| intent\.length > 500/);
  assert.match(lib, /escapeHtml\(request\.intent\)/, "requester text is escaped in the admin email");
});

test("approval reuses member invitations; rejection sends nothing; addresses are cleared", () => {
  const sql = read("supabase/migrations/20261112090000_invitation_requests.sql");
  assert.doesNotMatch(sql, /\bdrop\s+(table|column)\b/i, "additive migration only");
  assert.match(sql, /force row level security/);
  assert.match(sql, /revoke all on table public\.invitation_requests from public, anon, authenticated/);
  assert.match(sql, /insert into public\.member_email_invites\(inviter_profile_id, recipient_sha256, token_sha256, expires_at\)/);
  assert.match(sql, /for update/);
  assert.match(sql, /where status = 'PENDING'/, "one open request per address");
  const admin = read("src/app/api/admin/invitation-requests/route.ts");
  assert.match(admin, /requireAdminPermission\(req, PERMISSION\)/g);
  assert.match(admin, /"users:view_sensitive"/);
  assert.match(admin, /status: "REJECTED", email: null/);
  assert.match(admin, /update\(\{ email: null \}\)/);
  assert.match(admin, /status: "PENDING", decided_at: null/, "a failed send leaves the request pending");
  assert.match(admin, /INVITATION_REQUEST_APPROVE/);
  assert.match(admin, /INVITATION_REQUEST_REJECT/);
  assert.doesNotMatch(admin, /export async function (GET|POST|PATCH)[^]*?searchParams\.get\("decision"\)/, "no one-click GET decisions from email links");
  assert.match(read("src/components/admin/AdminCommandCenter.tsx"), /<AdminInvitationRequestsConsole\/>/);
});
