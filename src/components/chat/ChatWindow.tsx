"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Message, Conversation } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { ReportModal } from "@/components/safety/ReportModal";
import { ArrowLeft, ArrowRight, MoreHorizontal, Plus, Search } from "lucide-react";
import { ChatPhoto } from "@/components/chat/ChatPhoto";
import { Portrait } from "@/components/media/Portrait";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";
import { desireById } from "@/lib/desires.mjs";
import { possessive } from "@/lib/peopleCopy.mjs";
import { openersFor, explicitPhotoRule, planWindow } from "@/lib/messageJourney.mjs";

interface ChatWindowProps {
  conversations: Conversation[];
  activeConversation: Conversation;
  onSelectConversation: (conv: Conversation) => void;
  onLoadOlderConversations?: () => void;
  loadingOlderConversations?: boolean;
  datingAdId?: string | null;
  /** Bumped by the page on a realtime event for the open conversation. */
  threadVersion?: number;
  /** On phones only one pane shows: the list, or the open thread. */
  phonePane?: "list" | "thread";
  onBackToList?: () => void;
}

type Folder = "INBOX" | "UNREAD" | "REQUESTS";
type ThreadContext = {
  approach: { canWrite: boolean; line: string | null; established: boolean; explicitMediaInChat?: string } | null;
  shared: string[];
  plan: { id: string; title: string; text?: string; startsAt?: string; expiresAt: string } | null;
};
const OPENERS_HIDDEN = "intimo:openers:hidden";

function readHidden() {
  try { return window.localStorage.getItem(OPENERS_HIDDEN) === "1"; } catch { return false; }
}

/**
 * Messages (approved v33): a quiet list of conversations and a thread that starts with
 * context — the plan being replied to, what you share, the explicit-photo rule — then
 * optional typographic openers and a plain composer. The server stays authoritative for
 * every rule shown here (POST /api/messages).
 */
export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onLoadOlderConversations,
  loadingOlderConversations = false,
  datingAdId = null,
  threadVersion = 0,
  phonePane = "thread",
  onBackToList,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [folder, setFolder] = useState<Folder>("INBOX");
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadedThread, setLoadedThread] = useState<string | null>(null);
  const [sendError, setSendError] = useState("");
  const [context, setContext] = useState<ThreadContext>({ approach: null, shared: [], plan: null });
  const [openersHidden, setOpenersHidden] = useState(false);
  const participant = activeConversation.participant;
  const participantId = participant.id || participant.userId;

  useEffect(() => { setOpenersHidden(readHidden()); }, []);

  // Load durable messages through the authenticated participant boundary.
  useEffect(() => {
    if (!activeConversation) return;
    const participantId = activeConversation.participant.id || activeConversation.participant.userId;
    let active = true;
    fetch(`/api/messages?peerId=${encodeURIComponent(participantId)}`, { credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Messages unavailable")))
      .then((payload) => {
        if (!active) return;
        setMessages((payload.messages || []).map((item: any) => toMessage(item, activeConversation)));
        setNextCursor(payload.pagination?.nextCursor || null);
        setLoadedThread(participantId);
      })
      .catch(() => { if (active) { setMessages([]); setLoadedThread(participantId); } });
    return () => { active = false; };
  }, [activeConversation, threadVersion]);

  // What frames the thread: how to approach, what you share, the plan being replied to.
  useEffect(() => {
    let active = true;
    const key = encodeURIComponent(participantId);
    const get = (url: string) => fetch(url, { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null);
    Promise.all([
      get(`/api/profiles/${key}/approach`),
      get(`/api/profiles/${key}/desires`),
      datingAdId ? get(`/api/dating-ads?authorId=${key}`) : Promise.resolve(null),
    ]).then(([approach, desires, plans]) => {
      if (!active) return;
      const plan = datingAdId ? (plans?.plans || []).find((item: { id: string }) => item.id === datingAdId) ?? null : null;
      setContext({ approach, shared: desires?.shared || [], plan });
    });
    return () => { active = false; };
  }, [participantId, datingAdId]);

  const [inputMessage, setInputMessage] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const threadEnd = React.useRef<HTMLDivElement>(null);

  useEffect(() => { threadEnd.current?.scrollIntoView({ block: "end" }); }, [messages.length, loadedThread]);

  const loadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const response = await fetch(`/api/messages?peerId=${encodeURIComponent(participantId)}&before=${encodeURIComponent(nextCursor)}`, { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      const older = (payload.messages || []).map((item: any) => toMessage(item, activeConversation));
      setMessages((current) => [...older, ...current.filter((message) => !older.some((item: Message) => item.id === message.id))]);
      setNextCursor(payload.pagination?.nextCursor || null);
    }
    setLoadingOlder(false);
  };

  const [photoExplicit, setPhotoExplicit] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const sendPhoto = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 15 * 1024 * 1024) { setSendError("Choose a JPEG, PNG or WebP photo under 15 MB."); return; }
    setSendError("");
    setAttachOpen(false);
    try {
      const declaration = await requestParticipantDeclaration();
      setUploadingPhoto(0);
      const result = await uploadFileToR2(file, "photos", setUploadingPhoto, declaration, "PRIVATE", photoExplicit ? "EXPLICIT" : "NON_EXPLICIT", "MESSAGE");
      await handleSendMessage(result.mediaId);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Photo could not be sent.");
    } finally {
      setUploadingPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (mediaId?: string) => {
    if (!inputMessage.trim() && !mediaId) return;
    setSendError("");

    const response = await fetch("/api/messages", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: participantId, content: inputMessage.trim(), datingAdId, mediaId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSendError(typeof payload.error === "string" ? payload.error : "Message could not be sent.");
      return;
    }

    const newMsg: Message = {
      id: payload.message?.id || "m-" + Date.now(),
      conversationId: activeConversation.id,
      senderId: "user-current",
      senderName: "You",
      senderAvatar: "",
      content: inputMessage.trim(),
      mediaUrl: payload.message?.media_url || undefined,
      status: "SENT",
      createdAt: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((current) => [...current, newMsg]);
    setInputMessage("");
  };

  const hideOpeners = () => {
    setOpenersHidden(true);
    try { window.localStorage.setItem(OPENERS_HIDDEN, "1"); } catch { /* the choice just won't persist */ }
  };

  const requestCount = conversations.filter((c) => c.isRequest).length;
  const unreadCount = conversations.filter((c) => !c.isRequest && c.unreadCount > 0).length;
  const filteredConversations = conversations.filter((c) =>
    c.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    && (folder === "REQUESTS" ? c.isRequest : !c.isRequest && (folder === "INBOX" || c.unreadCount > 0))
  );

  const name = participant.displayName;
  const her = possessive(participant);
  const threadLoaded = loadedThread === participantId;
  const emptyThread = threadLoaded && messages.length === 0;
  const established = Boolean(context.approach?.established) || messages.some((m) => m.senderId !== "user-current");
  const sharedWords = context.shared.map((id) => desireById(id)?.label?.toLowerCase()).filter(Boolean) as string[];
  const explicitRule = explicitPhotoRule(context.approach?.explicitMediaInChat, established, name);
  const explicitAllowed = context.approach?.explicitMediaInChat === "COMFORTABLE" || (context.approach?.explicitMediaInChat === "ASK_FIRST" && established);
  const openers = emptyThread && !openersHidden ? openersFor({ plan: context.plan, shared: sharedWords }) : [];
  const status = participant.isOnline ? "Here now" : null;

  return (
    <div className="grid h-[calc(100svh-4rem)] grid-cols-1 text-left md:h-[calc(100vh-7rem)] md:grid-cols-[340px_minmax(0,1fr)] md:gap-0 md:overflow-hidden md:rounded-[28px] md:border md:border-velora-line md:bg-velora-surface">
      {/* Conversations */}
      <section aria-label="Conversations" className={`${phonePane === "list" ? "flex" : "hidden"} min-h-0 flex-col bg-velora-surface md:flex md:border-r md:border-velora-line`}>
        <div className="px-5 pb-3 pt-5">
          <h1 className="font-display text-[40px] leading-none text-velora-ink">Messages</h1>
          <div className="mt-4 flex gap-5" role="tablist" aria-label="Message folders">
            {([["INBOX", "Inbox", 0], ["UNREAD", "Unread", unreadCount], ["REQUESTS", "Requests", requestCount]] as const).map(([value, label, count]) => (
              <button key={value} type="button" role="tab" aria-selected={folder === value} onClick={() => setFolder(value)} className={`min-h-11 border-b-2 text-[15px] transition-colors ${folder === value ? "border-velora-copper font-semibold text-velora-ink" : "border-transparent text-velora-muted hover:text-velora-ink"}`}>
                {label}{count > 0 ? ` · ${count}` : ""}
              </button>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-3 border-b border-velora-ink/40 pb-2">
            <Search className="h-4 w-4 text-velora-ink2" aria-hidden />
            <span className="sr-only">Search conversations</span>
            <input type="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name" className="w-full bg-transparent text-[16px] text-velora-ink placeholder:text-velora-muted focus:outline-none" />
          </label>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {filteredConversations.map((c) => {
            const isActive = activeConversation.id === c.id;
            return (
              <li key={c.id}>
                <button type="button" onClick={() => onSelectConversation(c)} aria-current={isActive ? "true" : undefined} className={`flex min-h-[76px] w-full items-center gap-4 border-b border-velora-line/70 py-3 text-left ${isActive ? "md:bg-velora-sunken/60 md:-mx-5 md:w-[calc(100%+2.5rem)] md:px-5" : ""}`}>
                  <Portrait src={c.participant.avatarUrl} name={c.participant.displayName} sizes="44px" className="h-[55px] w-11 shrink-0" monogramClassName="text-xl" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate font-display text-[22px] leading-tight ${c.unreadCount > 0 ? "text-velora-ink" : "text-velora-ink"}`}>{c.participant.displayName}</span>
                      {c.participant.isOnline && <span className="h-2 w-2 shrink-0 rounded-full bg-velora-copper" role="img" aria-label="Here now" />}
                    </span>
                    <span className={`block truncate text-[14px] ${c.unreadCount > 0 ? "font-semibold text-velora-ink" : "text-velora-muted"}`}>{c.lastMessage?.content || "Conversation started"}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {filteredConversations.length === 0 && <li className="py-8 text-[15px] text-velora-ink2">{folder === "REQUESTS" ? "No message requests." : folder === "UNREAD" ? "You're all caught up." : "No conversations here yet."}</li>}
          {onLoadOlderConversations && !searchQuery && (
            <li><button type="button" onClick={onLoadOlderConversations} disabled={loadingOlderConversations} className="mt-3 min-h-11 text-[15px] text-velora-ink2 underline underline-offset-4 disabled:opacity-50">{loadingOlderConversations ? "Loading older conversations…" : "Load older conversations"}</button></li>
          )}
        </ul>
      </section>

      {/* Thread */}
      <section aria-label={`Conversation with ${name}`} className={`${phonePane === "thread" ? "flex" : "hidden"} min-h-0 flex-col bg-velora-surface md:flex`}>
        <header className="flex items-center gap-3 border-b border-velora-line px-3 py-2 md:px-6">
          <button type="button" onClick={onBackToList} aria-label="Back to conversations" className="flex h-11 w-11 items-center justify-center text-velora-ink md:hidden"><ArrowLeft className="h-5 w-5" aria-hidden /></button>
          <Link href={`/profile/${participantId}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Portrait src={participant.avatarUrl} name={name} sizes="40px" className="h-10 w-10 shrink-0 rounded-full" monogramClassName="text-lg" />
            <span className="min-w-0">
              <span className="block truncate font-display text-[24px] leading-tight text-velora-ink">{name}</span>
              {status && <span className="block text-[13px] text-velora-muted">{status}</span>}
            </span>
          </Link>
          <div className="relative">
            <button type="button" aria-label="More" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center text-velora-ink"><MoreHorizontal className="h-5 w-5" aria-hidden /></button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-11 z-20 w-52 border border-velora-line bg-velora-surface py-2 shadow-card">
                <Link role="menuitem" href={`/profile/${participantId}`} className="flex min-h-11 items-center px-4 text-[15px] text-velora-ink hover:bg-velora-sunken">{her === "their" ? "Their" : her === "her" ? "Her" : "His"} portrait</Link>
                <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setReportModalOpen(true); }} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-ink hover:bg-velora-sunken">Report</button>
                <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); setBlockModalOpen(true); }} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-crimson hover:bg-velora-sunken">Block</button>
              </div>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8">
          {context.plan && (
            <blockquote className="mb-5 border-l-2 border-velora-copper pl-4">
              <p className="text-[14px] text-velora-ink2">Replying to {her} invitation{planWindow(context.plan) ? ` · ${planWindow(context.plan)}` : ""}</p>
              <p className="mt-1 font-display text-[26px] leading-[1.15] text-velora-ink">{context.plan.title}</p>
            </blockquote>
          )}
          {(sharedWords.length > 0 || explicitRule || (!established && context.approach?.line)) && (
            <p className="mb-6 text-[15px] leading-relaxed text-velora-ink2">
              {sharedWords.length > 0 && <>You both list {sharedWords.length === 1 ? sharedWords[0] : `${sharedWords.slice(0, -1).join(", ")} and ${sharedWords[sharedWords.length - 1]}`}. </>}
              {!established && context.approach?.line && <>{context.approach.line} </>}
              {explicitRule}
            </p>
          )}
          {activeConversation.isRequest && (
            <p className="mb-5 text-[14px] text-velora-ink2" role="note">
              Message request: you haven&apos;t replied yet. Reply to move it to your inbox, or block or report from the menu.
            </p>
          )}
          {nextCursor && <div className="mb-4 text-center"><button type="button" onClick={() => void loadOlder()} disabled={loadingOlder} className="min-h-11 text-[14px] text-velora-ink2 underline underline-offset-4">{loadingOlder ? "Loading…" : "Load older messages"}</button></div>}
          <ol className="space-y-3">
            {messages.map((m) => {
              const isMe = m.senderId === "user-current";
              return (
                <li key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[85%] px-4 py-3 text-[16px] leading-relaxed md:max-w-md ${isMe ? "rounded-[20px] rounded-br-md bg-velora-accent text-velora-paper" : "rounded-[20px] rounded-bl-md bg-velora-sunken text-velora-ink"}`}>
                    {m.mediaUrl && <div className={m.content ? "mb-2" : ""}><ChatPhoto src={m.mediaUrl} mine={isMe} /></div>}
                    {m.content && <p className="whitespace-pre-line">{m.content}</p>}
                  </div>
                  <span className="mt-1 px-1 text-[13px] text-velora-muted">{m.createdAt}{isMe && m.status === "READ" ? " · Read" : ""}</span>
                </li>
              );
            })}
          </ol>
          <div ref={threadEnd} />
        </div>

        {/* Photos are private chat media (P1-10): served only to the two participants. */}
        <div className="border-t border-velora-line bg-velora-surface px-4 pb-3 pt-3 md:px-8">
          {openers.length > 0 && (
            <div className="mb-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[14px] text-velora-muted">If you&apos;d like a start</p>
                <button type="button" onClick={hideOpeners} className="min-h-11 text-[14px] text-velora-ink underline underline-offset-4">Hide</button>
              </div>
              <ul>
                {openers.map((opener) => (
                  <li key={opener}><button type="button" onClick={() => { setInputMessage(opener); inputRef.current?.focus(); }} className="py-1 text-left font-display text-[22px] italic leading-snug text-velora-copperInk hover:text-velora-ink">&ldquo;{opener}&rdquo;</button></li>
                ))}
              </ul>
            </div>
          )}
          {datingAdId && !context.plan && <p className="mb-2 text-[14px] text-velora-ink2">Replying to an invitation. Who can reply is checked when you send.</p>}
          {sendError && <p role="alert" className="mb-2 text-[14px] text-velora-crimson">{sendError}</p>}
          {attachOpen && (
            <div className="mb-3 border border-velora-line bg-velora-paper p-4">
              <button type="button" onClick={() => photoInputRef.current?.click()} className="min-h-11 text-[16px] font-semibold text-velora-ink underline underline-offset-4">Choose a photo</button>
              <label className={`mt-2 flex items-start gap-3 text-[15px] ${explicitAllowed ? "text-velora-ink" : "text-velora-muted"}`}>
                <input type="checkbox" className="mt-1 h-5 w-5 accent-velora-ink" checked={photoExplicit && explicitAllowed} disabled={!explicitAllowed} onChange={(event) => setPhotoExplicit(event.target.checked)} />
                <span>This photo is explicit{!explicitAllowed && <span className="block text-[14px]">{explicitRule || "Not available in this conversation."}</span>}</span>
              </label>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a photo to send" tabIndex={-1} className="sr-only" onChange={(event) => void sendPhoto(event.target.files?.[0])} />
            <button type="button" onClick={() => setAttachOpen(!attachOpen)} disabled={uploadingPhoto !== null} aria-expanded={attachOpen} aria-label="Send a photo" className="flex h-12 w-11 shrink-0 items-center justify-center text-velora-ink disabled:opacity-50">
              {uploadingPhoto !== null ? <span className="text-[13px]">{uploadingPhoto}%</span> : <Plus className="h-5 w-5" aria-hidden />}
            </button>
            <label className="flex min-h-12 flex-1 items-center rounded-[24px] border border-velora-ink/60 bg-velora-surface px-4 focus-within:border-velora-ink">
              <span className="sr-only">Message {name}</span>
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={emptyThread ? "Introduce yourself…" : "Write a message…"}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); } }}
                className="max-h-32 w-full resize-none bg-transparent py-3 text-[16px] text-velora-ink placeholder:text-velora-muted focus:outline-none"
              />
            </label>
            <button type="button" onClick={() => void handleSendMessage()} disabled={!inputMessage.trim()} aria-label="Send" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-velora-accent text-velora-paper disabled:opacity-40">
              <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUsername={name}
        targetProfileId={participantId}
        contentType="MESSAGE"
      />

      <Modal isOpen={blockModalOpen} onClose={() => setBlockModalOpen(false)} title={`Block ${name}?`}>
        <div className="space-y-5 text-left">
          <p className="text-[16px] leading-relaxed text-velora-ink2">You will no longer see or contact each other. Blocked members cannot view your profile or send messages.</p>
          <div className="flex items-center gap-5">
            <button type="button" className="min-h-11 text-[16px] text-velora-ink underline underline-offset-4" onClick={() => setBlockModalOpen(false)}>Cancel</button>
            <button type="button" className="min-h-12 flex-1 rounded-full bg-velora-crimson text-[16px] font-semibold text-velora-paper" onClick={async () => {
              const response = await fetch("/api/blocks", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: participantId }) });
              if (response.ok) { setBlockModalOpen(false); window.location.assign("/messages"); }
            }}>Block</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function toMessage(item: any, conversation: Conversation): Message {
  const participantId = conversation.participant.id || conversation.participant.userId;
  const theirs = item.sender_id === participantId;
  return {
    id: item.id,
    conversationId: item.conversation_id,
    senderId: theirs ? participantId : "user-current",
    senderName: theirs ? conversation.participant.displayName : "You",
    senderAvatar: theirs ? conversation.participant.avatarUrl : "",
    content: item.content,
    mediaUrl: item.attachment_type === "IMAGE" ? item.media_url || undefined : undefined,
    status: item.status,
    createdAt: new Date(item.created_at).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }),
  };
}
