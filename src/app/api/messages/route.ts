import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { establishedDecision, firstMessageDecision, resolveBoundaries } from "@/lib/boundaries.mjs";
import { presenceBucket } from "@/lib/presence.mjs";
import { areFriends } from "@/lib/social/friendship";
import { isVerifiedMember, planReplyEligibility } from "@/lib/planEligibility.mjs";
import { scenePlanCurrent } from "@/lib/sceneCompany.mjs";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 16 * 1024;

function conversationId(first: string, second: string) {
  return [first, second].sort().join(":");
}

async function blocked(supabase: ReturnType<typeof getServerSupabase>, first: string, second: string) {
  if (!supabase) return true;
  const { data, error } = await supabase.from("user_blocks").select("id").or(`and(blocker_id.eq.${first},blocked_profile_id.eq.${second}),and(blocker_id.eq.${second},blocked_profile_id.eq.${first})`).limit(1).maybeSingle();
  return Boolean(error || data);
}

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const url = new URL(req.url);
  const peerId = url.searchParams.get("peerId") || "";
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Messaging unavailable" }, { status: 503 });
  if (!peerId) {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 25), 250);
    const before = url.searchParams.get("before");
    if (before && Number.isNaN(new Date(before).getTime())) return NextResponse.json({ error: "Invalid conversation cursor" }, { status: 400 });
    let conversationQuery = supabase.from("direct_messages").select("id,conversation_id,sender_id,receiver_id,content,attachment_type,status,is_opened,created_at").or(`sender_id.eq.${actor.actor.profileId},receiver_id.eq.${actor.actor.profileId}`).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
    if (before) conversationQuery = conversationQuery.lt("created_at", before);
    const { data: rawRows, error } = await conversationQuery;
    if (error) return NextResponse.json({ error: "Conversations lookup failed" }, { status: 502 });
    const hasMore = (rawRows || []).length > limit;
    const rows = (rawRows || []).slice(0, limit);
    const latest = new Map<string, any>();
    for (const row of rows || []) if (!latest.has(row.conversation_id)) latest.set(row.conversation_id, row);
    const peerIds = [...latest.values()].map((row) => row.sender_id === actor.actor.profileId ? row.receiver_id : row.sender_id);
    const conversationIds = [...latest.keys()];
    const [{ data: profiles, error: profileError }, { data: blockRows, error: blockError }, { data: sentRows, error: sentError }] = await Promise.all([
      peerIds.length ? supabase.from("profiles").select("id,display_name,avatar_url,city,country,verification_status,last_active_at,show_online_status").in("id", peerIds).eq("account_status", "ACTIVE") : Promise.resolve({ data: [], error: null }),
      supabase.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${actor.actor.profileId},blocked_profile_id.eq.${actor.actor.profileId}`),
      // Requests: conversations the member has never written in. Replying moves them to the inbox.
      conversationIds.length ? supabase.from("direct_messages").select("conversation_id").eq("sender_id", actor.actor.profileId).in("conversation_id", conversationIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (profileError || blockError || sentError) return NextResponse.json({ error: "Conversation profiles lookup failed" }, { status: 502 });
    const blockedPeers = new Set((blockRows || []).map((block) => block.blocker_id === actor.actor.profileId ? block.blocked_profile_id : block.blocker_id));
    const repliedIn = new Set((sentRows || []).map((row) => row.conversation_id as string));
    const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const conversations = [...latest.values()].flatMap((row) => {
      const id = row.sender_id === actor.actor.profileId ? row.receiver_id : row.sender_id;
      const profile = byId.get(id);
      if (!profile || blockedPeers.has(id)) return [];
      const unreadCount = (rows || []).filter((message) => message.conversation_id === row.conversation_id && message.receiver_id === actor.actor.profileId && message.is_opened === false).length;
      return [{ id: row.conversation_id, participant: { id: profile.id, userId: profile.id, displayName: profile.display_name, avatarUrl: profile.avatar_url || "", location: [profile.city,profile.country].filter(Boolean).join(", "), verified: profile.verification_status === "VERIFIED", isOnline: presenceBucket(profile.last_active_at, profile.show_online_status === true) === "ONLINE" }, lastMessage: { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, senderName: row.sender_id === actor.actor.profileId ? "You" : profile.display_name, senderAvatar: profile.avatar_url || "", content: row.content || (row.attachment_type === "IMAGE" ? "Photo" : ""), status: row.status, createdAt: row.created_at }, updatedAt: row.created_at, unreadCount, isRequest: !repliedIn.has(row.conversation_id) }];
    });
    return NextResponse.json({ conversations, pagination: { limit, hasMore, nextCursor: hasMore ? rows.at(-1)?.created_at || null : null } }, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (!UUID.test(peerId) || peerId === actor.actor.profileId) return NextResponse.json({ error: "Invalid conversation participant" }, { status: 400 });
  if (await blocked(supabase, actor.actor.profileId, peerId)) return NextResponse.json({ error: "Conversation unavailable" }, { status: 403 });
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 100);
  const before = url.searchParams.get("before");
  if (before && Number.isNaN(new Date(before).getTime())) return NextResponse.json({ error: "Invalid message cursor" }, { status: 400 });
  let query = supabase.from("direct_messages").select("id,conversation_id,sender_id,receiver_id,content,media_url,attachment_type,is_disappearing,disappear_timer_sec,is_opened,status,created_at").eq("conversation_id", conversationId(actor.actor.profileId, peerId)).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
  if (before) query = query.lt("created_at", before);
  const { data: newestFirst, error } = await query;
  if (error) return NextResponse.json({ error: "Messages lookup failed" }, { status: 502 });
  const hasMore = (newestFirst || []).length > limit;
  const page = (newestFirst || []).slice(0, limit).reverse();
  const { data: readRows, error: readError } = await supabase.from("direct_messages").update({ is_opened: true, status: "READ" }).eq("conversation_id", conversationId(actor.actor.profileId, peerId)).eq("receiver_id", actor.actor.profileId).eq("is_opened", false).select("id");
  if (readError) return NextResponse.json({ error: "Message read state could not be recorded" }, { status: 502 });
  if (readRows?.length) {
    const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "MESSAGES_READ", resourceType: "CONVERSATION", resourceId: conversationId(actor.actor.profileId, peerId), outcome: "SUCCESS", metadata: { count: readRows.length, peerId } });
    if (!audited) return NextResponse.json({ error: "Message read state was updated but audit recording failed; contact support" }, { status: 503 });
  }
  return NextResponse.json({ messages: page, pagination: { limit, hasMore, nextCursor: hasMore ? page[0]?.created_at || null : null } }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const length = Number(req.headers.get("content-length") || "0");
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "Message is too large" }, { status: 413 });
  const rate = (await checkRateLimit(`message:${actor.actor.userId}`, 60, 60));
  if (!rate.allowed) return NextResponse.json({ error: "Message rate limit reached" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const receiverId = typeof body.receiverId === "string" ? body.receiverId : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const datingAdId = typeof body.datingAdId === "string" ? body.datingAdId : null;
  const mediaId = typeof body.mediaId === "string" && UUID.test(body.mediaId) ? body.mediaId : null;
  // A message needs text, a photo, or both (P1-10).
  if (!UUID.test(receiverId) || receiverId === actor.actor.profileId || (content.length < 1 && !mediaId) || content.length > 4_000) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  if (datingAdId && !UUID.test(datingAdId)) return NextResponse.json({ error: "Invalid dating ad context" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Messaging unavailable" }, { status: 503 });
  if (await blocked(supabase, actor.actor.profileId, receiverId)) return NextResponse.json({ error: "Messaging is not allowed between these profiles" }, { status: 403 });
  const { data: recipient } = await supabase.from("profiles").select("id,display_name,message_permission,allow_direct_messages").eq("id", receiverId).eq("account_status", "ACTIVE").maybeSingle();
  if (!recipient || recipient.allow_direct_messages === false) return NextResponse.json({ error: "Recipient is not accepting messages" }, { status: 403 });
  const { data: sender } = await supabase.from("profiles").select("display_name,avatar_url,verification_level,verification_status,gender,is_couple_profile,date_of_birth").eq("id", actor.actor.profileId).single();
  if (!sender) return NextResponse.json({ error: "Sender profile unavailable" }, { status: 502 });
  const verifiedSender = isVerifiedMember(sender);
  if (datingAdId) {
    const { data: ad, error: adError } = await supabase.from("dating_ads").select("id,author_id,status,starts_at,expires_at,scene_event_id,moderation_status,allowed_reply_genders,min_age,max_age,require_media,require_verified").eq("id", datingAdId).maybeSingle();
    if (adError) return NextResponse.json({ error: "Dating ad eligibility could not be checked" }, { status: 502 });
    if (!ad) return NextResponse.json({ error: "This plan is no longer available" }, { status: 404 });
    if (ad.author_id !== receiverId) return NextResponse.json({ error: "This plan is no longer available" }, { status: 404 });
    if (ad.scene_event_id) {
      const { data: scene, error: sceneError } = await supabase.from("scene_events").select("status,starts_at,ends_at").eq("id", ad.scene_event_id).maybeSingle();
      if (sceneError) return NextResponse.json({ error: "Event eligibility could not be checked" }, { status: 502 });
      if (!scenePlanCurrent(ad, scene)) return NextResponse.json({ error: "The linked event changed or is unavailable. This invitation cannot receive replies." }, { status: 409 });
    }
    let hasApprovedMedia = false;
    if (ad.require_media === true) {
      const { data: media, error: mediaError } = await supabase.from("media_objects").select("id").eq("owner_id", actor.actor.profileId).eq("upload_status", "AVAILABLE").eq("moderation_status", "APPROVED").limit(1).maybeSingle();
      if (mediaError) return NextResponse.json({ error: "Dating ad media eligibility could not be checked" }, { status: 502 });
      hasApprovedMedia = Boolean(media);
    }
    // Same rule GET /api/dating-ads uses for its "You can reply" indicator.
    const eligibility = planReplyEligibility({ plan: ad, viewer: { ...sender, id: actor.actor.profileId }, viewerHasApprovedMedia: hasApprovedMedia });
    if (!eligibility.canReply) {
      const denial: Record<string, [string, number]> = {
        NOT_LIVE: ["This plan is no longer available", 404],
        OWN_PLAN: ["This plan is no longer available", 404],
        PROFILE_TYPE: ["Your profile does not match this ad's allowed reply profiles", 403],
        AGE: ["Your profile does not match this ad's age range", 403],
        VERIFIED: ["This dating ad accepts verified members only", 403],
        MEDIA: ["This dating ad accepts replies from members with approved profile media only", 403],
      };
      const [message, status] = denial[eligibility.reason ?? "NOT_LIVE"] ?? denial.NOT_LIVE;
      return NextResponse.json({ error: message }, { status });
    }
  }

  // Once the recipient has written to the sender, the conversation is established
  // and first-message rules no longer apply. A valid reply to the recipient's own
  // ad is invited too (the ad's eligibility rules were checked above).
  const { data: repliedBefore, error: repliedError } = await supabase.from("direct_messages").select("id").eq("sender_id", receiverId).eq("receiver_id", actor.actor.profileId).limit(1).maybeSingle();
  if (repliedError) return NextResponse.json({ error: "Messaging eligibility could not be checked" }, { status: 502 });
  const invited = Boolean(repliedBefore) || Boolean(datingAdId);
  if (!invited) {
    if (recipient.message_permission === "PRIVATE") return NextResponse.json({ error: "This member only accepts messages from people they've written to" }, { status: 403 });
    if (recipient.message_permission === "FRIENDS_ONLY" && !(await areFriends(actor.actor.profileId, receiverId))) {
      return NextResponse.json({ error: "This member accepts messages from friends only" }, { status: 403 });
    }
    if (recipient.message_permission === "VERIFIED_ONLY" && !verifiedSender) return NextResponse.json({ error: "Recipient accepts messages from verified members only" }, { status: 403 });
    const { data: boundaryRows, error: boundaryError } = await supabase.from("member_boundaries").select("kind,preference").eq("profile_id", receiverId);
    if (boundaryError) return NextResponse.json({ error: "Messaging eligibility could not be checked" }, { status: 502 });
    const decision = firstMessageDecision(resolveBoundaries(boundaryRows), { gender: sender.gender, isCoupleProfile: sender.is_couple_profile, verified: verifiedSender });
    if (!decision.allowed) return NextResponse.json({ error: decision.reason, boundary: true }, { status: 403 });
  }
  if (mediaId) {
    // Chat photo: the sender's own finished upload, tagged for messages.
    const { data: media, error: mediaError } = await supabase.from("media_objects").select("id,owner_id,media_type,upload_status,category,content_rating,moderation_status").eq("id", mediaId).maybeSingle();
    if (mediaError) return NextResponse.json({ error: "Photo could not be checked" }, { status: 502 });
    if (!media || media.owner_id !== actor.actor.profileId || media.media_type !== "IMAGE" || media.upload_status !== "AVAILABLE" || media.category !== "MESSAGE" || ["REJECTED", "HIDDEN", "REMOVED"].includes(media.moderation_status)) {
      return NextResponse.json({ error: "That photo can't be sent" }, { status: 400 });
    }
    if (media.content_rating === "EXPLICIT") {
      // Boundary (P1-20): explicit photos need the recipient's consent pattern.
      const { data: rows, error: rowsError } = await supabase.from("member_boundaries").select("kind,preference").eq("profile_id", receiverId);
      if (rowsError) return NextResponse.json({ error: "Messaging eligibility could not be checked" }, { status: 502 });
      const preference = resolveBoundaries(rows).EXPLICIT_MEDIA_IN_CHAT;
      if (!establishedDecision(preference, Boolean(repliedBefore))) {
        return NextResponse.json({ error: preference === "NOT_INTERESTED" ? "This member doesn't accept explicit photos in chat." : "This member accepts explicit photos once they've written back.", boundary: true }, { status: 403 });
      }
    }
  }
  const row = { conversation_id: conversationId(actor.actor.profileId, receiverId), sender_id: actor.actor.profileId, receiver_id: receiverId, sender_name: sender.display_name, sender_avatar: sender.avatar_url, content, media_url: mediaId ? `/api/media/${mediaId}` : null, attachment_type: mediaId ? "IMAGE" : null, plan_id: datingAdId, is_disappearing: false, is_opened: false, status: "SENT", is_locked: false, unlock_price: null, is_unlocked: true };
  const { data, error } = await supabase.from("direct_messages").insert(row).select("id,conversation_id,sender_id,receiver_id,content,media_url,attachment_type,status,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Message could not be sent" }, { status: 502 });
  const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "MESSAGE_SEND", resourceType: "MESSAGE", resourceId: data.id, outcome: "SUCCESS", metadata: { receiverId, datingAdId } });
  if (!audited) return NextResponse.json({ error: "Message sent but audit recording failed; contact support" }, { status: 503 });
  await supabase.from("notifications").insert({ user_id: receiverId, type: "NEW_MESSAGE", title: "New message", message: `${sender.display_name} sent you a message.`, actor_name: sender.display_name, actor_avatar: sender.avatar_url, target_link: `/messages?peerId=${actor.actor.profileId}`, is_read: false });
  // The INSERT trigger queues unread email atomically with the message.
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "MESSAGE_SEND", resourceId: data.id, resourceType: "MESSAGE", status: "SUCCESS" });
  return NextResponse.json({ message: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
