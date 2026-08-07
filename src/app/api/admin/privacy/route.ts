import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

const STATUSES = new Set(["OPEN","IDENTITY_CONFIRMATION_REQUIRED","IN_PROGRESS","COMPLETED","REJECTED_WITH_REASON","LEGAL_REVIEW"]);
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "privacy:view"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Privacy administration unavailable" }, { status: 503 });
  const { data, error } = await db.from("privacy_requests").select("id,profile_id,request_type,request_category,status,requested_at,due_at,completed_at,assigned_admin_id,notes,updated_at").order("requested_at", { ascending: true }).limit(250);
  if (error) return NextResponse.json({ error: "Privacy queue failed" }, { status: 502 });
  return NextResponse.json({ requests: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "privacy:process"); if ("response" in auth) return auth.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : ""; const status = typeof body.status === "string" ? body.status : ""; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 4000) : "";
  if (!id || !STATUSES.has(status) || !reason) return NextResponse.json({ error: "Request, status and reason are required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Privacy administration unavailable" }, { status: 503 });
  const { data: before } = await db.from("privacy_requests").select("*").eq("id", id).maybeSingle(); if (!before) return NextResponse.json({ error: "Privacy request not found" }, { status: 404 });
  const update = { status, assigned_admin_id: auth.actor.profileId, notes: reason, updated_at: new Date().toISOString(), completed_at: status === "COMPLETED" ? new Date().toISOString() : null };
  const { data: after, error } = await db.from("privacy_requests").update(update).eq("id", id).select("*").single(); if (error || !after) return NextResponse.json({ error: "Privacy request update failed" }, { status: 502 });
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "PRIVACY_REQUEST_STATUS_CHANGED", category: before.request_type, resource_type: "PRIVACY_REQUEST", resource_id: id, reason, previous_state: { status: before.status, assigned_admin_id: before.assigned_admin_id }, new_state: { status, assigned_admin_id: auth.actor.profileId }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Privacy action audit failed" }, { status: 502 });
  return NextResponse.json({ request: after });
}
