import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { grantIsActive } from "@/lib/privateAccess.mjs";

// Lists an owner's private photos for a viewer with an active grant (P1-06).
// Each URL is the authenticated /api/media/{id} route, which re-checks the grant
// on every read and redirects to a short-lived signed link.
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const ownerId = new URL(req.url).searchParams.get("ownerId") || "";
  if (!UUID.test(ownerId)) return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Private photos unavailable" }, { status: 503 });
  if (ownerId !== auth.actor.profileId) {
    const { data: owner, error: ownerError } = await db.from("profiles").select("account_status,discovery_disabled").eq("id", ownerId).maybeSingle();
    if (ownerError || !owner || owner.account_status !== "ACTIVE" || owner.discovery_disabled) return NextResponse.json({ error: "No access" }, { status: 403 });
    const { data: grant } = await db.from("album_access_grants").select("status,grant_type,expires_at").eq("owner_id", ownerId).eq("viewer_id", auth.actor.profileId).maybeSingle();
    if (!grantIsActive(grant)) return NextResponse.json({ error: "No access" }, { status: 403 });
    const { data: block, error: blockError } = await db.from("user_blocks").select("id").or(`and(blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${ownerId}),and(blocker_id.eq.${ownerId},blocked_profile_id.eq.${auth.actor.profileId})`).limit(1).maybeSingle();
    if (blockError || block) return NextResponse.json({ error: "No access" }, { status: 403 });
  }
  const { data, error } = await db.from("media_objects").select("id,title,created_at").eq("owner_id", ownerId).eq("visibility", "PRIVATE").eq("upload_status", "AVAILABLE").eq("moderation_status", "APPROVED").or("category.is.null,and(category.neq.MESSAGE,category.neq.STORY)").order("created_at", { ascending: false }).limit(60);
  if (error) return NextResponse.json({ error: "Private photos lookup failed" }, { status: 502 });
  return NextResponse.json({ media: (data || []).map((row) => ({ id: row.id, title: row.title || "", url: `/api/media/${row.id}` })) }, { headers: { "Cache-Control": "private, no-store" } });
}
