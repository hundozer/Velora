import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { ACTIVE_WINDOWS, INTRODUCTIONS_MAX, NEW_MEMBER_DAYS, audienceExpression, chooseIntroductions } from "@/lib/people.mjs";
import { DISCOVERY_COLUMNS, loadViewerContext, toDiscoveryPerson, visibleTo, type DiscoveryRow } from "@/lib/discovery/context";

// Introductions (editorial redesign, Phase 2): at most five people, online first, then
// new members, then recently active. "Online" and "recently active" only ever use members
// who show their activity; members who opted out of Introductions are never featured
// (they stay findable in Everyone). Rotation is per viewer and per day, never by "fit".
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const POOL = 40;
const UNDEFINED_COLUMN = "42703";

export async function GET(req: NextRequest) {
  const actorResult = await resolveServerActor(req);
  if (actorResult.status === "unauthenticated") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (actorResult.status !== "authenticated") return NextResponse.json({ error: "Discovery unavailable" }, { status: actorResult.status === "unprovisioned" ? 403 : 503 });
  if (!hasAdultAccess(actorResult.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = (await checkRateLimit(`discovery-intro:${actorResult.actor.userId}`, 30, 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many discovery requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Discovery unavailable" }, { status: 503 });

  const loaded = await loadViewerContext(supabase, actorResult.actor.profileId);
  if ("error" in loaded) return NextResponse.json({ error: loaded.error }, { status: 502 });
  const context = loaded.context;
  const now = Date.now();

  const pool = async (kind: "online" | "fresh" | "recent", respectOptOut: boolean) => {
    let query = supabase
      .from("profiles")
      .select(DISCOVERY_COLUMNS)
      .in("profile_visibility", ["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY"])
      .eq("account_status", "ACTIVE")
      .eq("discovery_disabled", false)
      .neq("auth_id", actorResult.actor.userId)
      .or(audienceExpression(context.friendIds))
      .order("id", { ascending: true })
      .limit(POOL);
    if (respectOptOut) query = query.eq("show_in_introductions", true);
    if (context.excludedIds.length > 0) query = query.not("id", "in", `(${context.excludedIds.join(",")})`);
    if (kind === "online") query = query.eq("show_online_status", true).gte("last_active_at", new Date(now - ACTIVE_WINDOWS.ONLINE).toISOString());
    if (kind === "recent") query = query.eq("show_online_status", true).gte("last_active_at", new Date(now - ACTIVE_WINDOWS.WEEK).toISOString());
    if (kind === "fresh") query = query.gte("created_at", new Date(now - NEW_MEMBER_DAYS * 86_400_000).toISOString());
    return query;
  };

  const load = async (respectOptOut: boolean) => Promise.all([pool("online", respectOptOut), pool("fresh", respectOptOut), pool("recent", respectOptOut)]);
  let results = await load(true);
  // Before the 20261103 migration the opt-out column does not exist yet; nobody has opted out.
  if (results.some((result) => result.error?.code === UNDEFINED_COLUMN)) results = await load(false);
  if (results.some((result) => result.error)) return NextResponse.json({ error: "Discovery lookup failed" }, { status: 502 });
  const [online, fresh, recent] = results.map((result) => ((result.data || []) as unknown as DiscoveryRow[]).filter((row) => visibleTo(row, context)));

  const day = new Date(now).toISOString().slice(0, 10);
  const picked = chooseIntroductions({ online, fresh, recent }, { viewerId: context.viewerId, day, max: INTRODUCTIONS_MAX });
  const introductions = picked.map(({ row, reason }) => ({ ...toDiscoveryPerson(row, context), reason }));
  return NextResponse.json({ introductions }, { headers: noStore });
}
