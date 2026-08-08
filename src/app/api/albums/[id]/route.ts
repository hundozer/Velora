import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req); if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : ""; const description = typeof body.description === "string" ? body.description.trim() : ""; const category = typeof body.category === "string" ? body.category.trim() : "";
  const visibility = ["PUBLIC","MEMBERS_ONLY","FOLLOWERS_ONLY","PRIVATE"].includes(body.visibility) ? body.visibility : "PRIVATE";
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim().slice(0,50)).filter(Boolean).slice(0,20) : [];
  if (!title || title.length > 160 || description.length > 4000 || category.length > 100) return NextResponse.json({ error: "Invalid album details" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data, error } = await db.from("media_albums").update({ title, description: description || null, category: category || null, tags, visibility, moderation_status: "PENDING_REVIEW", published_at: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", auth.actor.profileId).neq("moderation_status", "REMOVED").select("id,title,description,category,tags,visibility,moderation_status,cover_media_id,updated_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Album update failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "ALBUM_UPDATE", resourceType: "ALBUM", resourceId: data.id, outcome: "SUCCESS", metadata: { visibility } });
  if (!audited) return NextResponse.json({ error: "Album was updated but audit evidence failed", albumId: data.id }, { status: 502 });
  return NextResponse.json({ album: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req); if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data, error } = await db.from("media_albums").update({ moderation_status: "REMOVED", visibility: "PRIVATE", published_at: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", auth.actor.profileId).neq("moderation_status", "REMOVED").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Album removal failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "ALBUM_REMOVE", resourceType: "ALBUM", resourceId: data.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Album was removed but audit evidence failed", albumId: data.id }, { status: 502 });
  return NextResponse.json({ success: true });
}
