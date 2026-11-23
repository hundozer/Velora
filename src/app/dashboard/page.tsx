"use client";

import { useTranslation } from "@/context/LanguageContext";
import Link from "next/link";
import { ClipboardList, Compass, Heart, ImagePlus, MessageSquare, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { FoundingMemberInvites } from "@/components/community/FoundingMemberInvites";
import { BETA_FEEDBACK_OPEN_AT, BETA_FEEDBACK_CLOSE_AT } from "@/lib/betaFeedback";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, profile, isAuthLoading } = useAuth();
  if (isAuthLoading) return <main className="flex min-h-[55vh] items-center justify-center" aria-live="polite"><span className="h-8 w-8 animate-spin rounded-full border-2 border-ink/15 border-t-amber-300" aria-hidden="true" /><span className="sr-only">{t("Loading")}</span></main>;
  if (!user) return <BehindTheDoorLanding />;

  const required = [profile?.displayName, profile?.avatarUrl, profile?.bio, profile?.city, profile?.country, profile?.lookingFor?.length];
  const completion = Math.round((required.filter(Boolean).length / required.length) * 100);
  const firstName = profile?.displayName || user.username || "member";

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-velora-gold/30 bg-velora-card p-6 shadow-gold-glow sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-velora-gold">{t("Your Intimo home")}</p>
        <h1 className="mt-3 font-display font-bold text-ink text-5xl leading-[1.02] sm:text-6xl">{t("Welcome, {firstName}", { firstName })}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-velora-textSecondary">{t("Your home starts empty and grows only from real profiles, conversations and connections you choose.")}</p>
      </section>

      <section aria-labelledby="first-steps" className="rounded-3xl border border-velora-line bg-velora-surface p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-velora-accent">{t("Your first days")}</p>
        <h2 id="first-steps" className="mt-2 font-display text-3xl font-normal text-ink sm:text-4xl">{t("Make yourself at home")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-velora-textSecondary">{t("No rush. These four steps help you settle in and meet people on your terms.")}</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2">
          {([
            ["Check your age", "Only adults can enter the community.", "/verify-age"],
            ["Make your profile yours", "Let people know a little about you.", `/profile/${profile?.id || "me"}`],
            ["Choose what you share", "Your privacy and consent stay in your hands.", "/settings#privacy"],
            ["Meet someone", "Explore profiles and start a conversation when you're ready.", "/people"],
          ] as const).map(([heading, description, href], index) => (
            <li key={href}>
              <Link href={href} className="flex h-full min-h-24 items-start gap-4 rounded-2xl border border-velora-line bg-velora-card p-4 transition hover:border-velora-accent/60">
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-velora-accent/50 text-sm font-semibold text-velora-accent">{index + 1}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{t(heading)}</span>
                  <span className="mt-1 block text-xs leading-5 text-velora-textSecondary">{t(description)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {Date.now() < Date.parse(BETA_FEEDBACK_CLOSE_AT) && (
        <section aria-labelledby="beta-feedback-heading" className="rounded-3xl border border-velora-accent/40 bg-velora-card p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-velora-accent">{t("December beta")}</p>
              <h2 id="beta-feedback-heading" className="mt-2 font-display text-3xl text-ink">{t("Help shape Intimo")}</h2>
              <p className="mt-2 max-w-xl text-sm text-velora-textSecondary">
                {Date.now() >= Date.parse(BETA_FEEDBACK_OPEN_AT)
                  ? t("Tell us what works and what doesn't. A few minutes, in your own words.")
                  : t("Our short beta feedback questionnaire opens on 15 December.")}
              </p>
            </div>
            <Link href="/beta-feedback" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-velora-warm px-6 py-3 text-sm font-semibold text-velora-paper">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />{t("View beta feedback form")}
            </Link>
          </div>
        </section>
      )}

      <FoundingMemberInvites />

      <section aria-labelledby="profile-progress" className="rounded-3xl border border-ink/10 bg-ink/[0.035] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 id="profile-progress" className="text-lg font-bold text-ink">{t("Profile completion")}</h2>
            <p className="mt-1 text-sm text-velora-textMuted">{t("Calculated from your real profile fields.")}</p>
          </div>
          <span className="text-2xl font-bold text-velora-gold">{completion}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <Link href={`/profile/${profile?.id || "me"}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-velora-warm px-5 py-3 text-sm font-semibold text-velora-bg">
            <UserRound className="h-4 w-4" />{" "}{t("Complete my profile")}</Link>
        )}
      </section>

      <section aria-labelledby="start-heading">
        <h2 id="start-heading" className="mb-4 text-lg font-bold text-ink">{t("What would you like to do?")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Find people", "Who's around, online now and new in Prague.", "/people", Compass],
            ["Post a plan for tonight", "Say what you're up for; it expires on its own.", "/tonight/new", Heart],
            ["View messages", "Continue genuine member conversations.", "/messages", MessageSquare],
            ["Manage photos", "Add your first photo or manage existing media.", `/profile/${profile?.id || "me"}?tab=PHOTOS`, ImagePlus],
            ["View favourites", "Profiles you have genuinely saved appear here.", "/favorites", UserRound],
            ["Privacy and settings", "Control visibility, consent and your account.", "/settings", Settings],
          ].map(([title, copy, href, Icon]) => (
            <Link key={String(href)} href={String(href)} className="group rounded-2xl border border-ink/10 bg-velora-card p-5 transition hover:border-velora-gold/50 hover:bg-ink/[0.06]">
              <Icon className="h-6 w-6 text-velora-gold" />
              <h3 className="mt-4 font-bold text-ink group-hover:text-velora-gold">{t(String(title))}</h3>
              <p className="mt-2 text-sm leading-5 text-velora-textMuted">{t(String(copy))}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
