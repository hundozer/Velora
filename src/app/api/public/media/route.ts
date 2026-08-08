import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";
const MAX_LIMIT = 36;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mediaType = url.searchParams.get("type");
  const ownerId = url.searchParams.get("ownerId");
  if (mediaType && !["IMAGE", "VIDEO"].includes(mediaType)) return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  if (ownerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId)) return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
  const page = Math.min(Math.max(Number(url.searchParams.get("page")) || 1, 1), 500);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 18, 1), MAX_LIMIT);
  const offset = (page - 1) * limit;
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`public-media-list:${client.slice(0, 80)}`, 90, 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Public media unavailable" }, { status: 503 });

  let query = db.from("media_objects")
    .select("id,owner_id,media_type,mime_type,title,description,category,tags,published_at,created_at", { count: "exact" })
    .eq("visibility", "PUBLIC")
    .eq("upload_status", "AVAILABLE")
    .eq("processing_status", "READY")
    .eq("moderation_status", "APPROVED")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (mediaType) query = query.eq("media_type", mediaType);
  if (ownerId) query = query.eq("owner_id", ownerId);
  const { data: rows, error, count } = await query;
  if (error) return NextResponse.json({ error: "Public media lookup failed" }, { status: 502 });
  const ownerIds = Array.from(new Set((rows || []).map((row) => row.owner_id)));
  const { data: owners } = ownerIds.length ? await db.from("profiles")
    .select("id,display_name,username,verification_status,verification_level")
    .in("id", ownerIds)
    .eq("profile_visibility", "EVERYONE")
    .eq("public_profile_visibility", true)
    .eq("account_status", "ACTIVE")
    .eq("discovery_disabled", false) : { data: [] };
  const ownerMap = new Map((owners || []).map((owner) => [owner.id, owner]));
  const media = (rows || []).flatMap((row) => {
    const owner = ownerMap.get(row.owner_id);
    if (!owner) return [];
    return [{
      id: row.id,
      type: row.media_type,
      mimeType: row.mime_type,
      title: String(row.title || (row.media_type === "VIDEO" ? "Untitled video" : "Untitled photo")).slice(0, 160),
      description: typeof row.description === "string" ? row.description.slice(0, 500) : undefined,
      category: typeof row.category === "string" ? row.category.slice(0, 100) : undefined,
      tags: Array.isArray(row.tags) ? row.tags.slice(0, 20) : [],
      owner: { id: owner.id, displayName: owner.display_name || owner.username || "Intimo member", verified: owner.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(owner.verification_level || "") },
      mediaUrl: `/api/public/media/${row.id}`,
      publishedAt: row.published_at || row.created_at,
    }];
  });
  return NextResponse.json({ media, pagination: { page, limit, total: count || 0, hasMore: offset + media.length < (count || 0) }, ranking: "published_at_desc_created_at_desc_id_asc" }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
