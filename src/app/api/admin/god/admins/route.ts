import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata } from "@/lib/auth/adminApi";
import { requireGodMode } from "@/lib/auth/godMode";
import { ADMIN_ROLES } from "@/lib/auth/adminAuthorization";
import { getServerSupabase } from "@/lib/supabase/server";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req: NextRequest) { const god = await requireGodMode(req, "admin_roles:manage"); if ("response" in god) return god.response; const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Admin management unavailable" }, { status: 503 }); const { data, error } = await db.from("admin_assignments").select("id,profile_id,role,status,grant_reason,granted_at,revoked_at").order("granted_at", { ascending: false }); return error ? NextResponse.json({ error: "Admin assignments unavailable" }, { status: 502 }) : NextResponse.json({ assignments: data || [] }, { headers: { "Cache-Control": "private, no-store" } }); }
export async function PATCH(req: NextRequest) {
  const god = await requireGodMode(req, "admin_roles:manage"); if ("response" in god) return god.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const target = typeof body.profileId === "string" ? body.profileId : ""; const role = typeof body.role === "string" ? body.role : ""; const operation = body.operation; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0,1000) : "";
  if (!UUID.test(target) || !ADMIN_ROLES.includes(role) || !["GRANT","REVOKE","SUSPEND"].includes(operation) || !reason || body.confirmation !== `CONFIRM ${operation} ${role}`) return NextResponse.json({ error: "Valid assignment, reason and exact confirmation required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Admin management unavailable" }, { status: 503 });
  const { data: before } = await db.from("admin_assignments").select("*").eq("profile_id", target).maybeSingle();
  if (operation !== "GRANT" && !before) return NextResponse.json({ error: "Admin assignment not found" }, { status: 404 });
  if (target === god.actor.profileId && role === "SUPER_ADMIN" && operation !== "GRANT") { const { count } = await db.from("admin_assignments").select("id", { count: "exact", head: true }).eq("role", "SUPER_ADMIN").eq("status", "ACTIVE"); if ((count || 0) <= 1) return NextResponse.json({ error: "The last active SUPER_ADMIN cannot remove or suspend themselves" }, { status: 409 }); }
  let after: any;
  if (operation === "GRANT") { const result = await db.from("admin_assignments").upsert({ profile_id: target, role, status: "ACTIVE", granted_by: god.actor.profileId, grant_reason: reason, granted_at: new Date().toISOString(), revoked_by: null, revoked_at: null, revoke_reason: null }, { onConflict: "profile_id" }).select("*").single(); if (result.error) return NextResponse.json({ error: "Admin grant failed" }, { status: 502 }); after = result.data; }
  else { const status = operation === "REVOKE" ? "REVOKED" : "SUSPENDED"; const result = await db.from("admin_assignments").update({ status, revoked_by: god.actor.profileId, revoked_at: new Date().toISOString(), revoke_reason: reason }).eq("profile_id", target).select("*").single(); if (result.error) return NextResponse.json({ error: "Admin assignment update failed" }, { status: 502 }); after = result.data; }
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: god.actor.profileId, actor_role: "SUPER_ADMIN", action: `ADMIN_ASSIGNMENT_${operation}`, category: role === "SUPER_ADMIN" ? "CRITICAL_PRIVILEGE" : "ADMINISTRATION", resource_type: "ADMIN_ASSIGNMENT", resource_id: target, reason, previous_state: before || {}, new_state: after || {}, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Assignment changed but audit failed; escalate immediately" }, { status: 502 }); return NextResponse.json({ assignment: after });
}
