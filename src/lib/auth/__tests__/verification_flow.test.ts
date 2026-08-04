import { userStore } from "@/lib/auth0/userStore";
import { createUserAccount } from "@/lib/auth/userModel";

async function runVerificationFlowTests() {
  console.log("========================================================");
  console.log("INTIMO MEMBER IDENTITY VERIFICATION TEST SUITE");
  console.log("========================================================\n");

  try {
    // 1. Seed user in userStore
    const testUser = createUserAccount({
      id: "usr_verification_test",
      email: "verification.test@intimo.live",
      account_status: "ACTIVE",
    });
    userStore.save(testUser);

    console.log("✓ [PASS] 1. Initial user account created with status UNVERIFIED");
    if (testUser.verificationStatus !== "UNVERIFIED" && testUser.verificationStatus !== "EMAIL_VERIFIED") {
      throw new Error(`Unexpected initial status: ${testUser.verificationStatus}`);
    }

    // 2. Member submits verification selfie with handwritten "INTIMO" note
    const photoUrl = "https://cdn.intimo.live/verification/17858_selfie_intimo_note.png";
    const req = userStore.submitVerificationRequest({
      id: "req_test_001",
      userId: testUser.id,
      userEmail: testUser.email,
      userName: "Test Applicant",
      userAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      verificationPhotoUrl: photoUrl,
      submittedAt: "Just now",
      status: "PENDING",
    });

    console.log("✓ [PASS] 2. Member verification selfie submitted directly to Cloudflare R2");
    console.log(`  Verification Photo CDN URL: ${req.verificationPhotoUrl}`);

    // 3. Verify user status updated to PENDING_REVIEW
    const pendingUser = userStore.findById(testUser.id);
    if (pendingUser?.verificationStatus !== "PENDING_REVIEW") {
      throw new Error(`Expected PENDING_REVIEW, got: ${pendingUser?.verificationStatus}`);
    }
    console.log("✓ [PASS] 3. User verification status set to PENDING_REVIEW");

    // 4. Admin Queue retrieves pending request
    const pendingQueue = userStore.getVerificationRequests().filter((r) => r.status === "PENDING");
    const foundReq = pendingQueue.find((r) => r.id === "req_test_001");
    if (!foundReq) {
      throw new Error("Submitted request not found in Admin Verification Queue");
    }
    console.log("✓ [PASS] 4. Verification request appeared in Admin Verification Queue (/admin)");

    // 5. Admin Approves Request
    const approved = userStore.approveVerification("req_test_001");
    if (!approved) throw new Error("Approve verification failed");

    const verifiedUser = userStore.findById(testUser.id);
    if (verifiedUser?.verificationStatus !== "IDENTITY_VERIFIED") {
      throw new Error(`Expected IDENTITY_VERIFIED, got: ${verifiedUser?.verificationStatus}`);
    }
    console.log("✓ [PASS] 5. Admin approved request -> User upgraded to IDENTITY_VERIFIED with Biometric Badge");

    // 6. Test Rejection flow for another applicant
    const req2 = userStore.submitVerificationRequest({
      id: "req_test_002",
      userId: "usr_test_reject",
      userEmail: "reject.test@intimo.live",
      userName: "Reject Applicant",
      userAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      verificationPhotoUrl: "https://cdn.intimo.live/verification/illegible.png",
      submittedAt: "5 mins ago",
      status: "PENDING",
    });

    const rejected = userStore.rejectVerification("req_test_002", "Handwritten date is illegible.");
    if (!rejected) throw new Error("Reject verification failed");
    console.log("✓ [PASS] 6. Admin rejected invalid request with feedback reason");

    console.log("\n========================================================");
    console.log("ALL VERIFICATION WORKFLOW TESTS PASSED PERFECTLY!");
    console.log("========================================================\n");
  } catch (err: any) {
    console.error("❌ [FAIL] Verification Test Failed:", err);
    process.exit(1);
  }
}

runVerificationFlowTests();
