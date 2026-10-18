import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import type { ProfileRow } from "@/lib/supabase/profileService";
import { establishedDecision, resolveBoundaries } from "@/lib/boundaries.mjs";
import { canRequest, decisionUpdate, grantIsActive } from "@/lib/privateAccess.mjs";
import { maybeSendReturnEmail } from "@/lib/notifications/returnEmails";

// Private Album Handshake (P1-06).
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };
type Db = NonNullable<ReturnType<typeof getServerSupabase>>;

async function actorAndDb(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return { error: NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 }) };
  if (!hasAdultAccess(auth.actor)) return { error: NextResponse.json({ error: "Adult access verification required" }, { status: 403 }) };
  const db = getServerSupabase();
  if (!db) return { error: NextResponse.json({ error: "Private photos unavailable" }, { status: 503 }) };
  return { actor: auth.actor, db };
}

async function blockedBetween(db: Db, first: string, second: string) {
  const { data, error } = await db.from("user_blocks").select("id").or(`and(blocker_id.eq.${first},blocked_profile_id.eq.${second}),and(blocker_id.eq.${second},blocked_profile_id.eq.${first})`).limit(1).maybeSingle();
  return Boolean(error || data);
}

async function privateCount(db: Db, ownerId: string) {
  const { count } = await db.from("media_objects").select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId).eq("visibility", "PRIVATE").eq("upload_status", "AVAILABLE").eq("moderation_status", "APPROVED").or("category.is.null,category.neq.MESSAGE");
  return count || 0;
}

/** ?ownerId= → the viewer's status toward that owner. ?scope=incoming → requests and grants on my photos. */
export async function GET(req: NextRequest) {
  const ctx = await actorAndDb(req);
  if ("error" in ctx) return ctx.error;
  const { actor, db } = ctx;
  const params = new URL(req.url).searchParams;
  const now = new Date();

  if (params.get("scope") === "incoming") {
    const { data: rows, error } = await db.from("album_access_grants").select("viewer_id,status,grant_type,expires_at,requested_at").eq("owner_id", actor.profileId).in("status", ["REQUESTED", "GRANTED"]).order("requested_at", { ascending: false }).limit(200);
    if (error) return NextResponse.json({ error: "Requests lookup failed" }, { status: 502 });
    const live = (rows || []).filter((row) => row.status === "REQUESTED" || grantIsActive(row, now));
    const ids = live.map((row) => row.viewer_id as string);
    const { data: profiles } = ids.length ? await db.from("profiles").select("*").in("id", ids).eq("account_status", "ACTIVE") : { data: [] };
    const byId = new Map((profiles || []).map((row) => [row.id as string, toMemberVisibleProfile(row as ProfileRow)]));
    const entries = live.filter((row) => byId.has(row.viewer_id)).map((row) => ({ viewer: byId.get(row.viewer_id)!, status: row.status, grantType: row.grant_type, expiresAt: row.expires_at, requestedAt: row.requested_at }));
    return NextResponse.json({ requests: entries.filter((entry) => entry.status === "REQUESTED"), grants: entries.filter((entry) => entry.status === "GRANTED") }, { headers: noStore });
  }

  const ownerId = params.get("ownerId") || "";
  if (!UUID.test(ownerId)) return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  if (ownerId === actor.profileId) return NextResponse.json({ isOwner: true, privateCount: await privateCount(db, ownerId) }, { headers: noStore });
  if (await blockedBetween(db, actor.profileId, ownerId)) return NextResponse.json({ error: "Member not available" }, { status: 404 });
  const { data: row } = await db.from("album_access_grants").select("status,grant_type,expires_at,decided_at").eq("owner_id", ownerId).eq("viewer_id", actor.profileId).maybeSingle();
  return NextResponse.json({
    isOwner: false,
    privateCount: await privateCount(db, ownerId),
    status: row?.status ?? null,
    active: grantIsActive(row, now),
    grantType: row?.grant_type ?? null,
    expiresAt: grantIsActive(row, now) ? row?.expires_at ?? null : null,
    canRequest: canRequest(row, now).ok,
  }, { headers: noStore });
}

/** Viewer asks an owner for access. */
export async function POST(req: NextRequest) {
  const ctx = await actorAndDb(req);
  if ("error" in ctx) return ctx.error;
  const { actor, db } = ctx;
  if (!(await checkRateLimit(`private-access-request:${actor.userId}`, 20, 60 * 60)).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const ownerId = typeof body.ownerId === "string" ? body.ownerId : "";
  if (!UUID.test(ownerId) || ownerId === actor.profileId) return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  if (await blockedBetween(db, actor.profileId, ownerId)) return NextResponse.json({ error: "Member not available" }, { status: 404 });

  const [{ data: owner }, { data: me }, { data: existing }, { data: boundaryRows, error: boundaryError }, { data: repliedBefore }] = await Promise.all([
    db.from("profiles").select("id,account_status").eq("id", ownerId).maybeSingle(),
    db.from("profiles").select("display_name,avatar_url").eq("id", actor.profileId).single(),
    db.from("album_access_grants").select("status,grant_type,expires_at,decided_at").eq("owner_id", ownerId).eq("viewer_id", actor.profileId).maybeSingle(),
    db.from("member_boundaries").select("kind,preference").eq("profile_id", ownerId),
    db.from("direct_messages").select("id").eq("sender_id", ownerId).eq("receiver_id", actor.profileId).limit(1).maybeSingle(),
  ]);
  if (!owner || owner.account_status !== "ACTIVE" || !me || boundaryError) return NextResponse.json({ error: "Member not available" }, { status: 404 });
  // Boundary (P1-20): Not interested = never; Ask me first = only once the owner has written to you.
  const preference = resolveBoundaries(boundaryRows).PRIVATE_ALBUM_REQUESTS;
  if (!establishedDecision(preference, Boolean(repliedBefore))) {
    return NextResponse.json({ error: preference === "NOT_INTERESTED" ? "This member isn't accepting requests for private photos." : "This member accepts photo requests once you're talking. Send a message first.", boundary: true }, { status: 403 });
  }
  const allowed = canRequest(existing);
  if (!allowed.ok) return NextResponse.json({ error: allowed.reason }, { status: 409 });

  const { error } = await db.from("album_access_grants").upsert({ owner_id: ownerId, viewer_id: actor.profileId, status: "REQUESTED", grant_type: null, expires_at: null, requested_at: new Date().toISOString(), decided_at: null }, { onConflict: "owner_id,viewer_id" });
  if (error) return NextResponse.json({ error: "Request could not be sent" }, { status: 502 });
  await db.from("notifications").insert({ user_id: ownerId, type: "PRIVATE_ACCESS_REQUEST", title: "Photo access request", message: `${me.display_name} asked to see your private photos.`, actor_name: me.display_name, actor_avatar: me.avatar_url, target_link: "/me/private-photos", is_read: false });
  await maybeSendReturnEmail(db, ownerId, "PRIVATE_ACCESS");
  return NextResponse.json({ status: "REQUESTED" }, { status: 201, headers: noStore });
}

/** Owner decides: GRANT_ONCE (24 h), GRANT (until revoked), DENY, REVOKE. */
export async function PATCH(req: NextRequest) {
  const ctx = await actorAndDb(req);
  if ("error" in ctx) return ctx.error;
  const { actor, db } = ctx;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const viewerId = typeof body.viewerId === "string" ? body.viewerId : "";
  const update = decisionUpdate(body.decision);
  if (!UUID.test(viewerId) || !update) return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  const { data, error } = await db.from("album_access_grants").update(update).eq("owner_id", actor.profileId).eq("viewer_id", viewerId).select("viewer_id").maybeSingle();
  if (error) return NextResponse.json({ error: "Decision could not be saved" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (update.status === "GRANTED") {
    const { data: me } = await db.from("profiles").select("display_name,avatar_url").eq("id", actor.profileId).single();
    if (me) await db.from("notifications").insert({ user_id: viewerId, type: "PRIVATE_ACCESS_GRANTED", title: "Photo access granted", message: update.grant_type === "ONCE" ? `${me.display_name} shared their private photos with you for 24 hours.` : `${me.display_name} shared their private photos with you.`, actor_name: me.display_name, actor_avatar: me.avatar_url, target_link: `/profile/${actor.profileId}`, is_read: false });
    await maybeSendReturnEmail(db, viewerId, "PRIVATE_ACCESS");
  }
  // Denials and revocations are silent: the requester simply sees no access.
  return NextResponse.json({ status: update.status, grantType: update.grant_type, expiresAt: update.expires_at }, { headers: noStore });
}
