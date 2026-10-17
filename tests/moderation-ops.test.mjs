import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("plan review requires moderator permission, a reason to remove, and is audited", async () => {
  const route = await read("src/app/api/admin/plans/route.ts");
  assert.equal((route.match(/requireAdminPermission\(req, "content:moderate"\)/g) || []).length, 2);
  assert.match(route, /if \(decision === "REJECTED" && reason\.length < 10\)/);
  assert.match(route, /appendDurableAudit/);
  assert.match(route, /type: "PLAN_REMOVED"/);
});

test("queue overview uses real report statuses/reasons and the documented targets", async () => {
  const route = await read("src/app/api/admin/queues/route.ts");
  const reports = await read("src/app/api/reports/route.ts");
  const moderation = await read("src/app/api/admin/moderation/route.ts");
  for (const reason of ["SUSPECTED_MINOR", "NON_CONSENSUAL_INTIMATE_CONTENT", "EXPLOITATION_TRAFFICKING"]) {
    assert.match(route, new RegExp(`"${reason}"`));
    assert.match(reports, new RegExp(`"${reason}"`));
  }
  for (const status of ["OPEN", "UNDER_REVIEW", "ACTION_REQUIRED", "ESCALATED", "APPEALED"]) assert.match(moderation, new RegExp(`"${status}"`));
  assert.match(route, /label: "Urgent reports \(underage, non-consensual\)", targetHours: 1/);
  assert.match(route, /requireAdminPermission\(req, "moderation:view"\)/);
});
