"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MOCK_CONVERSATIONS } from "@/lib/mockData";
import { Message } from "@/types";
import {
  MessageSquare,
  Send,
  Lock,
  Image as ImageIcon,
  MoreVertical,
  ShieldAlert,
  Ban,
  CheckCircle2,
  Phone,
  Video,
} from "lucide-react";

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState(MOCK_CONVERSATIONS[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      conversationId: "conv-1",
      senderId: "prof-1",
      senderName: "Elena Vance",
      senderAvatar: MOCK_CONVERSATIONS[0].participant.avatarUrl,
      content: "Hello! I noticed your profile and shared interest in luxury art curation.",
      createdAt: "10:30 AM",
    },
    {
      id: "m-2",
      conversationId: "conv-1",
      senderId: "user-current",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      content: "Hi Elena! Thank you for connecting. Are you attending the Monaco gallery opening next month?",
      createdAt: "10:38 AM",
    },
    {
      id: "m-3",
      conversationId: "conv-1",
      senderId: "prof-1",
      senderName: "Elena Vance",
      senderAvatar: MOCK_CONVERSATIONS[0].participant.avatarUrl,
      content: "I will be visiting London next Thursday. Shall we meet at the Connaught Bar?",
      createdAt: "10:42 AM",
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg: Message = {
      id: "m-" + Date.now(),
      conversationId: activeConv.id,
      senderId: "user-current",
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      content: inputMessage,
      createdAt: "Just now",
    };
    setMessages([...messages, newMsg]);
    setInputMessage("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-velora-gold" />
          Encrypted Private Messages
        </h1>
        <div className="flex items-center gap-2">
          <Badge type="verified" label="End-to-End Encrypted" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column: Conversations Drawer */}
        <Card variant="glass" className="p-4 space-y-3 flex flex-col h-full overflow-hidden">
          <h2 className="text-xs font-bold uppercase tracking-widest text-velora-textMuted px-2 font-serif">
            Active Chats ({MOCK_CONVERSATIONS.length})
          </h2>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {MOCK_CONVERSATIONS.map((c) => {
              const isActive = activeConv.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveConv(c)}
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

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-velora-textPrimary truncate">
                        {c.participant.displayName}
                      </h3>
                      <span className="text-[10px] text-velora-textMuted">{c.lastMessage.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-velora-textMuted truncate mt-0.5">
                      {c.lastMessage.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Column: Active Chat Thread */}
        <Card variant="glass" className="md:col-span-2 p-0 flex flex-col h-full overflow-hidden relative">
          {/* Thread Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-velora-card/60">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full border border-velora-gold/40 overflow-hidden bg-velora-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeConv.participant.avatarUrl}
                  alt="Participant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-sm font-bold text-velora-textPrimary flex items-center gap-2">
                  {activeConv.participant.displayName}
                  {activeConv.participant.verified && <Badge type="verified" label="" />}
                </h3>
                <p className="text-[10px] text-velora-textMuted">{activeConv.participant.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportModalOpen(true)}
                className="p-2 rounded-full glass-panel text-velora-textMuted hover:text-red-400 hover:border-red-500/40 transition-colors"
                title="Report or Block User"
              >
                <ShieldAlert className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Thread Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-left">
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
                    className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-gold-gradient text-velora-bg font-medium shadow-gold-glow rounded-tr-none"
                        : "glass-panel text-velora-textPrimary border-white/10 rounded-tl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Message Input Box */}
          <div className="p-4 border-t border-white/10 bg-velora-card/60 flex items-center gap-3">
            <button className="p-2.5 rounded-2xl glass-panel text-velora-textMuted hover:text-velora-gold transition-colors">
              <ImageIcon className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Write a discreet message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold/60"
            />
            <Button variant="gold" size="sm" className="p-3 rounded-2xl" onClick={handleSendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Report / Block Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Security & User Moderation">
        {reportSuccess ? (
          <div className="text-center space-y-4 py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-velora-textPrimary">Report Submitted</h3>
            <p className="text-xs text-velora-textMuted">
              Our moderation team has received your report and will audit this account within 1 hour.
            </p>
            <Button variant="gold" size="sm" onClick={() => setReportModalOpen(false)}>
              Close Window
            </Button>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-3 p-4 glass-panel rounded-2xl">
              <Ban className="w-6 h-6 text-red-400" />
              <div>
                <h4 className="text-sm font-bold text-velora-textPrimary">Report or Block Member</h4>
                <p className="text-xs text-velora-textMuted">Ensure safety and privacy standards are respected.</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
                Select Moderation Reason
              </label>
              <select className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary">
                <option>Inappropriate Solicitation / Offsite Links</option>
                <option>Underage Suspicion</option>
                <option>Harassment or Non-consensual Language</option>
                <option>Fake Profile / Impersonation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                Additional Details
              </label>
              <textarea
                rows={3}
                placeholder="Describe the issue for our admin review queue..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="w-2/3 text-xs font-bold uppercase"
                onClick={() => setReportSuccess(true)}
              >
                Submit Report & Block
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
