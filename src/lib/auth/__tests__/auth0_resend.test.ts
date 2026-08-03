import { UserSynchronizationService } from "../../auth0/userSync";
import { DestinationRouterService } from "../destinationRouter";
import { EmailNotificationService } from "../../notifications/emailService";
import { JwtValidatorService } from "../../auth0/tokenValidator";
import { validateApiRequest } from "../apiMiddleware";
import { userStore } from "../../auth0/userStore";

async function runAuth0ResendVerificationSuite() {
  console.log("\n========================================================");
  console.log("INTIMO AUTH0 + RESEND SECURITY & INFRASTRUCTURE TEST SUITE");
  console.log("========================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Auth0 User Registration & Deduplication Sync
  // ----------------------------------------------------
  const sub1 = `auth0|test_user_${Date.now()}`;
  const email1 = `test_registrant_${Date.now()}@intimo.live`;

  const user1 = UserSynchronizationService.syncAuth0User({
    sub: sub1,
    email: email1,
    email_verified: false,
  });

  assert(user1.auth0_user_id === sub1, "1.1 Auth0 ID correctly attached to Intimo user account");
  assert(user1.profile_completed === false, "1.2 New registrant starts with profile_completed = false");
  assert(user1.email_verified === false, "1.3 Email verified is false initially");

  // Re-syncing same sub should not create duplicate
  const user1Resync = UserSynchronizationService.syncAuth0User({
    sub: sub1,
    email: email1,
    email_verified: true,
  });
  assert(user1Resync.id === user1.id, "1.4 Re-syncing Auth0 identity returns identical local account ID (No duplicates)");
  assert(user1Resync.email_verified === true, "1.5 Email verified status updated upon Auth0 verification");

  // ----------------------------------------------------
  // TEST 2: Non-Enterprise Destination Routing Engine
  // ----------------------------------------------------
  const destNewUser = DestinationRouterService.getDestinationUrl(user1);
  assert(destNewUser === "/onboarding", "2.1 Uncompleted profile routes to /onboarding");

  UserSynchronizationService.markProfileCompleted(user1.id);
  const user1Completed = userStore.findById(user1.id)!;
  const destCompletedUser = DestinationRouterService.getDestinationUrl(user1Completed);
  assert(destCompletedUser === "/dashboard", "2.2 Completed profile routes to /dashboard");

  const creatorUser = UserSynchronizationService.syncAuth0User({
    sub: `auth0|creator_${Date.now()}`,
    email: `creator_${Date.now()}@intimo.live`,
    email_verified: true,
  });
  creatorUser.role = "CREATOR";
  creatorUser.creatorStatus = "APPLICANT";
  creatorUser.profile_completed = true;
  userStore.save(creatorUser);
  const destCreator = DestinationRouterService.getDestinationUrl(creatorUser);
  assert(destCreator === "/creator-studio", "2.3 Unapproved creator routes to /creator-studio");

  // ----------------------------------------------------
  // TEST 3: Resend Email Templates & Dispatch Engine
  // ----------------------------------------------------
  const welcomeLog = await EmailNotificationService.sendWelcomeEmail("welcome_user@intimo.live");
  assert(welcomeLog.subject.includes("Welcome to Intimo"), "3.1 Welcome email contains Intimo subject");
  assert(welcomeLog.bodyHtml.includes("Complete Your Intimo Profile"), "3.2 Welcome email contains onboarding CTA");

  const verifyLog = EmailNotificationService.sendVerificationEmail("verify_user@intimo.live", "test_tok_99");
  assert(verifyLog.subject.includes("Confirm Your Intimo Account Email"), "3.3 Email verification contains Intimo subject");
  assert(verifyLog.confirmationLink!.includes("verify-email?token=test_tok_99"), "3.4 Verification link includes token");

  const resetLog = await EmailNotificationService.sendPasswordResetEmail("reset_user@intimo.live", "https://intimo.live/reset");
  assert(resetLog.subject.includes("Reset Your Intimo Password"), "3.5 Password reset email subject matches");

  const alertLog = await EmailNotificationService.sendSecurityNotificationEmail("alert_user@intimo.live", "New Device Login", "Login from IP 192.168.1.1");
  assert(alertLog.subject.includes("Security Alert"), "3.6 Security alert email rendered cleanly");

  // ----------------------------------------------------
  // TEST 4: JWT Token Security Validation
  // ----------------------------------------------------
  const invalidJwt = JwtValidatorService.validateAuth0Token("Bearer invalid.fake.token");
  assert(invalidJwt.isValid === false, "4.1 Malformed/fake JWT token rejected");

  const missingJwt = JwtValidatorService.validateAuth0Token(undefined);
  assert(missingJwt.isValid === false && missingJwt.statusCode === 401, "4.2 Missing Authorization header rejected with 401");

  // ----------------------------------------------------
  // TEST 5: Suspended User Access Rejection
  // ----------------------------------------------------
  const suspendedUser = UserSynchronizationService.syncAuth0User({
    sub: `auth0|suspended_${Date.now()}`,
    email: `suspended_${Date.now()}@intimo.live`,
    email_verified: true,
  });
  suspendedUser.status = "SUSPENDED";
  suspendedUser.account_status = "SUSPENDED";
  userStore.save(suspendedUser);

  const suspendedCheck = await validateApiRequest(suspendedUser, {
    requireAuth: true,
  });
  assert(suspendedCheck.authorized === false && suspendedCheck.message.includes("SUSPENDED"), "5.1 Suspended user blocked from API access");

  // ----------------------------------------------------
  // TEST 6: IDOR Cross-User Ownership Isolation
  // ----------------------------------------------------
  const userA = userStore.save({ ...user1, id: "usr_alice" });
  const idorCheck = await validateApiRequest(userA, {
    requireAuth: true,
    ownershipCheck: (_, current) => current.id === "usr_bob",
  });
  assert(idorCheck.authorized === false && idorCheck.statusCode === 403, "6.1 IDOR attempt to access another user resource blocked with 403");

  console.log("\n========================================================");
  console.log(`TEST SUITE COMPLETE: Passed ${passed} / ${passed + failed} Tests`);
  console.log("========================================================\n");

  if (failed > 0) {
    throw new Error(`${failed} tests failed!`);
  }
}

// Run test if invoked directly
if (require.main === module) {
  runAuth0ResendVerificationSuite().catch((err) => {
    console.error("Test Suite Execution Failed:", err);
    process.exit(1);
  });
}

export { runAuth0ResendVerificationSuite };
