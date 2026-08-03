"use client";

import React, { useState } from "react";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { SearchBar } from "@/components/discovery/SearchBar";
import { FilterSidebar, FilterState } from "@/components/discovery/FilterSidebar";
import { MapView } from "@/components/discovery/MapView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_PROFILES, MOCK_LIVE_STREAMS } from "@/lib/mockData";
import { Profile } from "@/types";
import { useTranslation } from "@/context/LanguageContext";
import Link from "next/link";
import {
  Compass,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ShieldCheck,
  Flame,
  Users,
  LayoutGrid,
  List,
  Map as MapIcon,
  Crown,
  Radio,
  X,
  ArrowRight,
} from "lucide-react";

export default function DiscoveryMarketplacePage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"GRID" | "LIST" | "MAP">("GRID");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sidebar Filter State
  const [sidebarFilters, setSidebarFilters] = useState<FilterState>({
    country: "ALL",
    city: "",
    gender: "ALL",
    sexualOrientation: "ALL",
    distanceKm: 50,
    profileType: "ALL",
    minAge: 18,
    maxAge: 45,
    sortBy: "NEWEST",
  });

  // Filter profiles based on search query, gender, sexuality, country, city & sidebar criteria
  const filteredProfiles = MOCK_PROFILES.filter((p) => {
    // Search Query (Username, Display Name, City, Country, Headline)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.displayName.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.headline?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    // Country Filter
    if (sidebarFilters.country !== "ALL" && p.country !== sidebarFilters.country) {
      return false;
    }

    // City Filter
    if (sidebarFilters.city.trim() && !p.city?.toLowerCase().includes(sidebarFilters.city.toLowerCase())) {
      return false;
    }

    // Gender Filter
    if (sidebarFilters.gender !== "ALL" && p.gender !== sidebarFilters.gender) {
      return false;
    }

    // Sexual Orientation Filter
    if (sidebarFilters.sexualOrientation !== "ALL" && p.sexualOrientation !== sidebarFilters.sexualOrientation) {
      return false;
    }

    // Profile Type Filter
    if (sidebarFilters.profileType === "COUPLE" && !p.isCoupleProfile) return false;
    if (sidebarFilters.profileType === "CREATOR" && (!p.categories || p.categories.length === 0)) return false;
    if (sidebarFilters.profileType === "SINGLE" && (p.isCoupleProfile || (p.categories && p.categories.length > 0))) return false;

    // Age Filter
    if (p.age < sidebarFilters.minAge || p.age > sidebarFilters.maxAge) return false;

    return true;
  });

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Banner & View Switcher Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 font-mono uppercase tracking-widest">
              Adult Social Discovery Engine
            </span>
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Gender, Sexuality & Location Search</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Compass className="w-8 h-8 text-velora-gold" />
            {t("discovery.title")}
          </h1>
        </div>

        {/* View Mode Switcher (Grid, List, Map) & Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            className="md:hidden text-xs font-bold gap-2 border-velora-gold/40 text-velora-gold"
            onClick={() => setMobileFilterOpen(true)}
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>

          <div className="p-1 rounded-2xl glass-panel flex items-center gap-1 border border-white/10">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "GRID" ? "bg-gold-gradient text-velora-bg shadow-gold-glow" : "text-velora-textMuted hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={() => setViewMode("LIST")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "LIST" ? "bg-gold-gradient text-velora-bg shadow-gold-glow" : "text-velora-textMuted hover:text-white"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" /> <span className="hidden sm:inline">List</span>
            </button>

            <button
              onClick={() => setViewMode("MAP")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "MAP" ? "bg-gold-gradient text-velora-bg shadow-gold-glow" : "text-velora-textMuted hover:text-white"
              }`}
              title="Map View"
            >
              <MapIcon className="w-4 h-4" /> <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Search Bar with Autocomplete */}
      <div className="max-w-2xl">
        <SearchBar onSearchQueryChange={setSearchQuery} />
      </div>

      {/* 3-COLUMN DESKTOP LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Persistent Filter Sidebar (Desktop w-80 / 3 cols) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <FilterSidebar
            matchingCount={filteredProfiles.length}
            onFilterChange={(newFilters) => setSidebarFilters(newFilters)}
          />
        </div>

        {/* CENTER COLUMN: Profile Results (Grid / List / Map) (Desktop 6 cols / lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          {filteredProfiles.length === 0 ? (
            <Card variant="glass" className="p-12 text-center space-y-4">
              <Sparkles className="w-12 h-12 text-velora-gold mx-auto" />
              <h3 className="text-lg font-serif font-bold text-velora-textPrimary">No Profiles Match Selection</h3>
              <p className="text-xs text-velora-textMuted">Try broadening your gender, sexuality, or location filters.</p>
            </Card>
          ) : viewMode === "MAP" ? (
            <MapView profiles={filteredProfiles} />
          ) : viewMode === "LIST" ? (
            /* LIST VIEW */
            <div className="space-y-4">
              {filteredProfiles.map((p) => (
                <Card key={p.id} variant="goldBorder" hoverEffect className="p-4 bg-gold-card flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl border-2 border-velora-gold overflow-hidden bg-velora-card shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.avatarUrl} alt={p.displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-serif font-bold text-white">{p.displayName}, {p.age}</h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-xs text-velora-gold font-medium">
                        {p.gender} • {p.sexualOrientation} • {p.city}, {p.country}
                      </p>
                      <p className="text-xs text-velora-textMuted line-clamp-1 italic">"{p.headline}"</p>
                    </div>
                  </div>

                  <Link href={`/profile/${p.id}`} className="w-full sm:w-auto shrink-0">
                    <Button variant="gold" size="sm" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                      Enter Profile
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredProfiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Trending Creators & Suggested Profiles (Desktop 3 cols / lg:col-span-3) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          {/* Trending Creators Widget */}
          <Card variant="goldBorder" className="p-5 space-y-4 text-left bg-gold-card">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-mono">
                <Crown className="w-4 h-4 text-amber-400" /> Trending Salons & Creators
              </h3>
            </div>

            <div className="space-y-3">
              {MOCK_PROFILES.filter((p) => p.categories && p.categories.length > 0).map((creator) => (
                <div key={creator.id} className="flex items-center justify-between p-2 rounded-2xl glass-panel">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-amber-400 overflow-hidden bg-velora-card shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className="text-xs font-bold text-velora-textPrimary truncate">{creator.displayName}</h4>
                      <span className="text-[10px] text-amber-300 font-mono">${creator.monthlySubscriptionPrice}/mo</span>
                    </div>
                  </div>

                  <Link href={`/profile/${creator.id}`}>
                    <Button variant="ghost" size="sm" className="text-[10px] font-bold text-velora-gold px-2">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Live Broadcasts Widget */}
          <Card variant="glass" className="p-5 space-y-4 text-left border-red-500/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5 font-mono">
                <Radio className="w-4 h-4 text-red-400" /> Live Broadcasts Now
              </h3>
            </div>

            {MOCK_LIVE_STREAMS.map((stream) => (
              <div key={stream.id} className="space-y-2">
                <div className="h-28 rounded-2xl bg-velora-card relative overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white animate-pulse">
                    LIVE
                  </div>
                </div>
                <h4 className="text-xs font-bold text-velora-textPrimary line-clamp-1">{stream.title}</h4>
                <Link href={`/live/${stream.id}`} className="block">
                  <Button variant="gold" size="sm" className="w-full text-[10px] font-bold uppercase tracking-wider shadow-gold-glow py-1">
                    Watch Stream
                  </Button>
                </Link>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* MOBILE SLIDE-OVER FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-in fade-in">
          <div className="w-full max-w-xs h-full bg-velora-bg p-4 overflow-y-auto space-y-4 text-left border-l border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-serif font-bold text-velora-textPrimary">Filter Marketplace</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-full text-velora-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterSidebar
              matchingCount={filteredProfiles.length}
              onFilterChange={(newFilters) => setSidebarFilters(newFilters)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
