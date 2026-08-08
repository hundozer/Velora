import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Active adult access required" }, { status: 403 });
  if (!checkRateLimit(`identity-verification:${actor.actor.auth0Sub}`, 3, 24 * 60 * 60).allowed) return NextResponse.json({ error: "Verification submission limit reached" }, { status: 429 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const mediaId = typeof (body as { mediaId?: unknown }).mediaId === "string" ? (body as { mediaId: string }).mediaId : "";
  if (!UUID.test(mediaId)) return NextResponse.json({ error: "Invalid verification media" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification unavailable" }, { status: 503 });
  const { data: media } = await db.from("media_objects").select("id,owner_id,media_type,upload_status,visibility").eq("id", mediaId).eq("owner_id", actor.actor.profileId).maybeSingle();
  if (!media || media.media_type !== "IMAGE" || media.upload_status !== "AVAILABLE" || media.visibility !== "PRIVATE") return NextResponse.json({ error: "Private completed verification image required" }, { status: 400 });
  const { data: pending } = await db.from("verification_reviews").select("id").eq("profile_id", actor.actor.profileId).eq("verification_type", "IDENTITY").in("status", ["PENDING", "REVIEW_REQUIRED"]).maybeSingle();
  if (pending) return NextResponse.json({ error: "An identity verification is already under review", reviewId: pending.id }, { status: 409 });
  const { data: review, error } = await db.from("verification_reviews").insert({ profile_id: actor.actor.profileId, verification_type: "IDENTITY", status: "PENDING", provider_method: "MANUAL_SELFIE_R2", provider_reference: mediaId }).select("id,status,submitted_at").single();
  if (error || !review) return NextResponse.json({ error: "Verification submission failed" }, { status: 502 });
  await db.from("profiles").update({ verification_status: "PENDING_REVIEW" }).eq("id", actor.actor.profileId);
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "IDENTITY_VERIFICATION_SUBMIT", resourceId: review.id, resourceType: "VERIFICATION_REVIEW", status: "SUCCESS" });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorAuth0Sub: actor.actor.auth0Sub, action: "IDENTITY_VERIFICATION_SUBMIT", resourceType: "VERIFICATION_REVIEW", resourceId: review.id, outcome: "SUCCESS", metadata: { method: "MANUAL_SELFIE_R2" } });
  if (!audited) return NextResponse.json({ error: "Verification was submitted but its audit evidence could not be recorded", reviewId: review.id }, { status: 502 });
  return NextResponse.json({ review }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
