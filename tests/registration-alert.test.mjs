import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("a new member triggers a minimal alert to registration@intimo.live without risking sign-up", () => {
  const alert = read("src/lib/notifications/registrationAlert.ts");
  assert.match(alert, /process\.env\.REGISTRATION_ALERT_EMAIL \|\| "registration@intimo\.live"/);
  assert.match(alert, /catch \(error\)/, "a failed email never fails registration");
  assert.match(alert, /setTimeout\(\(\) => resolve\(null\), 4000\)/, "a slow email provider can't hold up sign-up");
  const fields = alert.match(/export type NewMember = \{([^}]*)\}/)[1];
  assert.deepEqual(fields.match(/\w+(?=\??:)/g), ["profileId", "displayName", "profileType", "areaName", "createdAt"], "no email, birth date, orientation, desires or photos in the alert");
  const route = read("src/app/api/profile/me/route.ts");
  const created = route.indexOf("if (!audited) return");
  const alerted = route.indexOf("await notifyNewRegistration(");
  assert.ok(created > 0 && alerted > created, "alert only after the profile and its audit record exist");
});

test("only photos and videos wait for approval; ads and plans go live and can only be removed", () => {
  const ads = read("src/app/api/personal-ads/route.ts");
  assert.match(ads, /insert\(\{ \.\.\.ad, moderation_status: "APPROVED"/, "new ads publish immediately");
  assert.match(ads, /\.in\("moderation_status", \["APPROVED", "PENDING_REVIEW"\]\)/, "older ads still waiting become visible");
  const plans = read("src/app/api/dating-ads/route.ts");
  assert.match(plans, /const moderationStatus = "APPROVED";/);
  for (const route of ["src/app/api/admin/personal-ads/route.ts", "src/app/api/admin/plans/route.ts"]) {
    assert.match(read(route), /const decision = body\.decision === "REJECTED" \? body\.decision : null;/, `${route} only removes`);
  }
  for (const consoleFile of ["src/components/admin/AdminPersonalAdsConsole.tsx", "src/components/admin/AdminPlansConsole.tsx"]) assert.doesNotMatch(read(consoleFile), />Approve</);
  assert.doesNotMatch(read("src/app/api/admin/queues/route.ts"), /Plans awaiting review/);
  assert.match(read("src/app/api/media/[id]/complete/route.ts"), /moderation_status: "PENDING_REVIEW"/, "photos and videos are still reviewed first");
});
