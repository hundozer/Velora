"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReportModal } from "@/components/safety/ReportModal";
import { MOCK_PROFILES, MOCK_CREATOR_ALBUMS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Heart,
  MessageSquare,
  ShieldCheck,
  Lock,
  Sparkles,
  Flame,
  Globe,
  UserCheck,
  CheckCircle2,
  Calendar,
  Eye,
  Crown,
  LogOut,
  Camera,
} from "lucide-react";

export default function SingleProfilePage() {
  const params = useParams();
  const { logout, user: currentUser, profile: currentProfile, updateUserProfile } = useAuth();
  const profileId = (params?.id as string) || "me";

  const isSelf =
    profileId === "me" ||
    profileId === "my-profile" ||
    (currentProfile?.id && profileId === currentProfile.id) ||
    (currentUser?.id && profileId === currentUser.id) ||
    (currentProfile?.userId && profileId === currentProfile.userId);

  const profile = isSelf && currentProfile ? currentProfile : (MOCK_PROFILES.find((p) => p.id === profileId) || MOCK_PROFILES[0]);

  const [isFavorited, setIsFavorited] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser && currentProfile) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const newAvatarUrl = reader.result as string;
        const updatedUser = { ...currentUser, avatarUrl: newAvatarUrl };
        const updatedProfile = { ...currentProfile, avatarUrl: newAvatarUrl };
        updateUserProfile(updatedUser, updatedProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser && currentProfile) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const newCoverUrl = reader.result as string;
        const updatedProfile = { ...currentProfile, coverPhotoUrl: newCoverUrl };
        updateUserProfile(currentUser, updatedProfile);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Hidden File Inputs for Interactive Photo Uploads */}
      <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarSelect} />
      <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={handleCoverSelect} />

      {/* Immersive Cover Header */}
      <Card variant="goldBorder" className="p-0 overflow-hidden text-left relative bg-gold-card">
        <div className="h-80 w-full bg-velora-card relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.coverPhotoUrl || profile.avatarUrl}
            alt={profile.displayName}
            className="w-full h-full object-cover filter contrast-110 saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/60 to-transparent" />

          {isSelf && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-full bg-black/70 border border-white/20 text-white text-xs font-semibold hover:bg-black/90 transition-all flex items-center gap-2 backdrop-blur-md shadow-2xl hover:scale-105"
              title="Upload New Cover Banner"
            >
              <Camera className="w-4 h-4 text-velora-gold" />
              <span>Change Cover Banner</span>
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6 -mt-24 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 border-velora-gold overflow-hidden bg-velora-card shrink-0 shadow-2xl relative group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />

                {isSelf && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 backdrop-blur-xs"
                    title="Upload New Avatar Photo"
                  >
                    <Camera className="w-6 h-6 text-velora-gold animate-bounce" />
                    <span>Change Photo</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-serif font-bold text-white">{profile.displayName}, {profile.age}</h1>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-xs text-velora-gold font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location} • Level 3 Biometric Verified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-3 rounded-full glass-panel transition-all ${
                  isFavorited ? "text-rose-400 border-rose-500/40 bg-rose-500/10" : "text-velora-textSecondary hover:text-velora-gold"
                }`}
                title="Favorite Profile"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-rose-400" : ""}`} />
              </button>

              {isSelf ? (
                <Link href="/settings">
                  <Button variant="gold" size="lg" className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow">
                    <UserCheck className="w-4 h-4" /> Edit Profile & Nickname
                  </Button>
                </Link>
              ) : (
                <Link href="/messages">
                  <Button variant="gold" size="lg" className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow">
                    <MessageSquare className="w-4 h-4" /> Send Private Message
                  </Button>
                </Link>
              )}

              <Button
                variant="glass"
                size="lg"
                className="text-xs font-bold uppercase tracking-wider gap-2 border-white/20 hover:border-red-500/50 hover:text-red-400"
                onClick={() => logout()}
                title="Sign Out of Account"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6 font-mono text-velora-textSecondary">
              <span className="flex items-center gap-1 text-velora-gold">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> {profile.compatibilityScore}% Chemistry Match
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Online
              </span>
            </div>

            <button
              onClick={() => setReportModalOpen(true)}
              className="text-[11px] text-velora-textMuted hover:text-red-400 transition-colors"
            >
              Report Profile
            </button>
          </div>
        </div>
      </Card>

      {/* Grid: About Me & Open Desires + Private Media Vault */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: About & Desires */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass" className="p-8 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted font-mono">
              Invitation Into {profile.displayName}'s World
            </h3>

            {profile.headline && (
              <h2 className="text-lg font-serif font-bold text-velora-gold italic">
                "{profile.headline}"
              </h2>
            )}

            <p className="text-xs text-velora-textSecondary leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </Card>

          <Card variant="glass" className="p-8 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted font-mono">
              Open Connections & Desires
            </h3>

            <div className="flex flex-wrap gap-2 pt-1">
              {profile.lookingFor.map((item) => (
                <span
                  key={item}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-velora-textPrimary border border-white/10"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>

          {/* Intimate Preferences & Sex Hobbies */}
          {(profile.sexHobbies || profile.erogenousZones || profile.favouriteSexPlaces || profile.favouriteSexPositions || profile.pubicHairGrooming) && (
            <Card variant="goldBorder" className="p-8 space-y-5 text-left bg-gold-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" /> Intimate Preferences & Kinks
              </h3>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-center text-xs font-mono">
                <div>
                  <span className="block text-[10px] text-velora-textMuted uppercase">Grooming</span>
                  <span className="font-bold text-amber-300">{profile.pubicHairGrooming || "Unspecified"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-velora-textMuted uppercase">Piercing</span>
                  <span className="font-bold text-amber-300">{profile.piercing || "Unspecified"}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-velora-textMuted uppercase">Tattoo</span>
                  <span className="font-bold text-amber-300">{profile.tattoo || "Unspecified"}</span>
                </div>
              </div>

              {profile.sexHobbies && profile.sexHobbies.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-velora-textMuted uppercase block">Sex Hobbies & Fetishes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.sexHobbies.map((hobby) => (
                      <span key={hobby} className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.erogenousZones && profile.erogenousZones.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-velora-textMuted uppercase block">Erogenous Zones</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.erogenousZones.map((zone) => (
                      <span key={zone} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-velora-textPrimary border border-white/10">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.favouriteSexPlaces && profile.favouriteSexPlaces.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-velora-textMuted uppercase block">Favourite Sex Places</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.favouriteSexPlaces.map((place) => (
                      <span key={place} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-velora-textPrimary border border-white/10">
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.favouriteSexPositions && profile.favouriteSexPositions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-velora-textMuted uppercase block">Favourite Sex Positions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.favouriteSexPositions.map((pos) => (
                      <span key={pos} className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-velora-textPrimary border border-white/10">
                        {pos}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Col: Private Vault Preview */}
        <div className="space-y-6">
          <Card variant="goldBorder" className="p-6 space-y-4 text-left bg-gold-card">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-velora-gold" /> Private Media Vault
              </h3>
              <span className="text-[10px] text-velora-textMuted font-mono">18 Media Items</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="h-28 rounded-2xl bg-velora-card relative overflow-hidden group border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatarUrl} alt="Vault" className="w-full h-full object-cover blur-md" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-velora-gold" />
                </div>
              </div>

              <div className="h-28 rounded-2xl bg-velora-card relative overflow-hidden group border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.coverPhotoUrl || profile.avatarUrl} alt="Vault" className="w-full h-full object-cover blur-md" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-velora-gold" />
                </div>
              </div>
            </div>

            <Link href="/messages" className="block">
              <Button variant="gold" size="sm" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                Request Vault Access
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUsername={profile.displayName}
      />
    </div>
  );
}
