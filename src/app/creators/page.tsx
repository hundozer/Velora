"use client";

import React, { useState } from "react";
import { CreatorCard } from "@/components/creator/CreatorCard";
import { MOCK_PROFILES, CREATOR_CATEGORIES } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Crown,
  Search,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  Users,
  MapPin,
  TrendingUp,
} from "lucide-react";

export default function CreatorsMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"subscribers" | "followers" | "price">("subscribers");

  const filteredCreators = MOCK_PROFILES.filter((p) => {
    // Filter by name or bio
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.displayName.toLowerCase().includes(q);
      const bioMatch = p.bio.toLowerCase().includes(q);
      if (!nameMatch && !bioMatch) return false;
    }

    // Filter by category
    if (selectedCategory !== "ALL") {
      if (!p.categories || !p.categories.includes(selectedCategory)) return false;
    }

    // Filter by verified status
    if (verifiedOnly && !p.verified) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "subscribers") return (b.subscribersCount || 0) - (a.subscribersCount || 0);
    if (sortBy === "followers") return (b.followersCount || 0) - (a.followersCount || 0);
    if (sortBy === "price") return (a.monthlySubscriptionPrice || 0) - (b.monthlySubscriptionPrice || 0);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge type="custom" label="Creator Economy" className="bg-amber-500/20 text-amber-300 border-amber-500/40" />
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Verified Creators</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Crown className="w-8 h-8 text-velora-gold" />
            Velora Creator Marketplace
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Discover verified creators, subscribe to exclusive channels, unlock private photo albums, and join luxury live experiences.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-4 glass-panel-gold rounded-2xl border border-velora-gold/40 text-center">
            <span className="text-xl font-serif font-bold text-velora-gold block">100%</span>
            <span className="text-[10px] text-velora-textMuted uppercase">Biometric Verified</span>
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
          All Creators ({MOCK_PROFILES.length})
        </button>
        {CREATOR_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-gold-gradient text-velora-bg shadow-gold-glow"
                  : "glass-panel text-velora-textMuted hover:text-white"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search & Sort Toolbar */}
      <Card variant="glass" className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-velora-textMuted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search creator name, bio, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-velora-textMuted hover:text-white">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-velora-gold w-4 h-4 cursor-pointer"
            />
            <span className="font-semibold">Level 4 Verified</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-velora-textMuted">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-velora-card border border-white/10 rounded-xl px-3 py-2 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              <option value="subscribers">Top Subscribers</option>
              <option value="followers">Most Followed</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Creator Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCreators.map((creator) => (
          <CreatorCard key={creator.id} creator={creator} />
        ))}
      </div>
    </div>
  );
}
