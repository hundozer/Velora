import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { mayAppeal } from "@/lib/moderation/outcomes.mjs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.id)) return NextResponse.json({ error: "This decision is not eligible for appeal" }, { status: 404 });
  const rate = (await checkRateLimit(`appeal:${actor.actor.userId}`, 5, 24 * 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Appeal limit reached" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 20 || reason.length > 4_000) return NextResponse.json({ error: "Appeal reason must be 20-4000 characters" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Appeal service unavailable" }, { status: 503 });
  // FM-07: the reported member (when action was taken) or the reporter may ask for one review.
  const me = actor.actor.profileId;
  const { data: moderationCase } = await supabase.from("moderation_cases").select("id,reporter_id,reported_user_id,status,appeal_status,action_taken").eq("id", params.id).or(`reporter_id.eq.${me},reported_user_id.eq.${me}`).maybeSingle();
  if (!moderationCase || !mayAppeal(moderationCase, me)) return NextResponse.json({ error: "This decision is not eligible for appeal" }, { status: 409 });
  const { data, error } = await supabase.rpc("intimo_create_appeal", { p_case_id: moderationCase.id, p_appellant_id: actor.actor.profileId, p_reason: reason });
  if (error || !data) return NextResponse.json({ error: "Appeal could not be submitted" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "MODERATION_APPEAL_CREATE", resourceId: moderationCase.id, resourceType: "MODERATION_CASE", status: "SUCCESS" });
  return NextResponse.json({ appeal: data }, { status: 201 });
}
