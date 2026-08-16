// 1. Manually parse .env.local before importing any application code
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  });
}

import test from "node:test";
import assert from "node:assert/strict";

test("Authentication & Authorization Flow Integration Tests", async (t) => {
  // Dynamically import TS modules to prevent hoisting execution before env is ready
  const { DestinationRouterService } = await import("../src/lib/auth/destinationRouter");
  const { UserSynchronizationService } = await import("../src/lib/auth0/userSync");
  const { userStore } = await import("../src/lib/auth0/userStore");
  const { TrustLevelEngine } = await import("../src/lib/auth/trustLevels");
  const { hasPermission } = await import("../src/lib/auth/permissions");
  const { validateApiRequest } = await import("../src/lib/auth/apiMiddleware");
  const { createUserAccount } = await import("../src/lib/auth/userModel");

  await t.test("1. Anonymous session returns unauthenticated/401 checks", async () => {
    const res = await validateApiRequest(null, { requireAuth: true });
    assert.equal(res.authorized, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.message, /authentication required/i);
  });

  await t.test("2. Unverified email authenticated state routes to /verify-email", () => {
    const sub = `auth0|temp_unverified_${Date.now()}`;
    const email = `unverified_${Date.now()}@intimo.live`;
    const user = UserSynchronizationService.syncAuth0User({
      sub,
      email,
      email_verified: false,
    });
    
    assert.equal(user.auth0_user_id, sub);
    assert.equal(user.profile_completed, false);
    assert.equal(user.email_verified, false);
    
    // Check destination routing for unverified email
    const destination = DestinationRouterService.getDestinationUrl(user);
    assert.equal(destination, "/verify-email");
  });

  await t.test("3. Verified email + uncompleted profile routes to /onboarding", () => {
    const sub = `auth0|temp_onboarding_${Date.now()}`;
    const email = `onboarding_${Date.now()}@intimo.live`;
    const user = UserSynchronizationService.syncAuth0User({
      sub,
      email,
      email_verified: true,
    });
    
    assert.equal(user.email_verified, true);
    assert.equal(user.profile_completed, false);
    
    // Check destination routing for verified email but uncompleted profile
    const destination = DestinationRouterService.getDestinationUrl(user);
    assert.equal(destination, "/onboarding");
  });

  await t.test("4. Provisioned authenticated state routes to dashboard", () => {
    const sub = `auth0|temp_provisioned_${Date.now()}`;
    const email = `provisioned_${Date.now()}@intimo.live`;
    const user = UserSynchronizationService.syncAuth0User({
      sub,
      email,
      email_verified: true,
    });
    
    // Complete onboarding
    UserSynchronizationService.markProfileCompleted(user.id);
    const completedUser = userStore.findById(user.id)!;
    assert.equal(completedUser.profile_completed, true);
    
    // Check routing destination
    const destination = DestinationRouterService.getDestinationUrl(completedUser);
    assert.equal(destination, "/dashboard");
  });

  await t.test("5. Repeated sync avoids duplicates (deduplication)", () => {
    const sub = `auth0|duplicate_check_${Date.now()}`;
    const email = `duplicate_check_${Date.now()}@intimo.live`;
    const user1 = UserSynchronizationService.syncAuth0User({ sub, email });
    const user2 = UserSynchronizationService.syncAuth0User({ sub, email });
    
    assert.equal(user1.id, user2.id);
  });

  await t.test("6. Account status enforcement blocks suspended accounts", async () => {
    const suspendedUser = createUserAccount({
      id: "usr-suspended-test",
      email: "suspended@intimo.live",
      role: "MEMBER",
      status: "SUSPENDED",
      account_status: "SUSPENDED",
      profile_completed: true,
      twoFactorEnabled: false,
      verificationStatus: "EMAIL_VERIFIED",
      creatorStatus: "NONE",
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferred_language: "en",
    });
    
    const res = await validateApiRequest(suspendedUser, { requireAuth: true });
    assert.equal(res.authorized, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.message, /restricted|suspended/i);
  });

  await t.test("7. God Mode & authorization role permissions", () => {
    // Normal user does not have admin permissions
    const normalUser = createUserAccount({
      id: "usr-normal",
      email: "normal@intimo.live",
      role: "MEMBER",
    });
    const hasAdminPerm = hasPermission(normalUser.role, "admin:system:manage");
    assert.equal(hasAdminPerm, false);

    // Admin user has admin permissions
    const adminUser = createUserAccount({
      id: "usr-admin",
      email: "admin@intimo.live",
      role: "SYSTEM_ADMIN",
    });
    const adminPerm = hasPermission(adminUser.role, "admin:system:manage");
    assert.equal(adminPerm, true);
  });

  await t.test("8. Trust level evaluation routing rules", () => {
    const unverifiedUser = createUserAccount({ id: "usr-unv", email: "unv@intimo.live", emailVerified: false });
    const verifiedUser = createUserAccount({ id: "usr-ver", email: "ver@intimo.live", emailVerified: true });
    
    const lvl1 = TrustLevelEngine.evaluateTrustLevel(unverifiedUser);
    const lvl2 = TrustLevelEngine.evaluateTrustLevel(verifiedUser);
    
    assert.equal(lvl1, 1);
    assert.equal(lvl2, 2);
  });
});
