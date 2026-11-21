import { NextRequest, NextResponse } from "next/server";
import { AGE_DECLARATION_COOKIE, verifyAgeDeclarationValue } from "@/lib/auth/ageDeclaration";
import { getServerSupabase } from "@/lib/supabase/server";
import { closedSiteRefusal } from "@/lib/publicAccess";
import { deliverMedia } from "@/lib/media/delivery";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const closed = await closedSiteRefusal(req); if (closed) return closed;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (!verifyAgeDeclarationValue(req.cookies.get(AGE_DECLARATION_COOKIE)?.value)) return NextResponse.json({ error: "Adult declaration required" }, { status: 403 });
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await checkRateLimit(`public-media-view:${client.slice(0, 80)}`, 120, 60)).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Public media unavailable" }, { status: 503 });
  const { data: media } = await db.from("media_objects").select("id,owner_id,object_key,content_rating,mime_type").eq("id", params.id).eq("visibility", "PUBLIC").eq("upload_status", "AVAILABLE").eq("processing_status", "READY").eq("moderation_status", "APPROVED").maybeSingle();
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  // Album-linked files are never available through the standalone/public
  // media endpoint. The album-specific authenticated endpoint checks access.
  const { data: linked, error: linkError } = await db.from("media_album_items")
    .select("album_id").eq("media_id", media.id).limit(1);
  if (linkError || (linked?.length ?? 0) > 0)
    return NextResponse.json({ error: "Media not found" }, { status: 404 });

  if (media.mime_type.startsWith("video/") && !media.object_key.startsWith(`variants/${media.id}/safe.`)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const actor = await resolveServerActor(req);
  if (media.content_rating !== "NON_EXPLICIT") {
    if (actor.status !== "authenticated") return NextResponse.json({ error: "Sign in to view explicit media" }, { status: 401 });
    if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult member access required" }, { status: 403 });
  }
  const { data: owner } = await db.from("profiles").select("id").eq("id", media.owner_id).eq("profile_visibility", "EVERYONE").eq("public_profile_visibility", true).eq("account_status", "ACTIVE").eq("age_verification_status", "AGE_VERIFIED").eq("discovery_disabled", false).maybeSingle();
  if (!owner) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (actor.status === "authenticated" && actor.actor.profileId !== media.owner_id) {
    const viewerId = actor.actor.profileId;
    const { data: block, error: blockError } = await db.from("user_blocks").select("id")
      .or(`and(blocker_id.eq.${viewerId},blocked_profile_id.eq.${media.owner_id}),and(blocker_id.eq.${media.owner_id},blocked_profile_id.eq.${viewerId})`).limit(1).maybeSingle();
    if (blockError || block) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
  try {
    return await deliverMedia(media.object_key, media.mime_type, req.headers.get("range") || undefined);
  } catch {
    return NextResponse.json({ error: "Public media unavailable" }, { status: 503 });
  }
}
