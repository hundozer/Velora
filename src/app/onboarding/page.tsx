"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Sparkles,
  MapPin,
  Heart,
  Shield,
  Upload,
  CheckCircle2,
  ArrowRight,
  Sliders,
  EyeOff,
  UserCheck,
  Lock,
} from "lucide-react";

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, profile, role } = useAuth();

  const [wizardStep, setWizardStep] = useState<number>(1);

  const [profileData, setProfileData] = useState({
    displayName: profile?.displayName || "Elena Vance",
    age: profile?.age || 26,
    gender: profile?.gender || "FEMALE",
    sexualOrientation: profile?.sexualOrientation || "BISEXUAL",
    location: profile?.location || "London / Monaco",
    partnerDisplayName: profile?.partnerDisplayName || "Sophia",
    partnerAge: profile?.partnerAge || 28,
    bio: profile?.bio || "Art curator, luxury lifestyle collector & private salon host.",
    interests: profile?.interests || ["Contemporary Art", "Fine Wine", "Private Aviation"],
    lookingFor: profile?.lookingFor || ["Discreet Connections", "Fine Dining"],
    showOnlineStatus: true,
    showDistance: true,
    requireVerificationToMessage: false,
  });

  const [newInterestInput, setNewInterestInput] = useState("");

  const handleAddInterest = () => {
    if (newInterestInput.trim() && !profileData.interests.includes(newInterestInput.trim())) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, newInterestInput.trim()],
      });
      setNewInterestInput("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setProfileData({
      ...profileData,
      interests: profileData.interests.filter((i) => i !== interest),
    });
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Wizard Header */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel-gold">
          <Sparkles className="w-3.5 h-3.5 text-velora-gold" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-velora-gold">
            Profile Creation Wizard • {role} Mode
          </span>
        </div>
        <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
          Customize Your Luxury Profile
        </h1>
        <p className="text-xs text-velora-textSecondary max-w-lg mx-auto">
          Complete your profile details to customize discovery preferences and unlock verified member matches.
        </p>

        {/* Progress Bar */}
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto pt-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
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
                1. Basic Identity & Location
              </h2>
              <p className="text-xs text-velora-textMuted">
                Specify your public presentation and primary region.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Display Name"
                value={profileData.displayName}
                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
              />

              <Input
                label="Primary Location (City / Country)"
                icon={<MapPin className="w-4 h-4" />}
                value={profileData.location}
                onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={profileData.age}
                  onChange={(e) => setProfileData({ ...profileData, age: parseInt(e.target.value) || 18 })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-velora-textPrimary focus:outline-none focus:border-velora-gold/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Gender Presentation
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({ ...profileData, gender: e.target.value as any })}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl px-4 py-3 text-sm text-velora-textPrimary focus:outline-none focus:border-velora-gold/60"
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
            </div>

            {/* Couple Specific Additional Fields */}
            {(role === "COUPLE" || profileData.gender.startsWith("COUPLE")) && (
              <div className="p-6 glass-panel rounded-2xl border border-purple-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge type="couple" />
                  <h3 className="text-sm font-serif font-bold text-purple-300">Partner Details</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Partner Name"
                    value={profileData.partnerDisplayName}
                    onChange={(e) => setProfileData({ ...profileData, partnerDisplayName: e.target.value })}
                  />
                  <Input
                    label="Partner Age"
                    type="number"
                    value={profileData.partnerAge}
                    onChange={(e) => setProfileData({ ...profileData, partnerAge: parseInt(e.target.value) || 18 })}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button variant="gold" className="text-xs uppercase font-bold tracking-wider gap-2" onClick={() => setWizardStep(2)}>
                Next: Preferences
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Orientation & Preferences */}
        {wizardStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                2. Orientation & Looking For
              </h2>
              <p className="text-xs text-velora-textMuted">
                Tune discovery matching parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Sexual Orientation
                </label>
                <select
                  value={profileData.sexualOrientation}
                  onChange={(e) => setProfileData({ ...profileData, sexualOrientation: e.target.value as any })}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl px-4 py-3 text-sm text-velora-textPrimary focus:outline-none focus:border-velora-gold/60"
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
                  Primary Connection Intent
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {["Discreet Connections", "Fine Dining", "Travel Partner", "Couples", "Private Parties"].map((tag) => {
                    const selected = profileData.lookingFor.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setProfileData({
                              ...profileData,
                              lookingFor: profileData.lookingFor.filter((t) => t !== tag),
                            });
                          } else {
                            setProfileData({
                              ...profileData,
                              lookingFor: [...profileData.lookingFor, tag],
                            });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selected
                            ? "bg-velora-gold/20 text-velora-gold border-velora-gold/60"
                            : "bg-white/5 text-velora-textSecondary border-white/10 hover:border-white/20"
                        }`}
                      >
                        {tag}
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
                Next: Bio & Lifestyle
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Bio & Interests */}
        {wizardStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                3. Bio & Interest Tags
              </h2>
              <p className="text-xs text-velora-textMuted">
                Express your lifestyle, taste, and conversation hooks.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                Personal Bio
              </label>
              <textarea
                rows={4}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-velora-textPrimary placeholder:text-velora-textMuted focus:outline-none focus:border-velora-gold/60"
                placeholder="Share your interests, travel plans, and discreet preferences..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                Lifestyle & Passions
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add passion (e.g. Yachting, Fine Art)"
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInterest())}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                />
                <Button variant="glass" size="sm" onClick={handleAddInterest}>
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profileData.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/10 text-velora-gold border border-white/10"
                  >
                    {interest}
                    <button
                      onClick={() => handleRemoveInterest(interest)}
                      className="text-velora-textMuted hover:text-red-400 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" className="text-xs" onClick={() => setWizardStep(2)}>
                Back
              </Button>
              <Button variant="gold" className="text-xs uppercase font-bold tracking-wider gap-2" onClick={() => setWizardStep(4)}>
                Next: Privacy & Media
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Privacy Settings & Media Preview */}
        {wizardStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                4. Privacy Controls & Media Vault
              </h2>
              <p className="text-xs text-velora-textMuted">
                Set visibility restrictions and manage your public & private photos.
              </p>
            </div>

            {/* Privacy Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
                <div className="flex items-center gap-3">
                  <EyeOff className="w-5 h-5 text-velora-gold" />
                  <div>
                    <p className="text-xs font-bold text-velora-textPrimary">Show Online Active Indicator</p>
                    <p className="text-[11px] text-velora-textMuted">Allow compatible members to see when you are online</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.showOnlineStatus}
                  onChange={(e) => setProfileData({ ...profileData, showOnlineStatus: e.target.checked })}
                  className="accent-velora-gold w-5 h-5 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 glass-panel rounded-2xl">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs font-bold text-velora-textPrimary">Require ID Verification to Message</p>
                    <p className="text-[11px] text-velora-textMuted">Only allow verified adult members to send direct messages</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={profileData.requireVerificationToMessage}
                  onChange={(e) => setProfileData({ ...profileData, requireVerificationToMessage: e.target.checked })}
                  className="accent-velora-gold w-5 h-5 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Photo Vault Placeholder */}
            <div className="p-6 glass-panel rounded-2xl border border-dashed border-velora-gold/30 text-center space-y-3">
              <Upload className="w-8 h-8 text-velora-gold mx-auto" />
              <div>
                <p className="text-xs font-bold text-velora-textPrimary">Upload Profile & Private Vault Photos</p>
                <p className="text-[11px] text-velora-textMuted mt-0.5">
                  Drag & drop images here or browse. Photos can be set to Public, Private Unlock, or Subscriber Only.
                </p>
              </div>
              <Button variant="glass" size="sm" className="mt-2">
                Select Photo Files
              </Button>
            </div>

            <div className="flex justify-between pt-6 border-t border-white/10">
              <Button variant="ghost" className="text-xs" onClick={() => setWizardStep(3)}>
                Back
              </Button>
              <Button variant="gold" size="lg" className="text-xs uppercase font-bold tracking-wider gap-2" onClick={handleFinish}>
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
