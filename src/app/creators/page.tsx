"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_PROFILES, CREATOR_CATEGORIES } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  Crown,
  Users,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function CreatorMarketplacePage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const creators = MOCK_PROFILES.filter((p) => p.categories && p.categories.length > 0);

  if (!user) {
    return <BehindTheDoorLanding />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> FREE CREATOR PROFILES
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Phase 1 Free MVP</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            Intimo Creators
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Discover creator profiles, free posts and public media. Creator subscriptions, paid content, tips and payouts are disabled in the free MVP.
          </p>
        </div>

        <Link href="/onboarding"><Button variant="gold" className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0 text-black"><Crown className="w-4 h-4 text-black" /> Set Up Creator Profile</Button></Link>
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

      {/* Creator Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {creators.map((creator) => (
          <Card key={creator.id} variant="goldBorder" hoverEffect className="p-0 overflow-hidden text-left flex flex-col justify-between group bg-gold-card">
            <div>
              <div className="h-72 w-full bg-velora-card relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={creator.avatarUrl}
                  alt={creator.displayName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter saturate-125"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/30 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1 font-mono uppercase">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Level 4 Creator
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-card/90 text-emerald-300 border border-emerald-500/40 font-mono">Free</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-left">
                  <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                    {creator.displayName}
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </h3>
                  <p className="text-xs text-velora-gold flex items-center gap-1 mt-0.5 font-medium">
                    {creator.categories?.join(" • ")}
                  </p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-velora-textSecondary line-clamp-2 leading-relaxed">
                  {creator.bio}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-velora-textMuted border-t border-white/10 pt-3">
                  <span className="flex items-center gap-1 text-amber-300">
                    <Users className="w-3.5 h-3.5" /> {creator.followersCount} Followers
                  </span>
                  <span>•</span>
                  <span>{creator.totalContentCount} Posts</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center gap-3 border-t border-white/10 mt-2">
              <Link href={`/profile/${creator.id}`} className="w-full">
                <Button variant="glass" size="sm" className="w-full text-xs font-bold">
                  View Profile
                </Button>
              </Link>

            </div>
          </Card>
        ))}
      </div>

    </div>
  );
}
