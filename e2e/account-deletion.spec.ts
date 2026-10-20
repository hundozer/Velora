import { expect, test } from "@playwright/test";

// UI regression only: the actual staged deletion is recorded separately.
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  await context.route("**/api/**", (route) => route.fulfill({ json: {} }));
  await context.route("**/api/auth/session", (route) => route.fulfill({ json: { provisioned: true, actor: { id: "u1", email: "member@example.test", role: "MEMBER", emailVerified: true } } }));
  await context.route("**/api/profile/me", (route) => route.fulfill({ json: { profile: { id: "p1", email: "member@example.test", display_name: "Member", account_status: "ACTIVE" } } }));
});

for (const failure of ["http", "network"] as const) {
  test(`deletion ${failure} failure stays in Settings and allows a successful retry`, async ({ page, context }) => {
    let attempts = 0;
    let finishRequest: (() => Promise<void>) | undefined;
    await context.route("**/api/auth/delete-account", async (route) => {
      attempts++;
      expect(route.request().postDataJSON()).toEqual({ confirmation: "DELETE" });
      if (attempts === 1) {
        if (failure === "network") await route.abort();
        else await route.fulfill({ status: 503, json: { error: "Unavailable" } });
        return;
      }
      await new Promise<void>((resolve) => {
        finishRequest = async () => { await route.fulfill({ json: { success: true } }); resolve(); };
      });
    });
    let logoutVisits = 0;
    await context.route("**/auth/logout?**", (route) => {
      logoutVisits++;
      return route.fulfill({ contentType: "text/html", body: "<p>Session cleared after accepted request</p>" });
    });
    await page.goto("/settings");
    await page.getByRole("button", { name: "Delete Account", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Confirm Account Deletion" });
    await dialog.getByRole("button", { name: "Confirm Deletion Request" }).click();
    await expect(dialog.getByRole("alert")).toContainText("We could not confirm your deletion request");
    await expect(page).toHaveURL(/\/settings$/);
    expect(logoutVisits).toBe(0);
    await dialog.getByRole("button", { name: "Confirm Deletion Request" }).click();
    await expect(dialog.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    expect(attempts).toBe(2);
    expect(logoutVisits).toBe(0);
    await expect.poll(() => !!finishRequest).toBe(true);
    await finishRequest!();
    await expect(page).toHaveURL(/\/auth\/logout\?returnTo=%2Fgoodbye$/);
    expect(logoutVisits).toBe(1);
  });
}
