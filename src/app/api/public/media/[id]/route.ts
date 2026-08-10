import { NextRequest, NextResponse } from "next/server";
import { AGE_DECLARATION_COOKIE, verifyAgeDeclarationValue } from "@/lib/auth/ageDeclaration";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPresignedDownloadUrl } from "@/lib/storage/r2";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (!verifyAgeDeclarationValue(req.cookies.get(AGE_DECLARATION_COOKIE)?.value)) return NextResponse.json({ error: "Adult declaration required" }, { status: 403 });
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`public-media-view:${client.slice(0, 80)}`, 120, 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Public media unavailable" }, { status: 503 });
  const { data: media } = await db.from("media_objects").select("id,owner_id,object_key,content_rating").eq("id", params.id).eq("visibility", "PUBLIC").eq("upload_status", "AVAILABLE").eq("processing_status", "READY").eq("moderation_status", "APPROVED").maybeSingle();
  if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (media.content_rating !== "NON_EXPLICIT") {
    const actor = await resolveServerActor(req);
    if (actor.status !== "authenticated") return NextResponse.json({ error: "Sign in to view explicit media" }, { status: 401 });
    if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult member access required" }, { status: 403 });
  }
  const { data: owner } = await db.from("profiles").select("id").eq("id", media.owner_id).eq("profile_visibility", "EVERYONE").eq("public_profile_visibility", true).eq("account_status", "ACTIVE").eq("discovery_disabled", false).maybeSingle();
  if (!owner) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  try {
    const signedUrl = await getPresignedDownloadUrl(media.object_key);
    const response = NextResponse.redirect(signedUrl, 307);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  } catch {
    return NextResponse.json({ error: "Public media unavailable" }, { status: 503 });
  }
}
