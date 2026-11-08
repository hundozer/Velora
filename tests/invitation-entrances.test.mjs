import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("/register explains invitation-only instead of showing a form it can't accept", async () => {
  const page = await read("src/app/register/page.tsx");
  assert.match(page, /if \(!inviteToken\) return <InvitationOnly \/>;/);
  assert.match(page, /if \(state === "expired" \|\| state === "used" \|\| state === "invalid"\) return <InvitationProblem state=\{state\} \/>;/);
  assert.match(page, /\/api\/invitations\/check\?invite=/);
  // No waiting list exists, so the page must not promise one.
  assert.match(page, /There is no waiting list\./);
  assert.doesNotMatch(page, /join the waitlist|request an invite/i);
});

test("invitation check reveals only the link's state", async () => {
  const route = await read("src/app/api/invitations/check/route.ts");
  assert.match(route, /select\("status,expires_at"\)\.eq\("token_sha256", hash\)/);
  assert.match(route, /checkRateLimit\(`invite-check:\$\{ip\}`, 30, 60 \* 60\)/);
  assert.doesNotMatch(route, /inviter_profile_id|recipient_sha256|display_name/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
});

test("no entrance promises sign-up to people without an invitation", async () => {
  const files = ["src/components/community/PublicCommunityHome.tsx", "src/app/goodbye/page.tsx", "src/app/about/page.tsx", "src/app/rooms/page.tsx", "src/app/rooms/[id]/page.tsx", "src/app/guest-list/page.tsx", "src/app/videos/upload/page.tsx"];
  for (const file of files) {
    const source = await read(file);
    assert.doesNotMatch(source, /Create your profile|Re-Register|Join to see rooms|Join to enter the room|Join Intimo to see Guest Lists|Join to upload|t\("Join Intimo"\)/, file);
  }
});
