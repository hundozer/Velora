import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("installed app notification offer is account-specific and not a website permission nag", () => {
  const source = read("src/components/pwa/InstalledAppNotificationOffer.tsx");
  assert.match(source, /user\?\.id/);
  assert.match(source, /authState !== "ACTIVE"/);
  assert.match(source, /ageCheckStatus !== "AGE_VERIFIED"/);
  assert.match(source, /pathname !== "\/"/);
  assert.match(source, /display-mode: standalone/);
  assert.match(source, /pushSupport\(\) !== "supported"/);
  assert.match(source, /Notification\.permission === "denied"/);
  assert.match(source, /thisDeviceRegistered\(\)/);
  assert.match(source, /localStorage\.getItem\(key\)/);
  assert.match(source, /localStorage\.setItem\(key, "done"\)/);
  assert.match(source, /onClose=\{finish\}/);
});

test("OS notification permission is only requested in direct Allow handler", () => {
  const source = read("src/components/pwa/InstalledAppNotificationOffer.tsx");
  const permission = source.indexOf("Notification.requestPermission()");
  const allow = source.indexOf("async function allow()");
  const effect = source.indexOf("React.useEffect(");
  assert.ok(permission > allow && allow > effect, "no permission request in effect");
  assert.match(source, /onClick=\{\(\) => void allow\(\)\}/);
  assert.match(source, /subscribeThisDevice\(language\)/);
  assert.match(source, /if \(outcome === "ok"\)/);
  assert.match(source, /setError\(outcome === "unavailable"/);
  assert.match(source, /"Not now"/);
  assert.doesNotMatch(source, /setTimeout|window\.Notification\./);
});

test("offer is attached to authenticated root layout and existing Settings remains accessible", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /<AuthProvider>/);
  assert.match(layout, /<InstalledAppNotificationOffer \/>/);
  assert.ok(layout.indexOf("<AuthProvider>") < layout.indexOf("<InstalledAppNotificationOffer />"));
  assert.match(read("src/app/settings/page.tsx"), /<AppOnThisDevice \/>/);
  assert.match(read("src/lib/notifications/pushClient.ts"), /thisDeviceRegistered/);
});
