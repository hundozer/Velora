import type { SupabaseClient } from "@supabase/supabase-js";

export const DESIRE_CONSENT_TYPE = "SPECIAL_CATEGORY_DESIRES";
export const DESIRE_CONSENT_VERSION = "desires-v1";

/** True when the member's most recent desire consent record is GRANTED. */
export async function hasDesireConsent(db: SupabaseClient, profileId: string): Promise<boolean | null> {
  const { data, error } = await db
    .from("user_consents")
    .select("consent_status")
    .eq("profile_id", profileId)
    .eq("consent_type", DESIRE_CONSENT_TYPE)
    .order("consent_timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.consent_status === "GRANTED";
}
