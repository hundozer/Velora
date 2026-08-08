import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req); if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const mediaIds = Array.isArray(body.mediaIds) ? body.mediaIds.filter((id: unknown): id is string => typeof id === "string" && UUID.test(id)) : [];
  const uniqueIds = [...new Set(mediaIds)]; const coverMediaId = typeof body.coverMediaId === "string" && UUID.test(body.coverMediaId) ? body.coverMediaId : null;
  if (uniqueIds.length !== mediaIds.length || uniqueIds.length > 100 || (coverMediaId && !uniqueIds.includes(coverMediaId))) return NextResponse.json({ error: "Invalid album media selection" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { error } = await db.rpc("intimo_set_album_media", { p_album_id: params.id, p_owner_id: auth.actor.profileId, p_media_ids: uniqueIds, p_cover_media_id: coverMediaId });
  if (error) return NextResponse.json({ error: "Album media could not be updated" }, { status: 409 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "ALBUM_MEDIA_SET", resourceType: "ALBUM", resourceId: params.id, outcome: "SUCCESS", metadata: { mediaCount: uniqueIds.length, coverMediaId } });
  if (!audited) return NextResponse.json({ error: "Album media changed but audit evidence failed", albumId: params.id }, { status: 502 });
  return NextResponse.json({ success: true });
}
