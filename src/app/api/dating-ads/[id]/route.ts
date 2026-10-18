import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/auth/auditLogger";
import { hasAdultAccess } from "@/lib/auth/serverActor";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Active adult access required" }, { status: 403 });
  if (!uuid.test(params.id)) return NextResponse.json({ error: "Invalid ad identifier" }, { status: 400 });
  if (!(await checkRateLimit(`plan-end:${actor.actor.userId}`, 20, 60 * 60)).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  // Plans expire on their own; the only member action is ending one early.
  if ((body as { action?: unknown }).action !== "END") return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Plans unavailable" }, { status: 503 });
  const { data, error } = await db.from("dating_ads").update({ status: "closed" }).eq("id", params.id).eq("author_id", actor.actor.profileId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Plan could not be ended" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "PLAN_END", resourceType: "DATING_AD", resourceId: params.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Plan ended but audit recording failed; contact support" }, { status: 503 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "PLAN_END", resourceId: params.id, resourceType: "DATING_AD", status: "SUCCESS" });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!uuid.test(params.id)) return NextResponse.json({ error: "Invalid ad identifier" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("dating_ads").delete().eq("id", params.id).eq("author_id", actor.actor.profileId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Dating ad deletion failed" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Dating ad not found" }, { status: 404 });
  const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "DATING_AD_DELETE", resourceType: "DATING_AD", resourceId: params.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Dating ad deleted but audit recording failed; contact support" }, { status: 503 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "DATING_AD_DELETE", resourceId: params.id, resourceType: "DATING_AD", status: "SUCCESS" });
  return NextResponse.json({ success: true });
}
