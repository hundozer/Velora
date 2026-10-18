import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import type { ProfileRow } from "@/lib/supabase/profileService";

// Activity (P1-08): who visited me (30 days), who is interested, and mutual interest.
export const dynamic = "force-dynamic";
const VISITOR_WINDOW_DAYS = 30;

function whenLabel(iso: string, now: number) {
  const hours = (now - new Date(iso).getTime()) / 3_600_000;
  if (hours < 24) return "Today";
  if (hours < 48) return "Yesterday";
  if (hours < 24 * 7) return "This week";
  return "This month";
}

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Activity unavailable" }, { status: 503 });
  const me = auth.actor.profileId;
  const now = Date.now();
  const since = new Date(now - VISITOR_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);

  const [{ data: self }, viewsResult, receivedResult, sentResult, blocksResult] = await Promise.all([
    db.from("profiles").select("browse_invisibly").eq("id", me).maybeSingle(),
    db.from("profile_views").select("viewer_id,last_viewed_at").eq("viewed_id", me).gte("viewed_on", since).order("last_viewed_at", { ascending: false }).limit(300),
    db.from("interests").select("from_id,created_at").eq("to_id", me).order("created_at", { ascending: false }).limit(200),
    db.from("interests").select("to_id").eq("from_id", me).limit(500),
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${me},blocked_profile_id.eq.${me}`),
  ]);
  if (viewsResult.error || receivedResult.error || sentResult.error || blocksResult.error) return NextResponse.json({ error: "Activity lookup failed" }, { status: 502 });
  const blocked = new Set((blocksResult.data || []).map((row) => row.blocker_id === me ? row.blocked_profile_id : row.blocker_id));
  const sent = new Set((sentResult.data || []).map((row) => row.to_id as string));

  // Reciprocity: invisible browsers don't see their own visitors either.
  const invisible = self?.browse_invisibly === true;
  const latestVisit = new Map<string, string>();
  if (!invisible) for (const row of viewsResult.data || []) if (!latestVisit.has(row.viewer_id)) latestVisit.set(row.viewer_id, row.last_viewed_at);
  const received = new Map<string, string>((receivedResult.data || []).map((row) => [row.from_id as string, row.created_at as string]));

  const ids = [...new Set([...latestVisit.keys(), ...received.keys()])].filter((id) => !blocked.has(id));
  const { data: rows, error } = ids.length
    ? await db.from("profiles").select("*").in("id", ids).eq("account_status", "ACTIVE")
    : { data: [], error: null };
  if (error) return NextResponse.json({ error: "Activity lookup failed" }, { status: 502 });
  const byId = new Map((rows || []).map((row) => [row.id as string, toMemberVisibleProfile(row as ProfileRow)]));

  const visitors = [...latestVisit.entries()].filter(([id]) => byId.has(id)).map(([id, at]) => ({ ...byId.get(id)!, when: whenLabel(at, now) }));
  const interestedInYou = [...received.entries()].filter(([id]) => byId.has(id) && !sent.has(id)).map(([id, at]) => ({ ...byId.get(id)!, when: whenLabel(at, now) }));
  const mutual = [...received.entries()].filter(([id]) => byId.has(id) && sent.has(id)).map(([id, at]) => ({ ...byId.get(id)!, when: whenLabel(at, now) }));
  return NextResponse.json({ visitors, interestedInYou, mutual, browseInvisibly: invisible }, { headers: { "Cache-Control": "private, no-store" } });
}
