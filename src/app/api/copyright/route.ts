import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`copyright:${actor.actor.auth0Sub}`, 10, 24 * 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Notice limit reached" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const claimantName = typeof body.claimantName === "string" ? body.claimantName.trim() : "";
  const claimantEmail = typeof body.claimantEmail === "string" ? body.claimantEmail.trim().toLowerCase() : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.trim().slice(0, 50) : "";
  const contentId = typeof body.contentId === "string" ? body.contentId.trim().slice(0, 200) : "";
  const complaint = typeof body.complaint === "string" ? body.complaint.trim() : "";
  if (claimantName.length < 2 || !/^\S+@\S+\.\S+$/.test(claimantEmail) || !contentType || !contentId || complaint.length < 20 || complaint.length > 8_000 || body.goodFaithConfirmed !== true || body.accuracyConfirmed !== true) return NextResponse.json({ error: "Incomplete copyright notice" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Copyright service unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("copyright_notices").insert({ claimant_profile_id: actor.actor.profileId, claimant_name: claimantName, claimant_email: claimantEmail, content_type: contentType, content_id: contentId, complaint, good_faith_confirmed: true, accuracy_confirmed: true }).select("id,status,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Copyright notice failed" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "COPYRIGHT_NOTICE_CREATE", resourceId: data.id, resourceType: "COPYRIGHT_NOTICE", status: "SUCCESS" });
  return NextResponse.json({ notice: data }, { status: 201 });
}
