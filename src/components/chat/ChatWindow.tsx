"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Message, Conversation } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ReportModal } from "@/components/safety/ReportModal";
import {
  MessageSquare,
  Send,
  Lock,
  MoreVertical,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Check,
  CheckCheck,
  Eye,
  UserCheck,
  MapPin,
  X,
  Search,
} from "lucide-react";

interface ChatWindowProps {
  conversations: Conversation[];
  activeConversation: Conversation;
  onSelectConversation: (conv: Conversation) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Load durable messages through the authenticated participant boundary.
  useEffect(() => {
    if (!activeConversation) return;
    const participantId = activeConversation.participant.id || activeConversation.participant.userId;
    let active = true;
    fetch(`/api/messages?peerId=${encodeURIComponent(participantId)}`, { credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : Promise.reject(new Error("Messages unavailable")))
      .then((payload) => {
        if (!active) return;
        setMessages((payload.messages || []).map((item: any) => ({
          id: item.id,
          conversationId: item.conversation_id,
          senderId: item.sender_id === participantId ? participantId : "user-current",
          senderName: item.sender_id === participantId ? activeConversation.participant.displayName : "You",
          senderAvatar: item.sender_id === participantId ? activeConversation.participant.avatarUrl : "",
          content: item.content,
          status: item.status,
          createdAt: new Date(item.created_at).toLocaleString(),
        })));
        setNextCursor(payload.pagination?.nextCursor || null);
      })
      .catch(() => { if (active) setMessages([]); });
    return () => { active = false; };
  }, [activeConversation]);

  const [inputMessage, setInputMessage] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);

  const loadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const participantId = activeConversation.participant.id || activeConversation.participant.userId;
    const response = await fetch(`/api/messages?peerId=${encodeURIComponent(participantId)}&before=${encodeURIComponent(nextCursor)}`, { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      const older = (payload.messages || []).map((item: any) => ({ id: item.id, conversationId: item.conversation_id, senderId: item.sender_id === participantId ? participantId : "user-current", senderName: item.sender_id === participantId ? activeConversation.participant.displayName : "You", senderAvatar: item.sender_id === participantId ? activeConversation.participant.avatarUrl : "", content: item.content, status: item.status, createdAt: new Date(item.created_at).toLocaleString() }));
      setMessages((current) => [...older, ...current.filter((message) => !older.some((item: Message) => item.id === message.id))]);
      setNextCursor(payload.pagination?.nextCursor || null);
    }
    setLoadingOlder(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const participantId = activeConversation.participant.id || activeConversation.participant.userId;
    const response = await fetch("/api/messages", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: participantId, content: inputMessage.trim() }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return;

    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: Message = {
      id: payload.message?.id || "m-" + Date.now(),
      conversationId: activeConversation.id,
      senderId: "user-current",
      senderName: "You",
      senderAvatar: "",
      content: inputMessage.trim(),
      status: "SENT",
      createdAt: nowTime,
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputMessage("");

  };

  const filteredConversations = conversations.filter((c) =>
    c.participant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)] text-left">
      {/* Sidebar: Conversation List matching Amateri reference */}
      <Card variant="glass" className="p-3 space-y-3 flex flex-col h-full overflow-hidden">
        {/* Search Conversations Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-velora-textMuted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-velora-textMuted focus:outline-none focus:border-amber-400/60 transition-all"
          />
        </div>

        <div className="flex items-center justify-between px-2 pt-1 border-t border-white/10">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-velora-textMuted font-mono">
            Messages ({filteredConversations.length})
          </h2>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Sync
          </span>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {filteredConversations.map((c) => {
            const isActive = activeConversation.id === c.id;
            const genderSymbol =
              (c.participant as any).genderSymbol ||
              (c.participant.gender === "FEMALE" ? "♀" : c.participant.gender === "MALE" ? "♂" : "👫");

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={`p-2.5 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500/20 to-amber-900/20 border border-amber-400/40 shadow-gold-glow"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="w-11 h-11 rounded-full border border-white/20 overflow-hidden bg-velora-card shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.participant.avatarUrl}
                    alt={c.participant.displayName}
                    className="w-full h-full object-cover"
                  />
                  {c.participant.isOnline ? (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-velora-bg" title="Online" />
                  ) : (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-gray-500 border-2 border-velora-bg" title="Offline" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">
                        {c.participant.displayName}
                      </h3>
                      <span className="text-[10px] text-pink-400 font-bold shrink-0">{genderSymbol}</span>
                      {c.participant.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20 shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-velora-textMuted shrink-0 ml-1">
                      {c.lastMessage?.createdAt}
                    </span>
                  </div>

                  <p className="text-[11px] text-velora-textMuted truncate mt-0.5 flex items-center gap-1">
                    <span className="text-[10px]">↩</span>
                    <span className="truncate">{c.lastMessage?.content || "Conversation started"}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Main Chat Thread Window */}
      <Card variant="glass" className="md:col-span-2 p-0 flex flex-col h-full overflow-hidden relative">
        {/* Chat Thread Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-velora-card/60">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowProfilePreview(!showProfilePreview)}
          >
            <div className="w-10 h-10 rounded-full border border-velora-gold/40 overflow-hidden bg-velora-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeConversation.participant.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-velora-textPrimary flex items-center gap-2">
                {activeConversation.participant.displayName}
                {activeConversation.participant.verified && <Badge type="verified" label="" />}
              </h3>
              <p className="text-[10px] text-velora-textMuted">
                {activeConversation.participant.isOnline ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {activeConversation.participant.location
                      ? `${activeConversation.participant.location} • Active Now`
                      : "Active Now"}
                  </span>
                ) : (
                  <span className="text-gray-400">
                    {activeConversation.participant.location
                      ? `${activeConversation.participant.location} • Offline`
                      : "Offline"}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <Link href={`/profile/${activeConversation.participant.id}`}>
              <Button variant="glass" size="sm" className="text-xs">
                View Profile
              </Button>
            </Link>

            <button
              onClick={() => setReportModalOpen(true)}
              className="p-2 rounded-full glass-panel text-velora-textMuted hover:text-red-400 hover:border-red-500/40 transition-colors"
              title="Report User"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>

            <button
              onClick={() => setBlockModalOpen(true)}
              className="p-2 rounded-full glass-panel text-velora-textMuted hover:text-red-400 hover:border-red-500/40 transition-colors"
              title="Block User"
            >
              <Ban className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {nextCursor && <div className="text-center"><Button variant="ghost" size="sm" onClick={() => void loadOlder()} disabled={loadingOlder}>{loadingOlder ? "Loading…" : "Load older messages"}</Button></div>}
          {messages.map((m) => {
            const isMe = m.senderId === "user-current";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] text-velora-textMuted">{m.senderName}</span>
                  <span className="text-[10px] text-velora-textMuted">• {m.createdAt}</span>
                </div>

                <div
                  className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed relative ${
                    isMe
                      ? "bg-gold-gradient text-velora-bg font-medium shadow-gold-glow rounded-tr-none"
                      : "glass-panel text-velora-textPrimary border-white/10 rounded-tl-none"
                  }`}
                >
                  <p>{m.content}</p>

                  {/* Delivery Status Indicator for sent messages */}
                  {isMe && (
                    <div className="flex justify-end pt-1 text-velora-bg/80">
                      {m.status === "SENT" && <span title="Sent"><Check className="w-3.5 h-3.5" /></span>}
                      {m.status === "DELIVERED" && <span title="Delivered"><CheckCheck className="w-3.5 h-3.5" /></span>}
                      {m.status === "READ" && <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-velora-bg font-bold" /></span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}


        </div>

        {/* Text messaging only until attachments have a moderated durable lifecycle. */}
        <div className="p-4 border-t border-white/10 bg-velora-card/60 space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Write a private message…"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />
            <Button variant="gold" size="sm" className="p-3 rounded-2xl" onClick={handleSendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Safety Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUsername={activeConversation.participant.displayName}
        targetProfileId={activeConversation.participant.id || activeConversation.participant.userId}
        contentType="MESSAGE"
      />

      {/* User Block Modal */}
      <Modal isOpen={blockModalOpen} onClose={() => setBlockModalOpen(false)} title="Confirm User Block">
        <div className="space-y-4 text-left">
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Are you sure you want to block <strong>@{activeConversation.participant.displayName}</strong>? Blocked members cannot view your profile or send messages.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setBlockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="w-2/3 text-xs font-bold" onClick={async () => {
              const targetProfileId = activeConversation.participant.id || activeConversation.participant.userId;
              const response = await fetch("/api/blocks", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId }) });
              if (response.ok) setBlockModalOpen(false);
            }}>
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
