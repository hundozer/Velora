"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LOCATION_DATA } from "@/lib/locationData";
import { useAuth } from "@/context/AuthContext";
import { User as UserType, UserRole, Profile as ProfileType } from "@/types";
import { Sparkles, ArrowRight, CheckCircle2, Heart, ShieldCheck, Compass, User, Users, Crown, Camera, Flame } from "lucide-react";

function ageFromBirthDate(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getDate() !== day
  ) return null;

  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age -= 1;
  return age;
}

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [profileType, setProfileType] = useState<"SINGLE" | "COUPLE" | "CREATOR" | "LIFESTYLE">("SINGLE");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Friends with Benefits", "Casual Chatting"]);
  const [gender, setGender] = useState("FEMALE");
  const [sexualOrientation, setSexualOrientation] = useState("BISEXUAL");
  const [country, setCountry] = useState("Czech Republic");
  const [city, setCity] = useState("Prague");
  const [headline, setHeadline] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [expressedCreatorIntent, setExpressedCreatorIntent] = useState(true);
  const [explicitSensitiveDataConsent, setExplicitSensitiveDataConsent] = useState(false);

  // Optional Intimate Preferences & Sex Hobbies
  const [pubicHairGrooming, setPubicHairGrooming] = useState<string>("Trimmed");
  const [piercing, setPiercing] = useState<string>("Yes");
  const [tattoo, setTattoo] = useState<string>("Multiple");
  const [selectedSexHobbies, setSelectedSexHobbies] = useState<string[]>(["Sensual Massage", "Oral Pleasure"]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>(["Doggy", "Cowgirl"]);

  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80");
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newUrls = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
      setGalleryPhotos((prev) => [...prev, ...newUrls]);
    }
  };

  const toggleInterest = (item: string) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const toggleHobby = (item: string) => {
    if (selectedSexHobbies.includes(item)) {
      setSelectedSexHobbies(selectedSexHobbies.filter((i) => i !== item));
    } else {
      setSelectedSexHobbies([...selectedSexHobbies, item]);
    }
  };

  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const nicknameIsValid = displayName.trim().length >= 2 && displayName.trim().length <= 80;
  const enteredAge = ageFromBirthDate(dateOfBirth);
  const birthDateIsValid = enteredAge !== null && enteredAge >= 18 && enteredAge <= 120;

  const handleFinish = async () => {
    setSubmitting(true);
    setSubmitError("");
    const userId = user?.id || "";
    const userEmail = user?.email || "";
    const userRole: UserRole = profileType === "CREATOR" ? "CREATOR" : profileType === "COUPLE" ? "COUPLE" : "MEMBER";
    const finalName = displayName.trim() || userEmail.split("@")[0] || "Intimo Member";
    const finalCity = city.trim();
    const finalCountry = country.trim();
    const formattedLoc = [finalCity, finalCountry].filter(Boolean).join(", ");

    const newUser: UserType = {
      id: userId,
      email: userEmail,
      username: finalName.toLowerCase().replace(/\s+/g, "_"),
      role: userRole,
      memberTier: "FREE",
      verificationStatus: "VERIFIED",
      verificationLevel: "LEVEL_1_EMAIL",
      createdAt: new Date().toISOString().split("T")[0],
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    };

    const newProfile: ProfileType = {
      id: `prof-${Date.now()}`,
      userId: userId,
      displayName: finalName,
      dateOfBirth,
      age: 18,
      gender: gender as any,
      sexualOrientation: sexualOrientation as any,
      country: finalCountry,
      city: finalCity,
      location: formattedLoc,
      languages: ["English"],
      headline: headline || "Private Intimo Member Profile",
      bio: headline || "Discreet, open-minded member exploring connections on Intimo.",
      interests: selectedInterests.length ? selectedInterests : ["Friends with Benefits"],
      lifestyleTags: ["Discreet", "Luxury Lifestyle"],
      hobbies: selectedSexHobbies,
      relationshipStatus: "SINGLE",
      lookingFor: ["Connections"],
      isCoupleProfile: profileType === "COUPLE",
      publicProfileVisibility: true,
      photoVisibilityDefault: "PUBLIC",
      locationPrecision: "CITY",
      showOnlineStatus: true,
      showDistance: true,
      allowDirectMessages: true,
      requireVerificationToMessage: false,
      verified: true,
      isOnline: true,
      compatibilityScore: 98,
      avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      coverPhotoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      galleryImages: galleryPhotos.map((url, idx) => ({
        id: `med-${Date.now()}-${idx}`,
        userId: userId,
        type: "IMAGE",
        url: url,
        visibility: "PUBLIC",
        createdAt: new Date().toISOString(),
      })),
    };

    try {
      const response = await fetch("/api/profile/me", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileType, displayName: finalName, dateOfBirth, gender, sexualOrientation,
          country: finalCountry, city: finalCity, headline, interests: selectedInterests,
          hobbies: selectedSexHobbies, positions: selectedPositions, pubicHairGrooming,
          piercing, tattoo, avatarUrl: avatarUrl.startsWith("https://") ? avatarUrl : undefined,
          expressedCreatorIntent,
          explicitSensitiveDataConsent,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Profile creation failed");
      const created = payload.profile;
      newUser.id = created.auth_id;
      newUser.email = created.email;
      newUser.role = created.role;
      newUser.memberTier = created.member_tier;
      newUser.verificationLevel = created.verification_level;
      newProfile.id = created.id;
      newProfile.userId = created.auth_id;
      newProfile.age = created.age;
      updateUserProfile(newUser, newProfile);
      router.push("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Profile creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-left space-y-8">
      {/* Step Indicator Bar */}
      <div className="space-y-2 text-center">
        <span className="text-xs font-mono uppercase tracking-widest text-velora-gold">
          Step {step} of 6 • Enter Intimo Adults-Only Community
        </span>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            style={{ width: `${(step / 6) * 100}%` }}
            className="h-full bg-gold-gradient transition-all duration-500 shadow-gold-glow"
          />
        </div>
      </div>

      <Card variant="goldBorder" className="p-8 space-y-6">
        {/* STEP 1: CHOOSE PROFILE TYPE */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              1. Choose Your Profile Type
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Select how you would like to participate in the Intimo adult social marketplace.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { id: "SINGLE", title: "Single Member", desc: "Individual profile", icon: User },
                { id: "COUPLE", title: "Couple Profile", desc: "Couples exploring together", icon: Users },
                { id: "CREATOR", title: "Creator & Host", desc: "Content & live salons", icon: Crown },
                { id: "LIFESTYLE", title: "Lifestyle Member", desc: "Open-minded experiences", icon: Sparkles },
              ].map((item) => {
                const isSelected = profileType === item.id;
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProfileType(item.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold shadow-gold-glow"
                        : "glass-panel text-velora-textMuted hover:text-white"
                    }`}
                  >
                    <IconComp className="w-5 h-5 mb-2" />
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{item.desc}</div>
                  </button>
                );
              })}
            </div>

            {profileType === "CREATOR" && (
              <div className="p-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 space-y-4 text-left">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Free Creator Mode
                </div>
                <p className="text-xs text-velora-textSecondary leading-relaxed">
                  Creator profiles, free content, followers, communities and free live experiences remain part of the MVP. Charging users, tips and payouts are disabled.
                </p>

                <label className="flex items-center gap-2 pt-2 cursor-pointer border-t border-white/10">
                  <input
                    type="checkbox"
                    checked={expressedCreatorIntent}
                    onChange={(e) => setExpressedCreatorIntent(e.target.checked)}
                    className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  />
                  <span className="text-xs text-amber-200 font-bold">
                    Enable free Creator Mode for this profile
                  </span>
                </label>
              </div>
            )}

            <div className="pt-3 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
                Your Private Nickname / Display Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Lucas, Monaco Host, Valerie Night"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-xs"
                required
                minLength={2}
                maxLength={80}
                aria-invalid={!nicknameIsValid}
              />
              <p className="text-[10px] text-velora-textMuted">
                This nickname will represent your private identity to verified members on Intimo.
              </p>
              {!nicknameIsValid && (
                <p className="text-[11px] text-amber-300" role="alert">
                  Enter a nickname between 2 and 80 characters to continue.
                </p>
              )}
            </div>

            <Button
              variant="gold"
              className="w-full text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
              onClick={() => setStep(2)}
              disabled={!nicknameIsValid}
            >
              <span>Next: Define Interests</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: DEFINE WHAT YOU ARE INTERESTED IN */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              2. Define What You Are Interested In
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Be open about what you are looking for. Select all that apply.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                "Friends with Benefits",
                "Couple Encounters",
                "Threesomes",
                "BDSM Encounter",
                "Casual Chatting",
                "Videochat",
              ].map((item) => {
                const isSelected = selectedInterests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInterest(item)}
                    className={`p-3.5 rounded-2xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold shadow-gold-glow"
                        : "glass-panel text-velora-textMuted hover:text-white"
                    }`}
                  >
                    {item} {isSelected ? "✓" : ""}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="gold"
                className="w-2/3 text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
                onClick={() => setStep(3)}
              >
                <span>Next: Demographics & Location</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: DEMOGRAPHICS & LOCATION */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              3. Gender, Sexual Orientation & Location
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Provide your identity details to ensure transparent discovery matches.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="COUPLE_MF">Couple (M & F)</option>
                  <option value="NON_BINARY">Non-Binary</option>
                  <option value="TRANSGENDER">Transgender</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  Sexual Orientation
                </label>
                <select
                  value={sexualOrientation}
                  onChange={(e) => setSexualOrientation(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
                >
                  <option value="BISEXUAL">Bisexual</option>
                  <option value="HETEROSEXUAL">Heterosexual (Straight)</option>
                  <option value="HOMOSEXUAL">Homosexual (Gay/Lesbian)</option>
                  <option value="PANSEXUAL">Pansexual</option>
                  <option value="FLUID">Fluid / Open</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Date of Birth (18+ required)
              </label>
              <Input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                required
                aria-invalid={!birthDateIsValid}
              />
              {!dateOfBirth && (
                <p className="mt-2 text-[11px] text-amber-300" role="alert">
                  Enter your date of birth to continue.
                </p>
              )}
              {dateOfBirth && enteredAge !== null && enteredAge < 18 && (
                <p className="mt-2 text-[11px] text-red-400" role="alert">
                  Intimo is only available to adults aged 18 or older.
                </p>
              )}
              {dateOfBirth && (enteredAge === null || enteredAge > 120) && (
                <p className="mt-2 text-[11px] text-red-400" role="alert">
                  Enter a valid date of birth.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    setCountry(newCountry);
                    const availableCities = LOCATION_DATA.getCitiesForCountry(newCountry);
                    setCity(availableCities[0] || "");
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
                >
                  {LOCATION_DATA.COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  City
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold font-mono"
                >
                  {LOCATION_DATA.getCitiesForCountry(country).map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Profile Headline
              </label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Outgoing & open-minded" />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="gold"
                className="w-2/3 text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
                onClick={() => setStep(4)}
                disabled={!birthDateIsValid}
              >
                <span>Next: Intimate Preferences (Optional)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: OPTIONAL INTIMATE PREFERENCES & SEX HOBBIES */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
                <Flame className="w-6 h-6 text-velora-gold" /> 4. Intimate Preferences & Sex Hobbies
              </h2>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                Optional
              </span>
            </div>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              You can optionally fill out your grooming, piercings, tattoos, and sex hobbies to find compatible members.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">Pubic Hair</label>
                <select
                  value={pubicHairGrooming}
                  onChange={(e) => setPubicHairGrooming(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-velora-textPrimary"
                >
                  <option value="Natural">Natural</option>
                  <option value="Trimmed">Trimmed</option>
                  <option value="Shaved">Shaved</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">Piercing</label>
                <select
                  value={piercing}
                  onChange={(e) => setPiercing(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-velora-textPrimary"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Multiple">Multiple</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-velora-textMuted mb-1">Tattoo</label>
                <select
                  value={tattoo}
                  onChange={(e) => setTattoo(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-velora-textPrimary"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="Multiple">Multiple</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                Sex Hobbies & Fetishes (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Oral Pleasure",
                  "Anal",
                  "Piss / Watersports",
                  "Sensual Massage",
                  "BDSM",
                  "Roleplay",
                  "Fetish",
                  "Exhibitionism",
                  "Swapping",
                  "Adult Toys",
                  "Shibari",
                  "Voyeurism",
                ].map((item) => {
                  const isSelected = selectedSexHobbies.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleHobby(item)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        isSelected
                          ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold shadow-gold-glow"
                          : "glass-panel text-velora-textMuted hover:text-white"
                      }`}
                    >
                      {item} {isSelected ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                variant="gold"
                className="w-2/3 text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
                onClick={() => setStep(5)}
              >
                <span>Next: Add Photos</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: ADD PHOTOS */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              5. Add Profile & Gallery Photos
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Upload clear photos from your device to present your persona to the community.
            </p>

            {/* Hidden Native File Inputs */}
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileSelect}
            />
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryFileSelect}
            />

            {/* Avatar Photo Selector */}
            <div className="flex flex-col items-center space-y-4 pt-2">
              <div className="w-32 h-32 rounded-3xl border-2 border-velora-gold overflow-hidden bg-velora-card relative shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
              </div>
              <Button
                variant="glass"
                size="sm"
                className="text-xs gap-1.5 border-velora-gold/40 text-velora-gold hover:bg-velora-gold/10"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 text-velora-gold" /> Select Main Avatar Photo
              </Button>
            </div>

            {/* Public Gallery Photos Uploader */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
                  Public Gallery Photos ({galleryPhotos.length})
                </label>
                <Button
                  variant="gold"
                  size="sm"
                  className="text-[11px] font-bold py-1 px-3"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  + Add Photos
                </Button>
              </div>

              {galleryPhotos.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {galleryPhotos.map((url, idx) => (
                    <div key={idx} className="h-20 rounded-xl overflow-hidden bg-velora-card border border-white/10 relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-white/15 text-center cursor-pointer hover:border-velora-gold/40 transition-colors"
                >
                  <Camera className="w-6 h-6 text-velora-textMuted mx-auto mb-1" />
                  <p className="text-xs text-velora-textMuted">Click here to select photos from your device</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(4)}>
                Back
              </Button>
              <Button
                variant="gold"
                className="w-2/3 text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
                onClick={() => setStep(6)}
              >
                <span>Next: Start Exploring</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: START EXPLORING */}
        {step === 6 && (
          <div className="space-y-6 text-center">
            <ShieldCheck className="w-12 h-12 text-velora-gold mx-auto" />
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              Your Adult Identity is Ready
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed max-w-md mx-auto">
              Welcome to Intimo. Start exploring open-minded adults nearby, viewing private profiles, and connecting.
            </p>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-left cursor-pointer">
              <input
                type="checkbox"
                checked={explicitSensitiveDataConsent}
                onChange={(event) => setExplicitSensitiveDataConsent(event.target.checked)}
                className="mt-0.5 w-4 h-4 accent-emerald-400"
              />
              <span className="text-xs text-velora-textSecondary leading-relaxed">
                I explicitly consent to Intimo processing the sexual orientation and intimate preferences I provide to operate my profile and discovery. This is separate from accepting general terms. I can withdraw this consent in the Privacy Center; withdrawal may limit these features.
              </span>
            </label>

            <Button
              variant="gold"
              size="lg"
              className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-gold-glow flex items-center justify-center gap-2"
              onClick={handleFinish}
              disabled={submitting || !dateOfBirth || displayName.trim().length < 2 || !explicitSensitiveDataConsent}
            >
              <Compass className="w-4 h-4" />
              <span>{submitting ? "Creating Profile..." : "Start Exploring Members"}</span>
            </Button>
            {(!dateOfBirth || displayName.trim().length < 2) && (
              <p className="text-xs text-amber-300" role="alert">
                {!dateOfBirth && displayName.trim().length < 2
                  ? "A nickname and date of birth are required. Go back to complete them."
                  : !dateOfBirth
                    ? "A date of birth is required. Go back to complete it."
                    : "A nickname of at least two characters is required. Go back to complete it."}
              </p>
            )}
            <Button variant="ghost" className="w-full text-xs" onClick={() => setStep(5)} disabled={submitting}>
              Back to profile details
            </Button>
            {submitError && <p className="text-xs text-red-400" role="alert">{submitError}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
