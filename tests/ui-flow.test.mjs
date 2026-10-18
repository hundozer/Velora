import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("first visit shows only the 18+ screen: no cookie banner", () => {
  const layout = read("src/app/layout.tsx");
  assert.doesNotMatch(layout, /CookieConsent/);
  assert.match(layout, /<AgeVerificationModal \/>/);
  // Nothing non-essential is set, which is what makes the banner unnecessary.
  assert.doesNotMatch(read("package.json"), /@vercel\/analytics|posthog|plausible|gtag/);
});

test("registration sends both declarations from the single agreement", () => {
  const page = read("src/app/register/page.tsx");
  assert.match(page, /adult: agreed, terms: agreed/);
  assert.match(page, /const ready = email\.trim\(\) && password\.length >= MIN_PASSWORD && agreed;/);
});

test("focused screens hide site chrome", () => {
  const flow = read("src/lib/flowRoutes.ts");
  for (const route of ["/register", "/login", "/onboarding"]) assert.ok(flow.includes(`"${route}"`), route);
  for (const file of ["src/components/layout/Navbar.tsx", "src/components/layout/MobileNavigation.tsx", "src/components/layout/Footer.tsx"]) {
    assert.match(read(file), /if \(isFlowPath\(pathname\)\) return null;/, file);
  }
});
