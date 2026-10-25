import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { areaById } from "@/lib/areas.mjs";

export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate"); if ("response" in guard) return guard.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Guest List unavailable" }, { status: 503 });
  const { data, error } = await db.from("guest_nights").select("id,title,starts_at,status,host_id,capacity,area_id").gte("starts_at", new Date(Date.now() - 86_400_000).toISOString()).order("starts_at").limit(100);
  return error ? NextResponse.json({ error: "Guest List unavailable" }, { status: 502 }) : NextResponse.json({ nights: data }, { headers: noStore });
}

/** Only MFA-authorized community admins can publish a verified real host and address. */
export async function POST(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate"); if ("response" in guard) return guard.response;
  if (Number(req.headers.get("content-length") || 0) > 8192) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid gathering" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const address = typeof body.exactAddress === "string" ? body.exactAddress.trim() : "";
  const starts = typeof body.startsAt === "string" ? Date.parse(body.startsAt) : NaN;
  const ends = typeof body.endsAt === "string" ? Date.parse(body.endsAt) : NaN;
  const capacity = Number(body.capacity);
  if (!uuid.test(String(body.hostId || "")) || body.confirmedHostParticipation !== true || title.length < 8 || title.length > 100 || description.length < 20 || description.length > 1000 || address.length < 8 || address.length > 240 || !Number.isInteger(capacity) || capacity < 2 || capacity > 12 || !Number.isFinite(starts) || starts < Date.now() + 3_600_000 || starts > Date.now() + 90 * 86400_000 || !Number.isFinite(ends) || ends <= starts || ends - starts > 24 * 3_600_000 || !areaById(String(body.areaId || ""))) return NextResponse.json({ error: "Confirm a real host, time, area, address and small guest limit" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Guest List unavailable" }, { status: 503 });
  const { data: host, error: hostError } = await db.from("profiles").select("id,account_status,age_verification_status,auth_id").eq("id", body.hostId).maybeSingle();
  if (hostError || !host || host.account_status !== "ACTIVE" || !host.auth_id || !["AGE_DECLARED", "AGE_VERIFIED"].includes(host.age_verification_status)) return NextResponse.json({ error: "Host unavailable" }, { status: 409 });
  const { data, error } = await db.from("guest_nights").insert({ host_id: host.id, title, description, starts_at: new Date(starts).toISOString(), ends_at: new Date(ends).toISOString(), capacity, area_id: body.areaId, exact_address: address, status: "PUBLISHED" }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Gathering could not be published" }, { status: 502 });
  await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: "GUEST_PUBLISH", resourceType: "GUEST_NIGHT", resourceId: data.id, outcome: "SUCCESS" });
  return NextResponse.json({ id: data.id }, { status: 201, headers: noStore });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate"); if ("response" in guard) return guard.response;
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid cancellation" }, { status: 400 }); }
  if (!uuid.test(String(body.id || "")) || body.status !== "CANCELLED") return NextResponse.json({ error: "Invalid cancellation" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Guest List unavailable" }, { status: 503 });
  const { data, error } = await db.from("guest_nights").update({ status: "CANCELLED" }).eq("id", body.id).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Gathering unavailable" }, { status: error ? 502 : 404 });
  await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: "GUEST_CANCEL", resourceType: "GUEST_NIGHT", resourceId: data.id, outcome: "SUCCESS" });
  return NextResponse.json({ status: "CANCELLED" }, { headers: noStore });
}

/** Manual pilot retention: remove ended gatherings and all their private pitches/address. */
export async function DELETE(req: NextRequest) {
  const guard = await requireAdminPermission(req, "community:moderate"); if ("response" in guard) return guard.response;
  const id = req.nextUrl.searchParams.get("id");
  if (!id || !uuid.test(id)) return NextResponse.json({ error: "Invalid gathering" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Guest List unavailable" }, { status: 503 });
  const { data, error } = await db.from("guest_nights").delete().eq("id", id).lt("ends_at", new Date().toISOString()).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Only ended gatherings can be removed" }, { status: error ? 502 : 409 });
  await appendDurableAudit(db, { actorProfileId: guard.actor.profileId, actorUserId: guard.actor.userId, action: "GUEST_PURGE", resourceType: "GUEST_NIGHT", resourceId: id, outcome: "SUCCESS" });
  return NextResponse.json({ deleted: true }, { headers: noStore });
}
