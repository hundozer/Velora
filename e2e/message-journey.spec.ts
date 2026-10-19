import { expect, test } from "@playwright/test";

// Messages, Phase 2: context, openers and the composer. Stubbed session and APIs only.
const lena = "00000000-0000-4000-8000-000000000007";
const planId = "10000000-0000-4000-8000-000000000001";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => localStorage.setItem("intimo_age_verified", "true"));
  await context.route("**/api/auth/session", (r) => r.fulfill({ json: { provisioned: true, actor: { id: "u1", email: "member@example.test", role: "MEMBER", emailVerified: true } } }));
  await context.route("**/api/profile/me", (r) => r.fulfill({ json: { profile: { id: "p1", email: "member@example.test", display_name: "Adam", verification_status: "VERIFIED", account_status: "ACTIVE" } } }));
  await context.route("**/api/notifications**", (r) => r.fulfill({ json: { notifications: [], unreadCount: 0 } }));
  await context.route("**/api/profiles/*", (r) => r.fulfill({ json: { profile: { id: lena, displayName: "Lena", gender: "FEMALE", avatarUrl: "", isOnline: true }, ownership: { isOwner: false } } }));
  await context.route("**/api/profiles/*/approach", (r) => r.fulfill({ json: { canWrite: true, established: false, line: "Lena asks men to introduce themselves first.", explicitMediaInChat: "ASK_FIRST" } }));
  await context.route("**/api/profiles/*/desires", (r) => r.fulfill({ json: { desires: [], shared: ["slow-burn"] } }));
  await context.route("**/api/dating-ads**", (r) => r.fulfill({ json: { plans: [{ id: planId, title: "A late jazz set in Holešovice.", startsAt: "2026-10-19T20:30:00Z", expiresAt: "2026-10-19T23:00:00Z" }] } }));
});

test("replying to a plan: quote, shared interests, rules, openers and a plain composer", async ({ page }) => {
  let sent: Record<string, unknown> | null = null;
  await page.route("**/api/messages**", async (r) => {
    if (r.request().method() === "POST") { sent = r.request().postDataJSON(); return r.fulfill({ status: 201, json: { message: { id: "m1" } } }); }
    const url = new URL(r.request().url());
    return r.fulfill({ json: url.searchParams.get("peerId") ? { messages: [], pagination: {} } : { conversations: [], pagination: {} } });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/messages?user=${lena}&datingAd=${planId}`);
  const thread = page.getByRole("region", { name: "Conversation with Lena" });
  await expect(thread.getByText("Replying to her invitation · 22:30 until 01:00")).toBeVisible();
  await expect(thread.getByText(/You both list slow burn\./)).toBeVisible();
  await expect(thread.getByText(/Explicit photographs stay off until Lena replies\./)).toBeVisible();
  await expect(page.getByRole("region", { name: "Conversations" })).toBeHidden();

  // Explicit is unavailable before she replies.
  await thread.getByRole("button", { name: "Send a photo" }).click();
  await expect(thread.getByRole("checkbox", { name: /This photo is explicit/ })).toBeDisabled();

  // An opener fills the composer; nothing is sent until you choose to.
  await thread.getByRole("button", { name: /Room for one more/ }).click();
  await expect(thread.getByPlaceholder("Introduce yourself…")).toHaveValue(/Room for one more\?/);
  expect(sent).toBeNull();
  await thread.getByRole("button", { name: "Send", exact: true }).click();
  await expect.poll(() => sent).toMatchObject({ receiverId: lena, datingAdId: planId });

  // Hide openers and they stay hidden.
  await page.goto(`/messages?user=${lena}`);
  await page.getByRole("button", { name: "Hide" }).click();
  await page.reload();
  await expect(page.getByText("If you'd like a start")).toHaveCount(0);
});
