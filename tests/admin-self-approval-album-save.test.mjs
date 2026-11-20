import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("authenticated active admin photo uploads self-approve only standard images", () => {
  const s=src("src/app/api/media/[id]/complete/route.ts");
  assert.match(s,/isAdminActor\(actor\.actor\)/);
  assert.match(s,/media\.mime_type\.startsWith\("image\/"\)/);
  assert.match(s,/\["AGE_CHECK", "MESSAGE", "STORY"\]\.includes\(media\.category \|\| ""\)/);
  assert.match(s,/moderation_status: "APPROVED", published_at: now/);
  assert.match(s,/adminSelfApproved: adminPhoto/);
  assert.match(s,/inspectStoredObject/);
});

test("only ready and approved admin album photos can make album visible", () => {
  const route=src("src/app/api/albums/[id]/media/route.ts");
  assert.match(route,/isAdminActor\(auth\.actor\) && uniqueIds\.length > 0/);
  for (const key of ['upload_status === "AVAILABLE"','processing_status === "READY"','moderation_status === "APPROVED"']) {
    assert.ok(route.includes(key),key);
  }
  assert.match(route,/photo\.visibility === "PRIVATE"/);
  assert.match(route,/adminSelfApproved/);
  const edit=src("src/app/api/albums/[id]/route.ts");
  assert.match(edit,/isAdminActor\(auth\.actor\)/);
  assert.match(edit,/adminEligible = photos\?\.length === ids\.length/);
  assert.match(edit,/const keepApproved = adminEligible \|\|/);
  assert.match(edit,/media_type === "IMAGE"/);
});

test("album save gives visible success, pending status and network errors", () => {
  const ui=src("src/components/media/AlbumManager.tsx");
  assert.match(ui,/Photos saved\. Album is available to permitted viewers\./);
  assert.match(ui,/Photos saved to your album\. Album and photos must be approved/);
  assert.match(ui,/role=\{error \? "alert" : "status"\}/);
  assert.match(ui,/Could not save the album\. Check your connection/);
  assert.match(ui,/Could not save the photos\. Check your connection/);
  assert.match(ui,/Saving…/);
});
