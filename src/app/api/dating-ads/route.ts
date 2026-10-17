import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { MAX_LIVE_PLANS, endsInLabel, planCategoryLabel, validatePlanInput } from "@/lib/plans.mjs";
import { areaById, distanceBucket, DISTANCE_BUCKET_LABELS } from "@/lib/areas.mjs";

// Tonight / Plans (P1-07). Stored in dating_ads; members-only, server-mediated.
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };
const PLAN_COLUMNS = "id,author_id,category,title,text,validity_days,expires_at,area_id,allowed_reply_genders,min_age,max_age,require_verified,require_media,status,moderation_status,created_at";

type PlanRow = { id: string; author_id: string; category: string; title: string; text: string; expires_at: string; area_id: string | null; allowed_reply_genders: string[]; min_age: number; max_age: number; require_verified: boolean; require_media: boolean; status: string; moderation_status: string; created_at: string };
type Author = { id: string; display_name: string; avatar_url: string | null; age: number | null; is_couple_profile: boolean; verification_status: string; area_id: string | null };

function toPlan(row: PlanRow, author: Author | undefined, viewerAreaId: string | null, viewerId: string, now: Date) {
  const bucket = viewerAreaId && row.area_id ? distanceBucket(viewerAreaId, row.area_id) : null;
  return {
    id: row.id,
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
    expiresAt: row.expires_at,
    endsIn: endsInLabel(row.expires_at, now),
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

  let query = supabase.from("dating_ads").select(PLAN_COLUMNS).order("created_at", { ascending: false }).limit(mine ? 20 : 100);
  if (mine) {
    query = query.eq("author_id", viewerId);
  } else {
    query = query.eq("status", "active").gt("expires_at", now.toISOString()).neq("moderation_status", "REJECTED");
    if (authorId) query = query.eq("author_id", authorId);
    if (category) query = query.eq("category", category);
  }

  const [{ data: rows, error }, { data: viewer }, { data: blockRows, error: blockError }] = await Promise.all([
    query,
    supabase.from("profiles").select("area_id").eq("id", viewerId).maybeSingle(),
    supabase.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${viewerId},blocked_profile_id.eq.${viewerId}`),
  ]);
  if (error || blockError) return NextResponse.json({ error: "Plans lookup failed" }, { status: 502 });
  const blocked = new Set((blockRows || []).map((block) => block.blocker_id === viewerId ? block.blocked_profile_id : block.blocker_id));
  const visibleRows = ((rows || []) as PlanRow[]).filter((row) => !blocked.has(row.author_id));

  const authorIds = [...new Set(visibleRows.map((row) => row.author_id))];
  const { data: authors, error: authorError } = authorIds.length
    ? await supabase.from("profiles").select("id,display_name,avatar_url,age,is_couple_profile,verification_status,area_id,account_status,discovery_disabled").in("id", authorIds)
    : { data: [], error: null };
  if (authorError) return NextResponse.json({ error: "Plans lookup failed" }, { status: 502 });
  const activeAuthors = new Map((authors || []).filter((author) => mine || (author.account_status === "ACTIVE" && !author.discovery_disabled)).map((author) => [author.id, author as Author]));

  const plans = visibleRows
    .filter((row) => activeAuthors.has(row.author_id))
    .map((row) => toPlan(row, activeAuthors.get(row.author_id), viewer?.area_id ?? null, viewerId, now));
  return NextResponse.json({ plans, maxLivePlans: MAX_LIVE_PLANS }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = checkRateLimit(`plan-create:${actor.actor.userId}`, 10, 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many plans posted" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  if (Number(req.headers.get("content-length") || "0") > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const validated = validatePlanInput(body);
  if (!validated.plan) return NextResponse.json({ error: validated.error }, { status: 400 });

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Plans unavailable" }, { status: 503 });
  const profileId = actor.actor.profileId;
  const [{ data: profile, error: profileError }, { data: previous, error: previousError }] = await Promise.all([
    supabase.from("profiles").select("display_name,avatar_url,verification_level,area_id").eq("id", profileId).single(),
    supabase.from("dating_ads").select("id,status,expires_at,moderation_status").eq("author_id", profileId).limit(50),
  ]);
  if (profileError || !profile || previousError) return NextResponse.json({ error: "Author profile unavailable" }, { status: 502 });
  const now = Date.now();
  const live = (previous || []).filter((row) => row.status === "active" && new Date(row.expires_at).getTime() > now && row.moderation_status !== "REJECTED");
  if (live.length >= MAX_LIVE_PLANS) return NextResponse.json({ error: `You can have up to ${MAX_LIVE_PLANS} live plans. End one first.` }, { status: 409 });

  const areaId = typeof body.areaId === "string" && areaById(body.areaId) ? body.areaId : profile.area_id;
  // A member's first Plan goes live immediately but is queued for moderator review.
  const moderationStatus = (previous || []).some((row) => row.moderation_status === "APPROVED") ? "APPROVED" : "PENDING_REVIEW";
  const row = {
    ...validated.plan,
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
  const { data, error } = await supabase.from("dating_ads").insert(row).select(PLAN_COLUMNS).single();
  if (error || !data) return NextResponse.json({ error: "Your plan could not be posted" }, { status: 502 });
  const audited = await appendDurableAudit(supabase, { actorProfileId: profileId, actorUserId: actor.actor.userId, action: "PLAN_CREATE", resourceType: "DATING_AD", resourceId: String(data.id), outcome: "SUCCESS", metadata: { category: row.category, validityDays: row.validity_days, moderationStatus } });
  if (!audited) return NextResponse.json({ error: "Plan posted but audit recording failed; contact support" }, { status: 503 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "PLAN_CREATE", resourceId: String(data.id), resourceType: "DATING_AD", status: "SUCCESS" });
  return NextResponse.json({ plan: toPlan(data as PlanRow, undefined, null, profileId, new Date()) }, { status: 201, headers: noStore });
}
