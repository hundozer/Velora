import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { areaById } from "@/lib/areas.mjs";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
const publicFields = "id,host_id,title,description,area_id,starts_at,ends_at,capacity,status";

async function member(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return { error: reply({ error: "Sign in to join a Guest List" }, auth.status === "unauthenticated" ? 401 : 503) };
  if (!hasAdultAccess(auth.actor)) return { error: reply({ error: "Active adult account required" }, 403) };
  const db = getServerSupabase();
  return db ? { actor: auth.actor, db } : { error: reply({ error: "Guest List unavailable" }, 503) };
}

export async function GET(req: NextRequest) {
  const access = await member(req);
  if ("error" in access) return access.error;
  const { db, actor } = access;
  const now = new Date().toISOString();
  const id = req.nextUrl.searchParams.get("id");
  if (id && !uuid.test(id)) return reply({ error: "Invalid gathering" }, 400);
  let query = db.from("guest_nights").select(publicFields).eq("status", "PUBLISHED").gt("ends_at", now).order("starts_at").limit(30);
  if (id) query = query.eq("id", id);
  const { data: nights, error } = await query;
  if (error) return reply({ error: "Guest List unavailable" }, 502);
  const hostIds = [...new Set((nights || []).map(n => n.host_id))];
  const [hosts, blocks, requests] = await Promise.all([
    hostIds.length ? db.from("profiles").select("id,display_name,account_status,discovery_disabled,auth_id").in("id", hostIds) : Promise.resolve({ data: [], error: null }),
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${actor.profileId},blocked_profile_id.eq.${actor.profileId}`),
    db.from("guest_requests").select("id,night_id,applicant_id,pitch,status").or(`applicant_id.eq.${actor.profileId},night_id.in.(${(nights || []).filter(n => n.host_id === actor.profileId).map(n => n.id).join(",") || "00000000-0000-4000-8000-000000000000"})`).limit(100),
  ]);
  if (hosts.error || blocks.error || requests.error) return reply({ error: "Guest List unavailable" }, 502);
  const hidden = new Set((blocks.data || []).map(b => b.blocker_id === actor.profileId ? b.blocked_profile_id : b.blocker_id));
  const byHost = new Map((hosts.data || []).map(h => [h.id, h]));
  const visible = (nights || []).filter(n => {
    const host = byHost.get(n.host_id);
    return host && host.account_status === "ACTIVE" && host.auth_id && !hidden.has(n.host_id) && (n.host_id === actor.profileId || !host.discovery_disabled);
  });
  const accepted = (requests.data || []).filter(r => r.applicant_id === actor.profileId && r.status === "ACCEPTED").map(r => r.night_id);
  const addressRows = accepted.length ? await db.from("guest_nights").select("id,exact_address").in("id", accepted) : { data: [], error: null };
  if (addressRows.error) return reply({ error: "Guest List unavailable" }, 502);
  const addresses = new Map((addressRows.data || []).map(n => [n.id, n.exact_address]));
  const applicantIds = [...new Set((requests.data || []).filter(r => visible.some(n => n.host_id === actor.profileId && n.id === r.night_id)).map(r => r.applicant_id))];
  const people = applicantIds.length ? await db.from("profiles").select("id,display_name,account_status").in("id", applicantIds) : { data: [], error: null };
  if (people.error) return reply({ error: "Guest List unavailable" }, 502);
  const names = new Map((people.data || []).filter(p => p.account_status === "ACTIVE").map(p => [p.id, p.display_name]));
  return reply({ nights: visible.map(n => ({
    id: n.id, title: n.title, description: n.description, hostId: n.host_id, hostName: byHost.get(n.host_id)?.display_name,
    areaName: areaById(n.area_id)?.name || "Prague", startsAt: n.starts_at, endsAt: n.ends_at, capacity: n.capacity,
    isHost: n.host_id === actor.profileId,
    myRequest: (requests.data || []).find(r => r.night_id === n.id && r.applicant_id === actor.profileId) || null,
    address: addresses.get(n.id) || null,
    requests: n.host_id === actor.profileId ? (requests.data || []).filter(r => r.night_id === n.id && names.has(r.applicant_id) && !hidden.has(r.applicant_id)).map(r => ({ id: r.id, status: r.status, pitch: r.pitch, applicantName: names.get(r.applicant_id), applicantId: r.applicant_id })) : undefined,
  })) });
}

export async function POST(req: NextRequest) {
  const access = await member(req); if ("error" in access) return access.error;
  const { db, actor } = access;
  if (!(await checkRateLimit(`guest-request:${actor.userId}`, 10, 3600)).allowed) return reply({ error: "Try again later" }, 429);
  if (Number(req.headers.get("content-length") || 0) > 4096) return reply({ error: "Request too large" }, 413);
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return reply({ error: "Invalid request" }, 400); }
  const id = body?.nightId, pitch = typeof body?.pitch === "string" ? body.pitch.trim() : "";
  if (typeof id !== "string" || !uuid.test(id) || pitch.length < 20 || pitch.length > 500) return reply({ error: "Write a short private introduction (20–500 characters)" }, 400);
  const { data: night, error } = await db.from("guest_nights").select("id,host_id").eq("id", id).eq("status", "PUBLISHED").gt("starts_at", new Date().toISOString()).maybeSingle();
  if (error) return reply({ error: "Gathering unavailable" }, 502);
  if (!night || night.host_id === actor.profileId) return reply({ error: "Gathering unavailable" }, 404);
  const result = await db.rpc("intimo_guest_request", { p_applicant: actor.profileId, p_night: id, p_pitch: pitch });
  if (result.error || !result.data) return reply({ error: "You have already requested this Guest List, or it is unavailable" }, 409);
  await appendDurableAudit(db, { actorProfileId: actor.profileId, actorUserId: actor.userId, action: "GUEST_REQUEST", resourceType: "GUEST_NIGHT", resourceId: id, outcome: "SUCCESS" });
  return reply({ id: result.data, status: "REQUESTED" }, 201);
}

export async function PATCH(req: NextRequest) {
  const access = await member(req); if ("error" in access) return access.error;
  const { db, actor } = access;
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return reply({ error: "Invalid decision" }, 400); }
  if (body?.status === "CANCELLED" && uuid.test(String(body.nightId || ""))) {
    const { data, error } = await db.from("guest_nights").update({ status: "CANCELLED" }).eq("id", body.nightId).eq("host_id", actor.profileId).eq("status", "PUBLISHED").select("id").maybeSingle();
    if (error) return reply({ error: "Cancellation unavailable" }, 502);
    if (!data) return reply({ error: "Gathering unavailable" }, 404);
    await appendDurableAudit(db, { actorProfileId: actor.profileId, actorUserId: actor.userId, action: "GUEST_CANCEL", resourceType: "GUEST_NIGHT", resourceId: data.id, outcome: "SUCCESS" });
    return reply({ status: "CANCELLED" });
  }
  if (!uuid.test(String(body?.requestId || "")) || !["ACCEPTED", "DECLINED"].includes(String(body.status))) return reply({ error: "Invalid decision" }, 400);
  const { data, error } = await db.rpc("intimo_guest_decide", { p_host: actor.profileId, p_request: body.requestId, p_accept: body.status === "ACCEPTED" });
  if (error) return reply({ error: "Decision unavailable" }, 502);
  if (!data) return reply({ error: "Request no longer eligible or no places remain" }, 409);
  await appendDurableAudit(db, { actorProfileId: actor.profileId, actorUserId: actor.userId, action: "GUEST_DECIDE", resourceType: "GUEST_REQUEST", resourceId: String(body.requestId), outcome: "SUCCESS", metadata: { status: body.status } });
  return reply({ status: body.status });
}

export async function DELETE(req: NextRequest) {
  const access = await member(req); if ("error" in access) return access.error;
  const { db, actor } = access;
  const id = req.nextUrl.searchParams.get("requestId");
  if (!id || !uuid.test(id)) return reply({ error: "Invalid request" }, 400);
  const { data, error } = await db.from("guest_requests").delete().eq("id", id).eq("applicant_id", actor.profileId).in("status", ["REQUESTED", "ACCEPTED"]).select("id").maybeSingle();
  if (error) return reply({ error: "Withdrawal unavailable" }, 502);
  if (!data) return reply({ error: "Request unavailable" }, 404);
  await appendDurableAudit(db, { actorProfileId: actor.profileId, actorUserId: actor.userId, action: "GUEST_WITHDRAW", resourceType: "GUEST_REQUEST", resourceId: id, outcome: "SUCCESS" });
  return reply({ status: "WITHDRAWN" });
}
