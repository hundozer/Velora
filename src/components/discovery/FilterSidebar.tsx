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
  Heart,
  Globe,
  ArrowUpDown,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export interface SavedSearchPreset {
  id: string;
  name: string;
  country: string;
  city: string;
  gender: string;
  sexualOrientation: string;
  distanceKm: number;
  profileType: string;
  verifiedOnly: boolean;
  alertsEnabled: boolean;
}

export interface FilterState {
  country: string;
  city: string;
  gender: string;
  sexualOrientation: string;
  distanceKm: number;
  profileType: string;
  minAge: number;
  maxAge: number;
  sortBy: string;
}

interface FilterSidebarProps {
  matchingCount: number;
  onFilterChange: (filters: FilterState) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ matchingCount, onFilterChange }) => {
  const { t } = useTranslation();

  // Expanded Accordion States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    location: true,
    demographics: true,
    type: true,
    age: true,
    sorting: true,
  });

  // Filter States
  const [country, setCountry] = useState<string>("ALL");
  const [city, setCity] = useState<string>("");
  const [gender, setGender] = useState<string>("ALL");
  const [sexualOrientation, setSexualOrientation] = useState<string>("ALL");
  const [distanceKm, setDistanceKm] = useState<number>(50);
  const [profileType, setProfileType] = useState<string>("ALL");
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(45);
  const [sortBy, setSortBy] = useState<string>("NEWEST");

  // Saved Searches Presets
  const [savedPresets, setSavedPresets] = useState<SavedSearchPreset[]>([
    {
      id: "preset-1",
      name: "Prague Straight & Bisexual Members",
      country: "Czech Republic",
      city: "Prague",
      gender: "ALL",
      sexualOrientation: "ALL",
      distanceKm: 25,
      profileType: "ALL",
      verifiedOnly: true,
      alertsEnabled: true,
    },
    {
      id: "preset-2",
      name: "Berlin Bisexual Couples",
      country: "Germany",
      city: "Berlin",
      gender: "COUPLE_MF",
      sexualOrientation: "BISEXUAL",
      distanceKm: 50,
      profileType: "COUPLE",
      verifiedOnly: true,
      alertsEnabled: false,
    },
  ]);
  const [newPresetName, setNewPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const notifyChange = (updated: Partial<FilterState>) => {
    const nextState: FilterState = {
      country: updated.country !== undefined ? updated.country : country,
      city: updated.city !== undefined ? updated.city : city,
      gender: updated.gender !== undefined ? updated.gender : gender,
      sexualOrientation: updated.sexualOrientation !== undefined ? updated.sexualOrientation : sexualOrientation,
      distanceKm: updated.distanceKm !== undefined ? updated.distanceKm : distanceKm,
      profileType: updated.profileType !== undefined ? updated.profileType : profileType,
      minAge: updated.minAge !== undefined ? updated.minAge : minAge,
      maxAge: updated.maxAge !== undefined ? updated.maxAge : maxAge,
      sortBy: updated.sortBy !== undefined ? updated.sortBy : sortBy,
    };
    onFilterChange(nextState);
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleReset = () => {
    setCountry("ALL");
    setCity("");
    setGender("ALL");
    setSexualOrientation("ALL");
    setDistanceKm(50);
    setProfileType("ALL");
    setMinAge(18);
    setMaxAge(45);
    setSortBy("NEWEST");
    onFilterChange({
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
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: SavedSearchPreset = {
      id: "preset-" + Date.now(),
      name: newPresetName.trim(),
      country,
      city,
      gender,
      sexualOrientation,
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
    setCountry(preset.country);
    setCity(preset.city);
    setGender(preset.gender);
    setSexualOrientation(preset.sexualOrientation);
    setDistanceKm(preset.distanceKm);
    setProfileType(preset.profileType);
    notifyChange({
      country: preset.country,
      city: preset.city,
      gender: preset.gender,
      sexualOrientation: preset.sexualOrientation,
      distanceKm: preset.distanceKm,
      profileType: preset.profileType,
    });
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

      {/* ACCORDION 1: LOCATION (COUNTRY & CITY) */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <button
          onClick={() => toggleSection("location")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-velora-textPrimary"
        >
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-velora-gold" /> Location (Country & City)
          </span>
          {openSections.location ? <ChevronUp className="w-4 h-4 text-velora-textMuted" /> : <ChevronDown className="w-4 h-4 text-velora-textMuted" />}
        </button>

        {openSections.location && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  notifyChange({ country: e.target.value });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
              >
                <option value="ALL">All Countries</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Germany">Germany</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Monaco">Monaco</option>
                <option value="Austria">Austria</option>
                <option value="France">France</option>
                <option value="Hungary">Hungary</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Romania">Romania</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">City Filter</label>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  notifyChange({ city: e.target.value });
                }}
                placeholder="e.g. Prague, Berlin, Munich..."
                className="text-xs py-2"
              />
            </div>

            <div className="space-y-1">
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
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDistanceKm(val);
                  notifyChange({ distanceKm: val });
                }}
                className="w-full accent-velora-gold bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 2: GENDER & SEXUAL ORIENTATION */}
      <div className="border-t border-white/10 pt-4 space-y-3">
        <button
          onClick={() => toggleSection("demographics")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-velora-textPrimary"
        >
          <span className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-velora-gold" /> Gender & Sexuality
          </span>
          {openSections.demographics ? <ChevronUp className="w-4 h-4 text-velora-textMuted" /> : <ChevronDown className="w-4 h-4 text-velora-textMuted" />}
        </button>

        {openSections.demographics && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  notifyChange({ gender: e.target.value });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
              >
                <option value="ALL">All Genders</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="COUPLE_MF">Couple (M & F)</option>
                <option value="NON_BINARY">Non-Binary</option>
                <option value="TRANSGENDER">Transgender</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">Sexual Orientation</label>
              <select
                value={sexualOrientation}
                onChange={(e) => {
                  setSexualOrientation(e.target.value);
                  notifyChange({ sexualOrientation: e.target.value });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
              >
                <option value="ALL">All Sexualities</option>
                <option value="BISEXUAL">Bisexual</option>
                <option value="HETEROSEXUAL">Heterosexual (Straight)</option>
                <option value="HOMOSEXUAL">Homosexual (Gay/Lesbian)</option>
                <option value="PANSEXUAL">Pansexual</option>
                <option value="FLUID">Fluid / Open</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 3: PROFILE TYPE */}
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
                onClick={() => {
                  setProfileType(item.id);
                  notifyChange({ profileType: item.id });
                }}
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

      {/* ACCORDION 4: AGE RANGE */}
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
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMinAge(val);
                  notifyChange({ minAge: val });
                }}
                className="text-xs py-1"
                placeholder="Min"
              />
              <Input
                type="number"
                min="18"
                max="99"
                value={maxAge}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxAge(val);
                  notifyChange({ maxAge: val });
                }}
                className="text-xs py-1"
                placeholder="Max"
              />
            </div>
          </div>
        )}
      </div>

      {/* ACCORDION 5: SORTING OPTIONS */}
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
            onChange={(e) => {
              setSortBy(e.target.value);
              notifyChange({ sortBy: e.target.value });
            }}
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
