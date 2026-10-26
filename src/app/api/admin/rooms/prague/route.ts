import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate"); if ("response" in guard) return guard.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Room unavailable" }, { status: 503 });
  const { data, error } = await db.from("room_messages").select("id,room_id,sender_id,body,status,created_at").order("created_at", { ascending: false }).limit(100);
  return error ? NextResponse.json({ error: "Room unavailable" }, { status: 502 }) : NextResponse.json({ messages: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate"); if ("response" in guard) return guard.response;
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid removal" }, { status: 400 }); }
  if (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id) || typeof body.reason !== "string" || body.reason.trim().length < 10 || body.reason.length > 500) return NextResponse.json({ error: "Message and reason required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Room unavailable" }, { status: 503 });
  const { data, error } = await db.from("room_messages").update({ status: "REMOVED" }).eq("id", body.id).eq("status", "VISIBLE").select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Message unavailable" }, { status: error ? 502 : 404 });
  await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: "ROOM_MESSAGE_MODERATE", resourceType: "ROOM_MESSAGE", resourceId: data.id, outcome: "SUCCESS", metadata: { reason: body.reason.trim() } });
  return NextResponse.json({ removed: true }, { headers: { "Cache-Control": "private, no-store" } });
}
