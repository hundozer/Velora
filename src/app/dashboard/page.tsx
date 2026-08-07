"use client";

import Link from "next/link";
import { Compass, Heart, ImagePlus, MessageSquare, Settings, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  if (!user) return <BehindTheDoorLanding />;

  const required = [profile?.displayName, profile?.avatarUrl, profile?.bio, profile?.city, profile?.country, profile?.lookingFor?.length];
  const completion = Math.round((required.filter(Boolean).length / required.length) * 100);
  const firstName = profile?.displayName || user.username || "member";

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <section className="rounded-3xl border border-velora-gold/30 bg-velora-card p-6 shadow-gold-glow sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-velora-gold">Your Intimo home</p>
        <h1 className="mt-3 font-serif text-3xl font-bold text-white sm:text-4xl">Welcome, {firstName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-velora-textSecondary">
          Your home starts empty and grows only from real profiles, conversations and connections you choose.
        </p>
      </section>

      <section aria-labelledby="profile-progress" className="rounded-3xl border border-white/10 bg-white/[0.035] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 id="profile-progress" className="text-lg font-bold text-white">Profile completion</h2>
            <p className="mt-1 text-sm text-velora-textMuted">Calculated from your real profile fields.</p>
          </div>
          <span className="text-2xl font-bold text-velora-gold">{completion}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gold-gradient" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <Link href={`/profile/${profile?.id || "me"}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-3 text-sm font-bold text-velora-bg">
            <UserRound className="h-4 w-4" /> Complete my profile
          </Link>
        )}
      </section>

      <section aria-labelledby="start-heading">
        <h2 id="start-heading" className="mb-4 text-lg font-bold text-white">What would you like to do?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Discover members", "Use real profile search and filters.", "/discovery", Compass],
            ["Create a dating ad", "Describe the connection you are looking for.", "/dating/create", Heart],
            ["View messages", "Continue genuine member conversations.", "/messages", MessageSquare],
            ["Manage photos", "Add your first photo or manage existing media.", `/profile/${profile?.id || "me"}?tab=PHOTOS`, ImagePlus],
            ["View favourites", "Profiles you have genuinely saved appear here.", "/favorites", UserRound],
            ["Privacy and settings", "Control visibility, consent and your account.", "/settings", Settings],
          ].map(([title, copy, href, Icon]) => (
            <Link key={String(href)} href={String(href)} className="group rounded-2xl border border-white/10 bg-velora-card p-5 transition hover:border-velora-gold/50 hover:bg-white/[0.06]">
              <Icon className="h-6 w-6 text-velora-gold" />
              <h3 className="mt-4 font-bold text-white group-hover:text-velora-gold">{String(title)}</h3>
              <p className="mt-2 text-sm leading-5 text-velora-textMuted">{String(copy)}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
