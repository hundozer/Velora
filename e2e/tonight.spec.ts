import { expect, test } from "@playwright/test";

// Tonight, Phase 3. Stubbed session and plans only; the clock is fixed at 21:05 in Prague.
const NOW = new Date("2026-10-19T19:05:00Z").getTime();
const at = (h: number, m = 0, day = 0) => new Date(Date.UTC(2026, 9, 19 + day, h - 2, m)).toISOString();
const plan = (i: number, o: Record<string, unknown>) => ({ id: `10000000-0000-4000-8000-00000000000${i}`, authorId: `00000000-0000-4000-8000-00000000000${i}`, authorAvatar: "", authorAge: 30, authorIsCouple: false, authorVerified: true, category: "DATE", categoryLabel: "Drinks & a date", text: "", areaName: "Praha 2", distance: null, endsIn: "", replyTypes: [], minAge: 18, maxAge: 99, requireVerified: false, requireMedia: false, status: "active", live: true, isMine: false, canReply: true, audience: "everyone", eligibilityText: "You can reply — open to everyone.", ...o });

test.use({ timezoneId: "Europe/Prague" });
test.beforeEach(async ({ context }) => {
  await context.addInitScript((now) => {
    const D = Date; const off = now - D.now();
    // @ts-expect-error a fixed clock for the page
    globalThis.Date = class extends D { constructor(...a: unknown[]) { super(...((a.length ? a : [D.now() + off]) as [])); } static now() { return D.now() + off; } };
  }, NOW);
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  await context.route("**/api/auth/session", (r) => r.fulfill({ json: { provisioned: true, actor: { id: "u1", email: "member@example.test", role: "MEMBER", emailVerified: true } } }));
  await context.route("**/api/profile/me", (r) => r.fulfill({ json: { profile: { id: "p1", email: "member@example.test", display_name: "Adam", verification_status: "VERIFIED", account_status: "ACTIVE", area_id: "praha-7" } } }));
  await context.route("**/api/notifications**", (r) => r.fulfill({ json: { notifications: [], unreadCount: 0 } }));
});

test("plans read in time order with start, end and whether you can reply", async ({ page }) => {
  await page.route("**/api/dating-ads**", (r) => r.fulfill({ json: { plans: new URL(r.request().url()).searchParams.get("mine") ? [] : [
    plan(3, { authorName: "Daniel", title: "Cocktails in Karlín.", startsAt: at(23), expiresAt: at(26), canReply: false, audience: "women and couples", eligibilityText: "This invitation is for women and couples." }),
    plan(1, { authorName: "Marek & Eva", authorIsCouple: true, title: "Orange wine in Vinohrady.", startsAt: at(21), expiresAt: at(23, 30) }),
    plan(4, { authorName: "Sofie", title: "A gallery opening.", startsAt: at(19, 0, 1), expiresAt: at(23, 0, 1) }),
  ] } }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tonight");
  await expect(page.getByText("Prague, tonight · 21:05")).toBeVisible();
  const glance = page.getByRole("list", { name: "At a glance" }).getByRole("listitem");
  await expect(glance).toHaveCount(3);
  await expect(glance.nth(0)).toContainText("Now");
  await expect(glance.nth(1)).toContainText("23:00");
  await expect(glance.nth(1)).toContainText("Women & couples only");
  await expect(glance.nth(1).getByRole("link", { name: "Reply" })).toHaveCount(0);
  await expect(glance.nth(2)).toContainText("Tue 19:00");

  const featured = page.getByRole("article", { name: "Happening now: Orange wine in Vinohrady." });
  await expect(featured.getByText("Happening now · since 21:00")).toBeVisible();
  await expect(featured.getByRole("link", { name: "Reply to their invitation" })).toHaveAttribute("href", /datingAd=10000000-0000-4000-8000-000000000001/);
  const later = page.getByRole("region", { name: "Later tonight" });
  await expect(later.getByText("This invitation is for women and couples.")).toBeVisible();
  await expect(later.getByRole("link", { name: "See Daniel's portrait" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Tomorrow" }).getByRole("link", { name: "Reply to Sofie" })).toBeVisible();
});

test("an invitation is written as a sentence and sent with explicit start and end", async ({ page }) => {
  let body: Record<string, unknown> | null = null;
  await page.route("**/api/dating-ads**", async (r) => {
    if (r.request().method() === "POST") { body = r.request().postDataJSON(); return r.fulfill({ status: 201, json: { plan: {} } }); }
    return r.fulfill({ json: { plans: [] } });
  });
  await page.goto("/tonight/new");
  await page.getByPlaceholder("talk kink over a drink").fill("have a quiet drink");
  await page.getByLabel("Starts at").selectOption("22:00");
  await page.getByLabel("Ends at").selectOption("01:00");
  await expect(page.getByText(/It disappears at 01:00/)).toBeVisible();
  await page.getByRole("button", { name: /Who may reply/ }).click();
  await page.getByRole("dialog", { name: "Who may reply" }).getByLabel("Women").check();
  await page.getByRole("dialog", { name: "Who may reply" }).getByLabel("Couples").check();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("button", { name: /Who may reply: women and couples/ })).toBeVisible();
  await page.getByPlaceholder(/Who you are/).fill("Natural wine, quiet corner table, easy conversation.");
  await page.getByRole("button", { name: "Send the invitation" }).click();
  await expect.poll(() => body).not.toBeNull();
  const sent = body as unknown as Record<string, string | string[]>;
  expect(sent.title).toBe("have a quiet drink");
  expect(sent.allowedReplyGenders).toEqual(["♀", "👫"]);
  expect((new Date(sent.endsAt as string).getTime() - new Date(sent.startsAt as string).getTime()) / 3_600_000).toBe(3);
  await expect(page).toHaveURL(/\/tonight$/);
});

test("an end more than 12 hours later is caught before sending", async ({ page }) => {
  await page.route("**/api/dating-ads**", (r) => r.fulfill({ json: { plans: [] } }));
  await page.goto("/tonight/new");
  await page.getByLabel("Starts at").selectOption("22:00");
  await page.getByLabel("Ends at").selectOption("21:00");
  await expect(page.getByText("Invitations last up to 12 hours.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send the invitation" })).toBeDisabled();
});
