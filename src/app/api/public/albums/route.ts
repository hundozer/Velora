import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const url = new URL(req.url); const page = Math.min(Math.max(Number(url.searchParams.get("page")) || 1, 1), 500); const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 18, 1), 36); const offset = (page - 1) * limit;
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`public-albums:${client.slice(0,80)}`, 90, 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data: albums, error, count } = await db.from("media_albums").select("id,owner_id,title,description,category,tags,cover_media_id,published_at,created_at", { count: "exact" }).eq("visibility", "PUBLIC").eq("moderation_status", "APPROVED").order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).order("id", { ascending: true }).range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: "Album lookup failed" }, { status: 502 });
  const ownerIds = [...new Set((albums || []).map((album) => album.owner_id))];
  const { data: owners } = ownerIds.length ? await db.from("profiles").select("id,display_name,username,verification_status,verification_level").in("id",ownerIds).eq("profile_visibility","EVERYONE").eq("public_profile_visibility",true).eq("account_status","ACTIVE").eq("discovery_disabled",false) : { data: [] };
  const ownerMap = new Map((owners || []).map((owner) => [owner.id,owner])); const albumIds = (albums || []).map((album) => album.id);
  const { data: items } = albumIds.length ? await db.from("media_album_items").select("album_id,media_id").in("album_id",albumIds) : { data: [] };
  const visible = (albums || []).flatMap((album) => { const owner = ownerMap.get(album.owner_id); if (!owner) return []; const mediaIds = (items || []).filter((item) => item.album_id === album.id).map((item) => item.media_id); return [{ id: album.id,title:album.title,description:album.description,category:album.category,tags:Array.isArray(album.tags)?album.tags.slice(0,20):[],coverUrl:album.cover_media_id?`/api/public/media/${album.cover_media_id}`:null,photoCount:mediaIds.length,owner:{id:owner.id,displayName:owner.display_name||owner.username||"Intimo member",verified:owner.verification_status==="VERIFIED"||["LEVEL_3_PROFILE_BIOMETRIC","LEVEL_4_CREATOR"].includes(owner.verification_level||"")},publishedAt:album.published_at||album.created_at}]; });
  return NextResponse.json({ albums: visible, pagination: { page,limit,total:count||0,hasMore:offset+(albums || []).length<(count||0) }, ranking:"published_at_desc_created_at_desc_id_asc" }, { headers: { "Cache-Control":"public, max-age=30, stale-while-revalidate=120" } });
}
