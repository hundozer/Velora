"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TipModal } from "@/components/streaming/TipModal";
import { ReportModal } from "@/components/safety/ReportModal";
import { LiveStreamService } from "@/lib/streaming/LiveStreamService";
import { MOCK_LIVE_STREAMS, MOCK_LIVE_CHAT } from "@/lib/mockData";
import { LiveChatMessage } from "@/types";
import {
  Radio,
  Users,
  Send,
  Heart,
  Sparkles,
  Crown,
  ShieldAlert,
  Flame,
  Volume2,
  Maximize2,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";

export default function LiveRoomPage() {
  const params = useParams();
  const streamId = (params?.id as string) || "ls-1";

  const stream = MOCK_LIVE_STREAMS.find((s) => s.id === streamId) || MOCK_LIVE_STREAMS[0];

  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>(MOCK_LIVE_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reactionsCount, setReactionsCount] = useState(148);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; left: number }[]>([]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMsg: LiveChatMessage = {
      id: "lc-" + Date.now(),
      streamId: stream.id,
      senderName: "You",
      senderAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      content: chatInput,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages([...chatMessages, newMsg]);
    setChatInput("");
  };

  const handleTipSent = (amount: number, message?: string) => {
    const tipPayload = LiveStreamService.createTipPayload("You", amount, message);
    setChatMessages((prev) => [...prev, tipPayload]);
  };

  const triggerReaction = () => {
    setReactionsCount(reactionsCount + 1);
    const newHeart = { id: Date.now(), left: Math.floor(Math.random() * 80) + 10 };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full border-2 border-velora-gold overflow-hidden bg-velora-card shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stream.creatorAvatar} alt={stream.creatorName} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-serif font-bold text-velora-textPrimary flex items-center gap-2">
              {stream.title}
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </h1>
            <p className="text-xs text-velora-textMuted flex items-center gap-2">
              <span className="font-bold text-velora-gold">{stream.creatorName}</span>
              <span>•</span>
              <span className="text-red-400 font-mono flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {stream.currentViewersCount} Live
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="gold"
            size="sm"
            className="text-xs font-bold gap-2 shadow-gold-glow"
            onClick={() => setTipModalOpen(true)}
          >
            <Heart className="w-4 h-4 fill-velora-bg" /> Send Tip
          </Button>

          <Button
            variant="glass"
            size="sm"
            className="text-xs border-amber-500/40 text-amber-300"
          >
            <Crown className="w-4 h-4" /> Subscribe
          </Button>

          <button
            onClick={() => setReportModalOpen(true)}
            className="p-2 rounded-full glass-panel text-velora-textMuted hover:text-red-400 transition-colors"
            title="Report Stream"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Video Player + Encrypted Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left 2 Cols: Video Stream Area */}
        <Card variant="glass" className="lg:col-span-2 p-0 overflow-hidden relative flex flex-col bg-black">
          {/* Stream Video Screen Container */}
          <div className="flex-1 w-full relative overflow-hidden bg-velora-card flex items-center justify-center">
            {stream.streamUrl ? (
              <video
                src={stream.streamUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stream.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            )}

            {/* Overlays */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1.5 shadow-lg uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/60 text-white border border-white/20">
                1080p WebRTC
              </span>
            </div>

            {/* Floating Hearts Reaction Animation */}
            {floatingHearts.map((h) => (
              <div
                key={h.id}
                style={{ left: `${h.left}%` }}
                className="absolute bottom-12 animate-bounce text-2xl text-rose-500 pointer-events-none transition-all duration-1000"
              >
                ❤️
              </div>
            ))}

            {/* Video Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-white">
                <Volume2 className="w-5 h-5 cursor-pointer hover:text-velora-gold" />
                <span className="font-mono">01:24:12</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={triggerReaction}
                  className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 hover:bg-rose-500/40 transition-all"
                >
                  ❤️ {reactionsCount}
                </button>
                <Maximize2 className="w-5 h-5 text-white cursor-pointer hover:text-velora-gold" />
              </div>
            </div>
          </div>
        </Card>

        {/* Right Col: Encrypted Live Chat Window */}
        <Card variant="glass" className="p-0 flex flex-col h-full overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-velora-card/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-velora-gold" />
              Encrypted Live Chat
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Mod Active</span>
          </div>

          {/* Chat Messages Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs text-left">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-2xl ${
                  msg.isTipMessage
                    ? "glass-panel-gold border-velora-gold shadow-gold-glow"
                    : "glass-panel"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-velora-textPrimary">{msg.senderName}</span>
                  <span className="text-[10px] text-velora-textMuted">{msg.createdAt}</span>
                </div>
                <p className="mt-0.5 text-velora-textSecondary leading-relaxed">{msg.content}</p>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-white/10 bg-velora-card/60 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Send a live message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
              />
              <Button variant="gold" size="sm" className="p-2.5 rounded-xl" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={tipModalOpen}
        onClose={() => setTipModalOpen(false)}
        creatorName={stream.creatorName}
        onTipSent={handleTipSent}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUsername={stream.creatorName}
      />
    </div>
  );
}
