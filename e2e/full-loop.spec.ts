import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";

// Two existing, onboarded, adult-verified test members (A and B) on staging.
// Registration and onboarding need inbox access, so they are covered by unit
// tests; this spec covers the member loop from sign-in to block.
const env = {
  baseUrl: process.env.E2E_BASE_URL,
  a: { email: process.env.E2E_A_EMAIL, password: process.env.E2E_A_PASSWORD },
  b: { email: process.env.E2E_B_EMAIL, password: process.env.E2E_B_PASSWORD },
};
const configured = Boolean(env.baseUrl && env.a.email && env.a.password && env.b.email && env.b.password);
test.skip(!configured, "Set E2E_BASE_URL and E2E_{A,B}_{EMAIL,PASSWORD} to run the full loop.");
test.skip(/^https?:\/\/(www\.)?intimo\.live/.test(env.baseUrl || ""), "Never run the full loop against production.");

type Member = { context: BrowserContext; page: Page; api: APIRequestContext; id: string };

async function signIn(browser: Browser, credentials: { email?: string; password?: string }): Promise<Member> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email!);
  await page.getByLabel("Password").fill(credentials.password!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
  const me = await context.request.get("/api/profile/me");
  expect(me.status(), "test member has a profile").toBe(200);
  const { profile } = await me.json();
  return { context, page, api: context.request, id: profile.id };
}

test("member loop: preferences → discover → interest → plan → private access → realtime message → notification → block", async ({ browser }) => {
  const a = await signIn(browser, env.a);
  const b = await signIn(browser, env.b);
  // Reset leftovers from an earlier run.
  await a.api.delete(`/api/blocks?targetProfileId=${b.id}`);
  await b.api.delete(`/api/blocks?targetProfileId=${a.id}`);
  await b.api.delete(`/api/interests?targetProfileId=${a.id}`);

  await test.step("A sets desires and boundaries", async () => {
    const desires = await a.api.put("/api/desires/me", { data: { consent: true, selections: [{ desireId: "massage", state: "INTO", visibility: "MEMBERS" }] } });
    expect(desires.ok(), await desires.text()).toBeTruthy();
    const boundaries = await a.api.put("/api/boundaries/me", { data: { boundaries: [{ kind: "PRIVATE_ALBUM_REQUESTS", preference: "COMFORTABLE" }] } });
    expect(boundaries.ok()).toBeTruthy();
  });

  await test.step("B finds A in People and opens the profile", async () => {
    expect((await b.api.get("/api/discovery/profiles")).ok()).toBeTruthy();
    await b.page.goto(`/profile/${a.id}`);
    await expect(b.page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  await test.step("B shows interest; A is notified", async () => {
    const interest = await b.api.post("/api/interests", { data: { targetProfileId: a.id } });
    expect(interest.status()).toBe(201);
    const notifications = await (await a.api.get("/api/notifications")).json();
    expect(notifications.notifications.some((item: { type: string }) => item.type === "INTEREST" || item.type === "MUTUAL_INTEREST")).toBeTruthy();
  });

  let planId = "";
  await test.step("A posts a Plan for tonight", async () => {
    const plan = await a.api.post("/api/dating-ads", { data: { category: "DATE", title: "E2E drinks", text: "Automated end-to-end test plan, please ignore.", validityDays: 1 } });
    expect(plan.status(), await plan.text()).toBe(201);
    planId = (await plan.json()).plan.id;
  });

  await test.step("B asks for private photos; A grants once", async () => {
    const request = await b.api.post("/api/private-access", { data: { ownerId: a.id } });
    expect([200, 201, 409]).toContain(request.status());
    const grant = await a.api.patch("/api/private-access", { data: { viewerId: b.id, decision: "GRANT_ONCE" } });
    expect(grant.ok(), await grant.text()).toBeTruthy();
    await a.api.patch("/api/private-access", { data: { viewerId: b.id, decision: "REVOKE" } });
  });

  await test.step("B messages A and it arrives in A's open chat in real time", async () => {
    await a.page.goto(`/messages?user=${b.id}`);
    const text = `E2E hello ${Date.now()}`;
    const sent = await b.api.post("/api/messages", { data: { receiverId: a.id, content: text } });
    expect(sent.status(), await sent.text()).toBe(201);
    await expect(a.page.getByText(text)).toBeVisible({ timeout: 15_000 });
  });

  await test.step("A blocks B; B can no longer reach A", async () => {
    expect((await a.api.post("/api/blocks", { data: { targetProfileId: b.id } })).status()).toBe(201);
    const blocked = await b.api.post("/api/messages", { data: { receiverId: a.id, content: "should not arrive" } });
    expect(blocked.ok()).toBeFalsy();
    expect((await b.api.get(`/api/profiles/${a.id}`)).ok()).toBeFalsy();
  });

  // Leave the pair reusable for the next run.
  await a.api.delete(`/api/blocks?targetProfileId=${b.id}`);
  await b.api.delete(`/api/interests?targetProfileId=${a.id}`);
  if (planId) await a.api.delete(`/api/dating-ads/${planId}`);
  await a.context.close();
  await b.context.close();
});
