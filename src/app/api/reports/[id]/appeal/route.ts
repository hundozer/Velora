import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`appeal:${actor.actor.auth0Sub}`, 5, 24 * 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Appeal limit reached" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 20 || reason.length > 4_000) return NextResponse.json({ error: "Appeal reason must be 20-4000 characters" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Appeal service unavailable" }, { status: 503 });
  const { data: moderationCase } = await supabase.from("moderation_cases").select("id,reported_user_id,status,appeal_status,assigned_moderator").eq("id", params.id).eq("reported_user_id", actor.actor.profileId).maybeSingle();
  if (!moderationCase || !["RESOLVED", "REJECTED"].includes(moderationCase.status) || moderationCase.appeal_status !== "NONE") return NextResponse.json({ error: "This decision is not eligible for appeal" }, { status: 409 });
  const { data, error } = await supabase.rpc("intimo_create_appeal", { p_case_id: moderationCase.id, p_appellant_id: actor.actor.profileId, p_reason: reason });
  if (error || !data) return NextResponse.json({ error: "Appeal could not be submitted" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "MODERATION_APPEAL_CREATE", resourceId: moderationCase.id, resourceType: "MODERATION_CASE", status: "SUCCESS" });
  return NextResponse.json({ appeal: data }, { status: 201 });
}
