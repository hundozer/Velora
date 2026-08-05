"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MOCK_PROFILES, CREATOR_CATEGORIES } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import {
  Sparkles,
  Crown,
  Lock,
  Radio,
  Users,
  Search,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { CreatorPreRegistrationModal } from "@/components/creator/CreatorPreRegistrationModal";

export default function CreatorMarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedCreator, setSelectedCreator] = useState<any | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [creatorModalOpen, setCreatorModalOpen] = useState(false);

  const creators = MOCK_PROFILES.filter((p) => p.categories && p.categories.length > 0);

  const handleSubscribe = (creator: any) => {
    setSelectedCreator(creator);
    setCheckoutOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> EXCLUSIVE CREATOR SALONS
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Creator Pre-Registration Open</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            Intimo Creator Marketplace & Salons
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Subscribe to verified creators, unlock private photo journals, 4K video performances, and join ticketed live experiences.
          </p>
        </div>

        <Button
          variant="gold"
          onClick={() => setCreatorModalOpen(true)}
          className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0 text-black"
        >
          <Crown className="w-4 h-4 text-black" /> Become a Creator (Pre-Register)
        </Button>
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
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-card/90 text-velora-gold border border-velora-gold/40 font-mono">
                    ${creator.monthlySubscriptionPrice}/mo
                  </span>
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
                    <Users className="w-3.5 h-3.5" /> {creator.subscribersCount} Subscribers
                  </span>
                  <span>•</span>
                  <span>{creator.totalContentCount} Vault Items</span>
                </div>
              </div>
            </div>

            <div className="p-5 pt-0 flex items-center gap-3 border-t border-white/10 mt-2">
              <Link href={`/profile/${creator.id}`} className="w-1/2">
                <Button variant="glass" size="sm" className="w-full text-xs font-bold">
                  View Profile
                </Button>
              </Link>

              <Button
                variant="gold"
                size="sm"
                className="w-1/2 text-xs font-bold uppercase tracking-wider shadow-gold-glow"
                onClick={() => handleSubscribe(creator)}
              >
                Subscribe ${creator.monthlySubscriptionPrice}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Subscription Checkout Modal */}
      {selectedCreator && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productTitle={`Monthly Creator Channel Subscription to @${selectedCreator.displayName}`}
          creatorName={selectedCreator.displayName}
          grossAmount={selectedCreator.monthlySubscriptionPrice || 24.99}
          type="CREATOR_SUBSCRIPTION"
        />
      )}

      {/* Creator Pre-Registration Modal */}
      <CreatorPreRegistrationModal
        isOpen={creatorModalOpen}
        onClose={() => setCreatorModalOpen(false)}
      />
    </div>
  );
}
