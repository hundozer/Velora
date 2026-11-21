"use client";

import { useTranslation } from "@/context/LanguageContext";
import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

function OnboardingForm() {
  const { t } = useTranslation();
  const inviteToken = useSearchParams().get("invite") || "";
  const validInviteLink = /^[a-zA-Z0-9_-]{43}$/.test(inviteToken);
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
  const [areaGroup, setAreaGroup] = useState<"prague" | "nearby" | "elsewhere">("prague");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = React.useRef(false);
  const [error, setError] = useState("");
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [savedDraft, setSavedDraft] = useState<Record<string, unknown> | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");

  React.useEffect(() => { window.scrollTo(0, 0); }, [step]);
  React.useEffect(() => {
    if (!validInviteLink) return;
    const controller = new AbortController();
    fetch("/api/onboarding/draft", { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(data => {
        if (controller.signal.aborted || !data) return;
        setDraftAvailable(true);
        if (data.draft) setSavedDraft(data.draft);
      }).catch(() => { /* Draft saving is optional; never block standard onboarding. */ });
    return () => controller.abort();
  }, [validInviteLink]);
  function restoreDraft() {
    if (!savedDraft) return;
    const d = savedDraft;
    const val = (key: string) => typeof d[key] === "string" ? d[key] as string : "";
    const kind = val("profileType") === "COUPLE" ? "COUPLE" : val("profileType") === "SINGLE" ? "SINGLE" : "";
    setProfileType(kind); setGender(val("gender")); setRelationshipStatus(val("relationshipStatus"));
    setDisplayName(val("displayName")); setDateOfBirth(val("dateOfBirth"));
    setPartnerDisplayName(val("partnerDisplayName")); setPartnerDateOfBirth(val("partnerDateOfBirth"));
    setLookingFor(Array.isArray(d.lookingFor) ? d.lookingFor.filter((v): v is string => typeof v === "string") : []);
    setAreaId(val("areaId"));
    const area = AREAS.find(a => a.id === val("areaId"));
    if (area) setAreaGroup(area.kind === "PRAGUE_DISTRICT" ? "prague" : area.kind === "NEAR_PRAGUE" ? "nearby" : "elsewhere");
    const candidate = val("step");
    setStep((candidate && ["kind", "identity", "relationship", "name", "birthday", "partner", "looking", "area"].includes(candidate))
      ? candidate as StepId : "kind");
    setSavedDraft(null);
    setDraftNotice("Your saved answers have been restored. Review them before continuing.");
  }
  async function saveDraft() {
    if (draftBusy) return;
    setDraftBusy(true); setDraftNotice("");
    try {
      const draft = { step, profileType, gender, relationshipStatus, displayName, dateOfBirth,
        partnerDisplayName, partnerDateOfBirth, lookingFor, areaId };
      const response = await fetch("/api/onboarding/draft", { method: "PUT",
        credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saveConsent: true, draft }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Draft could not be saved");
      setDraftNotice("Saved privately for 7 days. Use your invitation link to return.");
    } catch (cause) { setDraftNotice(cause instanceof Error ? cause.message : "Draft could not be saved"); }
    finally { setDraftBusy(false); }
  }
  async function deleteDraft() {
    if (draftBusy) return;
    setDraftBusy(true); setDraftNotice("");
    try {
      const response = await fetch("/api/onboarding/draft", { method: "DELETE", credentials: "same-origin" });
      if (!response.ok) throw new Error("Draft could not be deleted");
      setSavedDraft(null); setDraftNotice("Saved answers deleted.");
    } catch { setDraftNotice("Draft could not be deleted"); }
    finally { setDraftBusy(false); }
  }

  const steps = stepsFor(profileType);
  const index = steps.indexOf(step);
  const next = () => { setError(""); setStep(steps[index + 1]); };
  const back = index > 0 && step !== "photo" ? () => { setError(""); setStep(steps[index - 1]); } : undefined;
  const screen = { step: index + 1, total: steps.length, onBack: back,
    utility: draftAvailable && step !== "photo" ? <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
      {savedDraft && <button type="button" disabled={draftBusy} onClick={restoreDraft} className="min-h-11 rounded-full border border-velora-accent px-3 font-semibold text-velora-accent">{t("Restore saved answers")}</button>}
      <button type="button" disabled={draftBusy} onClick={() => void saveDraft()} className="min-h-11 rounded-full border border-velora-line px-3 font-semibold text-velora-textSecondary">{draftBusy ? t("Saving…") : t("Save and continue later")}</button>
      <button type="button" disabled={draftBusy} onClick={() => void deleteDraft()} className="min-h-11 px-2 font-semibold text-velora-textMuted underline">{t("Delete saved answers")}</button>
      <p className="w-full text-right text-xs leading-5 text-velora-textMuted">{t("Optional: encrypt these answers for 7 days so you can resume from your invitation link.")}</p>
      {draftNotice && <span role="status" className="w-full text-right text-velora-textSecondary">{t(draftNotice)}</span>}
    </div> : null,
  };

  const nameValid = displayName.trim().length >= 2 && displayName.trim().length <= 80;
  const basicsValid = onboardingBasicsAreValid(displayName, dateOfBirth);
  const partnerValid = !whoIsHereError({ profileType, gender, relationshipStatus, partnerDisplayName, partnerDateOfBirth });

  async function createProfile(area: string) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setAreaId(area);
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/profile/me", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteToken,
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
      if (response.status === 409 && payload.error === "Profile already exists") {
        // Only an authenticated read of this account's own profile can confirm
        // that a resumed onboarding really completed. Other conflicts are errors.
        const current = await fetch("/api/profile/me", { credentials: "same-origin", cache: "no-store" });
        if (!current.ok) throw new Error("We couldn't confirm your existing profile. Try again.");
        window.location.replace("/verify-age");
        return;
      }
      if (!response.ok) throw new Error(payload.error || "That didn't work. Try again.");
      void fetch("/api/onboarding/draft", { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
      setStep("photo");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "That didn't work. Try again.");
    } finally {
      submittingRef.current = false;
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
      // FM-06: a new member goes straight to the age check.
      window.location.replace("/verify-age");
    } catch (failure) {
      if (uploadedUrl.startsWith("/api/media/")) await fetch(uploadedUrl, { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
      setError(failure instanceof Error ? failure.message : "Your photo could not be uploaded.");
      setPhotoProgress(null);
    }
  }

  const errorLine = error ? <p role="alert" className="rounded-2xl bg-red-500/10 px-5 py-4 text-base text-velora-danger">{t(error)}</p> : null;

  // Do not collect DOB, identity or intimate preferences when we have no
  // invitation credential to finish registration. No token or draft is stored
  // in browser storage; the original email link is the safe resume path.
  if (!validInviteLink) return (
    <main className="mx-auto flex min-h-[75dvh] max-w-xl flex-col justify-center space-y-5 px-5 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-velora-accent">{t("Finish joining Intimo")}</p>
      <h1 className="font-display text-4xl text-velora-ink sm:text-5xl">{t("Open your invitation to continue")}</h1>
      <p className="text-base leading-7 text-velora-textSecondary">{t("Your profile isn't finished yet. Open the original invitation link in your email to continue securely. You may need to enter your answers again.")}</p>
      <p className="text-sm text-velora-textMuted">{t("Intimo doesn't keep unfinished personal answers on this device.")}</p>
      <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-full bg-velora-accent px-6 text-sm font-semibold text-velora-paper">{t("How invitations work")}</Link>
      <Link href="/login" className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-velora-textSecondary underline underline-offset-4">{t("Back to sign in")}</Link>
    </main>
  );

  if (step === "kind") return (
    <FlowScreen {...screen} title={t("Who's coming in?")}>
      <ChoiceCard icon={<User className="h-7 w-7" />} label={t("Just me")} selected={profileType === "SINGLE"} onClick={() => { if (profileType !== "SINGLE") { setGender(""); setRelationshipStatus(""); } setProfileType("SINGLE"); setStep("identity"); }} />
      <ChoiceCard icon={<Users className="h-7 w-7" />} label={t("We're a couple")} selected={profileType === "COUPLE"} onClick={() => { if (profileType !== "COUPLE") { setGender(""); setRelationshipStatus(""); } setProfileType("COUPLE"); setStep("identity"); }} />
    </FlowScreen>
  );

  if (step === "identity") return (
    <FlowScreen {...screen} title={profileType === "COUPLE" ? t("You are…") : t("I am a…")}>
      {(profileType === "COUPLE" ? COUPLE_COMPOSITIONS : INDIVIDUAL_IDENTITIES).map((item) => (
        <ChoiceCard key={item.value} label={t(item.label)} selected={gender === item.value} onClick={() => { setGender(item.value); next(); }} />
      ))}
    </FlowScreen>
  );

  if (step === "relationship") return (
    <FlowScreen {...screen} title={profileType === "COUPLE" ? t("Your relationship") : t("Your situation")}>
      {relationshipOptionsFor(profileType).map((item) => (
        <ChoiceCard key={item.value} label={t(item.label)} selected={relationshipStatus === item.value} onClick={() => { setRelationshipStatus(item.value); next(); }} />
      ))}
    </FlowScreen>
  );

  if (step === "name") return (
    <FlowScreen {...screen} title={profileType === "COUPLE" ? t("Your nickname") : t("What should we call you?")} action={<BigButton disabled={!nameValid} onClick={next}>{t("Continue")}</BigButton>}>
      <form onSubmit={(event) => { event.preventDefault(); if (nameValid) next(); }}>
        <BigInput label={t("Nickname")} autoFocus value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="nickname" placeholder={t("e.g. Nina")} />
      </form>
    </FlowScreen>
  );

  if (step === "birthday") return (
    <FlowScreen {...screen} title={t("Your birthday")} action={<BigButton disabled={!basicsValid} onClick={next}>{t("Continue")}</BigButton>}>
      <BigInput label={t("Date of birth")} type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} autoComplete="bday" error={birthdayError(dateOfBirth, "you")} />
      <p className="text-base text-velora-textMuted">{t("Members see your age, never the date.")}</p>
    </FlowScreen>
  );

  if (step === "partner") return (
    <FlowScreen {...screen} title={t("Your partner")} action={<BigButton disabled={!partnerValid} onClick={next}>{t("Continue")}</BigButton>}>
      <div className="space-y-5">
        <BigInput label={t("Their nickname")} value={partnerDisplayName} onChange={(event) => setPartnerDisplayName(event.target.value)} maxLength={80} placeholder={t("e.g. Tom")} />
        <BigInput label={t("Their date of birth")} type="date" value={partnerDateOfBirth} onChange={(event) => setPartnerDateOfBirth(event.target.value)} error={birthdayError(partnerDateOfBirth, "partner")} />
      </div>
    </FlowScreen>
  );

  if (step === "looking") return (
    <FlowScreen {...screen} title={t("What brings you here?")} action={<BigButton disabled={lookingFor.length === 0} onClick={next}>{t("Continue")}</BigButton>}>
      <p className="-mt-4 text-base text-velora-textMuted">{t("Pick as many as you like.")}</p>
      {LOOKING_FOR.map((item) => (
        <ChoiceCard key={item.value} compact label={t(item.label)} selected={lookingFor.includes(item.value)} onClick={() => setLookingFor((current) => current.includes(item.value) ? current.filter((value) => value !== item.value) : [...current, item.value])} />
      ))}
    </FlowScreen>
  );


  if (step === "area") return (
    <FlowScreen {...screen} title={t("Where are you?")} action={<BigButton disabled={!areaId || submitting} onClick={() => void createProfile(areaId)}>{submitting ? t("Creating your profile…") : t("Continue")}</BigButton>}>
      <p className="text-base leading-6 text-velora-textMuted">{t("Choose an approximate area, not your address. You can change it later.")}</p>
      {errorLine}
      <div role="group" aria-label={t("Choose an area group")} className="grid grid-cols-3 gap-2 rounded-2xl border border-velora-line bg-velora-surface p-2">
        {([
          ["prague", "Prague"],
          ["nearby", "Near Prague"],
          ["elsewhere", "Elsewhere"],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" disabled={submitting} aria-pressed={areaGroup === value}
            onClick={() => { setAreaGroup(value); setAreaId(""); setError(""); }}
            className={`min-h-12 rounded-xl px-2 py-2 text-sm font-semibold transition disabled:opacity-50 ${areaGroup === value ? "bg-velora-accent text-velora-paper" : "text-velora-ink hover:bg-ink/10"}`}>
            {t(label)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {AREAS.filter(area => areaGroup === "prague" ? area.kind === "PRAGUE_DISTRICT" : areaGroup === "nearby" ? area.kind === "NEAR_PRAGUE" : area.kind === "CZECHIA" || area.kind === "ABROAD").map(area => (
          <button key={area.id} type="button" disabled={submitting} aria-pressed={areaId === area.id}
            onClick={() => { setAreaId(area.id); setError(""); }}
            className={`min-h-16 rounded-2xl border-2 px-3 py-3 text-left transition active:scale-[0.98] disabled:opacity-50 ${areaId === area.id ? "border-velora-accent bg-velora-accent/[0.06]" : "border-velora-line bg-velora-surface hover:border-velora-ink/30"}`}>
            <span className="block text-base font-semibold text-velora-textPrimary">{t(area.name)}</span>
            {area.label && <span className="block text-xs leading-5 text-velora-textMuted">{t(area.label)}</span>}
          </button>
        ))}
      </div>
      {areaId && <p role="status" className="text-sm text-velora-textSecondary">{t("Selected area: {area}", { area: t(AREAS.find(area => area.id === areaId)?.name || "") })}</p>}
    </FlowScreen>
  );

  return (
    <FlowScreen step={steps.length} total={steps.length} title={t("Add a photo")}>
      <label className={`flex aspect-[4/5] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[2rem] border-2 border-dashed border-velora-gold/50 bg-velora-gold/5 transition hover:border-velora-gold ${photoProgress !== null ? "pointer-events-none" : ""}`}>
        {photoProgress !== null
          ? <span className="text-3xl font-bold text-velora-textPrimary">{photoProgress}%</span>
          : <><Camera className="h-14 w-14 text-velora-gold" /><span className="text-2xl font-semibold text-velora-textPrimary">{t("Choose a photo")}</span></>}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoProgress !== null} onChange={uploadPhoto} />
      </label>
      <p className="flex items-center gap-2 text-base text-velora-textMuted"><Heart className="h-4 w-4 text-velora-gold" aria-hidden />{t("Members only. Keep it non-explicit.")}</p>
      <p className="text-sm leading-6 text-velora-textSecondary">{t("Your profile photo is optional. The separate private age check is required before joining the community.")}</p>
      {errorLine}
      <button type="button" disabled={photoProgress !== null} onClick={() => window.location.replace("/verify-age")} className="w-full py-4 text-lg font-semibold text-velora-textSecondary hover:text-velora-textPrimary">{t("Skip for now")}</button>
    </FlowScreen>
  );
}

export default function OnboardingPage() { return <Suspense fallback={null}><OnboardingForm /></Suspense>; }
