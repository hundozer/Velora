import { expect, test } from "@playwright/test";

// Mobile tab bar: discreet unread dots and tap-to-top. Stubbed session and APIs only.
const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const member = (i: number) => ({ id: id(i), displayName: `Member ${i}`, age: 29, gender: "FEMALE", areaName: "Praha 7", presence: null, avatarUrl: "", headline: "" });

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  await context.route("**/api/auth/session", (r) => r.fulfill({ json: { provisioned: true, actor: { id: "u1", email: "member@example.test", role: "MEMBER", emailVerified: true } } }));
  await context.route("**/api/profile/me", (r) => r.fulfill({ json: { profile: { id: "p1", email: "member@example.test", display_name: "Adam", verification_status: "VERIFIED", account_status: "ACTIVE" } } }));
  await context.route("**/api/notifications**", (r) => r.fulfill({ json: { notifications: [], unreadCount: 0 } }));
  await context.route("**/api/desires/me", (r) => r.fulfill({ json: { selections: [] } }));
  await context.route("**/api/discovery/introductions", (r) => r.fulfill({ json: { introductions: [] } }));
  await context.route("**/api/discovery/profiles**", (r) => r.fulfill({ json: { profiles: Array.from({ length: 24 }, (_, k) => member(k)), nextCursor: null } }));
  await context.route("**/api/dating-ads**", (r) => r.fulfill({ json: { plans: [] } }));
  await context.route("**/api/public/**", (r) => r.fulfill({ json: { media: [], albums: [] } }));
  await context.route("**/api/interests**", (r) => r.fulfill({ json: { interested: false, mutual: false } }));
  await context.route("**/api/connections**", (r) => r.fulfill({ json: { connections: [] } }));
});

test("Messages and You show a dot, not a number, when something is new", async ({ page, context }) => {
  await context.route("**/api/messages/unread", (r) => r.fulfill({ json: { messages: 2, notifications: 1 } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people?view=everyone");
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  const messages = nav.getByRole("link", { name: /Messages/ });
  await expect(messages.locator("[data-unread]")).toBeVisible();
  await expect(messages).toContainText("New messages");
  await expect(nav.getByRole("link", { name: /You/ }).locator("[data-unread]")).toBeVisible();
  await expect(nav.getByRole("link", { name: /People/ }).locator("[data-unread]")).toHaveCount(0);
  await expect(nav).not.toContainText("2");
});

test("no dots when nothing is new; tapping the current tab returns to the top", async ({ page, context }) => {
  await context.route("**/api/messages/unread", (r) => r.fulfill({ json: { messages: 0, notifications: 0 } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people?view=everyone");
  const nav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(nav.getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
  await expect(nav.locator("[data-unread]")).toHaveCount(0);
  await page.mouse.wheel(0, 2500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await nav.getByRole("link", { name: "People" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
});
