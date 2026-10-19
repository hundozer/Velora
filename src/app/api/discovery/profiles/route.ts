import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { POSITIVE_STATES } from "@/lib/desires.mjs";
import { ACTIVE_WINDOWS, allOf, areaIdsWithin, audienceExpression, ACTIVITY_REST_START, encodeActivityCursor, encodeCursor, parsePeopleFilters, searchExpression, whoFilterExpression } from "@/lib/people.mjs";
import { DISCOVERY_COLUMNS, loadViewerContext, toDiscoveryPerson, type DiscoveryRow } from "@/lib/discovery/context";

// People v3 (P1-05): every filter runs in the database query; keyset pagination
// on (created_at desc, id asc); blocks excluded both ways.
// Phase 2: sort=activity orders the Everyone index as Here now → Earlier today → This
// week → Other people nearby. Only members who show their activity are ordered by it;
// everyone else follows by join date with no activity information. No counts, ever.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const WEEK_MS = ACTIVE_WINDOWS.WEEK;

export async function GET(req: NextRequest) {
  const actorResult = await resolveServerActor(req);
  if (actorResult.status === "unauthenticated") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (actorResult.status !== "authenticated") return NextResponse.json({ error: "Discovery unavailable" }, { status: actorResult.status === "unprovisioned" ? 403 : 503 });
  if (!hasAdultAccess(actorResult.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });

  const rate = (await checkRateLimit(`discovery:${actorResult.actor.userId}`, 120, 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many discovery requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Discovery unavailable" }, { status: 503 });

  const viewerId = actorResult.actor.profileId;
  const filters = parsePeopleFilters(new URL(req.url).searchParams);
  const empty = (reason: string) => NextResponse.json({ profiles: [], nextCursor: null, filters, emptyReason: reason }, { headers: noStore });

  const loaded = await loadViewerContext(supabase, viewerId);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: 502 });
  const context = loaded.context;
  const { excludedIds, friendIds, viewerAreaId } = context;

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
  const weekAgo = new Date(now - WEEK_MS).toISOString();
  // Activity order: phase A while members active this week remain, then phase R.
  const phase: "A" | "R" | null = filters.sort === "activity" ? (filters.activityCursor?.phase === "R" ? "R" : "A") : null;

  const run = async (currentPhase: "A" | "R" | null, limit: number) => {
    let query = supabase
      .from("profiles")
      .select(DISCOVERY_COLUMNS)
      .in("profile_visibility", ["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY"])
      .eq("account_status", "ACTIVE")
      .eq("discovery_disabled", false)
      .neq("auth_id", actorResult.actor.userId)
      .gte("age", filters.minAge)
      .lte("age", filters.maxAge);
    if (currentPhase === "A") query = query.eq("show_online_status", true).gte("last_active_at", weekAgo).order("last_active_at", { ascending: false });
    else query = query.order("created_at", { ascending: false });
    query = query.order("id", { ascending: true }).limit(limit + 1);
    if (excludedIds.length > 0) query = query.not("id", "in", `(${excludedIds.join(",")})`);
    if (desireMatchIds) query = query.in("id", desireMatchIds);
    if (areaIds) query = query.in("area_id", areaIds);
    if (filters.hasPhoto) query = query.not("avatar_url", "is", null);
    if (filters.verified) query = query.eq("verification_status", "VERIFIED");
    if (filters.active) query = query.eq("show_online_status", true).gte("last_active_at", new Date(now - ACTIVE_WINDOWS[filters.active]).toISOString());
    if (filters.newWithinDays) query = query.gte("created_at", new Date(now - filters.newWithinDays * 86_400_000).toISOString());

    // Every OR-shaped rule goes into one or= parameter so they all must hold.
    // FRIENDS_ONLY members are filtered here, before the limit, so pages stay full.
    const rules: (string | null)[] = [audienceExpression(friendIds), whoFilterExpression(filters.who), searchExpression(filters.q)];
    if (currentPhase === "R") rules.push(`show_online_status.eq.false,last_active_at.is.null,last_active_at.lt.${weekAgo}`);
    const cursor = filters.activityCursor;
    if (currentPhase === "A" && cursor?.phase === "A") rules.push(`last_active_at.lt.${cursor.at},and(last_active_at.eq.${cursor.at},id.gt.${cursor.id})`);
    if (currentPhase === "R" && cursor?.phase === "R" && cursor.at) rules.push(`created_at.lt.${cursor.at},and(created_at.eq.${cursor.at},id.gt.${cursor.id})`);
    if (!currentPhase && filters.cursor) rules.push(`created_at.lt.${filters.cursor.createdAt},and(created_at.eq.${filters.cursor.createdAt},id.gt.${filters.cursor.id})`);
    const combined = allOf(rules);
    if (combined) query = query.or(combined);
    const { data, error } = await query;
    return { rows: (data || []) as unknown as DiscoveryRow[], error };
  };

  let page: DiscoveryRow[];
  let nextCursor: string | null = null;
  if (phase === "A") {
    const active = await run("A", filters.limit);
    if (active.error) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
    page = active.rows.slice(0, filters.limit);
    if (active.rows.length > filters.limit) nextCursor = encodeActivityCursor("A", page[page.length - 1]);
    else {
      // This week's members are exhausted: fill the page from "Other people nearby".
      const room = filters.limit - page.length;
      const rest = await run("R", room);
      if (rest.error) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
      const restPage = rest.rows.slice(0, room);
      page = [...page, ...restPage];
      if (rest.rows.length > room) nextCursor = restPage.length ? encodeActivityCursor("R", restPage[restPage.length - 1]) : ACTIVITY_REST_START;
    }
  } else {
    const result = await run(phase, filters.limit);
    if (result.error) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
    page = result.rows.slice(0, filters.limit);
    if (result.rows.length > filters.limit) nextCursor = phase ? encodeActivityCursor(phase, page[page.length - 1]) : encodeCursor(page[page.length - 1]);
  }

  const profiles = page
    .filter((row) => row.profile_visibility !== "FRIENDS_ONLY" || friendIds.has(row.id))
    .map((row) => toDiscoveryPerson(row, context));
  return NextResponse.json(
    { profiles, nextCursor, ranking: { algorithm: phase ? "activity_then_joined" : "created_at_desc_then_id_asc", limit: filters.limit, desires: filters.desires } },
    { headers: noStore },
  );
}
