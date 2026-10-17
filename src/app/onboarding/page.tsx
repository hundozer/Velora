"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ShieldCheck, User, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AreaSelect } from "@/components/profile/AreaSelect";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";
import {
  COUPLE_COMPOSITIONS,
  FIRST_MESSAGE_PERMISSIONS,
  INDIVIDUAL_IDENTITIES,
  LOOKING_FOR,
  ageFromBirthDate,
  onboardingBasicsAreValid,
  relationshipOptionsFor,
  whoIsHereError,
} from "@/lib/onboardingPolicy.mjs";

type ProfileKind = "" | "SINGLE" | "COUPLE";

const TOTAL_STEPS = 5;
const selectClass = "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-textPrimary outline-none transition focus:border-velora-gold/60 focus:ring-1 focus:ring-velora-gold/60";
const chipClass = (selected: boolean) => `rounded-full border px-4 py-2 text-sm transition ${selected ? "border-velora-gold bg-velora-gold/15 text-velora-textPrimary" : "border-white/10 bg-white/5 text-velora-textSecondary hover:border-white/25"}`;
const labelClass = "space-y-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary";
const hintClass = "block text-[11px] font-normal normal-case tracking-normal text-velora-textMuted";

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-velora-textSecondary">{description}</p>
    </div>
  );
}

export default function OnboardingWizardPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profileType, setProfileType] = useState<ProfileKind>("");
  const [gender, setGender] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [partnerDisplayName, setPartnerDisplayName] = useState("");
  const [partnerDateOfBirth, setPartnerDateOfBirth] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [areaId, setAreaId] = useState("");
  const [headline, setHeadline] = useState("");
  const [messagePermission, setMessagePermission] = useState("MEMBERS_ONLY");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState("");

  const age = ageFromBirthDate(dateOfBirth);
  const nicknameError = displayName.length > 0 && (displayName.trim().length < 2 || displayName.trim().length > 80)
    ? "Your nickname must be between 2 and 80 characters."
    : "";
  const birthDateError = dateOfBirth && age === null
    ? "Enter a valid date of birth."
    : age !== null && age < 18
      ? "Intimo is only available to adults aged 18 or older."
      : age !== null && age > 120
        ? "Enter a valid date of birth."
        : "";
  const basicsValid = onboardingBasicsAreValid(displayName, dateOfBirth);
  const whoError = whoIsHereError({ profileType, gender, relationshipStatus, partnerDisplayName, partnerDateOfBirth });
  const partnerAge = ageFromBirthDate(partnerDateOfBirth);
  const partnerBirthDateError = partnerDateOfBirth && partnerAge !== null && partnerAge < 18
    ? "Everyone on a couple profile must be 18 or older."
    : "";
  const intentValid = lookingFor.length > 0 && Boolean(areaId);

  function chooseProfileType(value: Exclude<ProfileKind, "">) {
    setProfileType(value);
    setGender("");
    setRelationshipStatus("");
  }

  function toggleLookingFor(value: string) {
    setLookingFor((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function createProfile() {
    if (!basicsValid || whoError || !intentValid || (sexualOrientation && !sensitiveConsent)) return;
    setSubmitting(true);
    setSubmitError("");
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
          areaId,
          headline: headline.trim(),
          messagePermission,
          sexualOrientation: sexualOrientation || undefined,
          explicitSensitiveDataConsent: Boolean(sexualOrientation && sensitiveConsent),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      // 409: the profile already exists (e.g. a retried submit), so continue to the photo step.
      if (!response.ok && response.status !== 409) throw new Error(payload.error || "We could not create your profile. Please try again.");
      setStep(5);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not create your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadFirstPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setPhotoError("Choose a JPEG, PNG, or WebP image.");
    if (file.size <= 0 || file.size > 15 * 1024 * 1024) return setPhotoError("Choose an image smaller than 15 MB.");
    setPhotoError("");
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
      window.location.replace("/dashboard");
    } catch (error) {
      if (uploadedUrl.startsWith("/api/media/")) {
        await fetch(uploadedUrl, { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
      }
      setPhotoError(error instanceof Error ? error.message : "Your photo could not be uploaded.");
      setPhotoProgress(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-4 py-10 md:py-14">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Step {step} of {TOTAL_STEPS}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
          <div className="h-full bg-gold-gradient transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      <Card variant="goldBorder" className="space-y-7 p-6 md:p-9">
        {step === 1 && (
          <section className="space-y-6">
            <StepHeader title="Create your Intimo identity" description="Choose the name other members will see and confirm that you are an adult." />
            <Input label="Nickname" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="nickname" placeholder="How should members know you?" error={nicknameError} />
            <Input label="Date of birth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} autoComplete="bday" error={birthDateError} />
            <Button className="w-full" size="lg" disabled={!basicsValid} onClick={() => setStep(2)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <StepHeader title="Who's here?" description="One person or a couple, and how you relate. You can change this later." />
            <fieldset className="space-y-3">
              <legend className={labelClass}>Profile type</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["SINGLE", "Individual", "A profile for one person", User],
                  ["COUPLE", "Couple", "A shared profile for two adults", Users],
                ] as const).map(([value, title, description, Icon]) => (
                  <button key={value} type="button" aria-pressed={profileType === value} onClick={() => chooseProfileType(value)} className={`rounded-2xl border p-4 text-left transition ${profileType === value ? "border-velora-gold bg-velora-gold/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                    <Icon className="mb-3 h-5 w-5 text-velora-gold" />
                    <span className="block font-semibold text-velora-textPrimary">{title}</span>
                    <span className="mt-1 block text-xs text-velora-textSecondary">{description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {profileType && (
              <>
                <label className={`block ${labelClass}`}>{profileType === "COUPLE" ? "You are" : "Your identity"}
                  <select className={selectClass} value={gender} onChange={(event) => setGender(event.target.value)}>
                    <option value="">Choose one</option>
                    {(profileType === "COUPLE" ? COUPLE_COMPOSITIONS : INDIVIDUAL_IDENTITIES).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>

                {profileType === "COUPLE" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Partner's nickname" value={partnerDisplayName} onChange={(event) => setPartnerDisplayName(event.target.value)} maxLength={80} placeholder="How members know them" />
                    <Input label="Partner's date of birth" type="date" value={partnerDateOfBirth} onChange={(event) => setPartnerDateOfBirth(event.target.value)} error={partnerBirthDateError} />
                    <p className="text-[11px] text-velora-textMuted sm:col-span-2">We check that your partner is 18+ and keep only their age, never their date of birth.</p>
                  </div>
                )}

                <fieldset className="space-y-3">
                  <legend className={labelClass}>Relationship structure</legend>
                  <div className="flex flex-wrap gap-2">
                    {relationshipOptionsFor(profileType).map((item) => (
                      <button key={item.value} type="button" aria-pressed={relationshipStatus === item.value} onClick={() => setRelationshipStatus(item.value)} className={chipClass(relationshipStatus === item.value)}>{item.label}</button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div className="flex gap-3"><Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button className="flex-1" size="lg" disabled={Boolean(whoError)} onClick={() => setStep(3)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <StepHeader title="What are you open to?" description="Pick everything that fits. This shapes who you see and who sees you." />
            <fieldset className="space-y-3">
              <legend className={labelClass}>Looking for</legend>
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR.map((item) => (
                  <button key={item.value} type="button" aria-pressed={lookingFor.includes(item.value)} onClick={() => toggleLookingFor(item.value)} className={chipClass(lookingFor.includes(item.value))}>{item.label}</button>
                ))}
              </div>
            </fieldset>
            <label className={`block ${labelClass}`}>Your area
              <AreaSelect className={selectClass} value={areaId} onChange={setAreaId} />
              <span className={hintClass}>Members see your district and a rough distance, never your position.</span>
            </label>
            <Input label="Headline (optional)" value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={255} placeholder="A short introduction" />
            <div className="flex gap-3"><Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button className="flex-1" size="lg" disabled={!intentValid} onClick={() => setStep(4)}>Review privacy <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          </section>
        )}

        {step === 4 && (
          <section className="space-y-6">
            <StepHeader title="Your privacy starts protected" description="Your profile is visible to signed-in members only. Sensitive details remain private until you change them." />
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /><div><p className="font-semibold text-velora-textPrimary">Private by default</p><p className="mt-1 text-sm leading-relaxed text-velora-textSecondary">Your exact location is never stored, photos are members-only and reviewed before anyone sees them, and nothing is placed on the public web.</p></div></div>
            </div>
            <fieldset className="space-y-3">
              <legend className={labelClass}>Who can message you first</legend>
              {FIRST_MESSAGE_PERMISSIONS.map((item) => (
                <label key={item.value} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-velora-textSecondary">
                  <input type="radio" name="message-permission" className="h-4 w-4 accent-velora-gold" checked={messagePermission === item.value} onChange={() => setMessagePermission(item.value)} />
                  <span>{item.label}</span>
                </label>
              ))}
            </fieldset>
            <label className={`block ${labelClass}`}>Sexual orientation (optional)
              <select className={selectClass} value={sexualOrientation} onChange={(event) => { setSexualOrientation(event.target.value); if (!event.target.value) setSensitiveConsent(false); }}>
                <option value="">Prefer not to say now</option><option value="BISEXUAL">Bisexual</option><option value="HETEROSEXUAL">Heterosexual</option><option value="HOMOSEXUAL">Homosexual</option><option value="PANSEXUAL">Pansexual</option><option value="FLUID">Fluid</option><option value="QUEER">Queer</option>
              </select>
            </label>
            {sexualOrientation && (
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-velora-textSecondary">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-velora-gold" checked={sensitiveConsent} onChange={(event) => setSensitiveConsent(event.target.checked)} />
                <span>I explicitly consent to Intimo storing this sensitive profile detail. I can remove it or withdraw consent later in Privacy settings.</span>
              </label>
            )}
            {submitError && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{submitError}</p>}
            <div className="flex gap-3"><Button variant="ghost" disabled={submitting} onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button className="flex-1" size="lg" disabled={submitting || Boolean(sexualOrientation && !sensitiveConsent)} onClick={createProfile}>{submitting ? "Creating profile…" : "Create profile"}<CheckCircle2 className="ml-2 h-4 w-4" /></Button></div>
          </section>
        )}

        {step === 5 && (
          <section className="space-y-6">
            <StepHeader title="Add your first photo" description="Profiles with a photo appear in People and get far more replies. A moderator reviews it before other members see it." />
            <label className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-velora-gold/40 bg-velora-gold/5 p-8 text-center transition hover:border-velora-gold ${photoProgress !== null ? "pointer-events-none opacity-70" : ""}`}>
              <Camera className="h-8 w-8 text-velora-gold" />
              <span className="font-semibold text-velora-textPrimary">{photoProgress !== null ? `Uploading… ${photoProgress}%` : "Choose a photo"}</span>
              <span className="text-xs text-velora-textSecondary">JPEG, PNG or WebP, up to 15 MB. Keep it non-explicit; private albums come later.</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoProgress !== null} onChange={uploadFirstPhoto} />
            </label>
            {photoError && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{photoError}</p>}
            <Button variant="ghost" className="w-full" disabled={photoProgress !== null} onClick={() => window.location.replace("/dashboard")}>Skip for now</Button>
          </section>
        )}
      </Card>
    </main>
  );
}
