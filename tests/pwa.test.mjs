import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("manifest is installable and discreet", async () => {
  const manifest = await read("src/app/manifest.ts");
  assert.match(manifest, /name: "Intimo"/);
  assert.match(manifest, /display: "standalone"/);
  assert.match(manifest, /purpose: "maskable"/);
  for (const icon of ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]) await fs.access(path.join(root, "public/icons", icon));
});

test("service worker caches only the generic offline page", async () => {
  const sw = await read("public/sw.js");
  assert.match(sw, /if \(event\.request\.mode !== "navigate"\) return;/);
  assert.doesNotMatch(sw, /cache\.put|addAll\(/);
  assert.match(await read("public/offline.html"), /Nothing private is stored on this device/);
});

test("notification permission is only requested after an explicit tap", async () => {
  const card = await read("src/components/pwa/AppOnThisDevice.tsx");
  assert.match(card, /async function enableNotifications\(\)/);
  assert.equal((card.match(/Notification\.requestPermission\(\)/g) || []).length, 1);
  assert.match(card, /onClick=\{enableNotifications\}/);
});
