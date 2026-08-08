import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";
const TYPES = new Set(["CORRECTION", "RESTRICTION", "OBJECTION", "ACCESS"]);

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  const { data, error } = await db.from("privacy_requests").select("id,request_type,status,request_category,requested_at,due_at,completed_at,updated_at").eq("profile_id", actor.actor.profileId).order("requested_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Privacy requests could not be loaded" }, { status: 502 });
  return NextResponse.json({ requests: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`privacy-request:${actor.actor.auth0Sub}`, 10, 24 * 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Privacy request limit reached; contact support for urgent help" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const requestType = typeof body.requestType === "string" ? body.requestType : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  if (!TYPES.has(requestType) || details.length < 20 || details.length > 4_000) return NextResponse.json({ error: "Choose a valid right and provide 20-4000 characters of detail" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  const requestedAt = new Date(); const dueAt = new Date(requestedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const { data, error } = await db.from("privacy_requests").insert({ profile_id: actor.actor.profileId, request_type: requestType, request_category: "MEMBER_RIGHTS_REQUEST", status: "OPEN", requested_at: requestedAt.toISOString(), due_at: dueAt.toISOString(), notes: details }).select("id,request_type,status,requested_at,due_at").single();
  if (error || !data) return NextResponse.json({ error: "Privacy request could not be recorded" }, { status: 502 });
  await db.from("audit_events").insert({ actor_profile_id: actor.actor.profileId, actor_auth0_sub: actor.actor.auth0Sub, action: "PRIVACY_RIGHT_REQUEST_CREATED", resource_type: "PRIVACY_REQUEST", resource_id: data.id, outcome: "SUCCESS", metadata: { requestType } });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "PRIVACY_RIGHT_REQUEST_CREATED", resourceId: data.id, resourceType: "PRIVACY_REQUEST", status: "SUCCESS", details: { requestType } });
  return NextResponse.json({ request: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
