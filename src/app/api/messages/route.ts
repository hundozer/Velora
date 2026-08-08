import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

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
  const peerId = new URL(req.url).searchParams.get("peerId") || "";
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Messaging unavailable" }, { status: 503 });
  if (!peerId) {
    const { data: rows, error } = await supabase.from("direct_messages").select("id,conversation_id,sender_id,receiver_id,content,status,is_opened,created_at").or(`sender_id.eq.${actor.actor.profileId},receiver_id.eq.${actor.actor.profileId}`).order("created_at", { ascending: false }).limit(500);
    if (error) return NextResponse.json({ error: "Conversations lookup failed" }, { status: 502 });
    const latest = new Map<string, any>();
    for (const row of rows || []) if (!latest.has(row.conversation_id)) latest.set(row.conversation_id, row);
    const peerIds = [...latest.values()].map((row) => row.sender_id === actor.actor.profileId ? row.receiver_id : row.sender_id);
    const { data: profiles, error: profileError } = peerIds.length ? await supabase.from("profiles").select("id,display_name,avatar_url,city,country,verification_status").in("id", peerIds) : { data: [], error: null };
    if (profileError) return NextResponse.json({ error: "Conversation profiles lookup failed" }, { status: 502 });
    const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const conversations = [...latest.values()].flatMap((row) => {
      const id = row.sender_id === actor.actor.profileId ? row.receiver_id : row.sender_id;
      const profile = byId.get(id);
      if (!profile) return [];
      const unreadCount = (rows || []).filter((message) => message.conversation_id === row.conversation_id && message.receiver_id === actor.actor.profileId && message.is_opened === false).length;
      return [{ id: row.conversation_id, participant: { id: profile.id, userId: profile.id, displayName: profile.display_name, avatarUrl: profile.avatar_url || "", location: [profile.city,profile.country].filter(Boolean).join(", "), verified: profile.verification_status === "VERIFIED", isOnline: false }, lastMessage: { id: row.id, conversationId: row.conversation_id, senderId: row.sender_id, senderName: row.sender_id === actor.actor.profileId ? "You" : profile.display_name, senderAvatar: profile.avatar_url || "", content: row.content, status: row.status, createdAt: row.created_at }, updatedAt: row.created_at, unreadCount }];
    });
    return NextResponse.json({ conversations }, { headers: { "Cache-Control": "private, no-store" } });
  }
  if (!UUID.test(peerId) || peerId === actor.actor.profileId) return NextResponse.json({ error: "Invalid conversation participant" }, { status: 400 });
  if (await blocked(supabase, actor.actor.profileId, peerId)) return NextResponse.json({ error: "Conversation unavailable" }, { status: 403 });
  const { data, error } = await supabase.from("direct_messages").select("id,conversation_id,sender_id,receiver_id,content,media_url,attachment_type,is_disappearing,disappear_timer_sec,is_opened,status,created_at").eq("conversation_id", conversationId(actor.actor.profileId, peerId)).order("created_at", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: "Messages lookup failed" }, { status: 502 });
  await supabase.from("direct_messages").update({ is_opened: true, status: "READ" }).eq("conversation_id", conversationId(actor.actor.profileId, peerId)).eq("receiver_id", actor.actor.profileId).eq("is_opened", false);
  return NextResponse.json({ messages: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const length = Number(req.headers.get("content-length") || "0");
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "Message is too large" }, { status: 413 });
  const rate = checkRateLimit(`message:${actor.actor.auth0Sub}`, 60, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Message rate limit reached" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const receiverId = typeof body.receiverId === "string" ? body.receiverId : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!UUID.test(receiverId) || receiverId === actor.actor.profileId || content.length < 1 || content.length > 4_000) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Messaging unavailable" }, { status: 503 });
  if (await blocked(supabase, actor.actor.profileId, receiverId)) return NextResponse.json({ error: "Messaging is not allowed between these profiles" }, { status: 403 });
  const { data: recipient } = await supabase.from("profiles").select("id,display_name,message_permission,allow_direct_messages,require_verification_to_message").eq("id", receiverId).eq("account_status", "ACTIVE").maybeSingle();
  if (!recipient || recipient.allow_direct_messages === false || recipient.message_permission === "PRIVATE") return NextResponse.json({ error: "Recipient is not accepting messages" }, { status: 403 });
  const { data: sender } = await supabase.from("profiles").select("display_name,avatar_url,verification_level,verification_status").eq("id", actor.actor.profileId).single();
  if (!sender) return NextResponse.json({ error: "Sender profile unavailable" }, { status: 502 });
  const verifiedSender = sender.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(sender.verification_level || "");
  if ((recipient.require_verification_to_message === true || recipient.message_permission === "VERIFIED_ONLY") && !verifiedSender) return NextResponse.json({ error: "Recipient accepts messages from verified members only" }, { status: 403 });
  const row = { conversation_id: conversationId(actor.actor.profileId, receiverId), sender_id: actor.actor.profileId, receiver_id: receiverId, sender_name: sender.display_name, sender_avatar: sender.avatar_url, content, media_url: null, attachment_type: null, is_disappearing: false, is_opened: false, status: "SENT", is_locked: false, unlock_price: null, is_unlocked: true };
  const { data, error } = await supabase.from("direct_messages").insert(row).select("id,conversation_id,sender_id,receiver_id,content,status,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Message could not be sent" }, { status: 502 });
  const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorAuth0Sub: actor.actor.auth0Sub, action: "MESSAGE_SEND", resourceType: "MESSAGE", resourceId: data.id, outcome: "SUCCESS", metadata: { receiverId } });
  if (!audited) return NextResponse.json({ error: "Message sent but audit recording failed; contact support" }, { status: 503 });
  await supabase.from("notifications").insert({ user_id: receiverId, type: "NEW_MESSAGE", title: "New message", message: `${sender.display_name} sent you a message.`, actor_name: sender.display_name, actor_avatar: sender.avatar_url, target_link: `/messages?peerId=${actor.actor.profileId}`, is_read: false });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "MESSAGE_SEND", resourceId: data.id, resourceType: "MESSAGE", status: "SUCCESS" });
  return NextResponse.json({ message: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
