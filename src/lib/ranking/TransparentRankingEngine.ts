import { Profile } from "@/types";

export class TransparentRankingEngine {
  /**
   * Calculates a transparent, deterministic ranking score (0-100) based on clear rules.
   */
  static calculateRankingScore(profile: Profile): { score: number; explanation: string } {
    let score = 0;
    const reasons: string[] = [];

    // 1. Verification Level (up to 30 pts)
    if (profile.verificationLevel === "LEVEL_4_CREATOR") {
      score += 30;
      reasons.push("Level 4 Creator Verified (+30)");
    } else if (profile.verificationLevel === "LEVEL_3_PROFILE_BIOMETRIC") {
      score += 25;
      reasons.push("Photo Verified (+25)");
    } else if (profile.verified) {
      score += 15;
      reasons.push("Verified Member (+15)");
    }

    // 2. Profile Completeness (up to 25 pts)
    let completeness = 0;
    if (profile.avatarUrl) completeness += 5;
    if (profile.bio && profile.bio.length > 20) completeness += 5;
    if (profile.interests && profile.interests.length >= 3) completeness += 5;
    if (profile.lifestyleTags && profile.lifestyleTags.length >= 2) completeness += 5;
    if (profile.headline) completeness += 5;
    score += completeness;
    if (completeness > 0) reasons.push(`High Profile Completeness (+${completeness})`);

    // 3. Online Recency (up to 20 pts)
    if (profile.isOnline) {
      score += 20;
      reasons.push("Active Online Now (+20)");
    } else {
      score += 10;
      reasons.push("Recent Member Activity (+10)");
    }

    // 4. Proximity / Distance (up to 15 pts)
    if (profile.distanceKm !== undefined && profile.distanceKm <= 20) {
      score += 15;
      reasons.push("Nearby Location (+15)");
    } else {
      score += 8;
    }

    // 5. Community Participation (up to 10 pts)
    if (profile.reputationBadge) {
      score += 10;
      reasons.push(`${profile.reputationBadge} Badge (+10)`);
    } else {
      score += 5;
    }

    return {
      score: Math.min(100, score),
      explanation: reasons.join(" • "),
    };
  }
}
