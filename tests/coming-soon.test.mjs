import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { COMING_SOON, isOpenWhileComingSoon } from "../src/lib/comingSoon.mjs";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("Coming Soon is on", () => assert.equal(COMING_SOON, true));

test("signed-out visitors reach only the front page, account flows, legal pages and static files", () => {
  for (const path of ["/", "/login", "/auth/login", "/auth/callback", "/register", "/verify-email", "/reset-password", "/update-password",
    "/legal/privacy-policy", "/legal/terms", "/privacy", "/terms", "/cookies", "/manifest.webmanifest", "/sw.js", "/icons/favicon-32.png",
    "/api/invitation-requests", "/api/access/age-declaration", "/api/profile/me"]) assert.equal(isOpenWhileComingSoon(path), true, path);
  for (const path of ["/people", "/profile/abc", "/tonight", "/scene", "/guest-list", "/about", "/safety", "/stories", "/photos", "/personal-ads",
    "/api/public/community", "/api/public/profiles/abc", "/api/public", "/registered", "/legalese"]) assert.equal(isOpenWhileComingSoon(path), false, path);
});

test("middleware closes the site for signed-out and forged sessions only", async () => {
  const middleware = await read("src/middleware.ts");
  assert.match(middleware, /const gated = COMING_SOON && !isOpenWhileComingSoon\(pathname\)/);
  assert.match(middleware, /if \(!hasSessionHint\) return gated \? comingSoonResponse\(request\)/);
  assert.match(middleware, /const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);[\s\S]*if \(gated && !user\)/);
  assert.match(middleware, /status: 404/);
});

test("the front page is the invitation request, with no photos, example profiles or counts", async () => {
  // "/" and its cookie-bearing rewrite (/member-home) fall back to the same front page.
  for (const file of ["src/app/page.tsx", "src/app/member-home/page.tsx"]) {
    assert.match(await read(file), /COMING_SOON \? <ComingSoonHome \/> : <PublicCommunityHome \/>/, file);
  }
  const home = await read("src/components/community/ComingSoonHome.tsx");
  assert.match(home, /<InvitationRequestForm \/>/);
  assert.match(home, /href="\/auth\/login"/);
  assert.doesNotMatch(home, /next\/image|editorialPhotos|EXAMPLE_PROFILES|fetch\(|useAuth/);
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /COMING_SOON \? \{ robots: \{ index: false, follow: false \} \}/);
});
