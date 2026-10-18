"use client";

import React, { useState } from "react";
import { Camera, Heart, User, Users } from "lucide-react";
import { BigButton, BigInput, ChoiceCard, FlowScreen } from "@/components/flow/Flow";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";
import { AREAS } from "@/lib/areas.mjs";
import {
  COUPLE_COMPOSITIONS,
  INDIVIDUAL_IDENTITIES,
  LOOKING_FOR,
  ageFromBirthDate,
  onboardingBasicsAreValid,
  relationshipOptionsFor,
  whoIsHereError,
} from "@/lib/onboardingPolicy.mjs";

type ProfileKind = "" | "SINGLE" | "COUPLE";
type StepId = "kind" | "identity" | "relationship" | "name" | "birthday" | "partner" | "looking" | "area" | "photo";

// One question per screen. Message permission, orientation and headline keep
// their safe defaults here and live in Privacy Center / profile editing.
function stepsFor(kind: ProfileKind): StepId[] {
  return ["kind", "identity", "relationship", "name", "birthday", ...(kind === "COUPLE" ? ["partner" as const] : []), "looking", "area", "photo"];
}

function birthdayError(value: string, who: "you" | "partner") {
  if (!value) return "";
  const age = ageFromBirthDate(value);
  if (age === null || age > 120) return "Enter a real date.";
  if (age < 18) return who === "you" ? "Intimo is only available to adults aged 18 or older." : "Both of you must be 18 or older.";
  return "";
}

export default function OnboardingPage() {
  const [step, setStep] = useState<StepId>("kind");
  const [profileType, setProfileType] = useState<ProfileKind>("");
  const [gender, setGender] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [partnerDisplayName, setPartnerDisplayName] = useState("");
  const [partnerDateOfBirth, setPartnerDateOfBirth] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [areaId, setAreaId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);

  React.useEffect(() => { window.scrollTo(0, 0); }, [step]);

  const steps = stepsFor(profileType);
  const index = steps.indexOf(step);
  const next = () => { setError(""); setStep(steps[index + 1]); };
  const back = index > 0 && step !== "photo" ? () => { setError(""); setStep(steps[index - 1]); } : undefined;
  const screen = { step: index + 1, total: steps.length, onBack: back };

  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 80;
  const basicsValid = onboardingBasicsAreValid(displayName, dateOfBirth);
  const partnerValid = !whoIsHereError({ profileType, gender, relationshipStatus, partnerDisplayName, partnerDateOfBirth });

  async function createProfile(area: string) {
    setAreaId(area);
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/profile/me", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          dateOfBirth,
          profileType,
          gender,
          relationshipStatus,
          ...(profileType === "COUPLE" ? { partnerDisplayName: partnerDisplayName.trim(), partnerDateOfBirth } : {}),
          lookingFor,
          areaId: area,
          headline: "",
          messagePermission: "MEMBERS_ONLY",
          explicitSensitiveDataConsent: false,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      // 409: the profile already exists (a retried submit), so carry on.
      if (!response.ok && response.status !== 409) throw new Error(payload.error || "That didn't work. Try again.");
      setStep("photo");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That didn't work. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setError("Use a JPEG, PNG or WebP photo.");
    if (file.size <= 0 || file.size > 15 * 1024 * 1024) return setError("Use a photo under 15 MB.");
    setError("");
    setPhotoProgress(0);
    let uploadedUrl = "";
    try {
      const declaration = await requestParticipantDeclaration();
      const result = await uploadFileToR2(file, "avatars", setPhotoProgress, declaration, "MEMBERS_ONLY", "NON_EXPLICIT");
      uploadedUrl = result.publicUrl;
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { avatarUrl: result.publicUrl } }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Your photo could not be saved.");
      window.location.replace("/");
    } catch (failure) {
      if (uploadedUrl.startsWith("/api/media/")) await fetch(uploadedUrl, { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
      setError(failure instanceof Error ? failure.message : "Your photo could not be uploaded.");
      setPhotoProgress(null);
    }
  }

  const errorLine = error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-5 py-4 text-base text-red-200">{error}</p> : null;

  if (step === "kind") return (
    <FlowScreen {...screen} title="Who's joining?">
      <ChoiceCard icon={<User className="h-7 w-7" />} label="Just me" selected={profileType === "SINGLE"} onClick={() => { if (profileType !== "SINGLE") { setGender(""); setRelationshipStatus(""); } setProfileType("SINGLE"); setStep("identity"); }} />
      <ChoiceCard icon={<Users className="h-7 w-7" />} label="We're a couple" selected={profileType === "COUPLE"} onClick={() => { if (profileType !== "COUPLE") { setGender(""); setRelationshipStatus(""); } setProfileType("COUPLE"); setStep("identity"); }} />
    </FlowScreen>
  );

  if (step === "identity") return (
    <FlowScreen {...screen} title={profileType === "COUPLE" ? "You are…" : "I am a…"}>
      {(profileType === "COUPLE" ? COUPLE_COMPOSITIONS : INDIVIDUAL_IDENTITIES).map((item) => (
        <ChoiceCard key={item.value} label={item.label} selected={gender === item.value} onClick={() => { setGender(item.value); next(); }} />
      ))}
    </FlowScreen>
  );

  if (step === "relationship") return (
    <FlowScreen {...screen} title={profileType === "COUPLE" ? "Your relationship" : "Your situation"}>
      {relationshipOptionsFor(profileType).map((item) => (
        <ChoiceCard key={item.value} label={item.label} selected={relationshipStatus === item.value} onClick={() => { setRelationshipStatus(item.value); next(); }} />
      ))}
    </FlowScreen>
  );

  if (step === "name") return (
    <FlowScreen {...screen} title={profileType === "COUPLE" ? "Your nickname" : "What should we call you?"} action={<BigButton disabled={!nameValid} onClick={next}>Continue</BigButton>}>
      <form onSubmit={(event) => { event.preventDefault(); if (nameValid) next(); }}>
        <BigInput label="Nickname" autoFocus value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="nickname" placeholder="e.g. Nina" />
      </form>
    </FlowScreen>
  );

  if (step === "birthday") return (
    <FlowScreen {...screen} title="Your birthday" action={<BigButton disabled={!basicsValid} onClick={next}>Continue</BigButton>}>
      <BigInput label="Date of birth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} autoComplete="bday" error={birthdayError(dateOfBirth, "you")} />
      <p className="text-base text-velora-textMuted">Members see your age, never the date.</p>
    </FlowScreen>
  );

  if (step === "partner") return (
    <FlowScreen {...screen} title="Your partner" action={<BigButton disabled={!partnerValid} onClick={next}>Continue</BigButton>}>
      <div className="space-y-5">
        <BigInput label="Their nickname" value={partnerDisplayName} onChange={(event) => setPartnerDisplayName(event.target.value)} maxLength={80} placeholder="e.g. Tom" />
        <BigInput label="Their date of birth" type="date" value={partnerDateOfBirth} onChange={(event) => setPartnerDateOfBirth(event.target.value)} error={birthdayError(partnerDateOfBirth, "partner")} />
      </div>
    </FlowScreen>
  );

  if (step === "looking") return (
    <FlowScreen {...screen} title="What are you looking for?" action={<BigButton disabled={lookingFor.length === 0} onClick={next}>Continue</BigButton>}>
      <p className="-mt-4 text-base text-velora-textMuted">Pick as many as you like.</p>
      {LOOKING_FOR.map((item) => (
        <ChoiceCard key={item.value} compact label={item.label} selected={lookingFor.includes(item.value)} onClick={() => setLookingFor((current) => current.includes(item.value) ? current.filter((value) => value !== item.value) : [...current, item.value])} />
      ))}
    </FlowScreen>
  );

  if (step === "area") return (
    <FlowScreen {...screen} title="Where are you?">
      {errorLine}
      {submitting && <p role="status" className="text-lg text-velora-textSecondary">Creating your profile…</p>}
      <div className={`grid grid-cols-2 gap-3 ${submitting ? "pointer-events-none opacity-50" : ""}`}>
        {AREAS.filter((area) => area.kind === "PRAGUE_DISTRICT").map((area) => (
          <button key={area.id} type="button" aria-pressed={areaId === area.id} onClick={() => createProfile(area.id)} className={`min-h-20 rounded-3xl border-2 px-4 py-3 text-left transition active:scale-[0.98] ${areaId === area.id ? "border-velora-gold bg-velora-gold/15" : "border-white/10 bg-white/[0.04] hover:border-white/30"}`}>
            <span className="block text-lg font-semibold text-velora-textPrimary">{area.name}</span>
            <span className="block truncate text-sm text-velora-textMuted">{area.label}</span>
          </button>
        ))}
      </div>
      <div className={`space-y-3 pt-3 ${submitting ? "pointer-events-none opacity-50" : ""}`}>
        {AREAS.filter((area) => area.kind !== "PRAGUE_DISTRICT").map((area) => (
          <ChoiceCard key={area.id} compact label={area.name} selected={areaId === area.id} onClick={() => createProfile(area.id)} />
        ))}
      </div>
    </FlowScreen>
  );

  return (
    <FlowScreen step={steps.length} total={steps.length} title="Add a photo">
      <label className={`flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-velora-gold/50 bg-velora-gold/5 transition hover:border-velora-gold ${photoProgress !== null ? "pointer-events-none" : ""}`}>
        {photoProgress !== null
          ? <span className="text-3xl font-bold text-velora-textPrimary">{photoProgress}%</span>
          : <><Camera className="h-14 w-14 text-velora-gold" /><span className="text-2xl font-semibold text-velora-textPrimary">Choose a photo</span></>}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoProgress !== null} onChange={uploadPhoto} />
      </label>
      <p className="flex items-center gap-2 text-base text-velora-textMuted"><Heart className="h-4 w-4 text-velora-gold" aria-hidden />Members only. Keep it non-explicit.</p>
      {errorLine}
      <button type="button" disabled={photoProgress !== null} onClick={() => window.location.replace("/")} className="w-full py-4 text-lg font-semibold text-velora-textSecondary hover:text-velora-textPrimary">Skip for now</button>
    </FlowScreen>
  );
}
