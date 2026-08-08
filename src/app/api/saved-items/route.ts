import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { CONTENT_TARGET_TYPES, resolveContentTarget, type ContentTargetType } from "@/lib/content/targetAccess";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Saved items unavailable" }, { status: 503 });
  const { data, error } = await db.from("saved_items").select("id,target_type,target_id,created_at").eq("profile_id", actor.actor.profileId).order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Saved items lookup failed; confirm migration 20260814 is applied" }, { status: 502 });
  const items = data || [];
  const ids = (type: string) => items.filter((item) => item.target_type === type).map((item) => item.target_id);
  const [profiles, media, ads, posts] = await Promise.all([
    ids("PROFILE").length ? db.from("profiles").select("id,display_name,username,avatar_url,age,country,city,headline,verification_status,verification_level,account_status,discovery_disabled").in("id", ids("PROFILE")) : Promise.resolve({ data: [] }),
    ids("MEDIA").length ? db.from("media_objects").select("id,owner_id,media_type,title,category,upload_status,processing_status,moderation_status").in("id", ids("MEDIA")) : Promise.resolve({ data: [] }),
    ids("DATING_AD").length ? db.from("dating_ads").select("id,author_id,title,category,status,created_at,validity_days").in("id", ids("DATING_AD")) : Promise.resolve({ data: [] }),
    ids("POST").length ? db.from("content_posts").select("id,author_id,title,body,category,moderation_status").in("id", ids("POST")) : Promise.resolve({ data: [] }),
  ]);
  const summary = new Map<string, Record<string, unknown>>();
  for (const row of profiles.data || []) if (row.account_status === "ACTIVE" && !row.discovery_disabled) summary.set(`PROFILE:${row.id}`, { type: "PROFILE", id: row.id, title: row.display_name || row.username || "Intimo member", subtitle: [row.city, row.country].filter(Boolean).join(", "), description: row.headline, imageUrl: row.avatar_url, age: row.age, verified: row.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(row.verification_level || ""), href: `/profile/${row.id}` });
  for (const row of media.data || []) if (row.upload_status === "AVAILABLE" && row.processing_status === "READY" && row.moderation_status === "APPROVED") summary.set(`MEDIA:${row.id}`, { type: "MEDIA", id: row.id, title: row.title || (row.media_type === "VIDEO" ? "Untitled video" : "Untitled photo"), subtitle: row.category || row.media_type, description: "Approved community media", href: row.media_type === "VIDEO" ? "/videos" : "/photos" });
  for (const row of ads.data || []) if (row.status === "active" && new Date(row.created_at).getTime() + row.validity_days * 86_400_000 > Date.now()) summary.set(`DATING_AD:${row.id}`, { type: "DATING_AD", id: row.id, title: row.title, subtitle: row.category, description: "Active dating ad", href: `/dating?ad=${row.id}` });
  for (const row of posts.data || []) if (row.moderation_status === "APPROVED") summary.set(`POST:${row.id}`, { type: "POST", id: row.id, title: row.title || "Community post", subtitle: row.category || "Post", description: String(row.body || "").slice(0, 180), href: "/" });
  return NextResponse.json({ items: items.flatMap((item) => { const target = summary.get(`${item.target_type}:${item.target_id}`); return target ? [{ ...item, target }] : []; }) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!checkRateLimit(`saved-items:${actor.actor.auth0Sub}`, 80, 60 * 60).allowed) return NextResponse.json({ error: "Too many save requests" }, { status: 429 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as { targetType?: unknown; targetId?: unknown };
  const targetType = typeof input.targetType === "string" ? input.targetType : ""; const targetId = typeof input.targetId === "string" ? input.targetId : "";
  if (!CONTENT_TARGET_TYPES.includes(targetType as ContentTargetType) || !UUID.test(targetId)) return NextResponse.json({ error: "Invalid saved item" }, { status: 400 });
  const access = await resolveContentTarget(actor.actor, targetType as ContentTargetType, targetId); if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });
  const { data, error } = await access.db.from("saved_items").upsert({ profile_id: actor.actor.profileId, target_type: targetType, target_id: targetId }, { onConflict: "profile_id,target_type,target_id" }).select("id,target_type,target_id,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Item could not be saved" }, { status: 502 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const url = new URL(req.url); const targetType = url.searchParams.get("targetType") || ""; const targetId = url.searchParams.get("targetId") || "";
  if (!CONTENT_TARGET_TYPES.includes(targetType as ContentTargetType) || !UUID.test(targetId)) return NextResponse.json({ error: "Invalid saved item" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Saved items unavailable" }, { status: 503 });
  const { error } = await db.from("saved_items").delete().eq("profile_id", actor.actor.profileId).eq("target_type", targetType).eq("target_id", targetId);
  if (error) return NextResponse.json({ error: "Saved item could not be removed" }, { status: 502 });
  return NextResponse.json({ saved: false });
}
