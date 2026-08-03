"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_PROFILES } from "@/lib/mockData";
import {
  Compass,
  Sparkles,
  MapPin,
  Heart,
  MessageSquare,
  ShieldCheck,
  Crown,
  Users,
  Flame,
} from "lucide-react";

export default function DashboardPage() {
  const { profile, role } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Welcome Banner */}
      <div className="relative glass-panel-gold rounded-3xl p-8 sm:p-10 shadow-gold-glow overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-3">
            <Badge type={role === "CREATOR" ? "creator" : role === "COUPLE" ? "couple" : role === "ADMIN" ? "admin" : "verified"} />
            <span className="text-xs text-velora-textMuted uppercase tracking-widest font-mono">
              Role: {role}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-velora-textPrimary">
            Welcome back, <span className="gold-gradient-text">{profile?.displayName || "Elena"}</span>
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-xl">
            {role === "CREATOR"
              ? "Your Creator Studio is active. Check earnings, pending content unlocks, and subscriber updates below."
              : role === "ADMIN"
              ? "Admin oversight active. Review moderation queues and ID verification submissions."
              : "Discover curated verified members and active creators matching your lifestyle preferences."}
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link href="/discovery">
              <Button variant="gold" size="sm" className="font-bold uppercase tracking-wider gap-2">
                <Compass className="w-4 h-4" />
                Launch Discovery Search
              </Button>
            </Link>
            {role === "CREATOR" && (
              <Link href="/creator-studio">
                <Button variant="glass" size="sm" className="font-medium text-amber-300 border-amber-500/30 gap-2">
                  <Sparkles className="w-4 h-4" />
                  Creator Dashboard
                </Button>
              </Link>
            )}
            {role === "ADMIN" && (
              <Link href="/admin">
                <Button variant="glass" size="sm" className="font-medium text-red-300 border-red-500/30 gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Open Admin Queue
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Featured Highlights Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-velora-gold" />
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              Curated Highlights
            </h2>
          </div>
          <Link href="/discovery" className="text-xs font-bold uppercase tracking-wider text-velora-gold hover:underline">
            View All Marketplace Matches →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PROFILES.map((p) => (
            <Card key={p.id} variant="glass" className="group overflow-hidden flex flex-col justify-between">
              {/* Profile Image & Badges */}
              <div className="relative h-64 w-full bg-velora-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.avatarUrl}
                  alt={p.displayName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-transparent to-transparent opacity-90" />

                <div className="absolute top-3 left-3 flex flex-col gap-1">
                  {p.verified && <Badge type="verified" />}
                  {p.isCoupleProfile && <Badge type="couple" />}
                </div>

                <div className="absolute top-3 right-3">
                  {p.isOnline && <Badge type="online" />}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    {p.displayName}, {p.age}
                  </h3>
                  <p className="text-xs text-velora-textSecondary flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-velora-gold" />
                    {p.location}
                  </p>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="p-5 space-y-4 text-left flex-1 flex flex-col justify-between">
                <p className="text-xs text-velora-textMuted line-clamp-2 leading-relaxed">
                  {p.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.interests.slice(0, 2).map((interest) => (
                    <span key={interest} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-velora-textSecondary border border-white/5">
                      {interest}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <Link href={`/profile/${p.id}`} className="w-full">
                    <Button variant="glass" size="sm" className="w-full text-xs">
                      View Profile
                    </Button>
                  </Link>
                  <Link href="/messages">
                    <button className="p-2 rounded-full glass-panel text-velora-textSecondary hover:text-velora-gold hover:border-velora-gold/40 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
