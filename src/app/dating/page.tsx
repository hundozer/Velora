"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { SUPPORTED_COUNTRIES } from "@/lib/data/locations";
import {
  Heart,
  Plus,
  Search,
  Filter,
  MapPin,
  ShieldCheck,
  Sparkles,
  Camera,
  X,
  MessageSquare,
  Bookmark,
  Calendar,
  Eye,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  UserCheck,
  ChevronDown,
  Globe,
  RotateCcw,
  History,
  Trash2,
  Lock as LockIcon,
} from "lucide-react";

export interface DatingAdItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isVerified: boolean;
  category: string;
  title: string;
  text: string;
  photoUrl?: string;
  validityDays: number;
  country: string;
  region: string;
  allowedReplyGenders: string[];
  transgenderOption: "Including trans" | "Excluding trans" | "Only trans";
  minAge: number;
  maxAge: number;
  requireVip: boolean;
  requireMedia: boolean;
  requireVerified: boolean;
  createdAt: string;
  status: "active" | "expired";
  daysLeft: number;
  saved: boolean;
}

const DATING_CATEGORIES = [
  "Show all categories",
  "Woman seeking man",
  "Man seeking woman",
  "Couple seeking couple",
  "Swingers parties",
  "Woman seeking woman",
  "Man seeking man",
  "Couple seeking woman",
  "Erotic correspondence",
  "Woman seeking couple",
  "Man seeking couple",
  "Couple seeking man",
  "Lovers asylums",
  "Woman offering services",
  "Man offering services",
  "Couple offering services",
  "Strip-tease",
  "Photographing - offer",
  "Jobs in the erotic industry - offer",
  "Market - offer",
  "Incall apartments and clubs",
  "Photographing - request",
  "Jobs in the erotic industry - request",
  "Market - request",
  "Erotic services",
  "Transgender seeking",
  "Transgender offering services",
  "Massage/Sauna",
  "S/M studios",
];

const INITIAL_ADS: DatingAdItem[] = [
  {
    id: "ad-101",
    authorId: "usr-1",
    authorName: "Elena V.",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    isVerified: true,
    category: "Woman seeking man",
    title: "Discreet Fine Dining & Champagne Evening",
    text: "Looking for a refined, open-minded gentleman for private dining in Prague. Value discretion, chemistry, and genuine conversation.",
    photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    validityDays: 7,
    country: "Czech Republic",
    region: "Hlavní město Praha",
    allowedReplyGenders: ["♂"],
    transgenderOption: "Including trans",
    minAge: 25,
    maxAge: 55,
    requireVip: false,
    requireMedia: false,
    requireVerified: true,
    createdAt: "2 hours ago",
    status: "active",
    daysLeft: 7,
    saved: false,
  },
  {
    id: "ad-102",
    authorId: "usr-2",
    authorName: "Marco & Sofia",
    authorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
    isVerified: true,
    category: "Couple seeking woman",
    title: "French Riviera Yacht & Private Lounge Weekend",
    text: "Discreet couple inviting a sensual female companion for a yachting weekend in Monaco. Classy aesthetic and private suite.",
    photoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    validityDays: 14,
    country: "Monaco",
    region: "Monte Carlo",
    allowedReplyGenders: ["♀"],
    transgenderOption: "Including trans",
    minAge: 21,
    maxAge: 40,
    requireVip: true,
    requireMedia: true,
    requireVerified: true,
    createdAt: "5 hours ago",
    status: "active",
    daysLeft: 14,
    saved: true,
  },
  {
    id: "ad-103",
    authorId: "me",
    authorName: "Prince Charming",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    isVerified: true,
    category: "Man seeking woman",
    title: "Prague Old Town Cocktail & Salon Connection",
    text: "Looking for an attractive, spontaneous partner to explore private member lounges and cocktail bars in Prague this weekend.",
    photoUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    validityDays: 7,
    country: "Czech Republic",
    region: "Hlavní město Praha",
    allowedReplyGenders: ["♀"],
    transgenderOption: "Including trans",
    minAge: 21,
    maxAge: 45,
    requireVip: false,
    requireMedia: false,
    requireVerified: true,
    createdAt: "1 day ago",
    status: "active",
    daysLeft: 6,
    saved: false,
  },
  {
    id: "ad-104",
    authorId: "usr-3",
    authorName: "Lucas & Mia",
    authorAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
    isVerified: true,
    category: "Couple seeking couple",
    title: "Swingers Party & Private Villa Gathering",
    text: "Hosting a discreet private villa salon for like-minded couples. Refreshments, sauna, and relaxed atmosphere provided.",
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    validityDays: 30,
    country: "Germany",
    region: "Berlin",
    allowedReplyGenders: ["👫"],
    transgenderOption: "Including trans",
    minAge: 25,
    maxAge: 50,
    requireVip: false,
    requireMedia: true,
    requireVerified: true,
    createdAt: "2 days ago",
    status: "active",
    daysLeft: 28,
    saved: false,
  },
  {
    id: "ad-105",
    authorId: "me",
    authorName: "Prince Charming",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    isVerified: true,
    category: "Man seeking woman",
    title: "Discreet Opera & Fine Dining Experience in Vienna",
    text: "Inviting an elegant companion for an evening at the Vienna State Opera followed by wine at a private lounge.",
    photoUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    validityDays: 7,
    country: "Austria",
    region: "Vienna",
    allowedReplyGenders: ["♀"],
    transgenderOption: "Including trans",
    minAge: 21,
    maxAge: 45,
    requireVip: false,
    requireMedia: false,
    requireVerified: true,
    createdAt: "10 days ago",
    status: "expired",
    daysLeft: 0,
    saved: false,
  },
];

export default function DatingMarketplacePage() {
  const { user, profile } = useAuth();
  const [adsList, setAdsList] = useState<DatingAdItem[]>(INITIAL_ADS);
  const [selectedCategory, setSelectedCategory] = useState("Show all categories");
  const [selectedCountry, setSelectedCountry] = useState("All Countries");
  const [selectedRegion, setSelectedRegion] = useState("All Cities / Regions");
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 100]);
  const [activeFilterPill, setActiveFilterPill] = useState<string | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form Fields for Add New Dating Ad Modal
  const [formCategory, setFormCategory] = useState("Man seeking woman");
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formValidity, setFormValidity] = useState(7);
  const [formCountry, setFormCountry] = useState("Czech Republic");
  const [formRegion, setFormRegion] = useState("Hlavní město Praha");
  const [formReplyGenders, setFormReplyGenders] = useState<string[]>(["♀"]);
  const [formTransgender, setFormTransgender] = useState<"Including trans" | "Excluding trans" | "Only trans">("Including trans");
  const [formMinAge, setFormMinAge] = useState(18);
  const [formMaxAge, setFormMaxAge] = useState(100);
  const [formRequireVip, setFormRequireVip] = useState(false);
  const [formRequireMedia, setFormRequireMedia] = useState(false);
  const [formRequireVerified, setFormRequireVerified] = useState(true);

  const handleCountryFilterChange = (countryName: string) => {
    setSelectedCountry(countryName);
    setSelectedRegion("All Cities / Regions");
  };

  const handleFormCountryChange = (countryName: string) => {
    setFormCountry(countryName);
    const countryData = SUPPORTED_COUNTRIES[countryName];
    if (countryData && countryData.cities.length > 1) {
      setFormRegion(countryData.cities[1]);
    } else {
      setFormRegion("All Cities / Regions");
    }
  };

  // Photo Attachment File
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleReplyGender = (gender: string) => {
    if (formReplyGenders.includes(gender)) {
      setFormReplyGenders(formReplyGenders.filter((g) => g !== gender));
    } else {
      setFormReplyGenders([...formReplyGenders, gender]);
    }
  };

  const [activeTab, setActiveTab] = useState<"browse" | "my-ads">("browse");
  const [restrictedNoticeAd, setRestrictedNoticeAd] = useState<{ ad: DatingAdItem; reason: string } | null>(null);

  const checkCanReply = (ad: DatingAdItem): { canReply: boolean; reason?: string } => {
    if (ad.authorId === user?.id || ad.authorId === "me") {
      return { canReply: true };
    }

    const userGenderStr = String(profile?.gender || (user as any)?.gender || "MALE").toUpperCase();
    let userGenderSymbol = "♂";

    if (userGenderStr.includes("FEMALE")) userGenderSymbol = "♀";
    else if (userGenderStr.includes("COUPLE_FF")) userGenderSymbol = "👭";
    else if (userGenderStr.includes("COUPLE_MM")) userGenderSymbol = "👬";
    else if (userGenderStr.includes("COUPLE")) userGenderSymbol = "👫";
    else if (userGenderStr.includes("TRANS")) userGenderSymbol = "⚧";
    else if (userGenderStr.includes("MALE")) userGenderSymbol = "♂";

    if (ad.allowedReplyGenders && ad.allowedReplyGenders.length > 0) {
      if (!ad.allowedReplyGenders.includes(userGenderSymbol)) {
        const allowedLabels = ad.allowedReplyGenders
          .map((g) =>
            g === "♂"
              ? "Male (♂)"
              : g === "♀"
              ? "Female (♀)"
              : g === "👫"
              ? "Couples (👫)"
              : g === "👭"
              ? "Female Couples (👭)"
              : g === "👬"
              ? "Male Couples (👬)"
              : "Transgender (⚧)"
          )
          .join(", ");

        return {
          canReply: false,
          reason: `Replies restricted by creator: This dating ad accepts replies from ${allowedLabels} profiles only. Your profile gender (${userGenderSymbol}) does not match the creator's restriction.`,
        };
      }
    }

    const isUserVerified = Boolean(
      profile?.verified || (profile as any)?.isVerified || (user as any)?.isVerified || profile?.reputationBadge === "IDENTITY_VERIFIED"
    );
    if (ad.requireVerified && !isUserVerified) {
      return {
        canReply: false,
        reason: "Replies restricted by creator: Only verified users (members who completed selfie identity verification) can reply to this ad.",
      };
    }

    const isUserVip = (profile as any)?.tier === "VIP" || (profile as any)?.membershipTier === "VIP" || user?.role === "ADMIN";
    if (ad.requireVip && !isUserVip) {
      return {
        canReply: false,
        reason: "Replies restricted by creator: Only users who have bought a VIP membership can reply to this ad.",
      };
    }

    const hasMediaAlbums = Boolean(
      ((profile as any)?.albums && (profile as any).albums.length > 0) ||
      ((profile as any)?.videos && (profile as any).videos.length > 0) ||
      (profile as any)?.hasMedia ||
      user?.role === "ADMIN"
    );
    if (ad.requireMedia && !hasMediaAlbums) {
      return {
        canReply: false,
        reason: "Replies restricted by creator: Only users who have uploaded photo albums or video albums to their profile can reply to this ad.",
      };
    }

    return { canReply: true };
  };

  const handleReactivateAd = (id: string) => {
    setAdsList((prev) =>
      prev.map((ad) =>
        ad.id === id
          ? {
              ...ad,
              status: "active",
              daysLeft: ad.validityDays,
              createdAt: "Just now",
            }
          : ad
      )
    );
  };

  const handleDeleteAd = (id: string) => {
    setAdsList((prev) => prev.filter((ad) => ad.id !== id));
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formText.trim()) return;

    const newAd: DatingAdItem = {
      id: `ad-${Date.now()}`,
      authorId: user?.id || "me",
      authorName: profile?.displayName || user?.username || "Prince Charming",
      authorAvatar: profile?.avatarUrl || user?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      isVerified: true,
      category: formCategory,
      title: formTitle.trim(),
      text: formText.trim(),
      photoUrl: photoPreview || undefined,
      validityDays: formValidity,
      country: formCountry,
      region: formRegion,
      allowedReplyGenders: formReplyGenders,
      transgenderOption: formTransgender,
      minAge: formMinAge,
      maxAge: formMaxAge,
      requireVip: formRequireVip,
      requireMedia: formRequireMedia,
      requireVerified: formRequireVerified,
      createdAt: "Just now",
      status: "active",
      daysLeft: formValidity,
      saved: false,
    };

    setAdsList([newAd, ...adsList]);

    // Reset Form
    setFormTitle("");
    setFormText("");
    setPhotoPreview(null);
    setIsAddModalOpen(false);
  };

  const handleToggleSaveAd = (id: string) => {
    setAdsList((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, saved: !ad.saved } : ad))
    );
  };

  const filteredAds = adsList.filter((ad) => {
    if (activeTab === "my-ads") {
      // Show all user's ads (both active & expired)
      const isMyAd = ad.authorId === user?.id || ad.authorId === "me";
      if (!isMyAd) return false;
    } else {
      // Browse Marketplace: Show active ads ONLY! Expired ads disappear to prevent clutter!
      if (ad.status !== "active") return false;
      if (selectedCategory !== "Show all categories" && ad.category !== selectedCategory) {
        return false;
      }
    }

    if (activeFilterPill === "Saved" && !ad.saved) return false;
    if (activeFilterPill === "With photo" && !ad.photoUrl) return false;
    if (activeFilterPill === "Verified" && !ad.isVerified) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Banner Header matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-400 fill-rose-400/20" />
            {activeTab === "my-ads"
              ? "My Dating Ads History"
              : selectedCategory === "Show all categories"
              ? "All Active Dating Ads"
              : selectedCategory}
            <span className="text-xs font-mono text-amber-300 font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {selectedRegion || selectedCountry}
            </span>
          </h1>
          <p className="text-xs text-velora-textMuted mt-1">
            {activeTab === "my-ads"
              ? "Manage your active and expired dating announcements. Expired ads are hidden from the feed and can be reactivated anytime."
              : "Browse and post discreet adult dating ads, announcements, and invitations in your area."}
          </p>
        </div>

        {/* Primary "+ Add new dating ad" Button */}
        <Button
          variant="gold"
          size="lg"
          onClick={() => setIsAddModalOpen(true)}
          className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow border-amber-400/40 text-black shrink-0"
        >
          <Plus className="w-4 h-4 text-black" /> Add new dating ad
        </Button>
      </div>

      {/* Navigation Sub-Tabs: Browse Marketplace vs My Dating Ads (History) */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab("browse")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === "browse"
              ? "bg-amber-400 text-black shadow-gold-glow font-bold"
              : "bg-white/5 text-velora-textMuted hover:text-white border border-white/10"
          }`}
        >
          <Search className="w-4 h-4" />
          Browse Marketplace (Active Ads)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("my-ads")}
          className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === "my-ads"
              ? "bg-amber-400 text-black shadow-gold-glow font-bold"
              : "bg-white/5 text-velora-textMuted hover:text-white border border-white/10"
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          My Dating Ads ({adsList.filter((a) => a.authorId === user?.id || a.authorId === "me").length})
        </button>
      </div>

      {/* 29-Category Grid Selection Section */}
      <Card variant="goldBorder" className="p-5 space-y-4 bg-velora-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-2 border-b border-white/10 pb-2">
          <Filter className="w-4 h-4 text-velora-gold" /> Select Dating Category
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
          {DATING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all font-medium ${
                  isSelected
                    ? "bg-amber-400/20 text-amber-300 border-amber-400 shadow-gold-glow font-bold"
                    : "bg-white/5 text-velora-textSecondary border-white/10 hover:border-white/20 hover:text-white"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-amber-400 bg-amber-400" : "border-white/30"
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                </div>
                <span className="truncate">{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Bar Below Categories */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Country & Region Selectors */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-velora-textMuted uppercase text-[11px]">Country:</span>
              <select
                value={selectedCountry}
                onChange={(e) => handleCountryFilterChange(e.target.value)}
                className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="All Countries">🌐 All Countries</option>
                {Object.keys(SUPPORTED_COUNTRIES).map((cName) => (
                  <option key={cName} value={cName}>
                    {SUPPORTED_COUNTRIES[cName].flag} {cName}
                  </option>
                ))}
              </select>

              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {(selectedCountry !== "All Countries" && SUPPORTED_COUNTRIES[selectedCountry]
                  ? SUPPORTED_COUNTRIES[selectedCountry].cities
                  : ["All Cities / Regions"]
                ).map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-velora-textMuted uppercase text-[11px] mr-1">Only:</span>
              {[
                "Saved",
                "No ad highlighting",
                "Online",
                "With photo",
                "Verified",
                "Friends",
                "Followed",
              ].map((pill) => {
                const isActive = activeFilterPill === pill;
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => setActiveFilterPill(isActive ? null : pill)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      isActive
                        ? "bg-amber-400/20 text-amber-300 border-amber-400 shadow-gold-glow"
                        : "bg-white/5 text-velora-textMuted border-white/10 hover:text-white"
                    }`}
                  >
                    {pill === "Saved" && "⭐ "}
                    {pill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Range Slider */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-velora-textMuted uppercase">Age Range:</span>
              <span className="text-amber-300 font-bold">{ageRange[0]} – {ageRange[1]} years old</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-velora-textMuted">{ageRange[0]}</span>
              <input
                type="range"
                min={18}
                max={100}
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono text-velora-textMuted">100</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-4 text-[11px] font-mono pt-1 text-amber-300">
              <button type="button" onClick={() => setAgeRange([18, 25])} className="hover:underline">18–25</button>
              <button type="button" onClick={() => setAgeRange([26, 35])} className="hover:underline">26–35</button>
              <button type="button" onClick={() => setAgeRange([36, 45])} className="hover:underline">36–45</button>
              <button type="button" onClick={() => setAgeRange([46, 55])} className="hover:underline">46–55</button>
              <button type="button" onClick={() => setAgeRange([18, 100])} className="hover:underline text-velora-textMuted">Reset Age</button>
            </div>
          </div>
        </div>
      </Card>

      {/* Ads Feed Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-velora-textMuted px-1">
          <span>Showing {filteredAds.length} {filteredAds.length === 1 ? "Active Dating Ad" : "Active Dating Ads"}</span>
          <span>Category: <strong className="text-amber-300">{selectedCategory}</strong></span>
        </div>

        {filteredAds.length === 0 ? (
          <Card variant="glass" className="p-12 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-base font-serif font-bold text-white">No Dating Ads Found in This Category</h3>
            <p className="text-xs text-velora-textMuted">Be the first member to post a dating announcement!</p>
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold uppercase mt-2 shadow-gold-glow"
            >
              + Post New Dating Ad
            </Button>
          </Card>
        ) : (
          filteredAds.map((ad) => (
            <Card
              key={ad.id}
              variant="goldBorder"
              hoverEffect
              className="p-5 space-y-4 bg-velora-card text-left relative overflow-hidden"
            >
              {/* Top Ad Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-400/50 overflow-hidden bg-black shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ad.authorAvatar} alt={ad.authorName} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/profile/${ad.authorId}`}>
                        <h4 className="text-sm font-bold text-white hover:text-amber-300 transition-colors">
                          {ad.authorName}
                        </h4>
                      </Link>
                      {ad.isVerified && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ad.category}
                      </span>
                      {ad.status === "active" ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          🟢 Active ({ad.daysLeft}d left)
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          🔴 Expired (Hidden from Public Feed)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-velora-textMuted font-mono flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-blue-400" /> {ad.region}, {ad.country} • Posted {ad.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(ad.authorId === user?.id || ad.authorId === "me") ? (
                    <>
                      {ad.status === "expired" ? (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => handleReactivateAd(ad.id)}
                          className="text-xs font-bold uppercase gap-1.5 shadow-gold-glow"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reactivate Ad (+{ad.validityDays} Days)
                        </Button>
                      ) : (
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleReactivateAd(ad.id)}
                          className="text-xs font-semibold gap-1 text-amber-300 border-amber-400/30 hover:bg-amber-400/10"
                        >
                          <RotateCcw className="w-3 h-3" /> Extend +{ad.validityDays}d
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-2 rounded-xl border border-white/10 bg-white/5 text-velora-textMuted hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                        title="Delete Ad"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleSaveAd(ad.id)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                          ad.saved
                            ? "bg-amber-400/20 text-amber-300 border-amber-400 shadow-gold-glow"
                            : "bg-white/5 text-velora-textMuted border-white/10 hover:text-white"
                        }`}
                        title={ad.saved ? "Saved to Favorites" : "Save Dating Ad"}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${ad.saved ? "fill-amber-300 text-amber-300" : ""}`} />
                        <span className="hidden sm:inline">{ad.saved ? "Saved" : "Save"}</span>
                      </button>

                      {(() => {
                        const replyCheck = checkCanReply(ad);
                        if (replyCheck.canReply) {
                          return (
                            <Link href={`/messages?user=${ad.authorId}`}>
                              <Button variant="gold" size="sm" className="text-xs font-bold uppercase gap-1.5 shadow-gold-glow">
                                <MessageSquare className="w-3.5 h-3.5" /> Reply to Ad
                              </Button>
                            </Link>
                          );
                        } else {
                          return (
                            <Button
                              variant="glass"
                              size="sm"
                              onClick={() => setRestrictedNoticeAd({ ad, reason: replyCheck.reason || "Replies restricted." })}
                              className="text-xs font-bold uppercase gap-1.5 text-rose-300 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 shadow-none"
                            >
                              <LockIcon className="w-3.5 h-3.5 text-rose-400" /> Replies Restricted
                            </Button>
                          );
                        }
                      })()}
                    </>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="text-base font-serif font-bold text-amber-300">{ad.title}</h3>
                <p className="text-xs text-velora-textSecondary leading-relaxed whitespace-pre-line">
                  {ad.text}
                </p>
              </div>

              {/* Optional 1 Photo Attachment */}
              {ad.photoUrl && (
                <div className="max-w-md rounded-2xl overflow-hidden border border-white/10 bg-black relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.photoUrl} alt="Dating Ad Attachment" className="w-full max-h-72 object-cover" />
                </div>
              )}

              {/* Footer Ad Conditions & Target Criteria */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-velora-textMuted">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-amber-300 font-bold">Allowed Replies:</span>
                  {ad.allowedReplyGenders.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">{g}</span>
                  ))}
                  <span>• Target Age: <strong className="text-white">{ad.minAge}–{ad.maxAge}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {ad.requireVerified && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      ✓ Verified Only
                    </span>
                  )}
                  {ad.requireVip && (
                    <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                      ⭐ VIP Only
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* "ADD NEW DATING AD" MODAL (Matching User Screenshot) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <Card
            variant="goldBorder"
            className="w-full max-w-2xl p-6 space-y-5 text-left bg-velora-card relative shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/10 pb-3">
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-400 fill-rose-400" /> Add new dating ad
              </h2>
              <p className="text-xs text-velora-textMuted mt-0.5">
                Create a discreet dating announcement visible to verified members.
              </p>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-4 text-xs">
              {/* Category Dropdown */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-amber-300 mb-1.5 font-mono">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {DATING_CATEGORIES.filter((c) => c !== "Show all categories").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-amber-300 mb-1.5 font-mono">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Discreet Fine Dining & Private Champagne Lounge"
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder:text-velora-textMuted focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Text Area Description */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-amber-300 mb-1.5 font-mono">
                  Text
                </label>
                <textarea
                  rows={4}
                  required
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Describe your invitation, preferences, and expectations..."
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white placeholder:text-velora-textMuted focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-velora-textMuted mt-1 leading-relaxed">
                  It is forbidden to link to external websites. It is not allowed to offend or attack other users or insert contact details such as phone numbers in public text.
                </p>
              </div>

              {/* Photo Attachment (1 Photo) */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-amber-300 mb-1.5 font-mono">
                  Attach 1 Photo (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-amber-400 bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-amber-300 flex items-center gap-2 transition-colors font-bold"
                  >
                    <Camera className="w-5 h-5 text-amber-400" /> Upload 1 Ad Photo
                  </button>
                )}
              </div>

              {/* Validity */}
              <div>
                <label className="block font-bold uppercase tracking-wider text-amber-300 mb-1.5 font-mono">
                  Validity
                </label>
                <select
                  value={formValidity}
                  onChange={(e) => setFormValidity(parseInt(e.target.value))}
                  className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>

              {/* Location Searching In */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Location you are searching in
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-velora-textMuted uppercase font-mono mb-1">
                      Country
                    </label>
                    <select
                      value={formCountry}
                      onChange={(e) => handleFormCountryChange(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {Object.keys(SUPPORTED_COUNTRIES).map((cName) => (
                        <option key={cName} value={cName}>
                          {SUPPORTED_COUNTRIES[cName].flag} {cName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-velora-textMuted uppercase font-mono mb-1">
                      Region / City
                    </label>
                    <select
                      value={formRegion}
                      onChange={(e) => setFormRegion(e.target.value)}
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {(SUPPORTED_COUNTRIES[formCountry]?.cities || ["All Cities / Regions"]).map((cityName) => (
                        <option key={cityName} value={cityName}>
                          {cityName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Set Who Can Reply */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Set who can reply
                </h4>

                <div>
                  <label className="block text-[11px] text-velora-textMuted uppercase font-mono mb-1.5">
                    Category / Gender Symbols
                  </label>
                  <div className="flex items-center gap-2">
                    {["♂", "♀", "👫", "👭", "👬", "⚧"].map((g) => {
                      const active = formReplyGenders.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => toggleReplyGender(g)}
                          className={`w-9 h-9 rounded-xl border font-bold text-sm flex items-center justify-center transition-all ${
                            active
                              ? "bg-amber-400/20 text-amber-300 border-amber-400 shadow-gold-glow"
                              : "bg-white/5 text-velora-textMuted border-white/10"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-velora-textMuted uppercase font-mono mb-1">
                    Transgender
                  </label>
                  <select
                    value={formTransgender}
                    onChange={(e) => setFormTransgender(e.target.value as any)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Including trans">Including trans</option>
                    <option value="Excluding trans">Excluding trans</option>
                    <option value="Only trans">Only trans</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-velora-textMuted mb-1">
                    <span>Target Age:</span>
                    <span className="text-amber-300 font-bold">{formMinAge} – {formMaxAge}</span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={100}
                    value={formMaxAge}
                    onChange={(e) => setFormMaxAge(parseInt(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-amber-300 pt-1">
                    <button type="button" onClick={() => { setFormMinAge(18); setFormMaxAge(25); }}>18–25</button>
                    <button type="button" onClick={() => { setFormMinAge(26); setFormMaxAge(35); }}>26–35</button>
                    <button type="button" onClick={() => { setFormMinAge(36); setFormMaxAge(45); }}>36–45</button>
                    <button type="button" onClick={() => { setFormMinAge(46); setFormMaxAge(55); }}>46–55</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-velora-textMuted uppercase font-mono mb-1.5">
                    Only users matching conditions:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFormRequireVip(!formRequireVip)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        formRequireVip
                          ? "bg-amber-400/20 text-amber-300 border-amber-400 shadow-gold-glow"
                          : "bg-white/5 text-velora-textMuted border-white/10"
                      }`}
                    >
                      With VIP membership
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormRequireMedia(!formRequireMedia)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        formRequireMedia
                          ? "bg-amber-400/20 text-amber-300 border-amber-400 shadow-gold-glow"
                          : "bg-white/5 text-velora-textMuted border-white/10"
                      }`}
                    >
                      With albums/videos
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormRequireVerified(!formRequireVerified)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        formRequireVerified
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-gold-glow"
                          : "bg-white/5 text-velora-textMuted border-white/10"
                      }`}
                    >
                      Verified users
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="text-xs font-bold uppercase tracking-wider shadow-gold-glow"
                >
                  Add Dating Ad
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Restricted Reply Explanation Modal */}
      {restrictedNoticeAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <button
              onClick={() => setRestrictedNoticeAd(null)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/10 pb-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <LockIcon className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">Replies Restricted</h3>
                <p className="text-xs text-velora-textMuted">Ad Target Conditions Specified by {restrictedNoticeAd.ad.authorName}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <p className="text-xs text-rose-200 leading-relaxed font-sans">
                {restrictedNoticeAd.reason}
              </p>

              <div className="pt-2 text-[11px] font-mono text-amber-300 border-t border-white/10 flex items-center justify-between">
                <span>Ad Category: {restrictedNoticeAd.ad.category}</span>
                <span>Allowed Target: {restrictedNoticeAd.ad.allowedReplyGenders.join(" ")}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="gold"
                size="sm"
                onClick={() => setRestrictedNoticeAd(null)}
                className="text-xs font-bold uppercase shadow-gold-glow"
              >
                Understood
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
