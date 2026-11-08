import { redirect } from "next/navigation";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { FoundingMemberHub } from "@/components/community/FoundingMemberHub";

export const dynamic = "force-dynamic";

export default async function FoundingMemberPage() {
  const result = await resolveServerActor();
  if (result.status === "unauthenticated") redirect("/login");
  if (result.status !== "authenticated" || result.actor.accountStatus !== "ACTIVE" || !result.actor.emailVerified) redirect("/me");
  const db = getServerSupabase();
  if (!db) redirect("/me");
  const { data } = await db.from("profiles")
    .select("membership_level,account_lifecycle_status")
    .eq("id", result.actor.profileId).maybeSingle();
  if (data?.membership_level !== "FOUNDING_MEMBER" || (data.account_lifecycle_status && data.account_lifecycle_status !== "ACTIVE")) redirect("/me");
  return <FoundingMemberHub />;
}
