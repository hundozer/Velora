import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("delete account shows a non-blocking hide alternative", () => {
  const settings = read("src/app/settings/page.tsx");
  assert.match(settings, /Need a break instead\?/);
  assert.match(settings, /profileVisibility: "PRIVATE", showInIntroductions: false/);
  assert.match(settings, /fetch\("\/api\/privacy\/settings"/);
  assert.match(settings, /handleDeleteAccount/);
  assert.match(settings, /confirmation: "DELETE"/);
  assert.match(settings, /Why are you leaving\? \(optional\)/);
});

test("deletion reasons are limited to fixed categories and never block deletion", () => {
  const route = read("src/app/api/auth/delete-account/route.ts");
  const email = read("src/lib/notifications/registrationAlert.ts");
  assert.match(route, /cleanLeavingReason\(body\?\.reason\)/);
  assert.match(route, /await notifyAccountDeleted\(\{ reason: leaveReason \}\)/);
  assert.ok(route.indexOf('action: "GDPR_DELETE_ACCOUNT", resourceType') < route.indexOf("await notifyAccountDeleted("));
  assert.match(email, /LEAVING_REASONS/);
  assert.match(email, /REGISTRATION_ALERT_TO === "off"/);
  assert.doesNotMatch(email.slice(email.indexOf("export async function notifyAccountDeleted")), /profileId|displayName|note:/);
});
