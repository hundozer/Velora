import { NextRequest, NextResponse } from "next/server";
import type { PostgrestError } from "@supabase/supabase-js";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";

type ExportQuery = PromiseLike<{ data: unknown; error: PostgrestError | null }>;
const rows = (result: { data: unknown }) => Array.isArray(result.data) ? result.data : [];

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`privacy-export:${actor.actor.auth0Sub}`, 3, 24 * 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Export limit reached; try again later" }, { status: 429 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  const profileId = actor.actor.profileId;
  const requestedAt = new Date().toISOString();
  const { data: requestRow, error: requestError } = await supabase.from("privacy_requests").insert({ profile_id: profileId, request_type: "EXPORT", status: "IN_PROGRESS", requested_at: requestedAt, request_category: "SELF_SERVICE_JSON" }).select("id").single();
  if (requestError || !requestRow) return NextResponse.json({ error: "Export request could not be recorded" }, { status: 502 });

  const queries: Record<string, ExportQuery> = {
    profile: supabase.from("profiles").select("*").eq("id", profileId).single(),
    consents: supabase.from("user_consents").select("consent_type,consent_version,consent_timestamp,consent_status,withdrawn_at,source,created_at").eq("profile_id", profileId),
    connections: supabase.from("connections").select("connection_type,follower_id,followed_id,created_at").or(`follower_id.eq.${profileId},followed_id.eq.${profileId}`),
    blocks: supabase.from("user_blocks").select("blocked_profile_id,created_at").eq("blocker_id", profileId),
    messages: supabase.from("direct_messages").select("id,conversation_id,sender_id,receiver_id,content,media_url,attachment_type,status,is_disappearing,disappear_timer_sec,is_opened,created_at").or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`).order("created_at", { ascending: true }).limit(50000),
    datingAds: supabase.from("dating_ads").select("*").eq("author_id", profileId),
    media: supabase.from("media_objects").select("id,media_type,mime_type,byte_size,visibility,upload_status,moderation_status,processing_status,title,description,category,tags,published_at,created_at,updated_at").eq("owner_id", profileId),
    participantDeclarations: supabase.from("content_participant_declarations").select("media_id,contains_other_identifiable_participants,all_participants_adults,recording_consented,publication_consented,declaration_version,declared_at").eq("uploader_id", profileId),
    posts: supabase.from("content_posts").select("*").eq("author_id", profileId),
    comments: supabase.from("content_comments").select("*").eq("author_id", profileId),
    savedItems: supabase.from("saved_items").select("target_type,target_id,created_at").eq("profile_id", profileId),
    reactions: supabase.from("content_reactions").select("target_type,target_id,reaction,created_at").eq("profile_id", profileId),
    notifications: supabase.from("notifications").select("type,title,message,actor_name,target_link,is_read,created_at").eq("user_id", profileId),
    submittedReports: supabase.from("moderation_cases").select("id,reported_user_id,content_type,content_id,reason,description,status,priority,decision,decision_reason,appeal_status,created_at,updated_at").eq("reporter_id", profileId),
    appeals: supabase.from("moderation_appeals").select("case_id,reason,status,decision_reason,created_at,decided_at").eq("appellant_id", profileId),
    copyrightNotices: supabase.from("copyright_notices").select("id,claimant_name,claimant_email,content_type,content_id,complaint,status,action,counter_notice,resolution,created_at,updated_at").eq("claimant_profile_id", profileId),
    verification: supabase.from("verification_reviews").select("verification_type,status,provider_method,submitted_at,reviewed_at,reason").eq("profile_id", profileId),
    privacyRequests: supabase.from("privacy_requests").select("request_type,status,requested_at,due_at,completed_at,request_category,updated_at").eq("profile_id", profileId),
  };
  const entries = await Promise.all(Object.entries(queries).map(async ([key, query]) => [key, await query] as const));
  const failed = entries.find(([, result]) => result.error);
  if (failed) {
    await supabase.from("privacy_requests").update({ status: "REJECTED_WITH_REASON", completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), notes: `Automated export failed in category: ${failed[0]}` }).eq("id", requestRow.id);
    auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "PRIVACY_EXPORT", resourceId: profileId, resourceType: "PROFILE", status: "ERROR", details: { category: failed[0] } });
    return NextResponse.json({ error: "Data export could not be completed" }, { status: 502 });
  }
  const result = Object.fromEntries(entries);
  const completedAt = new Date().toISOString();
  await supabase.from("privacy_requests").update({ status: "COMPLETED", completed_at: completedAt, updated_at: completedAt }).eq("id", requestRow.id);
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "PRIVACY_EXPORT", resourceId: profileId, resourceType: "PROFILE", status: "SUCCESS" });
  return NextResponse.json({
    generatedAt: completedAt,
    scopeNote: "Reports made about you and restricted safety records require a reviewed access request so third-party rights are protected.",
    profile: result.profile.data,
    ...Object.fromEntries(Object.entries(result).filter(([key]) => key !== "profile").map(([key, value]) => [key, rows(value)])),
  }, { headers: { "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="intimo-data-export-${completedAt.slice(0, 10)}.json"` } });
}
