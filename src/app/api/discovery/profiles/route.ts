import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import type { ProfileRow } from "@/lib/supabase/profileService";
import { POSITIVE_STATES } from "@/lib/desires.mjs";
import { ACTIVE_WINDOWS, areaIdsWithin, encodeCursor, parsePeopleFilters, whoFilterExpression } from "@/lib/people.mjs";
import { areaById, distanceBucket, DISTANCE_BUCKET_LABELS } from "@/lib/areas.mjs";

// People v3 (P1-05): every filter runs in the database query; keyset pagination
// on (created_at desc, id asc); blocks excluded both ways.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const actorResult = await resolveServerActor(req);
  if (actorResult.status === "unauthenticated") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (actorResult.status !== "authenticated") return NextResponse.json({ error: "Discovery unavailable" }, { status: actorResult.status === "unprovisioned" ? 403 : 503 });
  if (!hasAdultAccess(actorResult.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });

  const rate = checkRateLimit(`discovery:${actorResult.actor.userId}`, 120, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many discovery requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Discovery unavailable" }, { status: 503 });

  const viewerId = actorResult.actor.profileId;
  const filters = parsePeopleFilters(new URL(req.url).searchParams);
  const empty = (reason: string) => NextResponse.json({ profiles: [], nextCursor: null, filters, emptyReason: reason }, { headers: noStore });

  const [{ data: blockRows, error: blockError }, { data: friendshipRows, error: friendshipError }, { data: viewer }] = await Promise.all([
    supabase.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${viewerId},blocked_profile_id.eq.${viewerId}`),
    supabase.from("friendships").select("requester_id,addressee_id").eq("status", "ACCEPTED").or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`),
    supabase.from("profiles").select("area_id").eq("id", viewerId).maybeSingle(),
  ]);
  if (blockError) return NextResponse.json({ error: "Discovery safety lookup failed" }, { status: 502 });
  if (friendshipError) return NextResponse.json({ error: "Discovery friends lookup failed" }, { status: 502 });
  const excludedIds = (blockRows || []).map((block) => block.blocker_id === viewerId ? block.blocked_profile_id : block.blocker_id);
  const friendIds = new Set((friendshipRows || []).map((row) => row.requester_id === viewerId ? row.addressee_id : row.requester_id));
  const viewerAreaId: string | null = viewer?.area_id ?? null;

  // Desire filter: members who want any of the chosen desires (members-visible rows only).
  let desireMatchIds: string[] | null = null;
  if (filters.desires.length > 0) {
    const { data: matches, error: matchError } = await supabase.from("member_desires").select("profile_id")
      .in("desire_id", filters.desires).in("state", POSITIVE_STATES).eq("visibility", "MEMBERS").limit(2000);
    if (matchError) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
    desireMatchIds = [...new Set((matches || []).map((row) => row.profile_id as string))];
    if (desireMatchIds.length === 0) return empty("desires");
  }

  let areaIds: string[] | null = null;
  if (filters.withinKm) {
    areaIds = areaIdsWithin(viewerAreaId, filters.withinKm);
    if (!areaIds) return empty("no-area");
  }

  const now = Date.now();
  let query = supabase
    .from("profiles")
    .select("*")
    .in("profile_visibility", ["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY"])
    .eq("account_status", "ACTIVE")
    .eq("discovery_disabled", false)
    .neq("auth_id", actorResult.actor.userId)
    .gte("age", filters.minAge)
    .lte("age", filters.maxAge)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(filters.limit + 1);
  if (excludedIds.length > 0) query = query.not("id", "in", `(${excludedIds.join(",")})`);
  if (desireMatchIds) query = query.in("id", desireMatchIds);
  if (areaIds) query = query.in("area_id", areaIds);
  const who = whoFilterExpression(filters.who);
  if (who) query = query.or(who);
  if (filters.hasPhoto) query = query.not("avatar_url", "is", null);
  if (filters.verified) query = query.eq("verification_status", "VERIFIED");
  if (filters.active) query = query.eq("show_online_status", true).gte("last_active_at", new Date(now - ACTIVE_WINDOWS[filters.active]).toISOString());
  if (filters.newWithinDays) query = query.gte("created_at", new Date(now - filters.newWithinDays * 86_400_000).toISOString());
  if (filters.cursor) query = query.or(`created_at.lt.${filters.cursor.createdAt},and(created_at.eq.${filters.cursor.createdAt},id.gt.${filters.cursor.id})`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
  const rows = (data || []) as (ProfileRow & { id: string; created_at: string; area_id?: string | null })[];
  const page = rows.slice(0, filters.limit);
  const profiles = page
    .filter((row) => row.profile_visibility !== "FRIENDS_ONLY" || friendIds.has(row.id))
    .map((row) => {
      const bucket = viewerAreaId && row.area_id ? distanceBucket(viewerAreaId, row.area_id) : null;
      return {
        ...toMemberVisibleProfile(row, { friends: friendIds.has(row.id) }),
        areaName: row.location_precision === "HIDDEN" ? null : areaById(row.area_id)?.name || null,
        distance: row.location_precision === "HIDDEN" || !bucket ? null : DISTANCE_BUCKET_LABELS[bucket],
      };
    });
  return NextResponse.json(
    { profiles, nextCursor: rows.length > filters.limit ? encodeCursor(page[page.length - 1]) : null, ranking: { algorithm: "created_at_desc_then_id_asc", limit: filters.limit, desires: filters.desires } },
    { headers: noStore },
  );
}
