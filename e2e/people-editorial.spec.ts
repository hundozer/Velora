import { expect, test } from "@playwright/test";

// People, Phase 2 (approved v33). Self-contained: session and discovery APIs are stubbed,
// so this never touches real members and runs against a local server or a preview.
const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const member = (i: number, extra: Record<string, unknown> = {}) => ({ id: id(i), displayName: `Member ${i}`, age: 30, gender: "FEMALE", areaName: "Praha 7", presence: null, avatarUrl: "", headline: "", ...extra });

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  await context.route("**/api/auth/session", (r) => r.fulfill({ json: { provisioned: true, actor: { id: "u1", email: "member@example.test", role: "MEMBER", emailVerified: true } } }));
  await context.route("**/api/profile/me", (r) => r.fulfill({ json: { profile: { id: "p1", email: "member@example.test", display_name: "Adam", verification_status: "VERIFIED", account_status: "ACTIVE" } } }));
  await context.route("**/api/desires/me", (r) => r.fulfill({ json: { selections: [] } }));
  await context.route("**/api/notifications**", (r) => r.fulfill({ json: { notifications: [], unreadCount: 0 } }));
  await context.route("**/api/discovery/introductions", (r) => r.fulfill({ json: { introductions: [
    member(1, { displayName: "Tomáš & Nina", isCoupleProfile: true, headline: "We like evenings that start with dinner.", presence: "ONLINE" }),
    member(2, { displayName: "Lena", presence: "ONLINE" }),
  ] } }));
  await context.route("**/api/discovery/profiles**", (r) => {
    const url = new URL(r.request().url());
    const q = url.searchParams.get("q");
    const people = [member(2, { displayName: "Lena", presence: "ONLINE" }), member(3, { presence: "TODAY" }), member(4, { displayName: "Hidden Hana" })];
    return r.fulfill({ json: { profiles: q ? people.filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase())) : people, nextCursor: null } });
  });
});

test("introductions come first; photo-free members get a typographic spread", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/people");
  const first = page.getByRole("article", { name: "Introduction: Tomáš & Nina" });
  await expect(first).toBeVisible();
  await expect(first.getByText("“We like evenings that start with dinner.”")).toBeVisible();
  await expect(first.getByRole("link", { name: "Write to them" })).toHaveAttribute("href", `/messages?user=${id(1)}`);
  await expect(first.getByRole("link", { name: "Their portrait" })).toHaveAttribute("href", `/profile/${id(1)}`);
  await expect(page.getByRole("heading", { name: "Everyone nearby" })).toBeAttached();
  await expect(page.getByRole("link", { name: "People" })).toHaveAttribute("aria-current", "page");
});

test("Everyone groups by activity and hidden members show no activity", async ({ page }) => {
  await page.goto("/people?view=everyone");
  await expect(page.getByRole("region", { name: "Here now" })).toContainText("Lena");
  await expect(page.getByRole("region", { name: "Earlier today" })).toContainText("Member 3");
  const hidden = page.getByRole("region", { name: "Other people nearby" });
  await expect(hidden).toContainText("Hidden Hana");
  await expect(hidden.getByRole("img", { name: "Here now" })).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(/\d+ (members|people)\b/);
});

test("the filter sentence opens a sheet and filters stay in the URL", async ({ page }) => {
  await page.goto("/people?view=everyone");
  await page.getByRole("button", { name: "everyone", exact: true }).click();
  const sheet = page.getByRole("dialog", { name: "Who to show" });
  await sheet.getByRole("radio", { name: "Women", exact: true }).click();
  await sheet.getByRole("radio", { name: "5 km", exact: true }).click();
  await sheet.getByRole("button", { name: "Show people" }).click();
  await expect(page).toHaveURL(/who=WOMEN/);
  await expect(page).toHaveURL(/withinKm=5/);
  await expect(page.getByText("Showing")).toContainText("women within 5 km");
  await page.getByPlaceholder("Name or neighbourhood").fill("lena");
  await expect(page).toHaveURL(/q=lena/);
  await expect(page.getByRole("region", { name: "Earlier today" })).toHaveCount(0);
});

for (const width of [375, 390, 1440]) {
  test(`grouped interests preserve selections and the five-interest limit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/people?view=everyone");
    await page.getByRole("button", { name: "everyone", exact: true }).click();
    const sheet = page.getByRole("dialog", { name: "Who to show" });
    await sheet.getByRole("radio", { name: "Women", exact: true }).click();
    const interests = sheet.getByRole("region", { name: "Into", exact: true });
    for (const category of ["Connection", "Play", "Couples & groups", "Power & kink", "Sensation", "Scene & social"]) {
      await expect(interests.getByRole("group", { name: category, exact: true })).toBeAttached();
    }
    await interests.getByRole("heading", { name: "Into", exact: true }).evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: `/tmp/intimo-filter-${width}.png` });
    for (const label of ["Dating", "Friends with benefits", "Casual encounters", "Flirting & sexting", "Slow burn"]) {
      await interests.getByRole("button", { name: label, exact: true }).click();
    }
    await expect(interests.getByRole("status")).toHaveText("5 of 5 selected");
    const roleplay = interests.getByRole("button", { name: "Roleplay", exact: true });
    await expect(roleplay).toBeDisabled();
    await interests.getByRole("button", { name: "Dating", exact: true }).click();
    await expect(roleplay).toBeEnabled();
    await roleplay.click();
    await expect(roleplay).toHaveAttribute("aria-pressed", "true");
    await expect(sheet.getByRole("button", { name: "Show people", exact: true })).toBeInViewport();
    expect(await sheet.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await sheet.getByRole("button", { name: "Show people", exact: true }).click();
    await expect(page).toHaveURL(/who=WOMEN/);
    await expect(page).toHaveURL(/roleplay/);
    await page.getByRole("button", { name: "women", exact: true }).click();
    await expect(roleplay).toHaveAttribute("aria-pressed", "true");
    await interests.getByRole("button", { name: "Clear interests", exact: true }).click();
    await expect(interests.getByRole("status")).toHaveText("0 of 5 selected");
    await expect(sheet.getByRole("radio", { name: /^Women/ })).toHaveAttribute("aria-checked", "true");
    await expect(roleplay).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });
}
