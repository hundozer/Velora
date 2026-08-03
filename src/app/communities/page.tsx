"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_COMMUNITIES } from "@/lib/mockData";
import { CommunityItem } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
} from "lucide-react";

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityItem[]>(MOCK_COMMUNITIES);
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleJoin = (id: string) => {
    setCommunities(
      communities.map((c) =>
        c.id === id
          ? {
              ...c,
              isJoined: !c.isJoined,
              membersCount: c.isJoined ? c.membersCount - 1 : c.membersCount + 1,
            }
          : c
      )
    );
  };

  const filteredCommunities = communities.filter((c) => {
    if (filterType === "LOCATION" && c.type !== "LOCATION_CITY") return false;
    if (filterType === "INTEREST" && c.type !== "INTEREST_GROUP") return false;
    if (filterType === "PRIVATE" && !c.isPrivate) return false;

    if (searchQuery) {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> VELORA PRIVATE SALONS & GROUPS
            </span>
            <span className="text-xs text-amber-300 font-mono uppercase tracking-widest">• High-Discretion Social Ecosystem</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Globe className="w-8 h-8 text-velora-gold" />
            Velora Private Communities & City Clubs
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Connect with verified members in exclusive city hubs, interest circles, and invite-only private dining groups across Europe.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="gold" className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow">
            <Plus className="w-4 h-4" /> Create Private Group
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "ALL", label: "All Communities" },
            { id: "LOCATION", label: "City & Location Hubs" },
            { id: "INTEREST", label: "Interest & Lifestyle Circles" },
            { id: "PRIVATE", label: "Invite-Only Groups" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                filterType === tab.id
                  ? "bg-gold-gradient text-velora-bg shadow-gold-glow"
                  : "glass-panel text-velora-textMuted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-velora-textMuted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
          />
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community) => (
          <Card key={community.id} variant="glass" hoverEffect className="p-0 overflow-hidden text-left flex flex-col justify-between group">
            <div>
              <div className="h-44 w-full bg-velora-card relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={community.coverImageUrl}
                  alt={community.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/30 to-transparent" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/70 text-velora-gold border border-velora-gold/30 flex items-center gap-1 font-mono uppercase">
                    {community.type === "LOCATION_CITY" ? <MapPin className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-amber-300" />}
                    {community.type.replace("_", " ")}
                  </span>
                  {community.isPrivate && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Invite Only
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-3">
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
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> {community.postsCount} Posts
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center justify-between border-t border-white/10 mt-3">
              <Link href={`/communities/${community.id}`}>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-velora-textPrimary">
                  View Community
                </Button>
              </Link>

              <Button
                variant={community.isJoined ? "glass" : "gold"}
                size="sm"
                className={`text-xs font-bold ${community.isJoined ? "border-emerald-500/40 text-emerald-300" : ""}`}
                onClick={() => handleToggleJoin(community.id)}
              >
                {community.isJoined ? "Joined ✓" : "Join Club"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
