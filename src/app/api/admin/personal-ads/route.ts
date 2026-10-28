import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, "content:moderate");
  if ("response" in guard) return guard.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const { data, error } = await db.from("personal_ads").select("id,author_id,category,title,body,boundaries,area_id,created_at,expires_at").eq("moderation_status", "PENDING_REVIEW").eq("status", "ACTIVE").order("created_at", { ascending: true }).limit(200);
  if (error) return NextResponse.json({ error: "Dating ads review unavailable" }, { status: 502 });
  return NextResponse.json({ ads: data || [] }, { headers: noStore });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminPermission(req, "content:moderate");
  if ("response" in guard) return guard.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid decision" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "APPROVED" || body.decision === "REJECTED" ? body.decision : null;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!UUID.test(id) || !decision || reason.length < 10) return NextResponse.json({ error: "Provide a decision and a review reason of at least 10 characters" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const { data, error } = await db.from("personal_ads").update({ moderation_status: decision, updated_at: new Date().toISOString() }).eq("id", id).eq("moderation_status", "PENDING_REVIEW").eq("status", "ACTIVE").select("id,author_id,title").maybeSingle();
  if (error) return NextResponse.json({ error: "Decision could not be saved" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Ad was already reviewed or closed" }, { status: 409 });
  const audited = await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: `PERSONAL_AD_${decision}`, resourceType: "PERSONAL_AD", resourceId: id, outcome: "SUCCESS", metadata: { reason } });
  if (!audited) return NextResponse.json({ error: "Decision saved but audit recording failed; contact support" }, { status: 503 });
  const { error: noticeError } = await db.from("notifications").insert({ user_id: data.author_id, type: "CONTENT_REVIEW", title: decision === "APPROVED" ? "Your dating ad is live" : "Your dating ad was not published", message: decision === "APPROVED" ? "Your dating ad is now visible to adult members." : reason, actor_name: "Intimo moderation", actor_avatar: null, target_link: "/dating?mine=1", is_read: false });
  return NextResponse.json({ id, moderationStatus: decision, notificationWarning: noticeError ? "Decision saved, but the member notice failed. Do not repeat the decision." : null }, { headers: noStore });
}
