"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Profile } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Crown,
  Users,
  Heart,
  Sparkles,
  MapPin,
  MessageSquare,
  Lock,
  CheckCircle2,
} from "lucide-react";

interface CreatorCardProps {
  creator: Profile;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(creator.followersCount || 1200);

  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(followersCount - 1);
    } else {
      setIsFollowing(true);
      setFollowersCount(followersCount + 1);
    }
  };

  return (
    <Card variant="glass" hoverEffect className="p-0 overflow-hidden flex flex-col h-full text-left group">
      {/* Cover Image Header */}
      <div className="h-44 w-full bg-velora-card relative overflow-hidden">
        {creator.coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.coverPhotoUrl}
            alt={creator.displayName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-velora-card to-velora-slate" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-transparent to-transparent opacity-80" />

        {/* Creator badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <Badge type="custom" label="Level 4 Creator" className="bg-amber-500/20 text-amber-300 border-amber-500/40" />
          <span className="px-3 py-1 rounded-full text-xs font-bold font-serif bg-velora-card/90 text-emerald-300 border border-emerald-500/40">Free</span>
        </div>
      </div>

      {/* Avatar & Info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 -mt-10 relative z-10">
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="w-16 h-16 rounded-full border-2 border-velora-gold overflow-hidden bg-velora-card shadow-gold-glow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creator.avatarUrl}
                alt={creator.displayName}
                className="w-full h-full object-cover"
              />
            </div>

            <Button
              variant={isFollowing ? "glass" : "gold"}
              size="sm"
              className="text-xs font-bold gap-1 rounded-full"
              onClick={toggleFollow}
            >
              <Heart className={`w-3.5 h-3.5 ${isFollowing ? "fill-velora-gold text-velora-gold" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>

          <div>
            <Link href={`/profile/${creator.id}`}>
              <h3 className="text-base font-serif font-bold text-velora-textPrimary group-hover:text-velora-gold transition-colors flex items-center gap-2">
                {creator.displayName}
                {creator.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </h3>
            </Link>
            {(creator.location || creator.city || creator.country) && (
              <p className="text-[11px] text-velora-textMuted flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-velora-gold" />
                {creator.location || [creator.city, creator.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {/* Categories */}
          {creator.categories && creator.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {creator.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-velora-textSecondary"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-velora-textMuted line-clamp-2 leading-relaxed">
            {creator.headline || creator.bio}
          </p>
        </div>

        {/* Stats Row */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-velora-textMuted font-mono">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-velora-gold" />
            <span>{followersCount} followers</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>{creator.totalContentCount || 12} items</span>
          </div>
        </div>

        {/* Free creator profile CTA */}
        <Link href={`/profile/${creator.id}`}>
          <Button variant="gold" size="sm" className="w-full text-xs font-bold uppercase tracking-wider gap-2">
            <Crown className="w-4 h-4" />
            View Creator Profile
          </Button>
        </Link>
      </div>
    </Card>
  );
};
