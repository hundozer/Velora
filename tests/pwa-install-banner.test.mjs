import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { detectDevice } from "../src/lib/installGuide.mjs";
const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("banner is mobile-only on landing page and never appears in installed mode", () => {
  const source = read("src/components/pwa/MobileInstallBanner.tsx");
  assert.match(source, /pathname !== "\/"/);
  assert.match(source, /!standalone && !dismissed/);
  assert.match(source, /detected\.os === "ios" \|\| detected\.os === "android"/);
  assert.match(source, /className="md:hidden/);
  assert.match(source, /DISMISS_MS = 7 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(source, /appinstalled/);
  assert.match(source, /onClick=\{dismiss\}/);
  assert.match(read("src/app/layout.tsx"), /<MobileInstallBanner \/>/);
});

test("native install is only invoked on explicit Android click", () => {
  const source = read("src/components/pwa/MobileInstallBanner.tsx");
  assert.match(source, /beforeinstallprompt/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /async function install\(\)/);
  assert.match(source, /await prompt\.prompt\(\)/);
  assert.match(source, /onClick=\{\(\) => void install\(\)\}/);
  assert.match(source, /setGuide\(true\)/);
  assert.match(source, /Share in the browser toolbar/);
  assert.match(source, /Add to Home Screen/);
  assert.doesNotMatch(source, /Notification\.requestPermission/);
});

test("mobile detection recognizes Safari, Android, and in-app browsers", () => {
  assert.equal(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1").os, "ios");
  const android = detectDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36");
  assert.equal(android.os, "android");
  assert.equal(android.browser, "chrome");
  assert.equal(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Instagram").inApp, "Instagram");
});
