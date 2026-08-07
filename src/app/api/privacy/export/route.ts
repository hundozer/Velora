import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`privacy-export:${actor.actor.auth0Sub}`, 3, 24 * 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Export limit reached; try again later" }, { status: 429 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  const profileId = actor.actor.profileId;
  const [profile, consents, connections, messages, ads] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).single(),
    supabase.from("user_consents").select("consent_type,consent_version,consent_timestamp,consent_status,withdrawn_at").eq("profile_id", profileId),
    supabase.from("connections").select("connection_type,follower_id,followed_id,created_at").or(`follower_id.eq.${profileId},followed_id.eq.${profileId}`),
    supabase.from("direct_messages").select("id,conversation_id,sender_id,receiver_id,content,media_url,attachment_type,status,created_at").or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`).order("created_at", { ascending: true }),
    supabase.from("dating_ads").select("*").eq("author_id", profileId),
  ]);
  if (profile.error || consents.error || connections.error || messages.error || ads.error) return NextResponse.json({ error: "Data export could not be completed" }, { status: 502 });
  await supabase.from("privacy_requests").insert({ profile_id: profileId, request_type: "EXPORT", status: "COMPLETED", completed_at: new Date().toISOString() });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "PRIVACY_EXPORT", resourceId: profileId, resourceType: "PROFILE", status: "SUCCESS" });
  return NextResponse.json({ generatedAt: new Date().toISOString(), profile: profile.data, consents: consents.data || [], connections: connections.data || [], messages: messages.data || [], datingAds: ads.data || [] }, {
    headers: { "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="intimo-data-export-${new Date().toISOString().slice(0, 10)}.json"` },
  });
}
