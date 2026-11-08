import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isAllowedPushEndpoint, parsePushSubscription, pushAllowed, pushPayload, PUSH_COPY, PUSH_CATEGORIES } from "../src/lib/notifications/pushPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const KEY = "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM";

test("only real browser push services are accepted (no SSRF)", () => {
  for (const ok of ["https://fcm.googleapis.com/fcm/send/abc", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://web.push.apple.com/QH", "https://db5p.notify.windows.com/w/?token=1"]) assert.equal(isAllowedPushEndpoint(ok), true, ok);
  for (const bad of ["http://fcm.googleapis.com/x", "https://evil.example/x", "https://fcm.googleapis.com.evil.example/x", "https://push.apple.com/x", "https://user:pw@fcm.googleapis.com/x", "https://fcm.googleapis.com:8443/x", "https://169.254.169.254/latest", 42, null]) assert.equal(isAllowedPushEndpoint(bad), false, String(bad));
});

test("subscriptions need valid keys", () => {
  assert.ok(parsePushSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: KEY, auth: "tBHItJI5svbpez7KI4CCXg" } }));
  assert.equal(parsePushSubscription({ endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "short", auth: "tBHItJI5svbpez7KI4CCXg" } }), null);
  assert.equal(parsePushSubscription({ endpoint: "https://evil.example/x", keys: { p256dh: KEY, auth: "tBHItJI5svbpez7KI4CCXg" } }), null);
});

test("opt-outs are respected per category and for all", () => {
  assert.equal(pushAllowed([], "MESSAGE"), true);
  assert.equal(pushAllowed(["MESSAGE"], "MESSAGE"), false);
  assert.equal(pushAllowed(["ALL"], "INTEREST"), false);
  assert.equal(pushAllowed([], "SOMETHING_ELSE"), false);
});

test("push text is discreet and has Czech", async () => {
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  for (const category of PUSH_CATEGORIES) {
    const payload = pushPayload(category);
    assert.equal(payload.title, "Intimo");
    assert.match(payload.url, /^\/[a-z]/);
    assert.ok(cs[PUSH_COPY[category].body], `Czech missing for ${PUSH_COPY[category].body}`);
  }
  const sender = await read("src/lib/notifications/webPush.ts");
  assert.doesNotMatch(sender, /display_name|content|avatar_url/, "push must never carry names, avatars or message text");
});

test("service worker shows pushes safely and never caches them", async () => {
  const sw = await read("public/sw.js");
  assert.match(sw, /addEventListener\("push"/);
  assert.match(sw, /addEventListener\("notificationclick"/);
  assert.match(sw, /const title = "Intimo";/);
  assert.match(sw, /function safePath\(value\)/);
  assert.doesNotMatch(sw, /cache\.put|addAll\(/);
});

test("devices are forgotten on sign-out and push events are wired", async () => {
  assert.match(await read("src/context/AuthContext.tsx"), /unsubscribeThisDevice\(\)/);
  assert.match(await read("src/app/api/messages/route.ts"), /sendPush\(\{ recipientId: receiverId/);
  assert.match(await read("src/app/api/interests/route.ts"), /created === true && result\.mutual\) await sendPush/);
  assert.match(await read("src/app/api/private-access/route.ts"), /category: "PRIVATE_ACCESS"[\s\S]*category: "PRIVATE_ACCESS"/);
  const migration = await read("supabase/migrations/20261109000000_web_push.sql");
  assert.match(migration, /revoke all on public\.push_subscriptions from public, anon, authenticated;/);
  assert.match(migration, /Rollback:/);
});

test("review fixes: local unsubscribe first, server-confirmed state, expired grants notify", async () => {
  const client = await read("src/lib/notifications/pushClient.ts");
  assert.ok(client.indexOf("subscription.unsubscribe()") < client.indexOf('method: "DELETE"'), "unsubscribe locally before the network call");
  assert.match(client, /payload\?\.thisDevice === true/);
  assert.match(await read("src/components/pwa/AppOnThisDevice.tsx"), /thisDeviceRegistered\(\)\.then\(setSubscribed\)/);
  const access = await read("src/app/api/private-access/route.ts");
  assert.match(access, /const hadAccess = Boolean\(before && grantIsActive\(before\)\);/);
  assert.match(access, /data\.status === "GRANTED" && !hadAccess\) await sendPush/);
});
