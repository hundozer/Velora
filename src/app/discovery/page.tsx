"use client";

import React, { useState } from "react";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { MOCK_PROFILES } from "@/lib/mockData";
import { Profile } from "@/types";
import { TransparentRankingEngine } from "@/lib/ranking/TransparentRankingEngine";
import {
  Compass,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ShieldCheck,
  Flame,
  Users,
  User,
  Crown,
} from "lucide-react";

import { useTranslation } from "@/context/LanguageContext";

export default function DiscoveryMarketplacePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("DISCOVER");
  const [selectedType, setSelectedType] = useState<"ALL" | "SINGLE" | "COUPLE" | "CREATOR" | "LIFESTYLE">("ALL");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Filter & Rank Profiles
  const filteredProfiles = MOCK_PROFILES.filter((profile) => {
    if (selectedType === "COUPLE" && !profile.isCoupleProfile) return false;
    if (selectedType === "CREATOR" && (!profile.categories || profile.categories.length === 0)) return false;
    if (selectedType === "SINGLE" && (profile.isCoupleProfile || (profile.categories && profile.categories.length > 0))) return false;

    if (activeTab === "ONLINE" && !profile.isOnline) return false;
    if (activeTab === "VERIFIED" && !profile.verified) return false;
    if (activeTab === "CREATORS" && (!profile.categories || profile.categories.length === 0)) return false;

    if (verifiedOnly && !profile.verified) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 font-mono uppercase tracking-widest">
              Fictional Demo Profiles
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Rule-Based Transparency</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Compass className="w-8 h-8 text-velora-gold" />
            {t("discovery.title")}
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            {t("discovery.subtitle")}
          </p>
        </div>

        {/* Category Tabs */}
        <Tabs
          tabs={[
            { id: "DISCOVER", label: t("nav.discover"), count: MOCK_PROFILES.length },
            { id: "NEARBY", label: "Nearby", count: MOCK_PROFILES.length },
            { id: "ONLINE", label: t("common.online_now"), count: MOCK_PROFILES.filter((p) => p.isOnline).length },
            { id: "VERIFIED", label: t("common.verified"), count: MOCK_PROFILES.filter((p) => p.verified).length },
            { id: "CREATORS", label: t("nav.creators"), count: MOCK_PROFILES.filter((p) => p.categories && p.categories.length > 0).length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Profile Type Selector Pills & Filter Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: "ALL", label: t("discovery.all"), icon: Users },
            { id: "SINGLE", label: t("discovery.singles"), icon: User },
            { id: "COUPLE", label: t("discovery.couples"), icon: Users },
            { id: "CREATOR", label: t("discovery.creators"), icon: Crown },
            { id: "LIFESTYLE", label: t("discovery.lifestyle"), icon: Sparkles },
          ].map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? "bg-gold-gradient text-velora-bg shadow-gold-glow"
                    : "glass-panel text-velora-textMuted hover:text-white"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        <Button
          variant={verifiedOnly ? "gold" : "glass"}
          size="sm"
          className="text-xs font-bold gap-2 shrink-0 border-white/20"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{verifiedOnly ? "Showing Verified Only" : "Filter Verified Only"}</span>
        </Button>
      </div>

      {/* Profile Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProfiles.map((profile) => (
            <ProfileCard key={profile.id} profile={profile} />
          ))}
        </div>
      ) : (
        <Card variant="glass" className="p-12 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-velora-gold mx-auto" />
          <h3 className="text-lg font-serif font-bold text-velora-textPrimary">No Profiles Match Selection</h3>
          <p className="text-xs text-velora-textMuted">Try switching profile types or clearing filter criteria.</p>
        </Card>
      )}
    </div>
  );
}
