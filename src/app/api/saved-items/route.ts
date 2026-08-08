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
  return NextResponse.json({ items: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
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
