import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import type { ProfileRow } from "@/lib/supabase/profileService";
import { POSITIVE_STATES, parseDesireFilter } from "@/lib/desires.mjs";

export const dynamic = "force-dynamic";
const MAX_RESULTS = 100;

export async function GET(req: NextRequest) {
  const actorResult = await resolveServerActor(req);
  if (actorResult.status === "unauthenticated") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (actorResult.status !== "authenticated") return NextResponse.json({ error: "Discovery unavailable" }, { status: actorResult.status === "unprovisioned" ? 403 : 503 });
  if (!hasAdultAccess(actorResult.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });

  const rate = checkRateLimit(`discovery:${actorResult.actor.userId}`, 60, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many discovery requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Discovery unavailable" }, { status: 503 });

  const { data: blockRows, error: blockError } = await supabase
    .from("user_blocks")
    .select("blocker_id,blocked_profile_id")
    .or(`blocker_id.eq.${actorResult.actor.profileId},blocked_profile_id.eq.${actorResult.actor.profileId}`);
  if (blockError) return NextResponse.json({ error: "Discovery safety lookup failed" }, { status: 502 });
  const excludedIds = (blockRows || []).map((block) => block.blocker_id === actorResult.actor.profileId ? block.blocked_profile_id : block.blocker_id);

  const { data: friendshipRows, error: friendshipError } = await supabase
    .from("friendships")
    .select("requester_id,addressee_id")
    .eq("status", "ACCEPTED")
    .or(`requester_id.eq.${actorResult.actor.profileId},addressee_id.eq.${actorResult.actor.profileId}`);
  if (friendshipError) return NextResponse.json({ error: "Discovery friends lookup failed" }, { status: 502 });
  const friendIds = new Set((friendshipRows || []).map((row) => row.requester_id === actorResult.actor.profileId ? row.addressee_id : row.requester_id));

  // Desire filter: members who want any of the chosen desires (members-visible rows only).
  // P1-05 moves this into a single SQL query; an id list is fine at launch density.
  const desireFilter = parseDesireFilter(new URL(req.url).searchParams.get("desires"));
  let desireMatchIds: string[] | null = null;
  if (desireFilter.length > 0) {
    const { data: matches, error: matchError } = await supabase
      .from("member_desires")
      .select("profile_id")
      .in("desire_id", desireFilter)
      .in("state", POSITIVE_STATES)
      .eq("visibility", "MEMBERS")
      .limit(1000);
    if (matchError) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
    desireMatchIds = [...new Set((matches || []).map((row) => row.profile_id as string))];
    if (desireMatchIds.length === 0) {
      return NextResponse.json({ profiles: [], ranking: { algorithm: "created_at_desc_then_id_asc", limit: MAX_RESULTS, desires: desireFilter } }, { headers: { "Cache-Control": "private, no-store" } });
    }
  }

  let query = supabase
    .from("profiles")
    .select("*")
    .in("profile_visibility", ["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY"])
    .neq("auth_id", actorResult.actor.userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(MAX_RESULTS);
  if (excludedIds.length > 0) query = query.not("id", "in", `(${excludedIds.join(",")})`);
  if (desireMatchIds) query = query.in("id", desireMatchIds);
  const { data, error } = await query;

  if (error) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
  const profiles = (data || [])
    .filter((row) => row.profile_visibility !== "FRIENDS_ONLY" || friendIds.has(row.id))
    .map((row) => toMemberVisibleProfile(row as ProfileRow, { friends: friendIds.has(row.id) }));
  return NextResponse.json(
    { profiles, ranking: { algorithm: "created_at_desc_then_id_asc", limit: MAX_RESULTS, desires: desireFilter } },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
