import { expect, test } from "@playwright/test";

for (const width of [375, 390, 1440]) {
  test(`honest landing and keyboard age gate at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, json: { authenticated: false } }));
    await page.route("**/api/public/community**", (route) => route.fulfill({ json: { profiles: [], datingAds: [], pagination: { total: 0 }, demoContentPresent: false } }));
    await page.route("**/api/access/age-declaration", (route) => route.fulfill({ json: { declared: true } }));
    await page.goto("/");
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
    await expect(page.getByRole("heading", { level: 1, name: "Kinky. Curious. Welcome." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Join Intimo", exact: true }).first()).toHaveAttribute("href", "/register");
    await expect(page.getByLabel("Everyone is welcome")).toContainText("Kink-curious.");
    await expect(page.getByText("Example plan", { exact: true }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("ends in 5 h");
    await expect(page.locator("body")).not.toContainText("Online now");
    await expect(page.locator("body")).toContainText("Looking for sex, a date, or someone who shares your kink?");
    const illustrations = page.locator("figure").filter({ hasText: "AI-generated illustration. Not real members or events." });
    await expect(illustrations).toHaveCount(8);
    for (const figure of await illustrations.all()) {
      const photo = figure.getByRole("img");
      await photo.scrollIntoViewIfNeeded();
      await expect.poll(() => photo.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `/tmp/intimo-landing-${width}.png`, fullPage: true });
  });
}

for (const width of [375, 1440]) {
  test(`About photos load and disclose their origin at ${width}px`, async ({ page, context }) => {
    await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
    await page.route("**/api/auth/session", (route) => route.fulfill({ status: 401, json: { authenticated: false } }));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about");
    const illustrations = page.locator("figure").filter({ hasText: "AI-generated illustration. Not real members or events." });
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
