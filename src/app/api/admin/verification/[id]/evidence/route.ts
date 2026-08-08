import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPresignedDownloadUrl } from "@/lib/storage/r2";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermission(req, "verification:view"); if ("response" in auth) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification evidence unavailable" }, { status: 503 });
  const { data: review } = await db.from("verification_reviews").select("id,profile_id,provider_reference").eq("id", params.id).eq("verification_type", "IDENTITY").maybeSingle();
  if (!review || !UUID.test(review.provider_reference || "")) return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  const { data: media } = await db.from("media_objects").select("id,owner_id,object_key,visibility,upload_status").eq("id", review.provider_reference).eq("owner_id", review.profile_id).maybeSingle();
  if (!media || media.visibility !== "PRIVATE" || media.upload_status !== "AVAILABLE") return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  try {
    const url = await getPresignedDownloadUrl(media.object_key);
    auditLogger.logEvent({ actorId: auth.actor.auth0Sub, actorRole: auth.actor.role as any, action: "VERIFICATION_EVIDENCE_VIEW", resourceId: params.id, resourceType: "VERIFICATION_REVIEW", status: "SUCCESS" });
    const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "VERIFICATION_EVIDENCE_VIEW", resourceType: "VERIFICATION_REVIEW", resourceId: params.id, outcome: "SUCCESS", metadata: { mediaId: media.id } });
    if (!audited) return NextResponse.json({ error: "Verification evidence access could not be audited" }, { status: 502 });
    const response = NextResponse.redirect(url, 307); response.headers.set("Cache-Control", "private, no-store"); response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive"); return response;
  } catch { return NextResponse.json({ error: "Verification evidence unavailable" }, { status: 503 }); }
}
