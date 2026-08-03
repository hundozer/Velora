"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { ProfileCard } from "@/components/discovery/ProfileCard";
import { MOCK_PROFILES } from "@/lib/mockData";
import { Profile, Gender } from "@/types";
import {
  Compass,
  SlidersHorizontal,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Users,
  Sparkles,
  UserCheck,
  MessageSquare,
  Heart,
  X,
  ArrowUpDown,
  Flame,
} from "lucide-react";
import { TransparentRankingEngine } from "@/lib/ranking/TransparentRankingEngine";

export default function DiscoveryMarketplacePage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [sortBy, setSortBy] = useState<"ACTIVE" | "COMPATIBILITY" | "DISTANCE" | "TRANSPARENT_RANK">("TRANSPARENT_RANK");

  // Advanced Phase 2 Filter Engine State
  const [filters, setFilters] = useState({
    country: "ALL",
    city: "",
    distanceKm: 200,
    minAge: 18,
    maxAge: 55,
    gender: "ALL",
    orientation: "ALL",
    lookingFor: "ALL",
    verifiedOnly: false,
    photosOnly: true,
    onlineOnly: false,
    couplesOnly: false,
    creatorsOnly: false,
  });

  const filteredProfiles = MOCK_PROFILES.filter((p) => {
    // Tab Filter
    if (activeTab === "MEMBERS" && (p.isCoupleProfile || p.userId === "user-3")) return false;
    if (activeTab === "COUPLES" && !p.isCoupleProfile) return false;
    if (activeTab === "CREATORS" && p.userId !== "user-3") return false;

    // Search Bar Text Match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.displayName.toLowerCase().includes(q);
      const matchLocation = p.location.toLowerCase().includes(q);
      const matchCountry = p.country.toLowerCase().includes(q);
      const matchCity = p.city.toLowerCase().includes(q);
      const matchHeadline = (p.headline || "").toLowerCase().includes(q);
      const matchBio = p.bio.toLowerCase().includes(q);
      const matchInterest = p.interests.some((i) => i.toLowerCase().includes(q));
      if (!matchName && !matchLocation && !matchCountry && !matchCity && !matchHeadline && !matchBio && !matchInterest)
        return false;
    }

    // Country Filter
    if (filters.country !== "ALL" && p.country.toLowerCase() !== filters.country.toLowerCase()) return false;

    // Age Filter
    if (p.age < filters.minAge || p.age > filters.maxAge) return false;

    // Gender Filter
    if (filters.gender !== "ALL" && p.gender !== filters.gender) return false;

    // Orientation Filter
    if (filters.orientation !== "ALL" && p.sexualOrientation !== filters.orientation) return false;

    // Trust & Activity Filters
    if (filters.verifiedOnly && !p.verified) return false;
    if (filters.onlineOnly && !p.isOnline) return false;
    if (filters.couplesOnly && !p.isCoupleProfile) return false;

    return true;
  }).sort((a, b) => {
    if (sortBy === "COMPATIBILITY") {
      return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
    }
    if (sortBy === "DISTANCE") {
      return (a.distanceKm || 999) - (b.distanceKm || 999);
    }
    return a.isOnline ? -1 : 1;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge type="verified" label="Discovery Marketplace" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
              <Compass className="w-8 h-8 text-velora-gold" />
              Private Discovery Marketplace
            </h1>
            <p className="text-xs text-velora-textSecondary mt-1">
              Search verified adults, couples, and creators using structured lifestyle filters.
            </p>
          </div>

          <Tabs
            tabs={[
              { id: "ALL", label: "All Members", count: MOCK_PROFILES.length },
              { id: "MEMBERS", label: "Individuals", count: 2 },
              { id: "COUPLES", label: "Couples", count: 1 },
              { id: "CREATORS", label: "Creators", count: 1 },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Recommendations Placeholder Banner */}
        <div className="glass-panel-gold rounded-3xl p-6 shadow-gold-glow flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-gradient p-[1px] shadow-gold-glow shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-velora-bg rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-velora-gold" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-serif font-bold text-velora-textPrimary">
                Curated Recommendations Engine Active
              </h3>
              <p className="text-xs text-velora-textMuted mt-0.5">
                Profiles below are ranked by your lifestyle compatibility score weights and location proximity.
              </p>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-velora-gold" />
            <span className="text-xs text-velora-textMuted uppercase tracking-wider font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              <option value="COMPATIBILITY">Highest Compatibility %</option>
              <option value="ACTIVE">Recently Active Online</option>
              <option value="DISTANCE">Closest Proximity Radius</option>
            </select>
          </div>
        </div>

        {/* Search Bar & Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1">
            <Input
              icon={<Search className="w-4 h-4 text-velora-gold" />}
              placeholder="Search by name, city (Monte Carlo, London, Zurich), passions, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            variant={showFiltersDrawer ? "gold" : "glass"}
            className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider"
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Advanced Filter System
            {(filters.verifiedOnly || filters.onlineOnly || filters.couplesOnly) && (
              <span className="w-2.5 h-2.5 rounded-full bg-velora-gold shadow-gold-glow" />
            )}
          </Button>
        </div>

        {/* Advanced Filter Drawer */}
        {showFiltersDrawer && (
          <Card variant="goldBorder" className="p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-velora-gold" />
                <h3 className="text-base font-serif font-bold text-velora-textPrimary">
                  Multi-Faceted Search Filters
                </h3>
              </div>
              <button
                onClick={() => setShowFiltersDrawer(false)}
                className="text-xs text-velora-textMuted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              {/* Location & Radius */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  className="w-full bg-velora-card border border-white/10 rounded-xl p-2.5 text-xs text-velora-textPrimary"
                >
                  <option value="ALL">All Countries</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="France">France</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Max Radius ({filters.distanceKm} km)
                </label>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={25}
                  value={filters.distanceKm}
                  onChange={(e) => setFilters({ ...filters, distanceKm: parseInt(e.target.value) })}
                  className="w-full accent-velora-gold"
                />
              </div>

              {/* Personal Attributes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Age Range ({filters.minAge} - {filters.maxAge} yrs)
                </label>
                <input
                  type="range"
                  min={18}
                  max={80}
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                  className="w-full accent-velora-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Gender Presentation
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full bg-velora-card border border-white/10 rounded-xl p-2.5 text-xs text-velora-textPrimary"
                >
                  <option value="ALL">All Genders</option>
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="COUPLE_MF">Couple Profiles</option>
                </select>
              </div>
            </div>

            {/* Trust & Activity Toggles */}
            <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 glass-panel rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  className="accent-velora-gold w-4 h-4 rounded"
                />
                <span className="text-xs text-velora-textPrimary font-semibold">100% ID Verified Only</span>
              </label>

              <label className="flex items-center gap-3 p-3 glass-panel rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlineOnly}
                  onChange={(e) => setFilters({ ...filters, onlineOnly: e.target.checked })}
                  className="accent-velora-gold w-4 h-4 rounded"
                />
                <span className="text-xs text-velora-textPrimary font-semibold">Online Active Now Only</span>
              </label>

              <label className="flex items-center gap-3 p-3 glass-panel rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.couplesOnly}
                  onChange={(e) => setFilters({ ...filters, couplesOnly: e.target.checked })}
                  className="accent-velora-gold w-4 h-4 rounded"
                />
                <span className="text-xs text-velora-textPrimary font-semibold">Couple Profiles Only</span>
              </label>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-4 gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() =>
                  setFilters({
                    country: "ALL",
                    city: "",
                    distanceKm: 200,
                    minAge: 18,
                    maxAge: 55,
                    gender: "ALL",
                    orientation: "ALL",
                    lookingFor: "ALL",
                    verifiedOnly: false,
                    photosOnly: true,
                    onlineOnly: false,
                    couplesOnly: false,
                    creatorsOnly: false,
                  })
                }
              >
                Reset All
              </Button>
              <Button variant="gold" size="sm" className="text-xs font-bold" onClick={() => setShowFiltersDrawer(false)}>
                Apply Search Parameters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Profile Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((p) => (
            <ProfileCard key={p.id} profile={p} />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 glass-panel rounded-3xl">
            <Search className="w-12 h-12 text-velora-textMuted mx-auto" />
            <h3 className="text-xl font-serif font-bold text-velora-textPrimary">No Profiles Matching Filter Criteria</h3>
            <p className="text-xs text-velora-textMuted max-w-sm mx-auto">
              Try adjusting your age, distance radius, or location filter settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
