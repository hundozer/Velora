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


test("legacy owner-wide grants do not authorize album photos", async () => {
  const media = await read("src/app/api/media/[id]/route.ts");
  assert.match(media, /canViewLinkedMedia/);
  assert.match(media, /albumAccess.linked && !albumAccess.allowed/);
  assert.doesNotMatch(media, /album_access_grants|grantIsActive/);
  const listing = await read("src/app/api/private-access/media/route.ts");
  assert.match(listing, /album_viewer_grants/);
  assert.doesNotMatch(listing, /album_access_grants/);
  const api = await read("src/app/api/private-access/route.ts");
  assert.match(api, /status:410/);
  const scoped = await read("src/app/api/albums/[id]/access/route.ts");
  assert.match(scoped, /album_viewer_grants/);
  assert.match(scoped, /viewer_id/);
  assert.match(scoped, /album_id/);
});
