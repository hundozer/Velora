"use client";

import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, User, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LOCATION_DATA } from "@/lib/locationData";
import { ageFromBirthDate, onboardingBasicsAreValid } from "@/lib/onboardingPolicy.mjs";

type ProfileKind = "" | "SINGLE" | "COUPLE";

const selectClass = "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-velora-textPrimary outline-none transition focus:border-velora-gold/60 focus:ring-1 focus:ring-velora-gold/60";

export default function OnboardingWizardPage() {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profileType, setProfileType] = useState<ProfileKind>("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [headline, setHeadline] = useState("");
  const [sexualOrientation, setSexualOrientation] = useState("");
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
  const profileValid = Boolean(profileType && gender && country && city);
  const cities = useMemo(() => LOCATION_DATA.getCitiesForCountry(country), [country]);

  function chooseCountry(value: string) {
    setCountry(value);
    setCity("");
  }

  async function finish() {
    if (!basicsValid || !profileValid || (sexualOrientation && !sensitiveConsent)) return;
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
          country,
          city,
          headline: headline.trim(),
          sexualOrientation: sexualOrientation || undefined,
          explicitSensitiveDataConsent: Boolean(sexualOrientation && sensitiveConsent),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "We could not create your profile. Please try again.");
      window.location.replace("/dashboard");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "We could not create your profile. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-7 px-4 py-10 md:py-14">
      <div className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Step {step} of 3</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-label={`Step ${step} of 3`}>
          <div className="h-full bg-gold-gradient transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <Card variant="goldBorder" className="space-y-7 p-6 md:p-9">
        {step === 1 && (
          <section className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">Create your Intimo identity</h1>
              <p className="mt-2 text-sm leading-relaxed text-velora-textSecondary">Choose the name other members will see and confirm that you are an adult.</p>
            </div>
            <Input label="Nickname" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="nickname" placeholder="How should members know you?" error={nicknameError} />
            <Input label="Date of birth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} autoComplete="bday" error={birthDateError} />
            <Button className="w-full" size="lg" disabled={!basicsValid} onClick={() => setStep(2)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">Set up your profile</h1>
              <p className="mt-2 text-sm leading-relaxed text-velora-textSecondary">Add the basics members use to discover you. You can add photos and preferences later.</p>
            </div>
            <fieldset className="space-y-3">
              <legend className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Profile type</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ["SINGLE", "Individual", "A profile for one person", User],
                  ["COUPLE", "Couple", "A shared profile for two adults", Users],
                ] as const).map(([value, title, description, Icon]) => (
                  <button key={value} type="button" onClick={() => setProfileType(value)} className={`rounded-2xl border p-4 text-left transition ${profileType === value ? "border-velora-gold bg-velora-gold/10" : "border-white/10 bg-white/5 hover:border-white/25"}`}>
                    <Icon className="mb-3 h-5 w-5 text-velora-gold" />
                    <span className="block font-semibold text-velora-textPrimary">{title}</span>
                    <span className="mt-1 block text-xs text-velora-textSecondary">{description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Profile gender
                <select className={selectClass} value={gender} onChange={(event) => setGender(event.target.value)}>
                  <option value="">Choose one</option><option value="FEMALE">Woman</option><option value="MALE">Man</option><option value="COUPLE_MF">Woman and man couple</option><option value="COUPLE_FF">Two women couple</option><option value="COUPLE_MM">Two men couple</option><option value="NON_BINARY">Non-binary</option><option value="TRANSGENDER">Transgender</option><option value="OTHER">Another identity</option>
                </select>
              </label>
              <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Country
                <select className={selectClass} value={country} onChange={(event) => chooseCountry(event.target.value)}>
                  <option value="">Choose a country</option>{LOCATION_DATA.COUNTRIES.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary sm:col-span-2">City or region
                <select className={selectClass} value={city} onChange={(event) => setCity(event.target.value)} disabled={!country}>
                  <option value="">{country ? "Choose your city or region" : "Choose a country first"}</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <Input label="Headline (optional)" value={headline} onChange={(event) => setHeadline(event.target.value)} maxLength={255} placeholder="A short introduction" />
            <div className="flex gap-3"><Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button className="flex-1" size="lg" disabled={!profileValid} onClick={() => setStep(3)}>Review privacy <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">Your privacy starts protected</h1>
              <p className="mt-2 text-sm leading-relaxed text-velora-textSecondary">Your profile starts visible to signed-in members only. Sensitive details remain private until you change them.</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /><div><p className="font-semibold text-velora-textPrimary">Private by default</p><p className="mt-1 text-sm leading-relaxed text-velora-textSecondary">Your exact location is not published, direct messages are limited to members, and nothing is placed on the public web automatically.</p></div></div>
            </div>
            <label className="block space-y-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Sexual orientation (optional)
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
            <div className="flex gap-3"><Button variant="ghost" disabled={submitting} onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><Button className="flex-1" size="lg" disabled={submitting || Boolean(sexualOrientation && !sensitiveConsent)} onClick={finish}>{submitting ? "Creating profile…" : "Enter Intimo"}<CheckCircle2 className="ml-2 h-4 w-4" /></Button></div>
          </section>
        )}
      </Card>
    </main>
  );
}
