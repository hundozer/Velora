import { expect, test } from "@playwright/test";

const title = "Kinky. Curious. Looking for someone?";

function deferred() {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => { release = resolve; });
  return { promise, release };
}

test("anonymous landing and hero load while the session request is still pending", async ({ page, context }) => {
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  const gate = deferred();
  let finished = false;
  await page.route("**/api/auth/session", async (route) => {
    await gate.promise;
    finished = true;
    await route.fulfill({ status: 401, json: { authenticated: false } });
  });
  try {
    const requested = page.waitForRequest("**/api/auth/session");
    const response = await page.goto("/");
    // Public content and the priority hero must be in the actual initial HTML.
    expect(await response!.text()).toContain("Looking for someone?");
    await requested;
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    const hero = page.locator("main img").first();
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    await expect(page.getByRole("link", { name: "Join the founding members" })).toHaveAttribute("href", "/register");
    expect(finished).toBe(false);
  } finally { gate.release(); }
});

test("public landing is present without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/");
    // The age gate intentionally remains, but the public content exists in HTML.
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeAttached();
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Around here" })).toHaveCount(0);
  } finally { await context.close(); }
});

test("session-cookie hint waits for verification then opens the member feed", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "sb-home-fixture-auth-token.0", value: "presentation-hint-only", url: baseURL! }]);
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  const gate = deferred();
  let feedRequests = 0;
  await page.route("**/api/auth/session", async (route) => {
    await gate.promise;
    await route.fulfill({ json: { provisioned: true, actor: { id: "fixture-user", email: "member@example.test", role: "MEMBER", emailVerified: true } } });
  });
  await page.route("**/api/profile/me", (route) => route.fulfill({ json: { profile: { id: "fixture-profile", email: "member@example.test", display_name: "Fixture", verification_status: "VERIFIED", account_status: "ACTIVE" } } }));
  await page.route("**/api/notifications**", (route) => route.fulfill({ json: { notifications: [], unreadCount: 0 } }));
  await page.route("**/api/feed**", (route) => { feedRequests++; return route.fulfill({ json: { items: [] } }); });
  try {
    const requested = page.waitForRequest("**/api/auth/session");
    await page.goto("/");
    await requested;
    await expect(page.getByRole("status")).toContainText("Loading your home");
    await expect(page.getByRole("heading", { level: 1, name: title })).toHaveCount(0);
    expect(feedRequests).toBe(0);
    gate.release();
    await expect(page.getByRole("heading", { level: 1, name: "Around here" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: title })).toHaveCount(0);
    await expect.poll(() => feedRequests).toBeGreaterThan(0);
  } finally { gate.release(); }
});

for (const status of [401, 503]) {
  test(`unverified cookie never opens the feed and falls back to public home after ${status}`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "sb-home-fixture-auth-token", value: "not-a-session", url: baseURL! }]);
    await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
    let feedRequests = 0;
    await page.route("**/api/auth/session", (route) => route.fulfill({ status, json: { authenticated: false } }));
    await page.route("**/api/feed**", (route) => { feedRequests++; return route.fulfill({ status: 401, json: {} }); });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Around here" })).toHaveCount(0);
    expect(feedRequests).toBe(0);
  });
}
