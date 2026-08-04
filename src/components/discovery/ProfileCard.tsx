"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Profile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MapPin, Heart, MessageSquare, Sparkles, ShieldCheck, Flame } from "lucide-react";

interface ProfileCardProps {
  profile: Profile;
  onQuickMessage?: (profile: Profile) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onQuickMessage }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <Card variant="goldBorder" className="group overflow-hidden flex flex-col justify-between text-left transition-all duration-500 bg-gold-card">
      {/* Cover / Avatar Container */}
      <div className="relative h-80 w-full bg-velora-card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter saturate-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/30 to-transparent" />

        {/* Badges Stack Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/80 text-velora-gold border border-velora-gold/40 backdrop-blur-md flex items-center gap-1 font-mono uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Adult
          </span>
          {profile.isCoupleProfile && (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Couple Profile
            </span>
          )}
        </div>

        {/* Online Status Top Right */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
          {profile.isOnline && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>
          )}
        </div>

        {/* Name, Age, Location Bottom Overlay */}
        <div className="absolute bottom-3 left-4 right-4 text-left">
          <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            {profile.displayName}, {profile.age}
          </h3>
          {(profile.location || profile.city || profile.country) && (
            <p className="text-xs text-velora-gold flex items-center gap-1 mt-0.5 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location || [profile.city, profile.country].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Card Body Details */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div>
          {profile.headline && (
            <p className="text-xs font-serif font-bold text-velora-textPrimary mb-1 line-clamp-1 italic">
              "{profile.headline}"
            </p>
          )}
          <p className="text-xs text-velora-textSecondary line-clamp-2 leading-relaxed">
            {profile.bio}
          </p>
        </div>

        {/* Looking For Tags */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">
            Open To Connections
          </span>
          <div className="flex flex-wrap gap-1">
            {profile.lookingFor.slice(0, 3).map((item) => (
              <span
                key={item}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-velora-textPrimary border border-white/10"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2">
          <Link href={`/profile/${profile.id}`} className="flex-1">
            <Button variant="gold" size="sm" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow">
              Enter World
            </Button>
          </Link>

          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-2.5 rounded-full glass-panel transition-colors ${
              isFavorited ? "text-rose-400 border-rose-500/40 bg-rose-500/10" : "text-velora-textSecondary hover:text-velora-gold"
            }`}
            title="Save to Favorites"
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-rose-400" : ""}`} />
          </button>

          <Link href="/messages">
            <button
              onClick={() => onQuickMessage && onQuickMessage(profile)}
              className="p-2.5 rounded-full glass-panel text-velora-textSecondary hover:text-velora-gold hover:border-velora-gold/40 transition-colors"
              title="Send Private Message"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
