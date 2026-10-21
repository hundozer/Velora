import { expect, test } from "@playwright/test";

for (const width of [375, 390, 1440]) {
  test(`honest landing and keyboard age gate at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, json: { authenticated: false } }));
    await page.route("**/api/public/community**", (route) => route.fulfill({ json: { profiles: [], datingAds: [], pagination: { total: 0 }, demoContentPresent: false } }));
    await page.route("**/api/access/age-declaration", (route) => route.fulfill({ json: { declared: true } }));
    await page.goto("/");
    // Wait for session hydration before testing the gate's keyboard listener;
    // native autofocus can occur on the server-rendered button before React mounts.
    await expect(page.getByRole("heading", { level: 1, name: "Kinky. Curious. Looking for someone?" })).toBeAttached();
    const dialog = page.getByRole("dialog", { name: "Are you 18 or older?" });
    const yes = dialog.getByRole("button", { name: "Yes, I'm 18+" });
    const exit = dialog.getByRole("link", { name: "No, take me out" });
    await expect(yes).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(exit).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(yes).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await yes.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Kinky. Curious. Looking for someone?" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Join the founding members" })).toHaveAttribute("href", "/register");
    await expect(page.getByRole("link", { name: "Create your profile", exact: true })).toHaveAttribute("href", "/register");
    await page.getByRole("link", { name: "Take a look" }).click();
    await expect(page).toHaveURL(/#connections$/);
    await expect(page.getByRole("heading", { name: "What brings you here?" })).toBeInViewport();
    for (const title of ["Just chemistry.", "Something kinky.", "Explore together."]) await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    const examples = page.getByRole("article", { name: /^Example profile:/ });
    await expect(examples).toHaveCount(3);
    for (const card of await examples.all()) {
      await expect(card.getByText("Example profile", { exact: true })).toBeVisible();
      await expect(card.getByRole("list", { name: "Example interests" })).toBeVisible();
      await expect(card.locator("a, button")).toHaveCount(0);
    }
    await expect(page.getByText("These are fictional examples, not members.", { exact: false })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("ends in 5 h");
    await expect(page.locator("body")).not.toContainText("Online now");
    await expect(page.locator("body")).toContainText("Sex, dates, friends with benefits, or someone who shares your kink.");
    const illustrations = page.locator("main img");
    await expect(illustrations).toHaveCount(7);
    for (const photo of await illustrations.all()) {
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/intimo-landing-${width}.png`, fullPage: true });
    await page.getByRole("link", { name: "Create your profile", exact: true }).click();
    await expect(page).toHaveURL(/\/register$/);
  });
}

for (const width of [375, 1440]) {
  test(`About photos load and fit the page at ${width}px`, async ({ page, context }) => {
    await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, json: { authenticated: false } }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about");
    const illustrations = page.locator("figure").filter({ has: page.locator("img") });
    await expect(illustrations).toHaveCount(4);
    for (const figure of await illustrations.all()) {
      const photo = figure.getByRole("img");
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/intimo-about-${width}.png`, fullPage: true });
  });
}
