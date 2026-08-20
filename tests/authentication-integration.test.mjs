import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  deriveAccountState,
  destinationForAccountState,
  isProtectedMemberRoute,
  safeReturnTo,
} from "../src/lib/auth/accountState.mjs";
import { ageFromBirthDate, onboardingBasicsAreValid } from "../src/lib/onboardingPolicy.mjs";
import {
  OFFICIAL_INTIMO_AUTH0_ISSUER,
  validateProductionAuthConfiguration,
} from "../src/lib/auth0/configValidation.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

test("canonical authentication states and destinations", async (t) => {
  await t.test("anonymous visitors remain anonymous", () => {
    assert.equal(deriveAccountState({ authenticated: false }), "ANONYMOUS");
    assert.equal(destinationForAccountState("ANONYMOUS"), "/");
  });
  await t.test("unverified identities must verify email", () => {
    const state = deriveAccountState({ authenticated: true, provisioned: false, emailVerified: false });
    assert.equal(state, "EMAIL_VERIFICATION_REQUIRED");
    assert.equal(destinationForAccountState(state), "/verify-email");
  });
  await t.test("verified identities without profiles must onboard", () => {
    const state = deriveAccountState({ authenticated: true, provisioned: false, emailVerified: true });
    assert.equal(state, "ONBOARDING_REQUIRED");
    assert.equal(destinationForAccountState(state), "/onboarding");
  });
  await t.test("active returning members reach their safe destination", () => {
    const state = deriveAccountState({ authenticated: true, provisioned: true, accountStatus: "ACTIVE" });
    assert.equal(state, "ACTIVE");
    assert.equal(destinationForAccountState(state), "/dashboard");
    assert.equal(destinationForAccountState(state, "/messages?thread=123"), "/messages?thread=123");
  });
  await t.test("suspended and restricted accounts fail closed", () => {
    for (const accountStatus of ["SUSPENDED", "RESTRICTED", "DELETED", undefined]) {
      const state = deriveAccountState({ authenticated: true, provisioned: true, accountStatus });
      assert.equal(state, "RESTRICTED");
      assert.equal(destinationForAccountState(state), "/account-restricted");
    }
  });
  await t.test("authorization-service failures fail closed", () => {
    assert.equal(deriveAccountState({ authenticated: true, available: false }), "ERROR");
  });
});

test("return destinations reject open redirects", () => {
  assert.equal(safeReturnTo("/dashboard"), "/dashboard");
  assert.equal(safeReturnTo("https://evil.example"), null);
  assert.equal(safeReturnTo("//evil.example/path"), null);
  assert.equal(safeReturnTo("/\\evil.example"), null);
  assert.equal(safeReturnTo("/dashboard\r\nLocation: https://evil.example"), null);
});

test("member-only route classification covers sensitive screens", () => {
  for (const route of ["/dashboard", "/messages", "/messages/abc", "/settings", "/albums/manage", "/dating/create", "/admin", "/admin/users"]) {
    assert.equal(isProtectedMemberRoute(route), true, route);
  }
  for (const route of ["/", "/people", "/dating", "/photos", "/terms"]) {
    assert.equal(isProtectedMemberRoute(route), false, route);
  }
});

test("onboarding enforces nickname, valid birth date and 18+ boundary", () => {
  const today = new Date(2026, 7, 20);
  assert.equal(ageFromBirthDate("2008-08-20", today), 18);
  assert.equal(ageFromBirthDate("2008-08-21", today), 17);
  assert.equal(ageFromBirthDate("2024-02-31", today), null);
  assert.equal(onboardingBasicsAreValid("Adult member", "2008-08-20", today), true);
  assert.equal(onboardingBasicsAreValid("Adult member", "2008-08-21", today), false);
  assert.equal(onboardingBasicsAreValid(" ", "1990-01-01", today), false);
});

test("production authentication accepts only the approved Intimo Auth0 issuer", () => {
  const complete = {
    AUTH0_SECRET: "set",
    AUTH0_CLIENT_ID: "set",
    AUTH0_CLIENT_SECRET: "set",
    AUTH0_ISSUER_BASE_URL: `${OFFICIAL_INTIMO_AUTH0_ISSUER}/`,
  };
  assert.deepEqual(validateProductionAuthConfiguration(complete), {
    valid: true,
    missing: [],
    issuerValid: true,
  });
  assert.equal(validateProductionAuthConfiguration({ ...complete, AUTH0_ISSUER_BASE_URL: "https://wrong.eu.auth0.com" }).valid, false);
  assert.equal(validateProductionAuthConfiguration({ ...complete, AUTH0_CLIENT_SECRET: "" }).valid, false);
  assert.equal(validateProductionAuthConfiguration({ ...complete, AUTH0_ISSUER_BASE_URL: "http://intimo.eu.auth0.com" }).valid, false);
});

test("production boundaries consume the canonical policies", async () => {
  const sessionRoute = await fs.readFile(path.join(root, "src/app/api/auth/session/route.ts"), "utf8");
  const authContext = await fs.readFile(path.join(root, "src/context/AuthContext.tsx"), "utf8");
  const onboarding = await fs.readFile(path.join(root, "src/app/onboarding/page.tsx"), "utf8");
  const adminLayout = await fs.readFile(path.join(root, "src/app/admin/layout.tsx"), "utf8");
  const onboardingLayout = await fs.readFile(path.join(root, "src/app/onboarding/layout.tsx"), "utf8");
  const settingsLayout = await fs.readFile(path.join(root, "src/app/settings/layout.tsx"), "utf8");
  assert.match(sessionRoute, /deriveAccountState/);
  assert.match(sessionRoute, /accountState === "RESTRICTED"/);
  assert.match(authContext, /destinationForAccountState/);
  assert.match(authContext, /response\.status === 403/);
  assert.match(onboarding, /onboardingBasicsAreValid/);
  assert.match(adminLayout, /resolveServerActor/);
  assert.match(adminLayout, /redirect\("\/auth\/login\?returnTo=%2Fadmin"\)/);
  assert.match(onboardingLayout, /resolveServerActor/);
  assert.match(onboardingLayout, /returnTo=%2Fonboarding/);
  assert.match(onboardingLayout, /currentEmailVerification/);
  assert.match(settingsLayout, /resolveServerActor/);
  assert.match(settingsLayout, /returnTo=%2Fsettings/);
  assert.match(settingsLayout, /account-restricted/);
});
