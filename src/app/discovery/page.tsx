"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { MOCK_PROFILES } from "@/lib/mockData";
import { Profile, Gender, UserRole } from "@/types";
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
} from "lucide-react";

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Discovery Filter Engine State
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 50,
    distanceKm: 100,
    gender: "ALL",
    verifiedOnly: false,
    onlineOnly: false,
    couplesOnly: false,
    creatorsOnly: false,
  });

  const filteredProfiles = MOCK_PROFILES.filter((p) => {
    // Tab Filter
    if (activeTab === "MEMBERS" && (p.isCoupleProfile || p.userId === "user-3")) return false;
    if (activeTab === "COUPLES" && !p.isCoupleProfile) return false;
    if (activeTab === "CREATORS" && p.userId !== "user-3") return false;

    // Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.displayName.toLowerCase().includes(q);
      const matchLocation = p.location.toLowerCase().includes(q);
      const matchBio = p.bio.toLowerCase().includes(q);
      const matchInterest = p.interests.some((i) => i.toLowerCase().includes(q));
      if (!matchName && !matchLocation && !matchBio && !matchInterest) return false;
    }

    // Age Filter
    if (p.age < filters.minAge || p.age > filters.maxAge) return false;

    // Verified Filter
    if (filters.verifiedOnly && !p.verified) return false;

    // Online Filter
    if (filters.onlineOnly && !p.isOnline) return false;

    // Couples Only Filter
    if (filters.couplesOnly && !p.isCoupleProfile) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Discovery Header & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
              <Compass className="w-8 h-8 text-velora-gold" />
              Discovery Marketplace
            </h1>
            <p className="text-xs text-velora-textSecondary mt-1">
              Search verified members, couples, and creators using advanced lifestyle filters.
            </p>
          </div>

          <Tabs
            tabs={[
              { id: "ALL", label: "All Profiles", count: MOCK_PROFILES.length },
              { id: "MEMBERS", label: "Members", count: 2 },
              { id: "COUPLES", label: "Couples", count: 1 },
              { id: "CREATORS", label: "Creators", count: 1 },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="flex-1">
            <Input
              icon={<Search className="w-4 h-4 text-velora-gold" />}
              placeholder="Search by name, city (Monaco, London, Paris), interests, or bio keywords..."
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
            Advanced Filters
            {(filters.verifiedOnly || filters.onlineOnly || filters.couplesOnly) && (
              <span className="w-2 h-2 rounded-full bg-velora-gold" />
            )}
          </Button>
        </div>

        {/* Expandable Advanced Filter Drawer */}
        {showFiltersDrawer && (
          <Card variant="goldBorder" className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-velora-gold" />
                <h3 className="text-sm font-serif font-bold text-velora-textPrimary">
                  Discovery Engine Parameters
                </h3>
              </div>
              <button
                onClick={() => setShowFiltersDrawer(false)}
                className="text-xs text-velora-textMuted hover:text-velora-textPrimary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              {/* Age Range */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Age Range: {filters.minAge} - {filters.maxAge}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={filters.maxAge}
                    onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                    className="w-full accent-velora-gold"
                  />
                </div>
              </div>

              {/* Distance Radius */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Max Radius: {filters.distanceKm} km
                </label>
                <input
                  type="range"
                  min={5}
                  max={500}
                  step={25}
                  value={filters.distanceKm}
                  onChange={(e) => setFilters({ ...filters, distanceKm: parseInt(e.target.value) })}
                  className="w-full accent-velora-gold"
                />
              </div>

              {/* Toggle Options */}
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-velora-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                    className="accent-velora-gold w-4 h-4 rounded"
                  />
                  <span>100% ID Verified Only</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-velora-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onlineOnly}
                    onChange={(e) => setFilters({ ...filters, onlineOnly: e.target.checked })}
                    className="accent-velora-gold w-4 h-4 rounded"
                  />
                  <span>Active Online Now Only</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-velora-textSecondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.couplesOnly}
                    onChange={(e) => setFilters({ ...filters, couplesOnly: e.target.checked })}
                    className="accent-velora-gold w-4 h-4 rounded"
                  />
                  <span>Couple Profiles Only</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 pt-4 gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() =>
                  setFilters({
                    minAge: 18,
                    maxAge: 50,
                    distanceKm: 100,
                    gender: "ALL",
                    verifiedOnly: false,
                    onlineOnly: false,
                    couplesOnly: false,
                    creatorsOnly: false,
                  })
                }
              >
                Reset Filters
              </Button>
              <Button variant="gold" size="sm" className="text-xs font-bold" onClick={() => setShowFiltersDrawer(false)}>
                Apply Search Parameters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Discovery Profile Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProfiles.length > 0 ? (
          filteredProfiles.map((p) => (
            <Card key={p.id} variant="glass" className="group overflow-hidden flex flex-col justify-between">
              {/* Profile Cover & Avatar */}
              <div className="relative h-72 w-full bg-velora-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.avatarUrl}
                  alt={p.displayName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-transparent to-transparent opacity-95" />

                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  {p.verified && <Badge type="verified" />}
                  {p.isCoupleProfile && <Badge type="couple" />}
                  {p.userId === "user-3" && <Badge type="creator" />}
                </div>

                <div className="absolute top-4 right-4">
                  {p.isOnline && <Badge type="online" />}
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                    {p.displayName}, {p.age}
                  </h3>
                  <p className="text-xs text-velora-gold flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.location} {p.distanceKm ? `(${p.distanceKm} km away)` : ""}
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-6 space-y-4 text-left flex-1 flex flex-col justify-between">
                <p className="text-xs text-velora-textSecondary line-clamp-3 leading-relaxed">
                  {p.bio}
                </p>

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted">Looking For</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.lookingFor.map((item) => (
                      <span key={item} className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 text-velora-gold border border-white/10 font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                  <Link href={`/profile/${p.id}`} className="flex-1">
                    <Button variant="gold" size="sm" className="w-full text-xs font-bold uppercase tracking-wider">
                      View Full Profile
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <button className="p-2.5 rounded-full glass-panel text-velora-textSecondary hover:text-velora-gold hover:border-velora-gold/40 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center space-y-4 glass-panel rounded-3xl">
            <Search className="w-12 h-12 text-velora-textMuted mx-auto" />
            <h3 className="text-lg font-serif font-bold text-velora-textPrimary">No Compatible Members Found</h3>
            <p className="text-xs text-velora-textMuted">Try expanding your age or distance radius search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
