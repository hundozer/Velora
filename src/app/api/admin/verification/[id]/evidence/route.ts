import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { deliverMedia } from "@/lib/media/delivery";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermission(req, "verification:view"); if ("response" in auth) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification evidence unavailable" }, { status: 503 });
  const { data: review } = await db.from("verification_reviews").select("id,profile_id,provider_reference").eq("id", params.id).in("verification_type", ["IDENTITY", "AGE"]).maybeSingle();
  if (!review || !UUID.test(review.provider_reference || "")) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  const { data: media } = await db.from("media_objects").select("id,owner_id,object_key,mime_type,visibility,upload_status").eq("id", review.provider_reference).eq("owner_id", review.profile_id).maybeSingle();
  if (!media || media.visibility !== "PRIVATE" || media.upload_status !== "AVAILABLE") return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  try {
    auditLogger.logEvent({ actorId: auth.actor.userId, actorRole: auth.actor.role as any, action: "VERIFICATION_EVIDENCE_VIEW", resourceId: params.id, resourceType: "VERIFICATION_REVIEW", status: "SUCCESS" });
    const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "VERIFICATION_EVIDENCE_VIEW", resourceType: "VERIFICATION_REVIEW", resourceId: params.id, outcome: "SUCCESS", metadata: { mediaId: media.id } });
    if (!audited) return NextResponse.json({ error: "Verification evidence access could not be audited" }, { status: 502 });
    // FM-03: proxy re-encoded bytes (no EXIF or GPS) rather than redirecting to a reusable
    // five-minute storage URL that would also serve the untouched original.
    return await deliverMedia(media.object_key, media.mime_type || "image/jpeg");
  } catch { return NextResponse.json({ error: "Verification evidence unavailable" }, { status: 503 }); }
}
