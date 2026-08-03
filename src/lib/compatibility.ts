import { Profile, Preferences } from "@/types";

export interface CompatibilityFactors {
  score: number;
  sharedInterests: string[];
  sharedLookingFor: string[];
  locationMatch: boolean;
}

/**
 * Calculates a lifestyle compatibility score between two Velora profiles.
 */
export function calculateCompatibility(
  myProfile: Partial<Profile>,
  targetProfile: Profile
): CompatibilityFactors {
  let points = 50; // Base score

  // 1. Shared Interests Match (Max 25 pts)
  const myInterests = myProfile.interests || [];
  const sharedInterests = targetProfile.interests.filter((i) =>
    myInterests.some((m) => m.toLowerCase() === i.toLowerCase())
  );
  points += Math.min(sharedInterests.length * 8, 25);

  // 2. Shared Looking For Intent (Max 20 pts)
  const myLookingFor = myProfile.lookingFor || [];
  const sharedLookingFor = targetProfile.lookingFor.filter((l) =>
    myLookingFor.some((m) => m.toLowerCase() === l.toLowerCase())
  );
  points += Math.min(sharedLookingFor.length * 7, 20);

  // 3. Location / Proximity (Max 10 pts)
  const myCountry = (myProfile.country || "Monaco").toLowerCase();
  const targetCountry = (targetProfile.country || "Monaco").toLowerCase();
  const locationMatch = myCountry === targetCountry;
  if (locationMatch) {
    points += 10;
  }

  // 4. Verification Bonus (+5 pts)
  if (targetProfile.verified) {
    points += 5;
  }

  const finalScore = Math.min(Math.max(points, 65), 98); // Clamp between 65% and 98%

  return {
    score: finalScore,
    sharedInterests,
    sharedLookingFor,
    locationMatch,
  };
}
