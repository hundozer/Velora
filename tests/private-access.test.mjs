import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canRequest, decisionUpdate, grantIsActive } from "../src/lib/privateAccess.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const now = new Date("2026-10-17T22:00:00Z");

test("grants: once expires after 24 h, until-revoked lasts, others never grant", () => {
  const once = decisionUpdate("GRANT_ONCE", now);
  assert.equal(once.expires_at, "2026-10-18T22:00:00.000Z");
  assert.equal(grantIsActive(once, now), true);
  assert.equal(grantIsActive(once, new Date("2026-10-18T22:00:01Z")), false);
  assert.equal(grantIsActive(decisionUpdate("GRANT", now), new Date("2030-01-01")), true);
  for (const decision of ["DENY", "REVOKE"]) assert.equal(grantIsActive(decisionUpdate(decision, now), now), false);
  assert.equal(decisionUpdate("ALLOW_ALL", now), null);
  assert.equal(grantIsActive({ status: "REQUESTED" }, now), false);
});

test("re-requests: no duplicates, cooldown after a decline", () => {
  assert.equal(canRequest(null, now).ok, true);
  assert.equal(canRequest({ status: "REQUESTED" }, now).ok, false);
  assert.equal(canRequest({ status: "DENIED", decided_at: "2026-10-15T00:00:00Z" }, now).ok, false);
  assert.equal(canRequest({ status: "DENIED", decided_at: "2026-10-01T00:00:00Z" }, now).ok, true);
  assert.equal(canRequest({ status: "REVOKED" }, now).ok, true);
});

test("every private media read re-checks the grant and blocks", async () => {
  const media = await read("src/app/api/media/[id]/route.ts");
  assert.match(media, /if \(!allowed && media\.visibility === "PRIVATE" && !isChatImage\) \{[\s\S]*album_access_grants[\s\S]*allowed = grantIsActive\(grant\);/);
  assert.match(media, /getPresignedDownloadUrl/);
  const list = await read("src/app/api/private-access/media/route.ts");
  assert.match(list, /if \(!grantIsActive\(grant\)\) return NextResponse\.json\(\{ error: "No access" \}, \{ status: 403 \}\);/);
  assert.match(list, /url: `\/api\/media\/\$\{row\.id\}`/);
});

test("requests respect the owner's boundary and only the owner can decide", async () => {
  const route = await read("src/app/api/private-access/route.ts");
  assert.match(route, /resolveBoundaries\(boundaryRows\)\.PRIVATE_ALBUM_REQUESTS/);
  assert.match(route, /establishedDecision\(preference, Boolean\(repliedBefore\)\)/);
  assert.match(route, /\.update\(update\)\.eq\("owner_id", actor\.profileId\)\.eq\("viewer_id", viewerId\)/);
  const sql = await read("supabase/migrations/20261025_private_access.sql");
  assert.match(sql, /revoke all on public\.album_access_grants from anon, authenticated;/);
  assert.match(sql, /check \(grant_type is distinct from 'ONCE' or expires_at is not null\)/);
});
