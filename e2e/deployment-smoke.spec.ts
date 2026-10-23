import { expect, test } from "@playwright/test";

// Real HTTP requests, no backend mocks and no member data mutations.
test.beforeAll(() => {
  if (!process.env.E2E_BASE_URL) throw new Error("E2E_BASE_URL is required; smoke cannot silently skip.");
});
test("deployment serves public data and protects member/admin endpoints", async ({ request }) => {
  const home = await request.get("/", { maxRedirects: 0 });
  const redirect = home.headers().location ? new URL(home.headers().location, process.env.E2E_BASE_URL) : null;
  const accessDetail = redirect ? `redirect to ${redirect.origin}${redirect.pathname}` : (home.headers()["x-vercel-error"] || "no redirect");
  expect(home.status(), `Preview access must reach Intimo directly (${accessDetail})`).toBe(200);
  expect((await home.text()).includes("Intimo"), "homepage must be the application").toBe(true);
  const community = await request.get("/api/public/community?limit=1", { maxRedirects: 0 });
  expect(community.status(), "real database-backed request").toBe(200);
  const data = await community.json();
  expect(Array.isArray(data.profiles)).toBe(true);
  expect(data.demoContentPresent).toBe(false);
  for (const path of ["/api/profile/me", "/api/discovery/profiles", "/api/messages", "/api/admin/overview", "/api/admin/albums/12345678-1234-4123-8123-123456789012/photos", "/api/admin/media/12345678-1234-4123-8123-123456789012/preview"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(401);
  }
  const age = await request.post("/api/access/age-declaration", { data: { adult: true }, maxRedirects: 0 });
  expect(age.status(), "signed age cookie must work on this deployment").toBe(200);
  expect(age.headers()["set-cookie"]).toContain("intimo_age_declaration=");
});
