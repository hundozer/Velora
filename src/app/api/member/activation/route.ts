import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

// Read-only, first-party activation signals. Never infer engagement from a page view.
export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated" || actor.actor.accountStatus !== "ACTIVE") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401, headers });
  }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers });
  const id = actor.actor.profileId;
  const [profile, sentMessages, sentInterests] = await Promise.all([
    db.from("profiles").select("id,created_at,avatar_url,looking_for,account_status")
      .eq("id", id).maybeSingle(),
    db.from("direct_messages").select("id", { count: "exact", head: true })
      .eq("sender_id", id).limit(1),
    db.from("interests").select("from_id", { count: "exact", head: true })
      .eq("from_id", id).limit(1),
  ]);
  if (profile.error || sentMessages.error || sentInterests.error || !profile.data || profile.data.account_status !== "ACTIVE") {
    return NextResponse.json({ error: "Activation information unavailable" }, { status: 503, headers });
  }
  const created = new Date(profile.data.created_at).getTime();
  return NextResponse.json({
    newMember: Number.isFinite(created) && Date.now() - created >= 0 && Date.now() - created < 14 * 86400000,
    hasPhoto: Boolean(profile.data.avatar_url),
    hasPreferences: Array.isArray(profile.data.looking_for) && profile.data.looking_for.length > 0,
    firstContactMade: (sentMessages.count ?? 0) > 0 || (sentInterests.count ?? 0) > 0,
  }, { headers });
}
