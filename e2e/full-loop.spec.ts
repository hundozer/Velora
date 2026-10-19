import { appendFileSync } from "node:fs";
import { authorizePreview } from "./protected-preview";
import { memberEnvironment } from "./member-environment";
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";

// Two existing, onboarded, adult-verified test members (A and B) on staging.
// Registration and onboarding need inbox access, so they are covered by unit
// tests; this spec covers the member loop from sign-in to block.
const env = {
  baseUrl: process.env.E2E_BASE_URL,
  a: { email: process.env.E2E_A_EMAIL, password: process.env.E2E_A_PASSWORD },
  b: { email: process.env.E2E_B_EMAIL, password: process.env.E2E_B_PASSWORD },
};
test.beforeAll(() => memberEnvironment());

type Member = { context: BrowserContext; page: Page; api: APIRequestContext; id: string };

async function signIn(browser: Browser, credentials: { email?: string; password?: string }): Promise<Member> {
  const context = await browser.newContext({ baseURL: env.baseUrl });
  try {
    await authorizePreview(context);
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByRole("button", { name: "Yes, I'm 18+" }).click();
    await expect(page.getByRole("dialog", { name: "Are you 18 or older?" })).toHaveCount(0);
    await page.getByLabel("Email", { exact: true }).fill(credentials.email!);
    await page.getByLabel("Password", { exact: true }).fill(credentials.password!);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"));
    const me = await context.request.get("/api/profile/me");
    expect(me.status(), "test member has a profile").toBe(200);
    const { profile } = await me.json();
    return { context, page, api: context.request, id: profile.id };
  } catch (error) {
    await context.close();
    throw error;
  }
}

test("member loop: preferences → discover → interest → plan → private access → realtime message → notification → block", async ({ browser }) => {
  let a: Member | undefined;
  let b: Member | undefined;
  let planId = "";
  let mediaId = "";
  let primaryFailure: unknown;
  try {
  a = await signIn(browser, env.a);
  b = await signIn(browser, env.b);
  // This is a dedicated fixture environment; messages, notices and consent
  // records are retained as test evidence, never real-member data.

  // Reset leftovers from an earlier run.
  await a!.api.delete(`/api/blocks?targetProfileId=${b!.id}`);
  await b!.api.delete(`/api/blocks?targetProfileId=${a!.id}`);
  await b!.api.delete(`/api/interests?targetProfileId=${a!.id}`);

  await test.step("A sets desires and boundaries", async () => {
    const desires = await a!.api.put("/api/desires/me", { data: { consent: true, selections: [{ desireId: "massage", state: "INTO", visibility: "MEMBERS" }] } });
    expect(desires.ok(), await desires.text()).toBeTruthy();
    const boundaries = await a!.api.put("/api/boundaries/me", { data: { boundaries: [{ kind: "PRIVATE_ALBUM_REQUESTS", preference: "COMFORTABLE" }] } });
    expect(boundaries.ok()).toBeTruthy();
  });

  await test.step("B finds A in People and opens the profile", async () => {
    expect((await b!.api.get("/api/discovery/profiles")).ok()).toBeTruthy();
    await b!.page.goto(`/profile/${a!.id}`);
    await expect(b!.page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  await test.step("B shows interest; A is notified", async () => {
    const interest = await b!.api.post("/api/interests", { data: { targetProfileId: a!.id } });
    expect(interest.status()).toBe(201);
    const notifications = await (await a!.api.get("/api/notifications")).json();
    expect(notifications.notifications.some((item: { type: string }) => item.type === "INTEREST" || item.type === "MUTUAL_INTEREST")).toBeTruthy();
  });

  await test.step("A posts a Plan for tonight", async () => {
    const plan = await a!.api.post("/api/dating-ads", { data: { category: "DATE", title: "E2E drinks", text: "Automated end-to-end test plan, please ignore.", startsAt: new Date(Date.now() + 60_000).toISOString(), endsAt: new Date(Date.now() + 3_600_000).toISOString() } });
    expect(plan.status(), await plan.text()).toBe(201);
    planId = (await plan.json()).plan.id;
  });

  await test.step("R2 upload → completion → owner delivery → deletion", async () => {
    // A small generated test image, never a real person's photograph.
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVR4nGP4z8AARwgWXg4ArpMP8aaUSCMAAAAASUVORK5CYII=", "base64");
    const presign = await a!.api.post("/api/media/presign-upload", { data: { fileName: "acceptance.png", fileType: "image/png", fileSize: png.length, folder: "photos", visibility: "PRIVATE", contentRating: "NON_EXPLICIT", participantDeclaration: { containsOtherIdentifiableParticipants: false, allParticipantsAdults: true, recordingConsented: true, publicationConsented: true } } });
    expect(presign.status(), await presign.text()).toBe(200);
    const upload = await presign.json();
    mediaId = upload.mediaId;
    if (process.env.E2E_MANIFEST_PATH) appendFileSync(process.env.E2E_MANIFEST_PATH, JSON.stringify({ mediaId, objectKey: upload.objectKey }) + "\n", { mode: 0o600 });
    expect(upload.isMock).toBe(false);
    expect((await a!.api.put(upload.uploadUrl, { data: png, headers: { "Content-Type": "image/png" } })).ok()).toBeTruthy();
    const complete = await a!.api.post(`/api/media/${mediaId}/complete`);
    expect(complete.ok(), await complete.text()).toBeTruthy();
    expect((await complete.json()).variants).toBe("READY");
    expect((await a!.api.get(`/api/media/${mediaId}`)).ok()).toBeTruthy();
    expect((await b!.api.get(`/api/media/${mediaId}`)).ok()).toBeFalsy();
  });

  await test.step("Private photo consent, grant and revoke enforce actual delivery", async () => {
    const mediaPath = `/api/media/${process.env.E2E_A_PRIVATE_MEDIA_ID}`;
    await a!.api.patch("/api/private-access", { data: { viewerId: b!.id, decision: "REVOKE" } });
    expect((await b!.api.get(mediaPath)).ok()).toBeFalsy();
    expect((await a!.api.put("/api/boundaries/me", { data: { boundaries: [{ kind: "PRIVATE_ALBUM_REQUESTS", preference: "NOT_INTERESTED" }] } })).ok()).toBeTruthy();
    expect((await b!.api.post("/api/private-access", { data: { ownerId: a!.id } })).status()).toBe(403);
    expect((await a!.api.put("/api/boundaries/me", { data: { boundaries: [{ kind: "PRIVATE_ALBUM_REQUESTS", preference: "COMFORTABLE" }] } })).ok()).toBeTruthy();
    const request = await b!.api.post("/api/private-access", { data: { ownerId: a!.id } });
    expect([200, 201]).toContain(request.status());
    expect((await a!.api.patch("/api/private-access", { data: { viewerId: b!.id, decision: "GRANT_ONCE" } })).ok()).toBeTruthy();
    const delivered = await b!.api.get(mediaPath, { maxRedirects: 0 });
    expect(delivered.status()).toBe(200);
    expect(delivered.headers()["cache-control"]).toContain("no-store");
    await a!.api.patch("/api/private-access", { data: { viewerId: b!.id, decision: "REVOKE" } });
    expect((await b!.api.get(mediaPath)).ok()).toBeFalsy();
  });

  await test.step("B messages A and it arrives in A's open chat in real time", async () => {
    await a!.page.goto(`/messages?user=${b!.id}`);
    const text = `E2E hello ${Date.now()}`;
    const sent = await b!.api.post("/api/messages", { data: { receiverId: a!.id, content: text } });
    expect(sent.status(), await sent.text()).toBe(201);
    await expect(a!.page.getByText(text)).toBeVisible({ timeout: 15_000 });
  });

  await test.step("A replies and B receives it without refresh", async () => {
    await b!.page.goto(`/messages?user=${a!.id}`);
    const content = `E2E reply ${Date.now()}`;
    expect((await a!.api.post("/api/messages", { data: { receiverId: b!.id, content } })).status()).toBe(201);
    await expect(b!.page.getByText(content)).toBeVisible({ timeout: 15_000 });
  });

  await test.step("A blocks B; B can no longer reach A", async () => {
    expect((await a!.api.post("/api/blocks", { data: { targetProfileId: b!.id } })).status()).toBe(201);
    const blocked = await b!.api.post("/api/messages", { data: { receiverId: a!.id, content: "should not arrive" } });
    expect(blocked.ok()).toBeFalsy();
    expect((await b!.api.get(`/api/profiles/${a!.id}`)).ok()).toBeFalsy();
  });

  } catch (error) {
    primaryFailure = error;
  } finally {
    // Always attempt every cleanup, including after a failed assertion/sign-in.
    const cleanups: Array<() => Promise<unknown>> = [];
    if (a && b) {
      cleanups.push(async () => { expect((await a!.api.delete(`/api/blocks?targetProfileId=${b!.id}`)).ok(), "cleanup unblock").toBeTruthy(); });
      cleanups.push(async () => { expect((await b!.api.delete(`/api/interests?targetProfileId=${a!.id}`)).ok(), "cleanup interest").toBeTruthy(); });
      cleanups.push(async () => { expect((await a!.api.patch("/api/private-access", { data: { viewerId: b!.id, decision: "REVOKE" } })).ok(), "cleanup private access").toBeTruthy(); });
    }
    if (a && planId) cleanups.push(async () => { expect((await a!.api.delete(`/api/dating-ads/${planId}`)).ok(), "cleanup Plan").toBeTruthy(); });
    if (a && mediaId) cleanups.push(async () => { expect((await a!.api.delete(`/api/media/${mediaId}`)).ok(), "cleanup media").toBeTruthy(); });
    const outcomes = await Promise.allSettled(cleanups.map((cleanup) => cleanup()));
    await a?.context.close();
    await b?.context.close();
    const failures = outcomes.filter((outcome) => outcome.status === "rejected");
    const errors = [...(primaryFailure ? [primaryFailure] : []), ...failures.map((outcome) => (outcome as PromiseRejectedResult).reason)];
    if (errors.length) throw new AggregateError(errors, errors.map(error => error instanceof Error ? error.stack : String(error)).join("\n\n").replace(/(https?:\/\/[^\s?]+)\?[^\s]+/g, "$1?[redacted]"));
  }
});
