import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { validateSceneEvent } from "@/lib/scene.mjs";

// Admin curation for Prague Scene (P1-21).
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate");
  if ("response" in guard) return guard.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Scene unavailable" }, { status: 503 });
  const { data, error } = await db.from("scene_events").select("*").gte("starts_at", new Date(Date.now() - 86_400_000).toISOString()).order("starts_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: "Scene lookup failed" }, { status: 502 });
  return NextResponse.json({ events: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

/** Admin adds a listing; it is published immediately. */
export async function POST(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate");
  if ("response" in guard) return guard.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const validated = validateSceneEvent(body);
  if (!validated.event) return NextResponse.json({ error: validated.error }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Scene unavailable" }, { status: 503 });
  const now = new Date().toISOString();
  const { data, error } = await db.from("scene_events").insert({ ...validated.event, status: "PUBLISHED", reviewed_by: guard.actor.profileId, reviewed_at: now }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Listing could not be saved" }, { status: 502 });
  await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: "SCENE_EVENT_PUBLISH", resourceType: "SCENE_EVENT", resourceId: data.id, outcome: "SUCCESS" });
  return NextResponse.json({ id: data.id, status: "PUBLISHED" }, { status: 201 });
}

/** Publish or reject a suggestion, or unpublish a listing. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate");
  if ("response" in guard) return guard.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === "PUBLISHED" || body.status === "REJECTED" ? body.status : null;
  if (!UUID.test(id) || !status) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Scene unavailable" }, { status: 503 });
  const { data, error } = await db.from("scene_events").update({ status, reviewed_by: guard.actor.profileId, reviewed_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Decision could not be saved" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: status === "PUBLISHED" ? "SCENE_EVENT_PUBLISH" : "SCENE_EVENT_REJECT", resourceType: "SCENE_EVENT", resourceId: id, outcome: "SUCCESS" });
  return NextResponse.json({ id, status });
}
