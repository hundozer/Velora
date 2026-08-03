"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Filter,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Bookmark,
  Bell,
  Check,
  ShieldCheck,
  User,
  Users,
  Crown,
  Sparkles,
  Camera,
  Globe,
  ArrowUpDown,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export interface SavedSearchPreset {
  id: string;
  name: string;
  distanceKm: number;
  profileType: string;
  verifiedOnly: boolean;
  alertsEnabled: boolean;
}

interface FilterSidebarProps {
  matchingCount: number;
  onFilterChange?: (filters: any) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ matchingCount, onFilterChange }) => {
  const { t } = useTranslation();

  // Expanded Accordion States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    location: true,
    type: true,
    age: true,
    lookingFor: true,
    sorting: true,
  });

  // Filter States
  const [distanceKm, setDistanceKm] = useState<number>(50);
  const [profileType, setProfileType] = useState<string>("ALL");
  const [gender, setGender] = useState<string>("ALL");
  const [orientation, setOrientation] = useState<string>("ALL");
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(45);
  const [onlineStatus, setOnlineStatus] = useState<string>("ALL");
  const [selectedMedia, setSelectedMedia] = useState<string[]>(["PHOTO"]);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(["Casual Encounters"]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en"]);
  const [sortBy, setSortBy] = useState<string>("NEWEST");

  // Saved Searches Presets
  const [savedPresets, setSavedPresets] = useState<SavedSearchPreset[]>([
    {
      id: "preset-1",
      name: "Prague Verified Members",
      distanceKm: 25,
      profileType: "ALL",
      verifiedOnly: true,
      alertsEnabled: true,
    },
    {
      id: "preset-2",
      name: "Berlin Open Couples",
      distanceKm: 50,
      profileType: "COUPLE",
      verifiedOnly: true,
      alertsEnabled: false,
    },
  ]);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleReset = () => {
    setDistanceKm(50);
    setProfileType("ALL");
    setGender("ALL");
    setOrientation("ALL");
    setMinAge(18);
    setMaxAge(45);
    setOnlineStatus("ALL");
    setSelectedMedia(["PHOTO"]);
    setSelectedLookingFor([]);
    setSelectedInterests([]);
    setSelectedLanguages(["en"]);
    setSortBy("NEWEST");
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedSearchPreset = {
      id: "preset-" + Date.now(),
      name: newPresetName.trim(),
      distanceKm,
      profileType,
      verifiedOnly: true,
      alertsEnabled: true,
    };
    setSavedPresets([...savedPresets, newPreset]);
    setNewPresetName("");
    setIsSavingPreset(false);
  };

  const applyPreset = (preset: SavedSearchPreset) => {
    setDistanceKm(preset.distanceKm);
    setProfileType(preset.profileType);
  };

  return (
    <Card variant="goldBorder" className="p-5 space-y-6 text-left bg-gold-card sticky top-24 max-h-[85vh] overflow-y-auto">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-velora-gold" />
          <h3 className="text-base font-serif font-bold text-velora-textPrimary">
            {t("common.filter")}
          </h3>
        </div>

        <button
          onClick={handleReset}
          className="text-xs font-mono text-velora-textMuted hover:text-velora-gold flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Matching Profiles Indicator */}
      <div className="p-3 rounded-2xl bg-velora-gold/10 border border-velora-gold/30 text-center space-y-1">
        <span className="text-xs text-velora-gold font-bold uppercase tracking-wider block">
          Showing {matchingCount} Matching Profiles
        </span>
        <span className="text-[10px] text-velora-textMuted font-mono">Filters updated in real time</span>
      </div>

      {/* SAVED SEARCHES PRESETS */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-velora-gold flex items-center gap-1.5 font-mono">
            <Bookmark className="w-3.5 h-3.5 text-velora-gold" /> Saved Searches
          </span>
          <button
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            className="text-[11px] font-bold text-amber-300 hover:underline"
          >
            + Save Current
          </button>
        </div>

        {isSavingPreset && (
          <div className="flex gap-2 p-2 glass-panel rounded-2xl">
            <Input
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="e.g. Vienna Couples"
              className="text-xs py-1"
            />
            <Button variant="gold" size="sm" className="text-xs font-bold shrink-0 py-1" onClick={handleSavePreset}>
              Save
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          {savedPresets.map((preset) => (
            <div key={preset.id} className="flex items-center justify-between p-2 rounded-xl glass-panel text-xs">
              <button
                onClick={() => applyPreset(preset)}
                className="font-semibold text-velora-textPrimary hover:text-velora-gold text-left truncate flex-1"
              >
                {preset.name}
              </button>
              <button
                onClick={() =>
                  setSavedPresets(
                    savedPresets.map((p) => (p.id === preset.id ? { ...p, alertsEnabled: !p.alertsEnabled } : p))
                  )
                }
                className={`p-1 rounded-full ${preset.alertsEnabled ? "text-velora-gold" : "text-velora-textMuted"}`}
                title="Toggle Instant New Match Alert Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ACCORDION 1: LOCATION & DISTANCE SLIDER */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <button
          onClick={() => toggleSection("location")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-velora-textPrimary"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-velora-gold" /> Location & Radius
          </span>
          {openSections.location ? <ChevronUp className="w-4 h-4 text-velora-textMuted" /> : <ChevronDown className="w-4 h-4 text-velora-textMuted" />}
        </button>

        {openSections.location && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-velora-textSecondary">
              <span>Distance Radius</span>
              <span className="text-velora-gold font-bold">{distanceKm === 100 ? "Anywhere" : `Within ${distanceKm} km`}</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full accent-velora-gold bg-white/10 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* ACCORDION 2: PROFILE TYPE */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <button
          onClick={() => toggleSection("type")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-velora-textPrimary"
        >
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4 text-velora-gold" /> Profile Type
          </span>
          {openSections.type ? <ChevronUp className="w-4 h-4 text-velora-textMuted" /> : <ChevronDown className="w-4 h-4 text-velora-textMuted" />}
        </button>

        {openSections.type && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { id: "ALL", label: "All Members" },
              { id: "SINGLE", label: "Individual" },
              { id: "COUPLE", label: "Couple" },
              { id: "CREATOR", label: "Creator" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setProfileType(item.id)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all ${
                  profileType === item.id
                    ? "bg-gold-gradient text-velora-bg border-velora-gold shadow-gold-glow"
                    : "glass-panel text-velora-textMuted hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ACCORDION 3: AGE RANGE SLIDER */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <button
          onClick={() => toggleSection("age")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-velora-textPrimary"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-velora-gold" /> Age Range ({minAge} – {maxAge})
          </span>
          {openSections.age ? <ChevronUp className="w-4 h-4 text-velora-textMuted" /> : <ChevronDown className="w-4 h-4 text-velora-textMuted" />}
        </button>

        {openSections.age && (
          <div className="space-y-3 pt-1">
            <div className="flex gap-2">
              <Input
                type="number"
                min="18"
                max="99"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="text-xs py-1"
                placeholder="Min"
              />
              <Input
                type="number"
                min="18"
                max="99"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="text-xs py-1"
                placeholder="Max"
              />
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 4: SORTING OPTIONS */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <button
          onClick={() => toggleSection("sorting")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-velora-textPrimary"
        >
          <span className="flex items-center gap-1.5">
            <ArrowUpDown className="w-4 h-4 text-velora-gold" /> Sort Results By
          </span>
          {openSections.sorting ? <ChevronUp className="w-4 h-4 text-velora-textMuted" /> : <ChevronDown className="w-4 h-4 text-velora-textMuted" />}
        </button>

        {openSections.sorting && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
          >
            <option value="NEWEST">Newest Members</option>
            <option value="ACTIVE">Recently Active</option>
            <option value="NEAREST">Nearest Location</option>
            <option value="VERIFIED">Verified First</option>
            <option value="POPULAR">Most Favourited</option>
          </select>
        )}
      </div>
    </Card>
  );
};
