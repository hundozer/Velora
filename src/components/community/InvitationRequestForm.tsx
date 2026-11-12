"use client";
import React from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

// Three questions only (owner decision). Values must match src/lib/invitations/requests.ts.
const IDENTITIES = [["WOMAN", "A woman"], ["MAN", "A man"], ["COUPLE", "A couple"], ["OTHER", "Non-binary or other"]] as const;
const BASED_IN = [["PRAGUE", "Prague"], ["CZECHIA", "Elsewhere in Czechia"], ["ABROAD", "Outside Czechia"]] as const;

function Choice({ name, value, label, checked, onChange }: { name: string; value: string; label: string; checked: boolean; onChange: (value: string) => void }) {
  return <label className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-velora-accent ${checked ? "border-velora-accent bg-velora-accent text-velora-paper" : "border-velora-control text-velora-ink hover:border-velora-accent"}`}>
    <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" required />{label}
  </label>;
}

/** Landing-page form: leave your email, answer three questions, and we may send a personal invitation. */
export function InvitationRequestForm() {
  const { t, language } = useTranslation();
  const [email, setEmail] = React.useState("");
  const [identity, setIdentity] = React.useState("");
  const [basedIn, setBasedIn] = React.useState("");
  const [intent, setIntent] = React.useState("");
  const [adult, setAdult] = React.useState(false);
  const [website, setWebsite] = React.useState("");
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = React.useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!identity || !basedIn) return setError(t("Please answer every question."));
    if (intent.trim().length < 10) return setError(t("Tell us a little more (at least 10 characters)."));
    setState("sending");
    try {
      const response = await fetch("/api/invitation-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, identity, basedIn, intent, adultConfirmed: adult, language: language === "cs" ? "cs" : "en", website }) });
      if (response.ok) return setState("sent");
      setError(response.status === 429 ? t("Too many requests. Please try again later.") : response.status === 400 ? t("Please answer every question and confirm you are 18 or older.") : t("Something went wrong. Please try again later."));
    } catch {
      setError(t("Something went wrong. Please try again later."));
    }
    setState("idle");
  }

  if (state === "sent") return <div role="status" className="rounded-2xl border border-velora-line bg-velora-surface p-7 sm:p-9">
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-velora-accent text-velora-paper"><Check className="h-6 w-6" aria-hidden /></span>
    <h3 className="mt-5 font-display text-3xl">{t("Thank you. We've got your request.")}</h3>
    <p className="mt-3 leading-relaxed text-velora-ink2">{t("We read every request personally. If it's a good fit, your personal invitation will arrive by email.")}</p>
  </div>;

  const field = "mt-2 block w-full rounded-lg border border-velora-control bg-velora-paper px-4 py-3 text-base text-velora-ink placeholder:text-velora-muted focus:border-velora-accent focus:outline-none focus:ring-2 focus:ring-velora-accent/30";
  return <form onSubmit={submit} noValidate={false} className="rounded-2xl border border-velora-line bg-velora-surface p-6 sm:p-8">
    <label className="block text-sm font-semibold">{t("Your email")}
      <input type="email" required autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("you@example.com")} className={field} />
    </label>
    <fieldset className="mt-6"><legend className="text-sm font-semibold">{t("1. I am…")}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{IDENTITIES.map(([value, label]) => <Choice key={value} name="identity" value={value} label={t(label)} checked={identity === value} onChange={setIdentity} />)}</div>
    </fieldset>
    <fieldset className="mt-6"><legend className="text-sm font-semibold">{t("2. Where are you based?")}</legend>
      <div className="mt-2 flex flex-wrap gap-2">{BASED_IN.map(([value, label]) => <Choice key={value} name="basedIn" value={value} label={t(label)} checked={basedIn === value} onChange={setBasedIn} />)}</div>
    </fieldset>
    <label className="mt-6 block text-sm font-semibold">{t("3. What are you hoping to find on Intimo?")}
      <textarea required minLength={10} maxLength={500} rows={3} value={intent} onChange={(e) => setIntent(e.target.value)} placeholder={t("A sentence or two is enough.")} className={field} />
    </label>
    {/* Hidden from people; bots fill it in. */}
    <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} className="hidden" aria-hidden />
    <label className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-velora-ink2">
      <input type="checkbox" required checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-velora-accent" />
      <span>{t("I'm 18 or older, and Intimo may email me about this request. My email is used for nothing else.")}</span>
    </label>
    {error && <p role="alert" className="mt-4 text-sm font-semibold text-velora-danger">{error}</p>}
    <button type="submit" disabled={state === "sending"} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-velora-accent px-6 text-base font-bold text-velora-paper transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto">
      {state === "sending" ? t("Sending…") : t("Request my invitation")}{state !== "sending" && <ArrowUpRight className="h-5 w-5" aria-hidden />}
    </button>
  </form>;
}
