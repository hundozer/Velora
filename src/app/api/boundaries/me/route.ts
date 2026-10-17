import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { cleanBoundaries, resolveBoundaries } from "@/lib/boundaries.mjs";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Boundaries unavailable" }, { status: 503 });
  const { data, error } = await db.from("member_boundaries").select("kind,preference").eq("profile_id", auth.actor.profileId);
  if (error) return NextResponse.json({ error: "Boundaries lookup failed" }, { status: 502 });
  return NextResponse.json({ boundaries: resolveBoundaries(data) }, { headers: noStore });
}

/** Saves the member's preferences (upsert; kinds not sent keep their current value). */
export async function PUT(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const rate = (await checkRateLimit(`boundaries:${auth.actor.userId}`, 30, 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many updates" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Boundaries unavailable" }, { status: 503 });
  const rows = cleanBoundaries(body.boundaries);
  if (rows.length === 0) return NextResponse.json({ error: "No boundary changes were supplied" }, { status: 400 });
  const profileId = auth.actor.profileId;
  const updatedAt = new Date().toISOString();
  const { error } = await db.from("member_boundaries").upsert(rows.map((row) => ({ ...row, profile_id: profileId, updated_at: updatedAt })), { onConflict: "profile_id,kind" });
  if (error) return NextResponse.json({ error: "Boundaries could not be saved" }, { status: 502 });
  await appendDurableAudit(db, { actorProfileId: profileId, actorUserId: auth.actor.userId, action: "BOUNDARIES_UPDATE", resourceType: "PROFILE", resourceId: profileId, outcome: "SUCCESS", metadata: { kinds: rows.map((row) => row.kind) } });
  const { data } = await db.from("member_boundaries").select("kind,preference").eq("profile_id", profileId);
  return NextResponse.json({ boundaries: resolveBoundaries(data) }, { headers: noStore });
}
