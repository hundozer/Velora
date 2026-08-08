import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DECISIONS = new Set(["UNDER_REVIEW", "APPROVED", "REJECTED", "HIDDEN", "REMOVED"]);

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "content:view");
  if ("response" in auth) return auth.response;
  const status = new URL(req.url).searchParams.get("status");
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Content service unavailable" }, { status: 503 });
  let query = db.from("media_objects").select("id,owner_id,media_type,mime_type,byte_size,visibility,upload_status,processing_status,moderation_status,title,description,category,tags,moderator_note,created_at,updated_at,published_at").order("created_at", { ascending: true }).limit(200);
  if (status && DECISIONS.has(status)) query = query.eq("moderation_status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Content queue lookup failed; confirm migration 20260814 is applied" }, { status: 502 });
  return NextResponse.json({ media: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "content:moderate");
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as { id?: unknown; decision?: unknown; reason?: unknown; confirmation?: unknown };
  const id = typeof input.id === "string" ? input.id : "";
  const decision = typeof input.decision === "string" ? input.decision : "";
  const reason = typeof input.reason === "string" ? input.reason.trim().slice(0, 4_000) : "";
  if (!UUID.test(id) || !DECISIONS.has(decision) || reason.length < 10) return NextResponse.json({ error: "Valid media, decision, and a specific reason are required" }, { status: 400 });
  if (["REJECTED", "REMOVED"].includes(decision) && input.confirmation !== `CONFIRM ${decision}`) return NextResponse.json({ error: `Type CONFIRM ${decision} to continue` }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Content service unavailable" }, { status: 503 });
  const { data: before } = await db.from("media_objects").select("id,owner_id,media_type,visibility,upload_status,processing_status,moderation_status").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (decision === "APPROVED" && (before.upload_status !== "AVAILABLE" || before.processing_status !== "READY")) return NextResponse.json({ error: "Only available, fully processed media can be approved" }, { status: 409 });
  const now = new Date().toISOString();
  const update = { moderation_status: decision, moderator_note: reason, published_at: decision === "APPROVED" ? now : null, updated_at: now };
  const { data: after, error } = await db.from("media_objects").update(update).eq("id", id).select("id,owner_id,media_type,visibility,upload_status,processing_status,moderation_status,moderator_note,published_at").single();
  if (error || !after) return NextResponse.json({ error: "Media decision failed" }, { status: 502 });
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: `MEDIA_${decision}`, category: "CONTENT_MODERATION", resource_type: "MEDIA", resource_id: id, reason, previous_state: before, new_state: after, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Decision saved but audit append failed; escalate immediately" }, { status: 502 });
  await db.from("audit_events").insert({ actor_profile_id: auth.actor.profileId, actor_auth0_sub: auth.actor.auth0Sub, action: `MEDIA_${decision}`, resource_type: "MEDIA", resource_id: id, outcome: "SUCCESS", metadata: { reason } });
  return NextResponse.json({ media: after });
}
