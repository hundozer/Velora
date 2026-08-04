"use client";

import React, { useState } from "react";
import { Profile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, ShieldCheck, Flame, ArrowRight, User } from "lucide-react";
import Link from "next/link";

interface MapViewProps {
  profiles: Profile[];
}

export const MapView: React.FC<MapViewProps> = ({ profiles }) => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(profiles[0] || null);

  return (
    <Card variant="goldBorder" className="p-0 overflow-hidden relative min-h-[550px] bg-velora-bg flex flex-col justify-between">
      {/* Mock Map Canvas Graphic */}
      <div className="absolute inset-0 z-0 bg-[#0B0D13] overflow-hidden">
        {/* Decorative Grid SVG */}
        <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Pulsing Location Radar Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-velora-gold/20 animate-ping opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-velora-gold/10 pointer-events-none" />

        {/* Map Pins */}
        {profiles.map((p, idx) => {
          // Calculate mock pin positions
          const positions = [
            { top: "35%", left: "45%" },
            { top: "55%", left: "65%" },
            { top: "40%", left: "25%" },
            { top: "68%", left: "38%" },
          ];
          const pos = positions[idx % positions.length];
          const isSelected = selectedProfile?.id === p.id;

          return (
            <div
              key={p.id}
              style={{ top: pos.top, left: pos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer group"
              onClick={() => setSelectedProfile(p)}
            >
              {/* Privacy Fuzzing Circle */}
              <div className="w-16 h-16 rounded-full bg-velora-gold/15 border border-velora-gold/30 flex items-center justify-center animate-pulse group-hover:scale-125 transition-transform">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-gold-glow transition-all ${
                    isSelected
                      ? "border-velora-gold bg-gold-gradient text-velora-bg scale-110"
                      : "border-white/20 bg-velora-bg text-velora-gold group-hover:border-velora-gold"
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              {/* Pin Label */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-white whitespace-nowrap border border-white/10 shadow-md">
                {p.displayName} ({p.city})
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Header Overlay */}
      <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-velora-bg via-velora-bg/80 to-transparent">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono uppercase">
            Approximate Privacy Fuzzed Locations
          </span>
        </div>
        <span className="text-xs text-velora-textMuted font-mono">{profiles.length} Active Pins</span>
      </div>

      {/* Map Floating Selected Card Footer */}
      {selectedProfile && (
        <div className="relative z-10 p-4 max-w-md mx-auto w-full mb-4 px-4">
          <Card variant="goldBorder" className="p-4 bg-gold-card backdrop-blur-xl space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl border-2 border-velora-gold overflow-hidden bg-velora-card shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedProfile.avatarUrl} alt={selectedProfile.displayName} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-serif font-bold text-white truncate">
                    {selectedProfile.displayName}, {selectedProfile.age}
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> {selectedProfile.distanceKm} km away
                  </span>
                </div>
                <p className="text-xs text-velora-gold flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3" /> {selectedProfile.city}, {selectedProfile.country}
                </p>
                <p className="text-[11px] text-velora-textMuted line-clamp-1 italic">"{selectedProfile.headline}"</p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <Link href={`/profile/${selectedProfile.id}`}>
                <Button variant="gold" size="sm" className="text-[10px] font-bold uppercase tracking-wider shadow-gold-glow py-1 px-3">
                  Enter Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};
