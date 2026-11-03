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

test("leaving: a pause option, an optional reason, and an alert that never blocks deletion", () => {
  const settings = read("src/app/settings/page.tsx");
  assert.match(settings, /Hide my profile instead/);
  assert.match(settings, /profileVisibility: "PRIVATE"/, "hiding uses the existing Hidden visibility");
  assert.match(settings, /Why are you leaving\? \(optional\)/);
  assert.match(settings, /confirmation: "DELETE", reason: leaveReason \|\| undefined/);
  const route = read("src/app/api/auth/delete-account/route.ts");
  assert.match(route, /reason = cleanLeavingReason\(body\?\.reason\)/, "only known reasons are accepted");
  assert.match(route, /body\.note\.trim\(\)\.slice\(0, 500\)/);
  const audited = route.indexOf('action: "GDPR_DELETE_ACCOUNT", resourceType');
  const alerted = route.indexOf("await notifyAccountDeleted(");
  assert.ok(audited > 0 && alerted > audited, "alert only after the deletion is complete and audited");
  assert.doesNotMatch(route.slice(route.indexOf("appendDurableAudit(supabase"), alerted), /note/, "the free-text note goes only to the team email, not the audit log");
  const alert = read("src/lib/notifications/registrationAlert.ts");
  assert.match(alert, /\[LEAVING ALERT FAILED\]/);
});
