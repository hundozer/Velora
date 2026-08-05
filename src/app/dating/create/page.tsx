"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { SUPPORTED_COUNTRIES } from "@/lib/data/locations";
import { createAd } from "@/lib/supabase/datingAdService";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import {
  Heart,
  ArrowLeft,
  Filter,
  Camera,
  X,
  ShieldCheck,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";

const DATING_CATEGORIES = [
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

export default function CreateDatingAdPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  // Form Fields
  const [formCategory, setFormCategory] = useState("Woman seeking man");
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo Attachment File
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCountryChange = (countryName: string) => {
    setFormCountry(countryName);
    const countryData = SUPPORTED_COUNTRIES[countryName];
    if (countryData && countryData.cities.length > 1) {
      setFormRegion(countryData.cities[1]);
    } else {
      setFormRegion("All Cities / Regions");
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formText.trim()) return;

    setIsSubmitting(true);

    const newAdItem = {
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
      status: "active" as const,
      daysLeft: formValidity,
      saved: false,
    };

    // Save to local cache first
    if (typeof window !== "undefined") {
      const existingStr = localStorage.getItem("intimo_all_dating_ads");
      const existing = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem("intimo_all_dating_ads", JSON.stringify([newAdItem, ...existing]));
    }

    // Persist to Supabase in background
    try {
      await createAd({
        author_id: profile?.id || null,
        author_name: profile?.displayName || user?.username || "Intimo Member",
        author_avatar: profile?.avatarUrl || null,
        is_verified: true,
        category: formCategory,
        title: formTitle.trim(),
        text: formText.trim(),
        photo_url: photoPreview || null,
        validity_days: formValidity,
        country: formCountry,
        region: formRegion,
        allowed_reply_genders: formReplyGenders,
        transgender_option: formTransgender,
        min_age: formMinAge,
        max_age: formMaxAge,
        require_vip: formRequireVip,
        require_media: formRequireMedia,
        require_verified: formRequireVerified,
        status: "active",
      });
    } catch (err) {
      console.error("Failed to save ad to Supabase:", err);
    }

    router.push("/dating");
  };

  if (!user) {
    return <BehindTheDoorLanding />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Back Button & Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link
            href="/dating"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-300 hover:text-amber-200 mb-3 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dating Marketplace
          </Link>
          <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-400 fill-rose-400/20" />
            Create New Dating Ad
          </h1>
          <p className="text-xs text-velora-textMuted mt-1">
            Post a discreet adult dating announcement visible to verified members in your preferred category.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* CATEGORY SELECTION GRID (Matching exact reference design) */}
        <Card variant="goldBorder" className="p-6 space-y-5 bg-gold-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Filter className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              SELECT DATING CATEGORY
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DATING_CATEGORIES.map((cat) => {
              const isSelected = formCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormCategory(cat)}
                  className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-3 transition-all text-left group cursor-pointer ${
                    isSelected
                      ? "border-amber-400 bg-amber-500/10 shadow-gold-glow text-white"
                      : "border-white/10 bg-black/40 text-white/80 hover:border-amber-400/50 hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all ${
                      isSelected ? "border-amber-400 bg-amber-400/20" : "border-white/30 group-hover:border-amber-400/60"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>
                  <span className="truncate">{cat}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ANNOUNCEMENT DETAILS CARD */}
        <Card variant="glass" className="p-6 space-y-6">
          <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-4 h-4" /> Announcement Details
          </h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
              Ad Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Discreet Fine Dining & Private Champagne Lounge in Monaco"
              className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder:text-velora-textMuted focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Text Area Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
              Detailed Announcement <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="Describe your invitation, expectations, location details, and atmosphere..."
              className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder:text-velora-textMuted focus:outline-none focus:border-amber-400 transition-colors resize-y"
            />
          </div>

          {/* Photo Upload Attachment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
              Attach Announcement Photo (Optional)
            </label>
            {photoPreview ? (
              <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-amber-400/40 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-6 border-2 border-dashed border-white/15 rounded-2xl bg-black/40 hover:bg-white/5 hover:border-amber-400/50 transition-all cursor-pointer text-center space-y-2"
              >
                <Camera className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs font-semibold text-white">Click to upload photo attachment</p>
                <p className="text-[11px] text-velora-textMuted">JPG, PNG or WEBP up to 10MB</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>
        </Card>

        {/* LOCATION & TARGET CRITERIA CARD */}
        <Card variant="glass" className="p-6 space-y-6">
          <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 border-b border-white/10 pb-3">
            <Filter className="w-4 h-4" /> Location & Target Audience Criteria
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Country */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
                Country
              </label>
              <select
                value={formCountry}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {Object.keys(SUPPORTED_COUNTRIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Region / City */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
                City / Region
              </label>
              <select
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {(SUPPORTED_COUNTRIES[formCountry]?.cities || ["All Cities / Regions"]).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allowed Reply Genders */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
              Accept Replies From Profile Genders
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { symbol: "♀", label: "Female (♀)" },
                { symbol: "♂", label: "Male (♂)" },
                { symbol: "👫", label: "Couples (👫)" },
                { symbol: "👭", label: "Female Couples (👭)" },
                { symbol: "👬", label: "Male Couples (👬)" },
                { symbol: "⚧", label: "Transgender (⚧)" },
              ].map((g) => {
                const active = formReplyGenders.includes(g.symbol);
                return (
                  <button
                    key={g.symbol}
                    type="button"
                    onClick={() => toggleReplyGender(g.symbol)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      active
                        ? "bg-amber-400 text-black border-amber-400 shadow-gold-glow"
                        : "bg-black/50 text-white/70 border-white/10 hover:border-amber-400/40"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transgender Inclusion Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
              Transgender Inclusion Criteria
            </label>
            <div className="flex flex-wrap gap-3">
              {(["Including trans", "Excluding trans", "Only trans"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-xs text-white cursor-pointer">
                  <input
                    type="radio"
                    name="transOption"
                    checked={formTransgender === opt}
                    onChange={() => setFormTransgender(opt)}
                    className="accent-amber-400"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Age Range Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
                Min Target Age ({formMinAge} years)
              </label>
              <input
                type="range"
                min="18"
                max="80"
                value={formMinAge}
                onChange={(e) => setFormMinAge(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
                Max Target Age ({formMaxAge === 100 ? "Any Age" : `${formMaxAge} years`})
              </label>
              <input
                type="range"
                min="18"
                max="100"
                value={formMaxAge}
                onChange={(e) => setFormMaxAge(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Validity Duration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 font-mono">
              Ad Duration / Validity
            </label>
            <div className="flex gap-3">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setFormValidity(days)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                    formValidity === days
                      ? "bg-amber-400 text-black border-amber-400 shadow-gold-glow"
                      : "bg-black/50 text-white/70 border-white/10 hover:border-amber-400/40"
                  }`}
                >
                  {days} Days Active
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* RESTRICTIONS & DISCRETION CARD */}
        <Card variant="glass" className="p-6 space-y-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2 border-b border-white/10 pb-3">
            <Lock className="w-4 h-4" /> Reply Eligibility Restrictions
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/30 transition-all cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Require Verified Identity
                </span>
                <p className="text-[11px] text-velora-textMuted">
                  Only members who completed selfie identity verification can reply to your ad.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formRequireVerified}
                onChange={(e) => setFormRequireVerified(e.target.checked)}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/30 transition-all cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" /> Require VIP Membership
                </span>
                <p className="text-[11px] text-velora-textMuted">
                  Only active VIP tier members can reply to your announcement.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formRequireVip}
                onChange={(e) => setFormRequireVip(e.target.checked)}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-400/30 transition-all cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-purple-400" /> Require Profile Photo/Video Albums
                </span>
                <p className="text-[11px] text-velora-textMuted">
                  Only members who have uploaded public or private media albums can reply.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formRequireMedia}
                onChange={(e) => setFormRequireMedia(e.target.checked)}
                className="w-5 h-5 accent-amber-400 rounded cursor-pointer"
              />
            </label>
          </div>
        </Card>

        {/* SUBMIT BUTTON BAR */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/10">
          <Link href="/dating">
            <Button variant="outline" size="lg" type="button" className="text-xs font-bold uppercase tracking-wider">
              Cancel
            </Button>
          </Link>
          <Button
            variant="gold"
            size="lg"
            type="submit"
            disabled={isSubmitting}
            className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow px-8 text-black"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            {isSubmitting ? "Publishing Ad..." : "Publish Dating Ad"}
          </Button>
        </div>
      </form>
    </div>
  );
}
