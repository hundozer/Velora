import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("tab bar shows a discreet unread dot, never a number", async () => {
  const nav = await read("src/components/layout/MobileNavigation.tsx");
  assert.match(nav, /useUnreadCounts\(user \? profile\?\.id : undefined, pathname\)/);
  assert.match(nav, /data-unread className="absolute -right-2\.5 top-0 h-1\.5 w-1\.5 rounded-full bg-velora-copper"/);
  assert.doesNotMatch(nav, /\{item\.unread\}/, "the tab bar must not print unread numbers");
  assert.match(nav, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
});

test("unread counts follow inbox rules and stay private", async () => {
  const route = await read("src/app/api/messages/unread/route.ts");
  assert.match(route, /hasAdultAccess\(actor\.actor\)/);
  assert.match(route, /\.eq\("receiver_id", me\)\.eq\("is_opened", false\)\.eq\("status", "SENT"\)/);
  assert.match(route, /filter\(\(id\) => !blocked\.has\(id\)\)/);
  assert.match(route, /\.eq\("account_status", "ACTIVE"\)\.eq\("is_demo", false\)/);
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.match(await read("src/lib/notifications/useUnreadCounts.ts"), /useMessageRealtime\(profileId, refresh, "tab-bar-unread"\)/);
});

test("page content clears the tab bar and the iPhone home indicator", async () => {
  assert.match(await read("src/app/layout.tsx"), /pb-\[calc\(4rem\+env\(safe-area-inset-bottom\)\)\] md:pb-0/);
});
