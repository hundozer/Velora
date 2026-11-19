import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { isVisibleMember } from "@/lib/auth/ageCheck.mjs";

export const dynamic = "force-dynamic";

/** Return only the requesting member's connection relationships. No public graph. */
export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Connections unavailable" }, { status: 503 });
  const me = auth.actor.profileId;
  const [{ data: rows, error }, { data: blocked, error: blockError }] = await Promise.all([
    db.from("friendships").select("requester_id,addressee_id,status,requested_at,accepted_at")
      .or(`requester_id.eq.${me},addressee_id.eq.${me}`).order("requested_at", { ascending: false }).limit(200),
    db.from("user_blocks").select("blocker_id,blocked_profile_id")
      .or(`blocker_id.eq.${me},blocked_profile_id.eq.${me}`),
  ]);
  if (error || blockError) return NextResponse.json({ error: "Connections could not be loaded" }, { status: 502 });
  const hidden = new Set((blocked || []).map(row => row.blocker_id === me ? row.blocked_profile_id : row.blocker_id));
  const relations = (rows || []).map(row => ({
    peerId: row.requester_id === me ? row.addressee_id : row.requester_id,
    status: row.status === "ACCEPTED" ? "CONNECTED" : row.requester_id === me ? "SENT" : "RECEIVED",
    at: row.status === "ACCEPTED" ? (row.accepted_at || row.requested_at) : row.requested_at,
  })).filter(row => !hidden.has(row.peerId));
  const ids = [...new Set(relations.map(row => row.peerId))];
  const { data: members, error: memberError } = ids.length
    ? await db.from("profiles").select("id,display_name,avatar_url,city,account_status,age_verification_status").in("id", ids)
    : { data: [], error: null };
  if (memberError) return NextResponse.json({ error: "Connections could not be loaded" }, { status: 502 });
  const byId = new Map((members || []).filter(isVisibleMember).map(p => [p.id, p]));
  return NextResponse.json({ connections: relations.flatMap(row => {
    const profile = byId.get(row.peerId);
    return profile ? [{ ...row, name: profile.display_name, avatarUrl: profile.avatar_url, city: profile.city }] : [];
  }) }, { headers: { "Cache-Control": "private, no-store" } });
}
