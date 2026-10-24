import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { MAX_LIVE_PLANS, endsInLabel, planCategoryLabel, planStartsAt, validatePlanInput } from "@/lib/plans.mjs";
import { eligibilityText, planAudienceText, planReplyEligibility, type Eligibility } from "@/lib/planEligibility.mjs";
import { areaById, distanceBucket, DISTANCE_BUCKET_LABELS } from "@/lib/areas.mjs";
import { sceneCompanyWindow, scenePlanCurrent } from "@/lib/sceneCompany.mjs";

// Tonight / Plans (P1-07). Stored in dating_ads; members-only, server-mediated.
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };
const LEGACY_PLAN_COLUMNS = "id,author_id,category,title,text,validity_days,expires_at,area_id,allowed_reply_genders,min_age,max_age,require_verified,require_media,status,moderation_status,created_at";
// starts_at arrives with migration 20261102; until it is applied, reads and writes fall back.
const PLAN_COLUMNS = `${LEGACY_PLAN_COLUMNS},starts_at,scene_event_id`;
const UNDEFINED_COLUMN = "42703";

type PlanRow = { id: string; author_id: string; category: string; title: string; text: string; expires_at: string; starts_at?: string | null; scene_event_id?: string | null; area_id: string | null; allowed_reply_genders: string[]; min_age: number; max_age: number; require_verified: boolean; require_media: boolean; status: string; moderation_status: string; created_at: string };
type Author = { id: string; display_name: string; avatar_url: string | null; age: number | null; is_couple_profile: boolean; verification_status: string; area_id: string | null };

function toPlan(row: PlanRow, author: Author | undefined, viewerAreaId: string | null, viewerId: string, now: Date, eligibility?: Eligibility) {
  const bucket = viewerAreaId && row.area_id ? distanceBucket(viewerAreaId, row.area_id) : null;
  return {
    id: row.id,
    sceneEventId: row.scene_event_id || null,
    authorId: row.author_id,
    authorName: author?.display_name || "Member",
    authorAvatar: author?.avatar_url || "",
    authorAge: author?.age ?? null,
    authorIsCouple: Boolean(author?.is_couple_profile),
    authorVerified: author?.verification_status === "VERIFIED",
    category: row.category,
    categoryLabel: planCategoryLabel(row.category),
    title: row.title,
    text: row.text,
    areaName: areaById(row.area_id)?.name || null,
    distance: bucket ? DISTANCE_BUCKET_LABELS[bucket] : null,
    startsAt: planStartsAt(row),
    expiresAt: row.expires_at,
    endsIn: endsInLabel(row.expires_at, now),
    audience: planAudienceText(row),
    // Computed by the same rule POST /api/messages enforces; display only.
    canReply: eligibility?.canReply ?? false,
    replyReason: eligibility?.reason ?? null,
    eligibilityText: eligibility ? eligibilityText(row, eligibility) : null,
    replyTypes: row.allowed_reply_genders || [],
    minAge: row.min_age,
    maxAge: row.max_age,
    requireVerified: row.require_verified,
    requireMedia: row.require_media,
    status: row.status,
    live: row.status === "active" && row.moderation_status !== "REJECTED" && new Date(row.expires_at) > now,
    isMine: row.author_id === viewerId,
  };
}

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Plans unavailable" }, { status: 503 });
  const params = new URL(req.url).searchParams;
  const viewerId = actor.actor.profileId;
  const now = new Date();

  const mine = params.get("mine") === "true";
  const authorId = params.get("authorId");
  if (authorId && !UUID.test(authorId)) return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  const category = params.get("category");
  const sceneEventId = params.get("sceneEventId");
  if (sceneEventId && !UUID.test(sceneEventId)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const buildQuery = (columns: string, withStart: boolean) => {
    let query = supabase.from("dating_ads").select(columns).order(mine || !withStart ? "created_at" : "starts_at", { ascending: !mine && withStart }).limit(mine ? 20 : 100);
    if (sceneEventId) query = query.eq("scene_event_id", sceneEventId);
    if (mine) {
      query = query.eq("author_id", viewerId);
    } else {
      query = query.eq("status", "active").gt("expires_at", now.toISOString()).neq("moderation_status", "REJECTED");
      if (authorId) query = query.eq("author_id", authorId);
      if (category) query = query.eq("category", category);
    }
    return query;
  };
  const runQuery = async () => {
    const first = await buildQuery(PLAN_COLUMNS, true);
    return first.error?.code === UNDEFINED_COLUMN ? buildQuery(LEGACY_PLAN_COLUMNS, false) : first;
  };

  const [{ data: rows, error }, { data: viewer }, { data: blockRows, error: blockError }] = await Promise.all([
    runQuery(),
    supabase.from("profiles").select("area_id,gender,is_couple_profile,date_of_birth,verification_status,verification_level").eq("id", viewerId).maybeSingle(),
    supabase.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${viewerId},blocked_profile_id.eq.${viewerId}`),
  ]);
  if (error || blockError) return NextResponse.json({ error: "Plans lookup failed" }, { status: 502 });
  const eventIds = [...new Set(((rows || []) as unknown as PlanRow[]).map(row => row.scene_event_id).filter((id): id is string => !!id))];
  const events = eventIds.length ? await supabase.from("scene_events").select("id,status,starts_at,ends_at").in("id", eventIds) : { data: [], error: null };
  if (events.error) return NextResponse.json({ error: "Event lookup failed" }, { status: 502 });
  const eventMap = new Map((events.data || []).map(event => [event.id, event]));
  const blocked = new Set((blockRows || []).map((block) => block.blocker_id === viewerId ? block.blocked_profile_id : block.blocker_id));
  const visibleRows = ((rows || []) as unknown as PlanRow[]).filter((row) => !blocked.has(row.author_id) && (!row.scene_event_id || mine || scenePlanCurrent(row, eventMap.get(row.scene_event_id), now)));

  const authorIds = [...new Set(visibleRows.map((row) => row.author_id))];
  const { data: authors, error: authorError } = authorIds.length
    ? await supabase.from("profiles").select("id,display_name,avatar_url,age,is_couple_profile,verification_status,area_id,account_status,discovery_disabled").in("id", authorIds)
    : { data: [], error: null };
  if (authorError) return NextResponse.json({ error: "Plans lookup failed" }, { status: 502 });
  const activeAuthors = new Map((authors || []).filter((author) => mine || (author.account_status === "ACTIVE" && !author.discovery_disabled)).map((author) => [author.id, author as Author]));

  let viewerHasApprovedMedia = false;
  if (visibleRows.some((row) => row.require_media)) {
    const { data: media } = await supabase.from("media_objects").select("id").eq("owner_id", viewerId).eq("upload_status", "AVAILABLE").eq("moderation_status", "APPROVED").limit(1).maybeSingle();
    viewerHasApprovedMedia = Boolean(media);
  }
  const viewerForEligibility = { ...(viewer || {}), id: viewerId };
  const plans = visibleRows
    .filter((row) => activeAuthors.has(row.author_id))
    .map((row) => toPlan(row, activeAuthors.get(row.author_id), viewer?.area_id ?? null, viewerId, now, planReplyEligibility({ plan: row, viewer: viewerForEligibility, viewerHasApprovedMedia, now })));
  return NextResponse.json({ plans, maxLivePlans: MAX_LIVE_PLANS }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = (await checkRateLimit(`plan-create:${actor.actor.userId}`, 10, 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many plans posted" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  if (Number(req.headers.get("content-length") || "0") > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Plans unavailable" }, { status: 503 });
  const sceneEventId = body.sceneEventId == null ? null : typeof body.sceneEventId === "string" ? body.sceneEventId : "";
  if (sceneEventId !== null && !UUID.test(sceneEventId)) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  let eventWindow = null;
  let eventArea: string | null = null;
  if (sceneEventId) {
    if (body.publishEventInvitation !== true) return NextResponse.json({ error: "Confirm publishing this invitation to signed-in adult members." }, { status: 400 });
    const { data: scene, error: sceneError } = await supabase.from("scene_events").select("id,status,starts_at,ends_at,area_id").eq("id", sceneEventId).eq("status", "PUBLISHED").maybeSingle();
    if (sceneError) return NextResponse.json({ error: "Event lookup failed" }, { status: 502 });
    eventWindow = scene && sceneCompanyWindow(scene);
    if (!eventWindow) return NextResponse.json({ error: "This event is unavailable for a company invitation. Choose a published upcoming event within 90 days." }, { status: 409 });
    eventArea = scene?.area_id || null;
  }
  const validated = validatePlanInput(body, new Date(), eventWindow);
  if (!validated.plan) return NextResponse.json({ error: validated.error }, { status: 400 });
  const profileId = actor.actor.profileId;
  const [{ data: profile, error: profileError }, { data: previous, error: previousError }] = await Promise.all([
    supabase.from("profiles").select("display_name,avatar_url,verification_level,area_id").eq("id", profileId).single(),
    supabase.from("dating_ads").select("id,status,expires_at,moderation_status").eq("author_id", profileId).limit(50),
  ]);
  if (profileError || !profile || previousError) return NextResponse.json({ error: "Author profile unavailable" }, { status: 502 });
  const now = Date.now();
  const live = (previous || []).filter((row) => row.status === "active" && new Date(row.expires_at).getTime() > now && row.moderation_status !== "REJECTED");
  if (live.length >= MAX_LIVE_PLANS) return NextResponse.json({ error: `You can have up to ${MAX_LIVE_PLANS} live plans. End one first.` }, { status: 409 });

  const areaId = sceneEventId ? eventArea : typeof body.areaId === "string" && areaById(body.areaId) ? body.areaId : profile.area_id;
  // A member's first Plan goes live immediately but is queued for moderator review.
  const moderationStatus = (previous || []).some((row) => row.moderation_status === "APPROVED") ? "APPROVED" : "PENDING_REVIEW";
  const row = {
    ...validated.plan,
    scene_event_id: sceneEventId,
    author_id: profileId,
    author_name: profile.display_name,
    author_avatar: profile.avatar_url,
    is_verified: ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(profile.verification_level),
    area_id: areaId || null,
    // Legacy columns: VIP gates never come from clients in the free MVP; region mirrors the area.
    require_vip: false,
    region: areaById(areaId)?.name || null,
    status: "active",
    moderation_status: moderationStatus,
  };
  let { data, error } = await supabase.from("dating_ads").insert(row).select(PLAN_COLUMNS).single();
  if (error?.code === UNDEFINED_COLUMN && !sceneEventId) {
    // Before migration 20261102: store the plan without its start time (it starts when posted).
    const { starts_at: _startsAt, scene_event_id: _sceneEventId, ...legacyRow } = row;
    ({ data, error } = await supabase.from("dating_ads").insert(legacyRow).select(LEGACY_PLAN_COLUMNS).single());
  }
  if (error || !data) return NextResponse.json({ error: "Your plan could not be posted" }, { status: 502 });
  const audited = await appendDurableAudit(supabase, { actorProfileId: profileId, actorUserId: actor.actor.userId, action: "PLAN_CREATE", resourceType: "DATING_AD", resourceId: String(data.id), outcome: "SUCCESS", metadata: { category: row.category, startsAt: row.starts_at, endsAt: row.expires_at, moderationStatus } });
  if (!audited) return NextResponse.json({ error: "Plan posted but audit recording failed; contact support" }, { status: 503 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "PLAN_CREATE", resourceId: String(data.id), resourceType: "DATING_AD", status: "SUCCESS" });
  return NextResponse.json({ plan: toPlan(data as unknown as PlanRow, undefined, null, profileId, new Date()) }, { status: 201, headers: noStore });
}
