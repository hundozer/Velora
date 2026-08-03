"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { MediaManager } from "@/components/media/MediaManager";
import {
  Sparkles,
  MapPin,
  Heart,
  ShieldCheck,
  Upload,
  CheckCircle2,
  ArrowRight,
  Sliders,
  EyeOff,
  UserCheck,
  Lock,
  Globe,
  Tag,
  Smile,
  Shield,
} from "lucide-react";

export default function OnboardingWizardPage() {
  const router = useRouter();
  const { user, profile, role } = useAuth();

  const [wizardStep, setWizardStep] = useState<number>(1);

  // Form State covering all 5 Steps
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    username: user?.username || "elena_vance",
    displayName: profile?.displayName || "Elena Vance",
    dateOfBirth: profile?.dateOfBirth || "2000-04-12",
    age: profile?.age || 26,
    gender: profile?.gender || "FEMALE",
    sexualOrientation: profile?.sexualOrientation || "BISEXUAL",
    relationshipStatus: profile?.relationshipStatus || "SINGLE",
    country: profile?.country || "Monaco",
    city: profile?.city || "Monte Carlo",
    languages: profile?.languages || ["English", "French", "Italian"],
    partnerDisplayName: profile?.partnerDisplayName || "Sophia",
    partnerAge: profile?.partnerAge || 28,

    // Step 2: About Me
    headline: profile?.headline || "Art Curator & High-Discretion Private Hostess",
    bio: profile?.bio || "Art curator, wine enthusiast & private event hostess. Looking for high-discretion connections and exclusive dining experiences across Europe.",
    interests: profile?.interests || ["Contemporary Art", "Fine Wine", "Private Aviation", "Yachting"],
    lifestyleTags: profile?.lifestyleTags || ["Luxury Lifestyle", "Gourmet Dining", "VIP Social Club"],
    hobbies: profile?.hobbies || ["Classical Piano", "Polo", "Vintage Champagne Tasting"],

    // Step 3: Looking For
    lookingFor: profile?.lookingFor || ["Dating", "Casual Connection", "Social Events", "Travel Partner"],

    // Step 4: Preferences
    minAge: 21,
    maxAge: 55,
    maxDistanceKm: 150,
    preferredGenders: ["MALE", "FEMALE", "COUPLE_MF"],
    preferredProfileTypes: ["INDIVIDUAL", "COUPLE", "CREATOR"],

    // Step 5: Privacy Settings & Media
    publicProfileVisibility: true,
    photoVisibilityDefault: "PUBLIC",
    locationPrecision: "CITY",
    showOnlineStatus: true,
    showDistance: true,
    allowDirectMessages: true,
    requireVerificationToMessage: false,
  });

  const [newTagInput, setNewTagInput] = useState({ type: "interest", value: "" });

  const calculateAgeFromDOB = (dobStr: string) => {
    if (!dobStr) return 18;
    const dob = new Date(dobStr);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleDOBChange = (dobStr: string) => {
    const calculated = calculateAgeFromDOB(dobStr);
    setFormData({
      ...formData,
      dateOfBirth: dobStr,
      age: calculated,
    });
  };

  const toggleArrayItem = (field: keyof typeof formData, item: string) => {
    const currentList = (formData[field] as string[]) || [];
    if (currentList.includes(item)) {
      setFormData({
        ...formData,
        [field]: currentList.filter((i) => i !== item),
      });
    } else {
      setFormData({
        ...formData,
        [field]: [...currentList, item],
      });
    }
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  const lookingForOptions = [
    { id: "Dating", label: "Dating & Companionship" },
    { id: "Casual Connection", label: "Casual Connection" },
    { id: "Friendship", label: "Discreet Friendship" },
    { id: "Couples", label: "Couples & Lifestyle" },
    { id: "Social Events", label: "VIP Social Events & Dining" },
    { id: "Online Interaction", label: "Online Interaction" },
    { id: "Creator Followers", label: "Creator Subscribers & Fans" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-left">
      {/* Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel-gold shadow-gold-glow">
          <Sparkles className="w-4 h-4 text-velora-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-velora-gold">
            Profile Creation Wizard • {role} Mode
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-velora-textPrimary">
          Build Your Private Club Profile
        </h1>
        <p className="text-xs text-velora-textSecondary max-w-lg mx-auto">
          Complete your 5-step profile details to tune discovery preferences, establish privacy boundaries, and unlock compatible verified matches.
        </p>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto pt-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                wizardStep >= s ? "bg-gold-gradient shadow-gold-glow" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      <Card variant="goldBorder" className="p-8 sm:p-12">
        {/* STEP 1: Basic Information */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Step 1 of 5: Basic Identity & Location
              </h2>
              <p className="text-xs text-velora-textMuted">
                Identity details, date of birth (strictly 18+), presentation, and geographical location.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Username / Handle"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />

              <Input
                label="Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Date of Birth (Calculated Age: {formData.age} yrs)
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleDOBChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                />
                {formData.age < 18 && (
                  <p className="text-xs text-red-400 font-bold mt-1">You must be 18+ to enter Velora.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Gender Presentation
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl px-4 py-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="COUPLE_MF">Couple (Male & Female)</option>
                  <option value="COUPLE_FF">Couple (Female & Female)</option>
                  <option value="COUPLE_MM">Couple (Male & Male)</option>
                  <option value="NON_BINARY">Non-Binary</option>
                  <option value="TRANSGENDER">Transgender</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Sexual Orientation
                </label>
                <select
                  value={formData.sexualOrientation}
                  onChange={(e) => setFormData({ ...formData, sexualOrientation: e.target.value as any })}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl px-4 py-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                >
                  <option value="BISEXUAL">Bisexual</option>
                  <option value="HETEROSEXUAL">Heterosexual</option>
                  <option value="HOMOSEXUAL">Homosexual</option>
                  <option value="PANSEXUAL">Pansexual</option>
                  <option value="FLUID">Fluid</option>
                  <option value="QUEER">Queer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Relationship Status
                </label>
                <select
                  value={formData.relationshipStatus}
                  onChange={(e) => setFormData({ ...formData, relationshipStatus: e.target.value as any })}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl px-4 py-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                >
                  <option value="SINGLE">Single</option>
                  <option value="ATTACHED">Attached</option>
                  <option value="OPEN_RELATIONSHIP">Open Relationship</option>
                  <option value="COUPLE">Couple</option>
                  <option value="SWINGER">Swinger</option>
                  <option value="POLYAMOROUS">Polyamorous</option>
                </select>
              </div>

              <Input
                label="Country"
                icon={<Globe className="w-4 h-4" />}
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />

              <Input
                label="City / Region"
                icon={<MapPin className="w-4 h-4" />}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            {/* Couple Profile Extra Partner Fields */}
            {(role === "COUPLE" || formData.gender.startsWith("COUPLE")) && (
              <div className="p-6 glass-panel rounded-2xl border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge type="couple" />
                  <h3 className="text-sm font-serif font-bold text-purple-300">Partner Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Partner Name"
                    value={formData.partnerDisplayName}
                    onChange={(e) => setFormData({ ...formData, partnerDisplayName: e.target.value })}
                  />
                  <Input
                    label="Partner Age"
                    type="number"
                    value={formData.partnerAge}
                    onChange={(e) => setFormData({ ...formData, partnerAge: parseInt(e.target.value) || 18 })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                variant="gold"
                className="text-xs uppercase font-bold tracking-wider gap-2"
                disabled={formData.age < 18}
                onClick={() => setWizardStep(2)}
              >
                Step 2: About Me
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: About Me */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Step 2 of 5: About Me & Lifestyle
              </h2>
              <p className="text-xs text-velora-textMuted">
                Craft your luxury profile headline, personal bio, lifestyle passions, and hobbies.
              </p>
            </div>

            <Input
              label="Profile Headline (Short Catchphrase)"
              placeholder="e.g. Art Curator & High-Discretion Private Hostess"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                Biography / Philosophy
              </label>
              <textarea
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-velora-textPrimary placeholder:text-velora-textMuted focus:outline-none focus:border-velora-gold"
              />
            </div>

            {/* Interests & Hobbies Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Lifestyle Passions
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Contemporary Art", "Fine Wine", "Private Aviation", "Yachting", "High Fashion", "Architecture"].map((item) => {
                    const active = formData.interests.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleArrayItem("interests", item)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? "bg-velora-gold/20 text-velora-gold border-velora-gold/60"
                            : "bg-white/5 text-velora-textSecondary border-white/10 hover:border-white/20"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Personal Hobbies
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Classical Piano", "Polo", "Vintage Champagne", "Skiing", "Mixology", "Wellness"].map((item) => {
                    const active = formData.hobbies.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleArrayItem("hobbies", item)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          active
                            ? "bg-purple-500/20 text-purple-300 border-purple-500/60"
                            : "bg-white/5 text-velora-textSecondary border-white/10 hover:border-white/20"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" className="text-xs" onClick={() => setWizardStep(1)}>
                Back
              </Button>
              <Button variant="gold" className="text-xs uppercase font-bold tracking-wider gap-2" onClick={() => setWizardStep(3)}>
                Step 3: Looking For
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Looking For */}
        {wizardStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Step 3 of 5: What Are You Looking For?
              </h2>
              <p className="text-xs text-velora-textMuted">
                Select all connection types that align with your lifestyle goals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lookingForOptions.map((opt) => {
                const isSelected = formData.lookingFor.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleArrayItem("lookingFor", opt.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "glass-panel-gold border-velora-gold shadow-gold-glow"
                        : "glass-panel hover:border-white/20"
                    }`}
                  >
                    <span className="text-xs font-bold text-velora-textPrimary">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-velora-gold" />}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" className="text-xs" onClick={() => setWizardStep(2)}>
                Back
              </Button>
              <Button variant="gold" className="text-xs uppercase font-bold tracking-wider gap-2" onClick={() => setWizardStep(4)}>
                Step 4: Preferences
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Structured Preferences */}
        {wizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Step 4 of 5: Match Preferences & Compatibility
              </h2>
              <p className="text-xs text-velora-textMuted">
                Set parameter weights for discovery recommendations and compatibility scores.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Preferred Age Range ({formData.minAge} - {formData.maxAge} yrs)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={18}
                    max={80}
                    value={formData.maxAge}
                    onChange={(e) => setFormData({ ...formData, maxAge: parseInt(e.target.value) })}
                    className="w-full accent-velora-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Max Radius Distance ({formData.maxDistanceKm} km)
                </label>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={25}
                  value={formData.maxDistanceKm}
                  onChange={(e) => setFormData({ ...formData, maxDistanceKm: parseInt(e.target.value) })}
                  className="w-full accent-velora-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                Preferred Profile Types
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "INDIVIDUAL", label: "Single Individuals" },
                  { id: "COUPLE", label: "Couple Profiles" },
                  { id: "CREATOR", label: "Verified Creators" },
                ].map((type) => {
                  const active = formData.preferredProfileTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleArrayItem("preferredProfileTypes", type.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                        active
                          ? "bg-gold-gradient text-velora-bg font-bold shadow-gold-glow"
                          : "bg-white/5 text-velora-textSecondary border-white/10"
                      }`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" className="text-xs" onClick={() => setWizardStep(3)}>
                Back
              </Button>
              <Button variant="gold" className="text-xs uppercase font-bold tracking-wider gap-2" onClick={() => setWizardStep(5)}>
                Step 5: Privacy & Media Vault
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Privacy Controls & Media Vault */}
        {wizardStep === 5 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Step 5 of 5: Privacy Controls & Media Vault
              </h2>
              <p className="text-xs text-velora-textMuted">
                Manage your public/private photo visibility, location precision, and messaging rules.
              </p>
            </div>

            {/* Privacy Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-5 h-5 text-velora-gold" />
                  <div>
                    <p className="text-xs font-bold text-velora-textPrimary">Public Profile Visibility</p>
                    <p className="text-[11px] text-velora-textMuted">Allow profile to appear in public discovery search</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.publicProfileVisibility}
                  onChange={(e) => setFormData({ ...formData, publicProfileVisibility: e.target.checked })}
                  className="accent-velora-gold w-5 h-5 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs font-bold text-velora-textPrimary">Require ID Verification to Message</p>
                    <p className="text-[11px] text-velora-textMuted">Only allow 100% ID verified adult members to message you</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.requireVerificationToMessage}
                  onChange={(e) => setFormData({ ...formData, requireVerificationToMessage: e.target.checked })}
                  className="accent-velora-gold w-5 h-5 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Media Manager System */}
            <div className="pt-4 border-t border-white/10">
              <MediaManager />
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" className="text-xs" onClick={() => setWizardStep(4)}>
                Back
              </Button>
              <Button variant="gold" size="lg" className="text-xs font-bold uppercase tracking-wider gap-2" onClick={handleFinish}>
                Complete Profile & Enter Marketplace
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
