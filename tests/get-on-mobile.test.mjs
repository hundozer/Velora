import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectDevice, installSteps } from "../src/lib/installGuide.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

const UA = {
  iphoneSafari: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  iphoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1",
  iphoneInstagram: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 357.0.0.25.101",
  iphoneTikTok: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_37.5.0 BytedanceWebview/d8a21c6",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  androidChrome: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  androidSamsung: "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  androidFacebook: "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/490.0.0.0;]",
  desktop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

test("detects phone, browser and in-app browsers", () => {
  assert.deepEqual(detectDevice(UA.iphoneSafari), { os: "ios", browser: "safari", inApp: null, installed: false });
  assert.equal(detectDevice(UA.iphoneChrome).browser, "chrome");
  assert.equal(detectDevice(UA.iphoneInstagram).inApp, "Instagram");
  assert.equal(detectDevice(UA.iphoneTikTok).inApp, "TikTok");
  assert.equal(detectDevice(UA.ipad, { maxTouchPoints: 5 }).os, "ios");
  assert.equal(detectDevice(UA.ipad, { maxTouchPoints: 0 }).os, "desktop");
  assert.deepEqual(detectDevice(UA.androidChrome), { os: "android", browser: "chrome", inApp: null, installed: false });
  assert.equal(detectDevice(UA.androidSamsung).browser, "samsung");
  assert.equal(detectDevice(UA.androidFacebook).inApp, "Facebook");
  assert.equal(detectDevice(UA.desktop).os, "desktop");
  assert.equal(detectDevice(UA.iphoneSafari, { standalone: true }).installed, true);
});

test("every path ends with opening from the icon and notifications", () => {
  const cases = [
    ["ios", detectDevice(UA.iphoneSafari), {}, ["ios-share", "ios-add", "ios-confirm", "open-from-icon", "notifications"]],
    ["ios", detectDevice(UA.iphoneChrome), {}, ["switch-to-safari", "ios-share", "ios-add", "ios-confirm", "open-from-icon", "notifications"]],
    ["ios", detectDevice(UA.iphoneInstagram), {}, ["leave-app-ios", "ios-share", "ios-add", "ios-confirm", "open-from-icon", "notifications"]],
    ["ios", detectDevice(UA.desktop), {}, ["open-on-iphone", "ios-share", "ios-add", "ios-confirm", "open-from-icon", "notifications"]],
    ["android", detectDevice(UA.androidChrome), { canPrompt: true }, ["android-one-tap", "open-from-icon", "notifications"]],
    ["android", detectDevice(UA.androidChrome), {}, ["android-menu", "android-install", "open-from-icon", "notifications"]],
    ["android", detectDevice(UA.androidSamsung), {}, ["samsung-menu", "samsung-add", "open-from-icon", "notifications"]],
    ["android", detectDevice(UA.androidFacebook), { canPrompt: true }, ["leave-app-android", "android-menu", "android-install", "open-from-icon", "notifications"]],
    ["android", detectDevice(UA.iphoneSafari), {}, ["open-on-android", "android-menu", "android-install", "open-from-icon", "notifications"]],
  ];
  for (const [phone, device, options, expected] of cases) assert.deepEqual(installSteps(phone, device, options), expected, `${phone} on ${device.os}/${device.browser}/${device.inApp}`);
});

test("every string in the guide has Czech", async () => {
  const source = await read("src/components/pwa/GetOnMobile.tsx");
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  const strings = new Set();
  for (const m of source.matchAll(/(?:title|body|hint): "((?:[^"\\]|\\.)+)"/g)) strings.add(m[1]);
  for (const m of source.matchAll(/(?<![\w.])t\("((?:[^"\\]|\\.)+)"/g)) strings.add(m[1]);
  for (const group of source.matchAll(/rows=\{\[([^\]]+)\]/g)) for (const m of group[1].matchAll(/(?<!=== )"([^"]*[A-Za-z]{2}[^"]*)"/g)) strings.add(m[1]);
  for (const m of source.matchAll(/\{\[("Opens like[^\]]+")\]\.map/g)) for (const s of m[1].matchAll(/"([^"]+)"/g)) strings.add(s[1]);
  strings.add("Get Intimo on your phone");
  const missing = [...strings].filter((text) => !cs[text]);
  assert.deepEqual(missing, []);
  assert.ok(strings.size > 50);
});

test("landing offers the guide, deep link opens it, nothing is asked without a tap", async () => {
  const home = await read("src/components/community/PublicCommunityHome.tsx");
  assert.match(home, /<GetOnMobileSection \/>/);
  assert.match(home, /\["Get it on your phone", "#get-the-app"\]/);
  const guide = await read("src/components/pwa/GetOnMobile.tsx");
  assert.match(guide, /GET_THE_APP_HASH = "#get-the-app"/);
  assert.match(guide, /addEventListener\("hashchange", onHash\)/);
  assert.doesNotMatch(guide, /Notification\.requestPermission|useAuth/);
  assert.match(guide, /<Sheet open=\{open\}/);
});
