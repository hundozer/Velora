import { expect, test } from "@playwright/test";

// Profile as a sheet over People (Phase 2). Stubbed session and APIs only.
const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const member = (i: number) => ({ id: id(i), displayName: i === 7 ? "Lena" : `Member ${i}`, age: 29, gender: "FEMALE", areaName: "Praha 7", presence: i < 3 ? "ONLINE" : null, avatarUrl: "", headline: "" });

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
  await context.route("**/api/profiles/*", (r) => r.fulfill({ json: { profile: { ...member(7), bio: "Designer, new-ish to Prague." }, ownership: { isOwner: false } } }));
  await context.route("**/api/profiles/*/desires", (r) => r.fulfill({ json: { desires: [{ desire_id: "slow-burn", state: "LOVE" }, { desire_id: "dating", state: "INTO" }], shared: ["slow-burn"] } }));
  await context.route("**/api/profiles/*/approach", (r) => r.fulfill({ json: { isOwner: false, canWrite: true, established: false, line: "Lena asks men to introduce themselves first.", boundaries: { PRIVATE_ALBUM_REQUESTS: "COMFORTABLE" }, sentences: [{ kind: "FIRST_MESSAGE_MEN", text: "Men: introduce yourself before anything else.", appliesToViewer: true }] } }));
  let requested = false;
  await context.route("**/api/private-access**", (r) => {
    if (r.request().method() === "POST") { requested = true; return r.fulfill({ status: 201, json: { status: "REQUESTED" } }); }
    return r.fulfill({ json: { isOwner: false, privateCount: 2, status: requested ? "REQUESTED" : null, active: false, canRequest: !requested } });
  });
});

test("a profile opens over People and Back returns to the same place", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people?view=everyone&withinKm=5");
  const row = page.locator(`a[href="/profile/${id(7)}"]`);
  await row.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => Math.round(window.scrollY));
  await row.click();
  const sheet = page.getByRole("dialog", { name: "Profile" });
  await expect(sheet.getByRole("heading", { name: "Lena, 29" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/profile/${id(7)}$`));
  // People is still underneath (no remount).
  await expect(page.locator(`a[href="/profile/${id(0)}"]`)).toBeAttached();
  await expect(sheet.getByText("(you too)")).toBeVisible();
  await expect(sheet.locator("strong", { hasText: "Men: introduce yourself before anything else." })).toBeVisible();
  await expect(sheet.getByText("Lena asks men to introduce themselves first.")).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Begin a conversation" })).toHaveAttribute("href", `/messages?user=${id(7)}`);
  await sheet.getByRole("button", { name: "Back to People" }).first().click();
  await expect(page).toHaveURL(/\/people\?(?=.*view=everyone)(?=.*withinKm=5)/);
  await expect(sheet).toHaveCount(0);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(before);
});

test("private photographs: ask, then a neutral waiting state; Escape closes", async ({ page }) => {
  await page.goto("/people?view=everyone");
  await page.locator(`a[href="/profile/${id(7)}"]`).click();
  const sheet = page.getByRole("dialog", { name: "Profile" });
  await expect(sheet.getByText("Two private photographs. If you ask, Lena chooses: 24 hours, until she stops, or not now.")).toBeVisible();
  await sheet.getByRole("button", { name: "Ask to see them" }).click();
  await expect(sheet.getByText("Two private photographs. You asked to see them — Lena will decide.")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/people\?view=everyone$/);
});

test("a direct link renders the full profile page", async ({ page }) => {
  await page.goto(`/profile/${id(7)}`);
  await expect(page.getByRole("heading", { name: "Lena, 29" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Profile" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "People" })).toBeVisible();
});
