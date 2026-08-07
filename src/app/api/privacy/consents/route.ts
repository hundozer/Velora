import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";
const CONSENT_VERSION = "sensitive-profile-v1-draft";
const CONSENT_TYPES = new Set(["SPECIAL_CATEGORY_PROFILE", "PERSONALIZED_DISCOVERY"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return noStore(NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 }));
  const supabase = getServerSupabase();
  if (!supabase) return noStore(NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 }));
  const { data, error } = await supabase.from("user_consents").select("consent_type,consent_version,consent_timestamp,consent_status,withdrawn_at").eq("profile_id", actor.actor.profileId).order("consent_timestamp", { ascending: false });
  if (error) return noStore(NextResponse.json({ error: "Consent lookup failed" }, { status: 502 }));
  return noStore(NextResponse.json({ consents: data || [], currentVersion: CONSENT_VERSION }));
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return noStore(NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 }));
  const rate = checkRateLimit(`consent:${actor.actor.auth0Sub}`, 20, 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many consent changes" }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const consentType = typeof input.consentType === "string" ? input.consentType : "";
  const granted = input.granted;
  if (!CONSENT_TYPES.has(consentType) || typeof granted !== "boolean") return NextResponse.json({ error: "Invalid consent choice" }, { status: 400 });
  const now = new Date().toISOString();
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  const { error } = await supabase.from("user_consents").insert({
    profile_id: actor.actor.profileId,
    consent_type: consentType,
    consent_version: CONSENT_VERSION,
    consent_timestamp: now,
    consent_status: granted ? "GRANTED" : "WITHDRAWN",
    withdrawn_at: granted ? null : now,
    source: "PRIVACY_CENTER",
  });
  if (error) return NextResponse.json({ error: "Consent update failed" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: granted ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN", resourceType: "CONSENT", status: "SUCCESS", details: { consentType, consentVersion: CONSENT_VERSION } });
  return noStore(NextResponse.json({ consentType, consentVersion: CONSENT_VERSION, status: granted ? "GRANTED" : "WITHDRAWN", timestamp: now }));
}
