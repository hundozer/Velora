"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_COUNTRIES } from "@/lib/data/locations";
import {
  Filter,
  RotateCcw,
  Sparkles,
  Bookmark,
  ChevronDown,
  ChevronUp,
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
  pubicHairGrooming: string;
  piercing: string;
  tattoo: string;
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
  pubicHairGrooming: string;
  piercing: string;
  tattoo: string;
  erogenousZones: string[];
  favouriteSexPlaces: string[];
  favouriteSexPositions: string[];
  sexHobbies: string[];
  sortBy: string;
}

interface FilterSidebarProps {
  matchingCount: number;
  onFilterChange: (filters: FilterState) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ matchingCount, onFilterChange }) => {
  const { t } = useTranslation();

  const [expanded, setExpanded] = useState(false);

  // Filter States
  const [country, setCountry] = useState<string>("ALL");
  const [city, setCity] = useState<string>("");
  const [gender, setGender] = useState<string>("ALL");
  const [sexualOrientation, setSexualOrientation] = useState<string>("ALL");
  const [distanceKm, setDistanceKm] = useState<number>(50);
  const [profileType, setProfileType] = useState<string>("ALL");
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(60);

  // Intimate Preferences & Sex Hobbies Filter States
  const [pubicHairGrooming, setPubicHairGrooming] = useState<string>("ALL");
  const [piercing, setPiercing] = useState<string>("ALL");
  const [tattoo, setTattoo] = useState<string>("ALL");
  const [selectedSexHobbies, setSelectedSexHobbies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("NEWEST");

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
      pubicHairGrooming: updated.pubicHairGrooming !== undefined ? updated.pubicHairGrooming : pubicHairGrooming,
      piercing: updated.piercing !== undefined ? updated.piercing : piercing,
      tattoo: updated.tattoo !== undefined ? updated.tattoo : tattoo,
      erogenousZones: [],
      favouriteSexPlaces: [],
      favouriteSexPositions: [],
      sexHobbies: updated.sexHobbies !== undefined ? updated.sexHobbies : selectedSexHobbies,
      sortBy: updated.sortBy !== undefined ? updated.sortBy : sortBy,
    };
    onFilterChange(nextState);
  };

  const toggleMultiSelect = (item: string, current: string[], setter: (val: string[]) => void, key: keyof FilterState) => {
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    setter(next);
    notifyChange({ [key]: next });
  };

  const handleReset = () => {
    setCountry("ALL");
    setCity("");
    setGender("ALL");
    setSexualOrientation("ALL");
    setDistanceKm(50);
    setProfileType("ALL");
    setMinAge(18);
    setMaxAge(60);
    setPubicHairGrooming("ALL");
    setPiercing("ALL");
    setTattoo("ALL");
    setSelectedSexHobbies([]);
    setSortBy("NEWEST");

    onFilterChange({
      country: "ALL",
      city: "",
      gender: "ALL",
      sexualOrientation: "ALL",
      distanceKm: 50,
      profileType: "ALL",
      minAge: 18,
      maxAge: 60,
      pubicHairGrooming: "ALL",
      piercing: "ALL",
      tattoo: "ALL",
      erogenousZones: [],
      favouriteSexPlaces: [],
      favouriteSexPositions: [],
      sexHobbies: [],
      sortBy: "NEWEST",
    });
  };

  return (
    <Card variant="goldBorder" className="w-full p-5 space-y-4 bg-gold-card text-left shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Filter className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              Filters & Preferences
            </h2>
            <p className="text-xs text-velora-textMuted font-mono">
              Refine profiles horizontally by location, gender, orientation, & intimate kinks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">

          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-amber-300 bg-white/5 border border-amber-400/30 hover:bg-amber-400/10 flex items-center gap-1.5 transition-all"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{expanded ? "Less Filters" : "More Filters"}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-full text-xs font-bold text-velora-textMuted hover:text-white bg-white/5 border border-white/10 flex items-center gap-1.5 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Horizontal Primary Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* 1. Country */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-velora-textMuted mb-1">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("");
              notifyChange({ country: e.target.value, city: "" });
            }}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">🌐 All Countries</option>
            {Object.keys(SUPPORTED_COUNTRIES).map((cKey) => (
              <option key={cKey} value={cKey}>
                {SUPPORTED_COUNTRIES[cKey].flag} {SUPPORTED_COUNTRIES[cKey].name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Cascading City */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-velora-textMuted mb-1">
            City Filter
          </label>
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              notifyChange({ city: e.target.value });
            }}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="">All Cities</option>
            {country !== "ALL" &&
              SUPPORTED_COUNTRIES[country]?.cities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
          </select>
        </div>

        {/* 3. Gender */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-velora-textMuted mb-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              notifyChange({ gender: e.target.value });
            }}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Genders</option>
            <option value="FEMALE">Female (♀)</option>
            <option value="MALE">Male (♂)</option>
            <option value="COUPLE">Couples (👫)</option>
            <option value="TRANSGENDER">Transgender (⚧)</option>
          </select>
        </div>

        {/* 4. Sexual Orientation */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-velora-textMuted mb-1">
            Sexual Orientation
          </label>
          <select
            value={sexualOrientation}
            onChange={(e) => {
              setSexualOrientation(e.target.value);
              notifyChange({ sexualOrientation: e.target.value });
            }}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">All Sexualities</option>
            <option value="HETEROSEXUAL">Heterosexual</option>
            <option value="BISEXUAL">Bisexual</option>
            <option value="HOMOSEXUAL">Homosexual</option>
            <option value="PANSEXUAL">Pansexual</option>
            <option value="FLUID">Fluid</option>
          </select>
        </div>

        {/* 5. Pubic Grooming */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-velora-textMuted mb-1">
            Pubic Grooming
          </label>
          <select
            value={pubicHairGrooming}
            onChange={(e) => {
              setPubicHairGrooming(e.target.value);
              notifyChange({ pubicHairGrooming: e.target.value });
            }}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">Any Grooming</option>
            <option value="Natural">Natural</option>
            <option value="Trimmed">Trimmed</option>
            <option value="Shaved">Shaved</option>
          </select>
        </div>

        {/* 6. Piercings & Body Art */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-velora-textMuted mb-1">
            Piercings & Tattoos
          </label>
          <select
            value={piercing}
            onChange={(e) => {
              setPiercing(e.target.value);
              notifyChange({ piercing: e.target.value });
            }}
            className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          >
            <option value="ALL">Any Body Art</option>
            <option value="Yes">With Piercings</option>
            <option value="Multiple">Multiple Tattoos/Piercings</option>
            <option value="No">No Body Art</option>
          </select>
        </div>
      </div>

      {/* Expanded Controls: Age Slider & Intimate Hobbies */}
      {expanded && (
        <div className="space-y-4 pt-3 border-t border-white/10 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Age Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-velora-textMuted uppercase tracking-wider">Age Range</span>
                <span className="font-mono text-amber-300 font-bold">{minAge} — {maxAge} years</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="18"
                  max="70"
                  value={minAge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMinAge(val);
                    notifyChange({ minAge: val });
                  }}
                  className="w-full accent-amber-400"
                />
                <input
                  type="range"
                  min="18"
                  max="70"
                  value={maxAge}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxAge(val);
                    notifyChange({ maxAge: val });
                  }}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>

            {/* Profile Type */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-velora-textMuted uppercase tracking-wider">Profile Category</span>
              <div className="flex items-center gap-2">
                {[
                  { id: "ALL", label: "All Profiles" },
                  { id: "SINGLE", label: "Singles" },
                  { id: "COUPLE", label: "Couples" },
                  { id: "CREATOR", label: "Creators" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setProfileType(item.id);
                      notifyChange({ profileType: item.id });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      profileType === item.id
                        ? "bg-amber-400 text-black border-amber-400 shadow-gold-glow"
                        : "bg-white/5 text-velora-textMuted border-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Intimate Tags */}
          <div className="space-y-2 pt-2">
            <span className="block text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              Intimate Hobbies & Desires Filter:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                "Sensual Massage",
                "Oral Pleasure",
                "BDSM & Kink",
                "Roleplay & Dressing",
                "Swinging & Parties",
                "Erotic Photography",
                "Casual Encounters",
                "Dominance / Submission",
              ].map((hobby) => {
                const isSelected = selectedSexHobbies.includes(hobby);
                return (
                  <button
                    key={hobby}
                    onClick={() => toggleMultiSelect(hobby, selectedSexHobbies, setSelectedSexHobbies, "sexHobbies")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-amber-400 text-black border-amber-400 shadow-gold-glow"
                        : "bg-white/5 text-velora-textMuted border-white/10 hover:text-white"
                    }`}
                  >
                    {hobby}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
