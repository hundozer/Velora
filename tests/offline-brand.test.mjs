import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("offline shell follows official Intimo palette, not legacy gold styling", async () => {
  const page = await read("public/offline.html");
  for (const hex of ["#191C20", "#F1E8DC", "#A8D5EF", "#E0704F"]) assert.ok(page.includes(hex), hex);
  assert.doesNotMatch(page, /#D4AF37|#0A0B0E|#F5F1E8/i);
  assert.match(page, /font-weight: 400/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /window\.addEventListener\("online"/);
  assert.match(page, /window\.location\.reload\(\)/);
});
test("PWA service worker rotates shell cache, never caches private member content", async () => {
  const worker = await read("public/sw.js");
  assert.match(worker, /intimo-offline-v3/);
  assert.match(worker, /event\.request\.mode !== "navigate"/);
  assert.match(worker, /cache\.match\(OFFLINE_URL\)/);
  assert.match(worker, /cache: "reload"/);
  assert.match(worker, /key.startsWith\("intimo-offline-"\)/);
  assert.doesNotMatch(worker, /cache\.put\(event\.request/);
});
