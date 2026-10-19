import { expect, test } from "@playwright/test";

// Real HTTP requests, no backend mocks and no member data mutations.
test.beforeAll(() => {
  if (!process.env.E2E_BASE_URL) throw new Error("E2E_BASE_URL is required; smoke cannot silently skip.");
});
test("deployment serves public data and protects member/admin endpoints", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain("Intimo");
  const community = await request.get("/api/public/community?limit=1");
  expect(community.status(), "real database-backed request").toBe(200);
  const data = await community.json();
  expect(Array.isArray(data.profiles)).toBe(true);
  expect(data.demoContentPresent).toBe(false);
  for (const path of ["/api/profile/me", "/api/discovery/profiles", "/api/messages", "/api/admin/overview"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
  }
  const age = await request.post("/api/access/age-declaration", { data: { adult: true } });
  expect(age.status(), "signed age cookie must work on this deployment").toBe(200);
  expect(age.headers()["set-cookie"]).toContain("intimo_age_declaration=");
});
