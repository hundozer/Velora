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

import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function DiscoveryMarketplacePage() {
  const { t } = useTranslation();
  const { user, profile: currentUserProfile } = useAuth();
  const [viewMode, setViewMode] = useState<"GRID" | "LIST" | "MAP">("GRID");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  if (!user) {
    return <BehindTheDoorLanding />;
  }

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
    pubicHairGrooming: "ALL",
    piercing: "ALL",
    tattoo: "ALL",
    erogenousZones: [],
    favouriteSexPlaces: [],
    favouriteSexPositions: [],
    sexHobbies: [],
    sortBy: "NEWEST",
  });

  const allProfiles = React.useMemo(() => {
    if (currentUserProfile) {
      const exists = MOCK_PROFILES.some((p) => p.id === currentUserProfile.id || p.displayName === currentUserProfile.displayName);
      return exists ? MOCK_PROFILES : [currentUserProfile, ...MOCK_PROFILES];
    }
    return MOCK_PROFILES;
  }, [currentUserProfile]);

  // Filter profiles based on all filter parameters
  const filteredProfiles = allProfiles.filter((p) => {
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
    if (sidebarFilters.country !== "ALL" && p.country !== sidebarFilters.country) return false;

    // City Filter
    if (sidebarFilters.city.trim() && !p.city?.toLowerCase().includes(sidebarFilters.city.toLowerCase())) return false;

    // Gender Filter
    if (sidebarFilters.gender !== "ALL" && p.gender !== sidebarFilters.gender) return false;

    // Sexual Orientation Filter
    if (sidebarFilters.sexualOrientation !== "ALL" && p.sexualOrientation !== sidebarFilters.sexualOrientation) return false;

    // Profile Type Filter
    if (sidebarFilters.profileType === "COUPLE" && !p.isCoupleProfile) return false;
    if (sidebarFilters.profileType === "CREATOR" && (!p.categories || p.categories.length === 0)) return false;
    if (sidebarFilters.profileType === "SINGLE" && (p.isCoupleProfile || (p.categories && p.categories.length > 0))) return false;

    // Age Filter
    if (p.age < sidebarFilters.minAge || p.age > sidebarFilters.maxAge) return false;

    // Pubic Hair Grooming Filter
    if (sidebarFilters.pubicHairGrooming !== "ALL" && p.pubicHairGrooming && p.pubicHairGrooming !== sidebarFilters.pubicHairGrooming) return false;

    // Piercing Filter
    if (sidebarFilters.piercing !== "ALL" && p.piercing && p.piercing !== sidebarFilters.piercing) return false;

    // Tattoo Filter
    if (sidebarFilters.tattoo !== "ALL" && p.tattoo && p.tattoo !== sidebarFilters.tattoo) return false;

    // Sex Hobbies Filter
    if (sidebarFilters.sexHobbies.length > 0) {
      if (!p.sexHobbies || !sidebarFilters.sexHobbies.some((hobby) => p.sexHobbies?.includes(hobby))) {
        return false;
      }
    }

    // Erogenous Zones Filter
    if (sidebarFilters.erogenousZones.length > 0) {
      if (!p.erogenousZones || !sidebarFilters.erogenousZones.some((zone) => p.erogenousZones?.includes(zone))) {
        return false;
      }
    }

    // Favourite Places Filter
    if (sidebarFilters.favouriteSexPlaces.length > 0) {
      if (!p.favouriteSexPlaces || !sidebarFilters.favouriteSexPlaces.some((place) => p.favouriteSexPlaces?.includes(place))) {
        return false;
      }
    }

    // Favourite Positions Filter
    if (sidebarFilters.favouriteSexPositions.length > 0) {
      if (!p.favouriteSexPositions || !sidebarFilters.favouriteSexPositions.some((pos) => p.favouriteSexPositions?.includes(pos))) {
        return false;
      }
    }

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
            <span className="text-xs text-velora-gold font-mono uppercase tracking-widest">• Intimate Preferences & Kinks Filter</span>
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

      {/* HORIZONTAL SEARCH & FILTER BAR DIRECTLY ABOVE PROFILES */}
      <div className="space-y-4">
        {/* Horizontal Keyword Search Bar */}
        <div className="w-full bg-velora-card p-4 rounded-3xl border border-velora-gold/30 shadow-gold-glow space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 font-mono">
              <Compass className="w-4 h-4 text-velora-gold" /> Search Profiles by Keyword / Name / Interests
            </label>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {filteredProfiles.length} {filteredProfiles.length === 1 ? "Matching Member" : "Matching Members"}
            </span>
          </div>
          <SearchBar onSearchQueryChange={setSearchQuery} />
        </div>

        {/* Horizontal Filter Bar */}
        <FilterSidebar
          matchingCount={filteredProfiles.length}
          onFilterChange={(newFilters) => setSidebarFilters(newFilters)}
        />
      </div>

      {/* FULL-WIDTH PROFILES GRID / LIST / MAP SECTION DIRECTLY BELOW SEARCH BAR */}
      <div>
        {filteredProfiles.length === 0 ? (
          <Card variant="glass" className="p-12 text-center space-y-4">
            <Sparkles className="w-12 h-12 text-velora-gold mx-auto" />
            <h3 className="text-lg font-serif font-bold text-velora-textPrimary">No Profiles Match Selection</h3>
            <p className="text-xs text-velora-textMuted">Try broadening your intimate preferences, grooming, or location filters.</p>
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
                    {p.sexHobbies && p.sexHobbies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.sexHobbies.slice(0, 4).map((h) => (
                          <span key={h} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
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
          /* GRID VIEW: 4 COLUMNS ACROSS FULL WIDTH */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* TRENDING SALONS & CREATORS FOOTER BAR */}
      <div className="pt-6 border-t border-white/10">
        <Card variant="goldBorder" className="p-6 space-y-4 text-left bg-gold-card">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-serif font-bold text-amber-300 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" /> Trending Salons & Verified Creators
            </h3>
            <Link href="/creators" className="text-xs text-amber-400 font-bold hover:underline">
              View All Creators →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {MOCK_PROFILES.filter((p) => p.categories && p.categories.length > 0).map((creator) => (
              <div key={creator.id} className="flex items-center justify-between p-3 rounded-2xl glass-panel">
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
