import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { areaById } from "@/lib/areas.mjs";
import { sceneKindLabel, validateSceneEvent } from "@/lib/scene.mjs";
import { sceneCompanyWindow } from "@/lib/sceneCompany.mjs";

// Prague Scene v0 (P1-21). Published, upcoming listings are public information
// from organisers; suggestions require a member and wait for admin review.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Scene unavailable" }, { status: 503 });
  const limit = Math.min(Math.max(Number(new URL(req.url).searchParams.get("limit")) || 30, 1), 60);
  const nowIso = new Date().toISOString();
  const eventId = new URL(req.url).searchParams.get("id");
  if (eventId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  // Past events disappear: keep those still running (ends_at) or starting within the last 6 h.
  let query = db.from("scene_events").select("id,title,kind,starts_at,ends_at,venue_name,area_id,organiser,description,url")
    .eq("status", "PUBLISHED")
    .or(`ends_at.gt.${nowIso},and(ends_at.is.null,starts_at.gt.${new Date(Date.now() - 6 * 3_600_000).toISOString()})`)
    .order("starts_at", { ascending: true })
    .limit(limit);
  if (eventId) query = query.eq("id", eventId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Scene lookup failed" }, { status: 502 });
  if (eventId && !data?.length) return NextResponse.json({ error: "Event unavailable" }, { status: 404 });
  const events = (data || []).map((row) => ({ id: row.id, title: row.title, kind: row.kind, kindLabel: sceneKindLabel(row.kind), startsAt: row.starts_at, endsAt: row.ends_at, venueName: row.venue_name, areaId: row.area_id, areaName: areaById(row.area_id)?.name || null, organiser: row.organiser, description: row.description, url: row.url, companyWindow: sceneCompanyWindow(row) }));
  return NextResponse.json({ events }, { headers: { "Cache-Control": eventId ? "private, no-store" : "public, max-age=60, stale-while-revalidate=300" } });
}

export async function POST(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Sign in to suggest a listing" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!(await checkRateLimit(`scene-suggest:${auth.actor.userId}`, 5, 24 * 60 * 60)).allowed) return NextResponse.json({ error: "You've suggested several listings today. Thank you!" }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const validated = validateSceneEvent(body);
  if (!validated.event) return NextResponse.json({ error: validated.error }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Scene unavailable" }, { status: 503 });
  const { error } = await db.from("scene_events").insert({ ...validated.event, status: "PENDING_REVIEW", submitted_by: auth.actor.profileId });
  if (error) return NextResponse.json({ error: "Suggestion could not be saved" }, { status: 502 });
  return NextResponse.json({ status: "PENDING_REVIEW" }, { status: 201 });
}
