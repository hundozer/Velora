"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DEFAULT_COMMUNITY_CHATROOMS } from "@/lib/data/communitiesChatrooms";
import { MOCK_COMMUNITIES } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users,
  MessageSquare,
  MapPin,
  Lock,
  Globe,
  Sparkles,
  ShieldCheck,
  Search,
  Plus,
  Flame,
  Radio,
  ArrowRight,
} from "lucide-react";

export default function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChatrooms = DEFAULT_COMMUNITY_CHATROOMS.filter((room) => {
    if (!searchQuery) return true;
    return (
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.badge.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 font-mono uppercase">
              <Users className="w-3.5 h-3.5 text-amber-400" /> INTIMO TOPIC CHATROOMS & SALONS
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Real-time Adult Social Lounge</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Globe className="w-8 h-8 text-velora-gold" />
            Live Communities & Topic Chatrooms
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Join topic-based live chatrooms with likeminded adult members across Europe. Chat in real-time, view color-coded active room profiles, and filter by gender.
          </p>
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-velora-textMuted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search chatrooms & topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
          />
        </div>
      </div>

      {/* TOPIC CHATROOMS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Default Topic Chatrooms
          </h2>
          <span className="text-xs text-amber-400 font-mono font-bold">
            5 Live Rooms Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChatrooms.map((room) => (
            <Card
              key={room.id}
              variant="goldBorder"
              hoverEffect
              className="p-6 space-y-4 text-left flex flex-col justify-between bg-gold-card group border-amber-400/30"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                    {room.icon}
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    {room.activeOnlineCount} Online
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                    {room.name}
                  </h3>
                  <span className="text-[11px] font-mono text-amber-400 font-bold block mt-0.5">
                    {room.badge}
                  </span>
                </div>

                <p className="text-xs text-velora-textMuted leading-relaxed line-clamp-2">
                  {room.description}
                </p>

                {/* Gender Color Preview Legend */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-velora-textMuted">Active:</span>
                  <span className="text-rose-400 font-bold">♀ Females</span>
                  <span className="text-sky-400 font-bold">♂ Males</span>
                  <span className="text-amber-300 font-bold">👫 Couples</span>
                  <span className="text-purple-400 font-bold">⚧ Trans</span>
                </div>
              </div>

              <div className="pt-3">
                <Link href={`/communities/${room.slug}`}>
                  <Button
                    variant="gold"
                    size="sm"
                    className="w-full text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow text-black"
                  >
                    <MessageSquare className="w-4 h-4 text-black" /> Enter Live Chatroom <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* REGIONAL & CITY COMMUNITY HUBS */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            Regional & City Private Clubs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_COMMUNITIES.map((community) => (
            <Card key={community.id} variant="glass" hoverEffect className="p-0 overflow-hidden text-left flex flex-col justify-between group">
              <div>
                <div className="h-40 w-full bg-velora-card relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={community.coverImageUrl}
                    alt={community.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/30 to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/70 text-velora-gold border border-velora-gold/30 flex items-center gap-1 font-mono uppercase">
                      <MapPin className="w-3 h-3" />
                      {community.location || "City Hub"}
                    </span>
                    {community.isPrivate && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Invite Only
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-base font-serif font-bold text-velora-textPrimary group-hover:text-velora-gold transition-colors">
                    {community.name}
                  </h3>
                  <p className="text-xs text-velora-textMuted line-clamp-2 leading-relaxed">
                    {community.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-velora-textSecondary pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-velora-gold" /> {community.membersCount} Members
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-white/10 mt-3">
                <Link href={`/communities/room-chatting`}>
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-velora-textPrimary">
                    View Hub Chat
                  </Button>
                </Link>

                <Link href="/communities/room-sexpartner-finder">
                  <Button variant="gold" size="sm" className="text-xs font-bold text-black shadow-gold-glow">
                    Join Lounge
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
