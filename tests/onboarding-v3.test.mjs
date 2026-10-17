import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanFirstMessagePermission,
  cleanLookingFor,
  relationshipOptionsFor,
  whoIsHereError,
} from "../src/lib/onboardingPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const today = new Date(2026, 7, 20);

test("individuals need an identity and a relationship structure", () => {
  assert.equal(whoIsHereError({ profileType: "SINGLE", gender: "FEMALE", relationshipStatus: "SINGLE" }, today), null);
  assert.match(whoIsHereError({ profileType: "", gender: "FEMALE", relationshipStatus: "SINGLE" }, today), /individual or couple/);
  assert.match(whoIsHereError({ profileType: "SINGLE", gender: "COUPLE_MF", relationshipStatus: "SINGLE" }, today), /who this profile is/);
  assert.match(whoIsHereError({ profileType: "SINGLE", gender: "MALE", relationshipStatus: "SWINGER" }, today), /how you relate/);
});

test("couples require an adult partner", () => {
  const couple = { profileType: "COUPLE", gender: "COUPLE_MF", relationshipStatus: "SWINGER", partnerDisplayName: "Eva" };
  assert.equal(whoIsHereError({ ...couple, partnerDateOfBirth: "2008-08-20" }, today), null);
  assert.match(whoIsHereError({ ...couple, partnerDateOfBirth: "2008-08-21" }, today), /18 or older/);
  assert.match(whoIsHereError({ ...couple, partnerDateOfBirth: "" }, today), /partner's date of birth/);
  assert.match(whoIsHereError({ ...couple, partnerDisplayName: " ", partnerDateOfBirth: "1990-01-01" }, today), /partner's nickname/);
  assert.ok(relationshipOptionsFor("COUPLE").every((item) => item.value !== "SINGLE"));
});

test("looking-for and message permission accept only known values", () => {
  assert.deepEqual(cleanLookingFor(["DATES", "KINK", "DATES", "VIP", 3]), ["DATES", "KINK"]);
  assert.deepEqual(cleanLookingFor("DATES"), []);
  assert.equal(cleanFirstMessagePermission("PRIVATE"), "PRIVATE");
  assert.equal(cleanFirstMessagePermission("EVERYONE"), "MEMBERS_ONLY");
});

test("profile creation enforces onboarding v3 server-side and keeps only the partner's age", async () => {
  const route = await read("src/app/api/profile/me/route.ts");
  assert.match(route, /const whoError = whoIsHereError\(/);
  assert.match(route, /if \(isCouple && \(partnerAge === null \|\| partnerAge < 18\)\)/);
  assert.match(route, /partner_age: partnerAge,/);
  assert.doesNotMatch(route, /partner_date_of_birth/);
  assert.match(route, /looking_for: cleanLookingFor\(body\.lookingFor\)/);
  assert.match(route, /message_permission: cleanFirstMessagePermission\(body\.messagePermission\)/);
  assert.doesNotMatch(route, /"CREATOR", "LIFESTYLE"/);
});

test("wizard has five steps ending in an optional first photo", async () => {
  const page = await read("src/app/onboarding/page.tsx");
  assert.match(page, /const TOTAL_STEPS = 5;/);
  assert.match(page, /uploadFileToR2\(file, "avatars"/);
  assert.match(page, /Skip for now/);
  assert.match(page, /whoIsHereError\(/);
});
