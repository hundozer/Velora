import { supabase } from "./client";
import { User, Profile } from "@/types";

// ── Database Row Type ──────────────────────────────────────
export interface ProfileRow {
  id: string;
  auth_id: string;
  email: string;
  display_name: string;
  username: string | null;
  role: string;
  member_tier: string;
  verification_status: string;
  verification_level: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  date_of_birth: string | null;
  age: number;
  gender: string;
  sexual_orientation: string;
  country: string;
  city: string;
  location: string;
  languages: string[];
  headline: string | null;
  bio: string | null;
  interests: string[];
  lifestyle_tags: string[];
  hobbies: string[];
  relationship_status: string;
  looking_for: string[];
  is_couple_profile: boolean;
  partner_display_name: string | null;
  partner_age: number | null;
  partner_gender: string | null;
  pubic_hair_grooming: string | null;
  piercing: string | null;
  tattoo: string | null;
  erogenous_zones: string[];
  favourite_sex_places: string[];
  favourite_sex_positions: string[];
  sex_hobbies: string[];
  categories: string[];
  monthly_subscription_price: number | null;
  followers_count: number;
  subscribers_count: number;
  total_content_count: number;
  public_profile_visibility: boolean;
  photo_visibility_default: string;
  location_precision: string;
  show_online_status: boolean;
  show_distance: boolean;
  allow_direct_messages: boolean;
  require_verification_to_message: boolean;
  gallery_images: any[];
  created_at: string;
  updated_at: string;
  age_verification_status?: string;
  age_verified_at?: string | null;
  age_verification_method?: string | null;
  profile_visibility?: string;
  sensitive_fields_visibility?: string;
  message_permission?: string;
  account_status?: string;
  discovery_disabled?: boolean;
  last_active_at?: string | null;
}

// ── Converters ─────────────────────────────────────────────

export function dbRowToUser(row: ProfileRow): User {
  return {
    id: row.auth_id,
    email: row.email,
    username: row.username || row.display_name,
    role: row.role as any,
    memberTier: row.member_tier as any,
    verificationStatus: row.verification_status as any,
    verificationLevel: row.verification_level as any,
    createdAt: row.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    avatarUrl: row.avatar_url || undefined,
  };
}

export function dbRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.auth_id,
    displayName: row.display_name,
    dateOfBirth: row.date_of_birth || undefined,
    age: row.age,
    gender: row.gender as any,
    sexualOrientation: row.sexual_orientation as any,
    country: row.country,
    city: row.city,
    location: row.location,
    languages: row.languages || ["English"],
    headline: row.headline || undefined,
    bio: row.bio || "Private member profile.",
    interests: row.interests || [],
    lifestyleTags: row.lifestyle_tags || [],
    hobbies: row.hobbies || [],
    relationshipStatus: row.relationship_status as any,
    lookingFor: row.looking_for || ["Connections"],
    isCoupleProfile: row.is_couple_profile,
    partnerDisplayName: row.partner_display_name || undefined,
    partnerAge: row.partner_age || undefined,
    partnerGender: row.partner_gender as any,
    pubicHairGrooming: row.pubic_hair_grooming as any,
    piercing: row.piercing as any,
    tattoo: row.tattoo as any,
    erogenousZones: row.erogenous_zones || [],
    favouriteSexPlaces: row.favourite_sex_places || [],
    favouriteSexPositions: row.favourite_sex_positions || [],
    sexHobbies: row.sex_hobbies || [],
    categories: row.categories || [],
    monthlySubscriptionPrice: row.monthly_subscription_price || undefined,
    followersCount: row.followers_count,
    subscribersCount: row.subscribers_count,
    totalContentCount: row.total_content_count,
    publicProfileVisibility: row.public_profile_visibility,
    photoVisibilityDefault: row.photo_visibility_default as any,
    locationPrecision: row.location_precision as any,
    showOnlineStatus: row.show_online_status,
    showDistance: row.show_distance,
    allowDirectMessages: row.allow_direct_messages,
    requireVerificationToMessage: row.require_verification_to_message,
    verified: row.verification_status === "VERIFIED",
    isOnline: true,
    compatibilityScore: 90,
    avatarUrl: row.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    coverPhotoUrl: row.cover_photo_url || undefined,
    galleryImages: row.gallery_images || [],
  };
}

export function profileToDbRow(authId: string, email: string, profile: Partial<Profile>, user?: Partial<User>): Partial<ProfileRow> {
  const row: Partial<ProfileRow> = {
    auth_id: authId,
    email: email,
  };

  if (profile.displayName !== undefined) row.display_name = profile.displayName;
  if (user?.username !== undefined) row.username = user.username;
  if (user?.role !== undefined) row.role = user.role;
  if (user?.memberTier !== undefined) row.member_tier = user.memberTier;
  if (user?.verificationStatus !== undefined) row.verification_status = user.verificationStatus;
  if (user?.verificationLevel !== undefined) row.verification_level = user.verificationLevel;
  if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl;
  if (profile.coverPhotoUrl !== undefined) row.cover_photo_url = profile.coverPhotoUrl;
  if (profile.dateOfBirth !== undefined) row.date_of_birth = profile.dateOfBirth;
  if (profile.age !== undefined) row.age = profile.age;
  if (profile.gender !== undefined) row.gender = profile.gender;
  if (profile.sexualOrientation !== undefined) row.sexual_orientation = profile.sexualOrientation;
  if (profile.country !== undefined) row.country = profile.country;
  if (profile.city !== undefined) row.city = profile.city;
  if (profile.location !== undefined) row.location = profile.location;
  if (profile.languages !== undefined) row.languages = profile.languages;
  if (profile.headline !== undefined) row.headline = profile.headline;
  if (profile.bio !== undefined) row.bio = profile.bio;
  if (profile.interests !== undefined) row.interests = profile.interests;
  if (profile.lifestyleTags !== undefined) row.lifestyle_tags = profile.lifestyleTags;
  if (profile.hobbies !== undefined) row.hobbies = profile.hobbies;
  if (profile.relationshipStatus !== undefined) row.relationship_status = profile.relationshipStatus;
  if (profile.lookingFor !== undefined) row.looking_for = profile.lookingFor;
  if (profile.isCoupleProfile !== undefined) row.is_couple_profile = profile.isCoupleProfile;
  if (profile.partnerDisplayName !== undefined) row.partner_display_name = profile.partnerDisplayName;
  if (profile.partnerAge !== undefined) row.partner_age = profile.partnerAge;
  if (profile.partnerGender !== undefined) row.partner_gender = profile.partnerGender;
  if (profile.pubicHairGrooming !== undefined) row.pubic_hair_grooming = profile.pubicHairGrooming;
  if (profile.piercing !== undefined) row.piercing = profile.piercing;
  if (profile.tattoo !== undefined) row.tattoo = profile.tattoo;
  if (profile.erogenousZones !== undefined) row.erogenous_zones = profile.erogenousZones;
  if (profile.favouriteSexPlaces !== undefined) row.favourite_sex_places = profile.favouriteSexPlaces;
  if (profile.favouriteSexPositions !== undefined) row.favourite_sex_positions = profile.favouriteSexPositions;
  if (profile.sexHobbies !== undefined) row.sex_hobbies = profile.sexHobbies;
  if (profile.publicProfileVisibility !== undefined) row.public_profile_visibility = profile.publicProfileVisibility;
  if (profile.photoVisibilityDefault !== undefined) row.photo_visibility_default = profile.photoVisibilityDefault;
  if (profile.locationPrecision !== undefined) row.location_precision = profile.locationPrecision;
  if (profile.showOnlineStatus !== undefined) row.show_online_status = profile.showOnlineStatus;
  if (profile.showDistance !== undefined) row.show_distance = profile.showDistance;
  if (profile.allowDirectMessages !== undefined) row.allow_direct_messages = profile.allowDirectMessages;
  if (profile.requireVerificationToMessage !== undefined) row.require_verification_to_message = profile.requireVerificationToMessage;
  if (profile.galleryImages !== undefined) row.gallery_images = profile.galleryImages;

  return row;
}

// ── Service Functions ──────────────────────────────────────

export async function getProfileByAuthId(authId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_id", authId)
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as ProfileRow, error: null };
}

export async function getProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as ProfileRow, error: null };
}

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as ProfileRow, error: null };
}

export async function upsertProfile(authId: string, email: string, profileData: Partial<ProfileRow>) {
  const row = {
    auth_id: authId,
    email: email.toLowerCase().trim(),
    display_name: profileData.display_name || email.split("@")[0],
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "auth_id" })
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as ProfileRow, error: null };
}

export async function updateProfile(profileId: string, updates: Partial<ProfileRow>) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as ProfileRow, error: null };
}

export async function deleteProfileByAuthId(authId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .delete()
    .eq("auth_id", authId);

  return { data, error };
}
