import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { areaById } from "@/lib/areas.mjs";
import { categoryLabel, PERSONAL_CATEGORIES, validatePersonalAd } from "@/lib/personalAds.mjs";
import { planReplyEligibility } from "@/lib/planEligibility.mjs";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };
const columns = "id,author_id,category,title,body,boundaries,area_id,allowed_reply_genders,min_age,max_age,require_verified,status,moderation_status,expires_at,created_at";

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const params = req.nextUrl.searchParams;
  const mine = params.get("mine") === "true";
  const id = params.get("id");
  const category = params.get("category");
  const areaId = params.get("areaId");
  if (id && !UUID.test(id)) return NextResponse.json({ error: "Invalid ad" }, { status: 400 });
  if (category && !PERSONAL_CATEGORIES.some(item => item.value === category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  if (areaId && !areaById(areaId)) return NextResponse.json({ error: "Invalid area" }, { status: 400 });
  let query = db.from("personal_ads").select(columns).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(mine ? 30 : 60);
  if (id) query = query.eq("id", id);
  if (mine) query = query.eq("author_id", actor.actor.profileId);
  else query = query.eq("status", "ACTIVE").eq("moderation_status", "APPROVED").gt("expires_at", new Date().toISOString());
  if (category) query = query.eq("category", category);
  if (areaId) query = query.eq("area_id", areaId);
  const [{ data: rows, error }, { data: blocks, error: blockError }, { data: viewer, error: viewerError }] = await Promise.all([
    query,
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${actor.actor.profileId},blocked_profile_id.eq.${actor.actor.profileId}`),
    db.from("profiles").select("id,gender,is_couple_profile,date_of_birth,verification_status,verification_level").eq("id", actor.actor.profileId).maybeSingle(),
  ]);
  if (error || blockError || viewerError) return NextResponse.json({ error: "Dating ads lookup failed" }, { status: 502 });
  const blocked = new Set((blocks || []).map(row => row.blocker_id === actor.actor.profileId ? row.blocked_profile_id : row.blocker_id));
  const visible = (rows || []).filter(row => !blocked.has(row.author_id));
  const ids = [...new Set(visible.map(row => row.author_id))];
  const { data: authors, error: authorError } = ids.length ? await db.from("profiles").select("id,display_name,avatar_url,age,account_status,discovery_disabled,allow_direct_messages").in("id", ids) : { data: [], error: null };
  if (authorError) return NextResponse.json({ error: "Dating ads lookup failed" }, { status: 502 });
  const byId = new Map((authors || []).filter(row => row.account_status === "ACTIVE" && !row.discovery_disabled && row.allow_direct_messages !== false).map(row => [row.id, row]));
  const ads = visible.flatMap(row => {
    const author = byId.get(row.author_id);
    if (!author) return [];
    const eligibility = planReplyEligibility({ plan: { ...row, status: row.status === "ACTIVE" && row.moderation_status === "APPROVED" ? "active" : "closed" }, viewer: { ...viewer, id: actor.actor.profileId } });
    return [{ id: row.id, authorId: row.author_id, authorName: author.display_name, authorAvatar: author.avatar_url, authorAge: author.age, category: row.category, categoryLabel: categoryLabel(row.category), title: row.title, body: row.body, boundaries: row.boundaries, areaName: areaById(row.area_id)?.name || null, allowedReplyGenders: row.allowed_reply_genders, minAge: row.min_age, maxAge: row.max_age, requireVerified: row.require_verified, moderationStatus: row.moderation_status, status: row.status, expiresAt: row.expires_at, createdAt: row.created_at, isMine: row.author_id === actor.actor.profileId, canReply: eligibility.canReply, replyReason: eligibility.reason }];
  });
  return NextResponse.json({ ads }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!(await checkRateLimit(`personal-ad-create:${actor.actor.userId}`, 3, 86_400)).allowed) return NextResponse.json({ error: "You have posted too many ads today" }, { status: 429 });
  if (Number(req.headers.get("content-length") || "0") > 16 * 1024) return NextResponse.json({ error: "Ad is too large" }, { status: 413 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid ad" }, { status: 400 }); }
  const validated = validatePersonalAd(body);
  if (!validated.ad) return NextResponse.json({ error: validated.error }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const [{ data: profile, error: profileError }, { data: previous, error: previousError }] = await Promise.all([
    db.from("profiles").select("area_id,allow_direct_messages,account_status").eq("id", actor.actor.profileId).maybeSingle(),
    db.from("personal_ads").select("id").eq("author_id", actor.actor.profileId).eq("status", "ACTIVE").gt("expires_at", new Date().toISOString()).in("moderation_status", ["APPROVED", "PENDING_REVIEW"]).limit(2),
  ]);
  if (profileError || previousError) return NextResponse.json({ error: "Your profile could not be checked" }, { status: 502 });
  if (!profile || profile.account_status !== "ACTIVE" || profile.allow_direct_messages === false) return NextResponse.json({ error: "Enable messages in your profile before posting an ad" }, { status: 403 });
  if ((previous || []).length >= 2) return NextResponse.json({ error: "You can have two current ads. Close one first." }, { status: 409 });
  const areaId = typeof body.areaId === "string" && areaById(body.areaId) ? body.areaId : profile.area_id;
  const { days, ...ad } = validated.ad;
  const { data, error } = await db.from("personal_ads").insert({ ...ad, author_id: actor.actor.profileId, area_id: areaId || null, expires_at: new Date(Date.now() + days * 86_400_000).toISOString() }).select("id").single();
  if (error || !data) return NextResponse.json({ error: "Ad could not be posted" }, { status: 502 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "PERSONAL_AD_CREATE", resourceType: "PERSONAL_AD", resourceId: data.id, outcome: "SUCCESS", metadata: { category: ad.category } });
  if (!audited) return NextResponse.json({ error: "Ad saved but audit recording failed; contact support" }, { status: 503 });
  return NextResponse.json({ id: data.id, moderationStatus: "PENDING_REVIEW" }, { status: 201, headers: noStore });
}
