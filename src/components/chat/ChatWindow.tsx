"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Message, Conversation, AttachmentType, MessageStatus } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ReportModal } from "@/components/safety/ReportModal";
import {
  MessageSquare,
  Send,
  Lock,
  Image as ImageIcon,
  MoreVertical,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Check,
  CheckCheck,
  Eye,
  Clock,
  Sparkles,
  Heart,
  UserCheck,
  MapPin,
  X,
  FileImage,
  Flame,
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      conversationId: activeConversation.id,
      senderId: activeConversation.participant.userId,
      senderName: activeConversation.participant.displayName,
      senderAvatar: activeConversation.participant.avatarUrl,
      content: "Hello! I noticed your profile and shared interest in luxury art curation.",
      status: "READ",
      createdAt: "10:30 AM",
    },
    {
      id: "m-2",
      conversationId: activeConversation.id,
      senderId: "user-current",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      content: "Hi! Thank you for connecting. Are you attending the Monaco gallery opening next month?",
      status: "READ",
      createdAt: "10:38 AM",
    },
    {
      id: "m-3",
      conversationId: activeConversation.id,
      senderId: activeConversation.participant.userId,
      senderName: activeConversation.participant.displayName,
      senderAvatar: activeConversation.participant.avatarUrl,
      content: "I'll be visiting London next Thursday. Shall we meet at the Connaught Bar?",
      status: "READ",
      createdAt: "10:42 AM",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState<AttachmentType>("STANDARD_IMAGE");
  const [isDisappearing, setIsDisappearing] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);

  // Simulate typing indicator from active participant
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMsg: Message = {
      id: "m-" + Date.now(),
      conversationId: activeConversation.id,
      senderId: "user-current",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      content: inputMessage,
      attachmentType: attachmentMode,
      isDisappearing: isDisappearing,
      disappearTimerSec: isDisappearing ? 10 : undefined,
      status: "SENT",
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([...messages, newMsg]);
    setInputMessage("");
    setIsTyping(false);

    // Simulate delivery transition after 1s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === newMsg.id ? { ...msg, status: "DELIVERED" } : msg))
      );
    }, 1200);

    // Simulate read transition after 3s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === newMsg.id ? { ...msg, status: "READ" } : msg))
      );
    }, 3000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)] text-left">
      {/* Sidebar: Conversation List */}
      <Card variant="glass" className="p-4 space-y-3 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-velora-textMuted font-serif">
            Encrypted Chats ({conversations.length})
          </h2>
          <span className="text-[10px] text-emerald-400 font-mono">100% Private</span>
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {conversations.map((c) => {
            const isActive = activeConversation.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c)}
                className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${
                  isActive
                    ? "glass-panel-gold border-velora-gold/50 shadow-gold-glow"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="w-12 h-12 rounded-full border border-velora-gold/40 overflow-hidden bg-velora-card shrink-0 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.participant.avatarUrl}
                    alt={c.participant.displayName}
                    className="w-full h-full object-cover"
                  />
                  {c.participant.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-velora-bg" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-velora-textPrimary truncate">
                      {c.participant.displayName}
                    </h3>
                    <span className="text-[10px] text-velora-textMuted">{c.lastMessage.createdAt}</span>
                  </div>
                  <p className="text-[11px] text-velora-textMuted truncate mt-0.5">
                    {c.isTyping ? <span className="text-velora-gold animate-pulse">Typing message...</span> : c.lastMessage.content}
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
                {isTyping ? (
                  <span className="text-velora-gold font-bold">is typing...</span>
                ) : (
                  `${activeConversation.participant.location} • Active Now`
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
                  {/* Disappearing Media Badge if applicable */}
                  {m.isDisappearing && (
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-amber-300 mb-1">
                      <Flame className="w-3 h-3 text-amber-400" />
                      Disappearing Media (View Once)
                    </div>
                  )}

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

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-velora-textMuted font-mono">
              <span className="w-2 h-2 rounded-full bg-velora-gold animate-ping" />
              {activeConversation.participant.displayName} is typing...
            </div>
          )}
        </div>

        {/* Message Input Box with Attachment Options */}
        <div className="p-4 border-t border-white/10 bg-velora-card/60 space-y-2">
          {/* Options Bar */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsDisappearing(!isDisappearing)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all flex items-center gap-1 ${
                isDisappearing
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-white/5 text-velora-textMuted hover:text-white"
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              {isDisappearing ? "Disappearing Mode Active" : "Standard Photo"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="p-2.5 rounded-2xl glass-panel text-velora-textMuted hover:text-velora-gold transition-colors"
              title="Attach Photo"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Write a discreet encrypted message..."
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
            <Button variant="danger" className="w-2/3 text-xs font-bold" onClick={() => setBlockModalOpen(false)}>
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
