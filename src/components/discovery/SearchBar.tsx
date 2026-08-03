"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, MapPin, User, X } from "lucide-react";
import { MOCK_PROFILES } from "@/lib/mockData";
import { Profile } from "@/types";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

interface SearchBarProps {
  onSearchQueryChange?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchQueryChange }) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const suggestions = query.trim()
    ? MOCK_PROFILES.filter(
        (p) =>
          p.displayName.toLowerCase().includes(query.toLowerCase()) ||
          p.city?.toLowerCase().includes(query.toLowerCase()) ||
          p.country?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    if (onSearchQueryChange) onSearchQueryChange(val);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    if (onSearchQueryChange) onSearchQueryChange("");
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-velora-gold absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder={t("common.search")}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-10 text-xs text-velora-textPrimary placeholder:text-velora-textMuted focus:outline-none focus:border-velora-gold/50 focus:bg-white/10 transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-full text-velora-textMuted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel-gold rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 border border-velora-gold/30 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-velora-textMuted border-b border-white/10 mb-1">
            Matching Members & Cities
          </div>
          {suggestions.map((profile) => (
            <Link
              key={profile.id}
              href={`/profile/${profile.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
            >
              <div className="w-8 h-8 rounded-full border border-velora-gold/50 overflow-hidden bg-velora-card shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-velora-textPrimary group-hover:text-velora-gold transition-colors">
                    {profile.displayName}, {profile.age}
                  </h4>
                  <span className="text-[10px] font-mono text-velora-gold">{profile.city}</span>
                </div>
                <p className="text-[10px] text-velora-textMuted truncate mt-0.5">{profile.headline}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
