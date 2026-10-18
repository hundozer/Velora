import { expect, test } from "@playwright/test";

// People keeps its place (editorial redesign, Phase 1). Self-contained: the session and
// discovery APIs are stubbed in the browser, so this never touches real members and can
// run against a local dev server or a preview (E2E_BASE_URL).
const person = (i: number) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`, displayName: `Member ${i}`, age: 25 + (i % 15), areaName: "Holešovice", presence: null });

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  await context.route("**/api/auth/session", (r) => r.fulfill({ json: { provisioned: true, actor: { id: "u1", email: "member@example.test", role: "MEMBER", emailVerified: true } } }));
  await context.route("**/api/profile/me", (r) => r.fulfill({ json: { profile: { id: "p1", email: "member@example.test", display_name: "Adam", verification_status: "VERIFIED", account_status: "ACTIVE" } } }));
  await context.route("**/api/discovery/profiles**", (r) => {
    const url = new URL(r.request().url());
    if (url.searchParams.get("limit") === "12") return r.fulfill({ json: { profiles: [], nextCursor: null } });
    const page = url.searchParams.get("cursor") ? 1 : 0;
    return r.fulfill({ json: { profiles: Array.from({ length: 24 }, (_, k) => person(page * 24 + k)), nextCursor: page ? null : "2026-10-18T10:00:00Z|00000000-0000-4000-8000-000000000023" } });
  });
  await context.route("**/api/desires/me", (r) => r.fulfill({ json: { selections: [] } }));
  await context.route("**/api/dating-ads**", (r) => r.fulfill({ json: { plans: [] } }));
  await context.route("**/api/profiles/**", (r) => r.fulfill({ json: { profile: { id: "x", displayName: "Member 40", age: 30, interests: [], languages: [] }, ownership: { isOwner: false } } }));
});

test("filters, loaded people and scroll position survive opening a profile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people?who=WOMEN&withinKm=5");
  const tile = (i: number) => page.locator(`a[href="/profile/${person(i).id}"]`);
  await tile(0).waitFor();
  await page.getByRole("button", { name: "Show more" }).click();
  await tile(40).scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => Math.round(window.scrollY));

  await tile(40).click();
  await page.waitForURL(/\/profile\//);
  await page.goBack();
  await page.waitForURL(/\/people\?who=WOMEN&withinKm=5$/);
  await tile(40).waitFor();
  await expect(page.locator('a[href^="/profile/"]')).toHaveCount(48);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(before);
});

test("a reload shows fresh results instead of the saved place", async ({ page }) => {
  await page.goto("/people");
  await page.locator(`a[href="/profile/${person(0).id}"]`).waitFor();
  await page.locator(`a[href="/profile/${person(5).id}"]`).click();
  await page.waitForURL(/\/profile\//);
  await page.goBack();
  await page.waitForURL(/\/people/);
  await page.reload();
  await expect(page.locator('a[href^="/profile/"]')).toHaveCount(24);
});
