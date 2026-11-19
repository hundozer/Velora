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
  assert.deepEqual(fields.match(/\w+(?=\??:)/g), ["profileId", "displayName", "profileType", "areaName", "createdAt", "invitationLabel"], "no email, birth date, orientation, desires or photos in the alert");
  const route = read("src/app/api/profile/me/route.ts");
  const created = route.indexOf("if (!audited) return");
  const alerted = route.indexOf("await notifyNewRegistration(");
  assert.ok(created > 0 && alerted > created, "alert only after the profile and its audit record exist");
});

test("registration notification includes safe invite attribution and verification status", () => {
  const alert = read("src/lib/notifications/registrationAlert.ts");
  const route = read("src/app/api/profile/me/route.ts");
  assert.match(alert, /escape\(invitation\)/, "HTML-escape the admin-controlled invitation name");
  assert.match(alert, /Registered, awaiting age verification/);
  assert.match(alert, /Personal invitation/, "legacy email links have a neutral fallback");
  assert.match(route, /\.eq\("code_sha256", tokenHash\)/, "lookup by server-computed token hash");
  const redeemed = route.indexOf("const { data: redeemed");
  const lookup = route.indexOf("let invitationLabel:");
  const notified = route.indexOf("await notifyNewRegistration(");
  assert.ok(redeemed > 0 && lookup > redeemed && notified > lookup, "lookup occurs after redemption");
  assert.doesNotMatch(alert, /inviteToken|tokenHash|recipient_sha256/);
});
