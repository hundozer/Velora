"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  onSearchQueryChange?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchQueryChange }) => {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearchQueryChange) onSearchQueryChange(val);
  };

  const handleClear = () => {
    setQuery("");
    if (onSearchQueryChange) onSearchQueryChange("");
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-velora-gold absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search profiles by name, city, country, or keyword..."
          className="w-full bg-black/50 border border-amber-400/30 rounded-2xl py-3.5 pl-11 pr-10 text-xs text-velora-textPrimary placeholder:text-velora-textMuted focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-inner"
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

    </div>
  );
};
