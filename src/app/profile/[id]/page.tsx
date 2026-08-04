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
import { Input } from "@/components/ui/Input";
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
  Image,
  Video,
  Megaphone,
  Plus,
  Play,
  X,
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

  // Interactive Media Vault Menu State (My Photos, My Videos, My Dating Ads)
  const [mediaTab, setMediaTab] = useState<"PHOTOS" | "VIDEOS" | "ADS">("PHOTOS");

  const [userPhotos, setUserPhotos] = useState<string[]>([
    profile.avatarUrl,
    profile.coverPhotoUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  ]);

  const [userVideos, setUserVideos] = useState<{ id: string; title: string; duration: string; thumbnail: string }[]>([
    { id: "v1", title: "Private Lifestyle Teaser", duration: "0:45", thumbnail: profile.avatarUrl },
    { id: "v2", title: "Monaco Riviera Highlights", duration: "1:20", thumbnail: profile.coverPhotoUrl || profile.avatarUrl },
  ]);

  const [userDatingAds, setUserDatingAds] = useState<{ id: string; title: string; category: string; description: string; date: string }[]>([
    {
      id: "ad-1",
      title: "Discreet Fine Dining & Champagne Evening",
      category: "VIP Dining & Lounge",
      description: "Looking for an open-minded, sophisticated partner for private dining in Monte Carlo this Friday.",
      date: "Active • Posted 2 days ago",
    },
    {
      id: "ad-2",
      title: "Weekend Riviera Yacht & Sunbathing",
      category: "Weekend Getaway",
      description: "Seeking a fun, attractive companion to join for a weekend cruise along the Côte d'Azur.",
      date: "Active • Posted 5 days ago",
    },
  ]);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const photoUploadRef = React.useRef<HTMLInputElement>(null);
  const videoUploadRef = React.useRef<HTMLInputElement>(null);

  const [newAdModalOpen, setNewAdModalOpen] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState("");
  const [newAdCategory, setNewAdCategory] = useState("VIP Lifestyle");
  const [newAdDescription, setNewAdDescription] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            setUserPhotos((prev) => [reader.result as string, ...prev]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setUserVideos((prev) => [
            {
              id: `vid-${Date.now()}`,
              title: file.name.replace(/\.[^/.]+$/, ""),
              duration: "0:30",
              thumbnail: profile.avatarUrl,
            },
            ...prev,
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdDescription.trim()) return;

    const newAd = {
      id: `ad-${Date.now()}`,
      title: newAdTitle,
      category: newAdCategory,
      description: newAdDescription,
      date: "Active • Posted just now",
    };

    setUserDatingAds((prev) => [newAd, ...prev]);
    setNewAdTitle("");
    setNewAdDescription("");
    setNewAdModalOpen(false);
  };

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

        {/* Right Col: Member Vault & Content Showcase (My Photos, My Videos, My Dating Ads) */}
        <div className="space-y-6">
          <Card variant="goldBorder" className="p-6 space-y-5 text-left bg-gold-card">
            {/* Hidden Inputs for Media Uploads */}
            <input type="file" ref={photoUploadRef} accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            <input type="file" ref={videoUploadRef} accept="video/*" className="hidden" onChange={handleVideoUpload} />

            {/* Header Title & Count */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-velora-gold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-velora-gold" /> Member Vault & Media Showcase
              </h3>
              <span className="text-[10px] text-velora-textMuted font-mono">
                {mediaTab === "PHOTOS" ? `${userPhotos.length} Photos` : mediaTab === "VIDEOS" ? `${userVideos.length} Videos` : `${userDatingAds.length} Active Ads`}
              </span>
            </div>

            {/* Navigation Menu Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMediaTab("PHOTOS")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mediaTab === "PHOTOS" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm font-bold" : "text-velora-textMuted hover:text-white"
                }`}
              >
                <Image className="w-3.5 h-3.5" />
                <span>Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaTab("VIDEOS")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mediaTab === "VIDEOS" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm font-bold" : "text-velora-textMuted hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaTab("ADS")}
                className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mediaTab === "ADS" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm font-bold" : "text-velora-textMuted hover:text-white"
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Dating Ads</span>
              </button>
            </div>

            {/* TAB 1: MY PHOTOS */}
            {mediaTab === "PHOTOS" && (
              <div className="space-y-4">
                {isSelf && (
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => photoUploadRef.current?.click()}
                    className="w-full text-xs font-bold uppercase tracking-wider gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-400/10"
                  >
                    <Plus className="w-4 h-4 text-velora-gold" /> Upload New Photo
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {userPhotos.map((photoUrl, idx) => (
                    <div key={idx} className="h-28 rounded-2xl bg-velora-card relative overflow-hidden group border border-white/10 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photoUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <span className="text-[10px] text-white font-mono">Photo #{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: MY VIDEOS */}
            {mediaTab === "VIDEOS" && (
              <div className="space-y-4">
                {isSelf && (
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => videoUploadRef.current?.click()}
                    className="w-full text-xs font-bold uppercase tracking-wider gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-400/10"
                  >
                    <Plus className="w-4 h-4 text-velora-gold" /> Upload Video Clip
                  </Button>
                )}

                <div className="space-y-2">
                  {userVideos.map((vid) => (
                    <div key={vid.id} className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 group hover:border-amber-400/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-velora-card relative overflow-hidden shrink-0 border border-white/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-4 h-4 text-amber-300 fill-amber-300" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">{vid.title}</p>
                          <p className="text-[10px] text-velora-textMuted font-mono">Duration: {vid.duration}</p>
                        </div>
                      </div>
                      <Badge type="verified" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MY DATING ADS */}
            {mediaTab === "ADS" && (
              <div className="space-y-4">
                {isSelf && (
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setNewAdModalOpen(true)}
                    className="w-full text-xs font-bold uppercase tracking-wider gap-1.5 shadow-gold-glow"
                  >
                    <Plus className="w-4 h-4" /> + Post New Dating Ad
                  </Button>
                )}

                <div className="space-y-3">
                  {userDatingAds.map((ad) => (
                    <div key={ad.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-left hover:border-amber-400/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {ad.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">{ad.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white">{ad.title}</h4>
                      <p className="text-[11px] text-velora-textSecondary leading-relaxed">{ad.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Post Dating Ad Modal */}
      {newAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-5 text-left bg-velora-card relative shadow-2xl">
            <button
              onClick={() => setNewAdModalOpen(false)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-velora-gold" /> Post Personal Dating Ad
              </h3>
              <p className="text-xs text-velora-textMuted">Publish an intimate announcement or lifestyle connection request.</p>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-velora-textSecondary mb-1.5">Ad Title / Headline</label>
                <Input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="e.g. Seeking Gala Partner for Monaco Weekend"
                  className="w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-velora-textSecondary mb-1.5">Category</label>
                <select
                  value={newAdCategory}
                  onChange={(e) => setNewAdCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-velora-gold"
                >
                  <option value="VIP Lifestyle" className="bg-velora-card">VIP Lifestyle & Events</option>
                  <option value="VIP Dining & Lounge" className="bg-velora-card">VIP Dining & Lounge</option>
                  <option value="Weekend Getaway" className="bg-velora-card">Weekend Getaway</option>
                  <option value="Discreet Romance" className="bg-velora-card">Discreet Romance</option>
                  <option value="Couples Experience" className="bg-velora-card">Couples Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-velora-textSecondary mb-1.5">Description & Desires</label>
                <textarea
                  value={newAdDescription}
                  onChange={(e) => setNewAdDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your ideal partner, location, expectations, and chemistry..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-velora-gold resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="glass" size="sm" type="button" onClick={() => setNewAdModalOpen(false)} className="w-1/2 text-xs">
                  Cancel
                </Button>
                <Button variant="gold" size="sm" type="submit" className="w-1/2 text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                  Publish Ad
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUsername={profile.displayName}
      />
    </div>
  );
}
