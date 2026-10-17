import type { ProfileRow } from "./profileService";

export type PublicProfileRow = Pick<
  ProfileRow,
  | "id"
  | "display_name"
  | "username"
  | "age"
  | "country"
  | "city"
  | "headline"
  | "bio"
  | "is_couple_profile"
  | "verification_status"
  | "verification_level"
  | "location_precision"
  | "show_online_status"
  | "last_active_at"
  | "created_at"
  | "is_demo"
>;

export interface AnonymousPublicProfile {
  id: string;
  slug: string;
  displayName: string;
  age?: number;
  country?: string;
  city?: string;
  location?: string;
  headline?: string;
  bio?: string;
  profileType: "COUPLE" | "INDIVIDUAL";
  verified: boolean;
  recentlyActive: boolean;
  joinedAt: string;
  isDemo: boolean;
}

function cleanPublicText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

export function toAnonymousPublicProfile(row: PublicProfileRow): AnonymousPublicProfile {
  const locationVisible = row.location_precision !== "HIDDEN";
  const country = locationVisible ? cleanPublicText(row.country, 80) : undefined;
  const city = locationVisible && row.location_precision === "CITY" ? cleanPublicText(row.city, 80) : undefined;
  const lastActive = row.last_active_at ? new Date(row.last_active_at).getTime() : 0;

  return {
    id: row.id,
    slug: cleanPublicText(row.username, 80) || row.id,
    displayName: cleanPublicText(row.display_name, 80) || "Intimo member",
    age: Number.isInteger(row.age) && row.age >= 18 ? row.age : undefined,
    country,
    city,
    location: [city, country].filter(Boolean).join(", ") || undefined,
    headline: cleanPublicText(row.headline, 160),
    bio: cleanPublicText(row.bio, 280),
    profileType: row.is_couple_profile ? "COUPLE" : "INDIVIDUAL",
    verified:
      row.verification_status === "VERIFIED" ||
      ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(row.verification_level || ""),
    recentlyActive:
      row.show_online_status === true &&
      Number.isFinite(lastActive) &&
      Date.now() - lastActive < 24 * 60 * 60 * 1000,
    joinedAt: row.created_at,
    isDemo: row.is_demo === true,
  };
}
