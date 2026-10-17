import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { planCategoryLabel } from "@/lib/plans.mjs";

// First-Plan review (P1-18). Plans go live immediately; moderators approve or
// reject queued ones. Rejection hides the plan everywhere and tells the author why.
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, "content:moderate");
  if ("response" in guard) return guard.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Plans unavailable" }, { status: 503 });
  const { data, error } = await db.from("dating_ads").select("id,author_id,author_name,category,title,text,area_id,status,moderation_status,expires_at,created_at").eq("moderation_status", "PENDING_REVIEW").order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: "Plans lookup failed" }, { status: 502 });
  return NextResponse.json({ plans: (data || []).map((row) => ({ ...row, categoryLabel: planCategoryLabel(row.category) })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminPermission(req, "content:moderate");
  if ("response" in guard) return guard.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "APPROVED" || body.decision === "REJECTED" ? body.decision : null;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!UUID.test(id) || !decision) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  if (decision === "REJECTED" && reason.length < 10) return NextResponse.json({ error: "Give the author a reason of at least 10 characters." }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Plans unavailable" }, { status: 503 });
  const { data, error } = await db.from("dating_ads").update({ moderation_status: decision }).eq("id", id).select("id,author_id,title").maybeSingle();
  if (error) return NextResponse.json({ error: "Decision could not be saved" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  if (decision === "REJECTED") {
    await db.from("notifications").insert({ user_id: data.author_id, type: "PLAN_REMOVED", title: "Your plan was removed", message: `"${String(data.title).slice(0, 60)}" was removed: ${reason}`, actor_name: "Intimo moderation", actor_avatar: null, target_link: "/community-guidelines", is_read: false });
  }
  const audited = await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: decision === "APPROVED" ? "PLAN_APPROVE" : "PLAN_REJECT", resourceType: "DATING_AD", resourceId: id, outcome: "SUCCESS", metadata: { reason: reason || null } });
  if (!audited) return NextResponse.json({ error: "Decision saved but audit evidence failed" }, { status: 502 });
  return NextResponse.json({ id, moderationStatus: decision });
}
