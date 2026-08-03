"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_LIVE_STREAMS, CREATOR_CATEGORIES } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import {
  Radio,
  Users,
  Clock,
  Sparkles,
  Search,
  SlidersHorizontal,
  Lock,
  Crown,
  Ticket,
  Calendar,
} from "lucide-react";

export default function LiveDiscoveryPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [accessFilter, setAccessFilter] = useState("ALL");
  const [ticketCheckoutOpen, setTicketCheckoutOpen] = useState(false);
  const [selectedTicketStream, setSelectedTicketStream] = useState<any | null>(null);

  const activeStreams = MOCK_LIVE_STREAMS.filter((s) => s.status === "LIVE");
  const scheduledStreams = MOCK_LIVE_STREAMS.filter((s) => s.status === "SCHEDULED");

  const handleBuyTicket = (stream: any) => {
    setSelectedTicketStream(stream);
    setTicketCheckoutOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5" /> NOW LIVE BROADCASTS
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• High-Discretion WebRTC</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-500" />
            Velora Live Experiences & Salons
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Join exclusive private live sessions, ticketed salon concerts, art gallery previews, and direct creator Q&A rooms.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-4 glass-panel-gold rounded-2xl border border-velora-gold/40 text-center">
            <span className="text-2xl font-serif font-bold text-velora-gold block">
              {activeStreams.reduce((acc, s) => acc + s.currentViewersCount, 0)}
            </span>
            <span className="text-[10px] text-velora-textMuted uppercase">Active Live Viewers</span>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedCategory === "ALL"
              ? "bg-gold-gradient text-velora-bg shadow-gold-glow"
              : "glass-panel text-velora-textMuted hover:text-white"
          }`}
        >
          All Categories
        </button>
        {CREATOR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat
                ? "bg-gold-gradient text-velora-bg shadow-gold-glow"
                : "glass-panel text-velora-textMuted hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* SECTION 1: NOW LIVE */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            Currently Streaming Live ({activeStreams.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeStreams.map((stream) => (
            <Card key={stream.id} variant="goldBorder" hoverEffect className="p-0 overflow-hidden text-left group">
              <div className="h-64 w-full bg-velora-card relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stream.thumbnailUrl}
                  alt={stream.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/40 to-transparent" />

                {/* Live Badge & Viewer Count */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1.5 shadow-lg uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5 animate-pulse" /> LIVE NOW
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-card/90 text-white border border-white/20 flex items-center gap-1.5 font-mono">
                    <Users className="w-3.5 h-3.5 text-velora-gold" />
                    {stream.currentViewersCount} Viewers
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-velora-gold overflow-hidden bg-velora-card shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stream.creatorAvatar} alt={stream.creatorName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-velora-textPrimary">{stream.creatorName}</h3>
                    <span className="text-[10px] uppercase font-bold text-amber-300">{stream.category}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-serif font-bold text-velora-textPrimary group-hover:text-velora-gold transition-colors">
                    {stream.title}
                  </h4>
                  <p className="text-xs text-velora-textMuted line-clamp-2 mt-1 leading-relaxed">
                    {stream.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <span className="text-xs font-bold text-velora-gold">
                    {stream.accessType === "FREE"
                      ? "Free Access"
                      : stream.accessType === "SUBSCRIBER_ONLY"
                      ? "Subscriber Only"
                      : `Ticket: $${stream.ticketPrice}`}
                  </span>

                  <Link href={`/live/${stream.id}`}>
                    <Button variant="gold" size="sm" className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow">
                      <Radio className="w-4 h-4" /> Enter Live Room
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SECTION 2: SCHEDULED UPCOMING LIVE EVENTS */}
      <div className="space-y-6 pt-4 border-t border-white/10">
        <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-400" />
          Scheduled Live Experiences & Private Salons
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {scheduledStreams.map((stream) => (
            <Card key={stream.id} variant="glass" className="p-0 overflow-hidden text-left space-y-3">
              <div className="h-44 w-full bg-velora-card relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold bg-velora-card/90 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {stream.scheduledStartTime}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-velora-gold">{stream.category}</span>
                  <span className="text-[10px] text-velora-textMuted">• {stream.creatorName}</span>
                </div>

                <h4 className="text-sm font-bold text-velora-textPrimary">{stream.title}</h4>
                <p className="text-xs text-velora-textMuted line-clamp-2">{stream.description}</p>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <span className="text-xs font-bold text-velora-textPrimary">
                    {stream.accessType === "SUBSCRIBER_ONLY" ? "Subscriber Only" : `Ticket $${stream.ticketPrice}`}
                  </span>
                  <Button
                    variant="glass"
                    size="sm"
                    className="text-xs font-bold border-amber-500/40 text-amber-300"
                    onClick={() => handleBuyTicket(stream)}
                  >
                    Reserve Ticket
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Ticket Checkout Modal */}
      {selectedTicketStream && (
        <CheckoutModal
          isOpen={ticketCheckoutOpen}
          onClose={() => setTicketCheckoutOpen(false)}
          productTitle={selectedTicketStream.title}
          creatorName={selectedTicketStream.creatorName}
          grossAmount={selectedTicketStream.ticketPrice || 20}
          type="PREMIUM_ALBUM_UNLOCK"
        />
      )}
    </div>
  );
}
