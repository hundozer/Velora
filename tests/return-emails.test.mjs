import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("return emails are throttled, skipped when active or opted out, and discreet", async () => {
  const source = await read("src/lib/notifications/returnEmails.ts");
  assert.match(source, /const THROTTLE_MS = 3 \* 60 \* 60 \* 1000;/);
  assert.match(source, /if \(optOut\.includes\("ALL"\) \|\| optOut\.includes\(category\)\) return;/);
  assert.match(source, /Date\.now\(\) - new Date\(member\.last_active_at\)\.getTime\(\) < ACTIVE_NOW_MS\) return;/);
  assert.match(source, /Claim the slot first/);
  assert.match(source, /We never put names or messages in emails/);
  assert.doesNotMatch(source, /display_name|content/);
});

test("unsubscribe links are signed and work without login", async () => {
  const route = await read("src/app/api/email/unsubscribe/route.ts");
  assert.match(route, /verifyUnsubscribeToken\(profileId, category, token\)/);
  assert.doesNotMatch(route, /resolveServerActor/);
  const lib = await read("src/lib/notifications/returnEmails.ts");
  assert.match(lib, /timingSafeEqual/);
});

test("events trigger return emails", async () => {
  assert.match(await read("src/app/api/messages/route.ts"), /maybeSendReturnEmail\(supabase, receiverId, datingAdId \? "PLAN_REPLY" : "MESSAGE"\)/);
  assert.match(await read("src/app/api/interests/route.ts"), /maybeSendReturnEmail\(db, targetId, "INTEREST"\)/);
  assert.equal(((await read("src/app/api/private-access/route.ts")).match(/maybeSendReturnEmail\(/g) || []).length, 2);
  const sql = await read("supabase/migrations/20261026_return_emails.sql");
  assert.match(sql, /revoke all on public\.email_send_state from anon, authenticated;/);
});
