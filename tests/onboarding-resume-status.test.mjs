import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("provisioned member resumes at age check, not the member dashboard", () => {
  const layout = read("src/app/onboarding/layout.tsx");
  assert.match(layout, /result\.actor\.accountStatus !== "ACTIVE"/);
  assert.match(layout, /result\.actor\.ageVerificationStatus === "AGE_VERIFIED" \? "\/dashboard" : "\/verify-age"/);
  assert.match(layout, /!result\.identity\.emailVerified/);
});

test("missing invitation never leads to collecting sensitive answers or bypassing server invite redemption", () => {
  const wizard = read("src/app/onboarding/page.tsx");
  const api = read("src/app/api/profile/me/route.ts");
  assert.match(wizard, /validInviteLink = \/\^\[a-zA-Z0-9_-\]\{43\}\$\//);
  assert.match(wizard, /if \(!validInviteLink\) return/);
  assert.match(wizard, /Open your invitation to continue/);
  assert.match(wizard, /Intimo doesn't keep unfinished personal answers on this device/);
  assert.match(wizard, /inviteToken,/);
  assert.match(api, /is_member_invite_valid/);
  assert.match(api, /redeem_member_invite/);
  assert.doesNotMatch(wizard, /sessionStorage|localStorage|indexedDB/);
});

test("pending age review survives page leave, gives honest status and an explicit refresh", () => {
  const page = read("src/app/verify-age/page.tsx");
  const api = read("src/app/api/age-check/route.ts");
  assert.match(page, /check\.state === "PENDING"/);
  assert.match(page, /You can leave and come back later/);
  assert.match(page, /Check review status/);
  assert.match(page, /refreshStatus\(\)/);
  assert.match(page, /checkingStatus/);
  assert.match(page, /We cannot guarantee an exact review time/);
  assert.doesNotMatch(page, /usually takes less than a day/);
  assert.match(api, /memberAgeCheckState\(row\.age_verification_status\)/);
  assert.match(api, /"Cache-Control": "private, no-store"/);
});

test("verification status does not grant community access while pending or self-declared", () => {
  const age = read("src/lib/auth/ageCheck.mjs");
  const actor = read("src/lib/auth/serverActor.ts");
  assert.match(actor, /return hasVerifiedAccess\(actor\)/);
  assert.match(age, /AGE_VERIFIED/);
  assert.match(age, /PENDING/);
});

test("Czech copy covers all new onboarding and verification states", () => {
  const cs = JSON.parse(read("src/locales/cs/phrases.json"));
  for (const key of [
    "Finish joining Intimo",
    "Open your invitation to continue",
    "Your age check is waiting for manual review. You cannot use the community until it is approved. We cannot guarantee an exact review time.",
    "Check review status",
    "Checking status…",
  ]) assert.ok(cs[key], key);
});
