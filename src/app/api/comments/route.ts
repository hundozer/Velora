import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, isAdminActor, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { CONTENT_TARGET_TYPES, resolveContentTarget, type ContentTargetType } from "@/lib/content/targetAccess";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const url = new URL(req.url); const targetType = url.searchParams.get("targetType") || ""; const targetId = url.searchParams.get("targetId") || "";
  if (!CONTENT_TARGET_TYPES.includes(targetType as ContentTargetType) || !UUID.test(targetId)) return NextResponse.json({ error: "Invalid comment target" }, { status: 400 });
  const access = await resolveContentTarget(actor.actor, targetType as ContentTargetType, targetId); if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });
  const { data, error } = await access.db.from("content_comments").select("id,author_id,body,created_at,profiles!content_comments_author_id_fkey(display_name,avatar_url,verification_status)").eq("target_type", targetType).eq("target_id", targetId).eq("moderation_status", "VISIBLE").order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: "Comments lookup failed; confirm migration 20260814 is applied" }, { status: 502 });
  return NextResponse.json({ comments: (data || []).map((item: any) => ({ id: item.id, authorId: item.author_id, body: item.body, createdAt: item.created_at, author: { displayName: item.profiles?.display_name || "Member", avatarUrl: item.profiles?.avatar_url || "", verified: item.profiles?.verification_status === "VERIFIED" }, canDelete: item.author_id === actor.actor.profileId || isAdminActor(actor.actor) })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!checkRateLimit(`comment:${actor.actor.auth0Sub}`, 30, 60).allowed) return NextResponse.json({ error: "Comment rate limit reached" }, { status: 429 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as { targetType?: unknown; targetId?: unknown; text?: unknown }; const targetType = typeof input.targetType === "string" ? input.targetType : ""; const targetId = typeof input.targetId === "string" ? input.targetId : ""; const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!CONTENT_TARGET_TYPES.includes(targetType as ContentTargetType) || !UUID.test(targetId) || text.length < 1 || text.length > 2_000) return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  const access = await resolveContentTarget(actor.actor, targetType as ContentTargetType, targetId); if (!access.allowed) return NextResponse.json({ error: access.error }, { status: access.status });
  const { data, error } = await access.db.from("content_comments").insert({ author_id: actor.actor.profileId, target_type: targetType, target_id: targetId, body: text, moderation_status: "VISIBLE" }).select("id,author_id,body,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Comment could not be created" }, { status: 502 });
  if (!access.isOwner) { const { data: author } = await access.db.from("profiles").select("display_name,avatar_url").eq("id", actor.actor.profileId).maybeSingle(); if (author) await access.db.from("notifications").insert({ user_id: access.target.ownerId, type: "NEW_COMMENT", title: "New comment", message: `${author.display_name} commented on your content.`, actor_name: author.display_name, actor_avatar: author.avatar_url, target_link: `/${targetType.toLowerCase()}/${targetId}`, is_read: false }); }
  return NextResponse.json({ comment: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const id = new URL(req.url).searchParams.get("id") || ""; if (!UUID.test(id)) return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Comments unavailable" }, { status: 503 });
  let query = db.from("content_comments").delete().eq("id", id); if (!isAdminActor(actor.actor)) query = query.eq("author_id", actor.actor.profileId);
  const { data, error } = await query.select("id").maybeSingle(); if (error) return NextResponse.json({ error: "Comment deletion failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
