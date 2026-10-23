import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store" };
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermission(req, "content:reveal_sensitive");
  if ("response" in auth) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid album identifier" }, { status: 400, headers });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Album photos unavailable" }, { status: 503, headers });
  const { data: album, error: albumError } = await db.from("media_albums").select("id,owner_id").eq("id", params.id).maybeSingle();
  if (albumError) return NextResponse.json({ error: "Album lookup failed" }, { status: 503, headers });
  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404, headers });
  const { data: links, error: linkError } = await db.from("media_album_items").select("media_id,sort_order").eq("album_id", album.id).order("sort_order").limit(101);
  if (linkError || (links?.length || 0) > 100) return NextResponse.json({ error: "Album photo list unavailable" }, { status: 503, headers });
  if (!links?.length) return NextResponse.json({ photos: [] }, { headers });
  const { data: photos, error } = await db.from("media_objects")
    .select("id,title,moderation_status,upload_status,processing_status")
    .in("id", links.map(link => link.media_id)).eq("owner_id", album.owner_id).eq("media_type", "IMAGE")
    .or("category.is.null,category.neq.MESSAGE");
  if (error) return NextResponse.json({ error: "Album photos unavailable" }, { status: 503, headers });
  return NextResponse.json({ photos: links.map(link => photos?.find(photo => photo.id === link.media_id) || {
    id: link.media_id, title: null, moderation_status: "UNAVAILABLE", upload_status: "UNAVAILABLE", processing_status: "UNAVAILABLE",
  }) }, { headers });
}
