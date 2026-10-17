"use client";

import React from "react";
import Link from "next/link";
import { Bell, Bookmark, ChevronRight, Flame, Hand, Image as ImageIcon, LogOut, Settings, Shield, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation, LANGUAGES } from "@/context/LanguageContext";
import { useDurableNotifications } from "@/lib/notifications/useDurableNotifications";
import { AppOnThisDevice } from "@/components/pwa/AppOnThisDevice";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "SYSTEM_ADMIN", "TRUST_AND_SAFETY_ADMIN", "CONTENT_MODERATOR", "PRIVACY_ADMIN", "SUPPORT_ADMIN", "COMMUNITY_ADMIN"]);

function Row({ href, icon: Icon, label, detail }: { href: string; icon: React.ElementType; label: string; detail?: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 text-velora-textPrimary hover:bg-white/5">
      <Icon className="h-5 w-5 shrink-0 text-velora-gold" aria-hidden />
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {detail}
      <ChevronRight className="h-4 w-4 text-velora-textMuted" aria-hidden />
    </Link>
  );
}

/** Mobile account hub: everything that lives in the desktop avatar menu. */
export default function MePage() {
  const { user, profile, role, isAuthLoading, signIn, signOut } = useAuth();
  const { language, setLanguage } = useTranslation();
  const notifications = useDurableNotifications();

  if (isAuthLoading) return <main className="mx-auto max-w-lg px-4 py-10 text-sm text-velora-textMuted">Loading…</main>;

  if (!user) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center">
        <h1 className="font-serif text-2xl font-bold text-velora-textPrimary">Your account</h1>
        <p className="text-sm text-velora-textSecondary">Sign in to see your profile, messages and settings.</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => signIn()} className="min-h-11 rounded-full border border-velora-gold/40 px-5 text-sm font-bold text-velora-gold">Sign in</button>
          <button onClick={() => signIn("signup")} className="min-h-11 rounded-full bg-gold-gradient px-5 text-sm font-bold text-velora-bg">Join Intimo</button>
        </div>
      </main>
    );
  }

  const name = profile?.displayName || user.username || "Member";
  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-velora-gold/50 bg-velora-card">
          {profile?.avatarUrl
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            : <span className="text-xl font-bold text-velora-gold">{name.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-serif text-2xl font-bold text-velora-textPrimary">{name}</h1>
          <p className="truncate text-xs text-velora-textMuted">{user.email}</p>
        </div>
      </div>

      <nav aria-label="Account" className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <Row href={`/profile/${profile?.id || "me"}`} icon={User} label="My profile" />
        <Row href="/notifications" icon={Bell} label="Notifications" detail={notifications.unreadCount > 0 ? <span className="rounded-full bg-velora-gold px-2 py-0.5 text-[11px] font-bold text-velora-bg">{notifications.unreadCount}</span> : null} />
        <Row href="/me/desires" icon={Flame} label="My desires" />
        <Row href="/me/boundaries" icon={Hand} label="My boundaries" />
        <Row href="/albums/manage" icon={ImageIcon} label="My photos & albums" />
        <Row href="/favorites" icon={Bookmark} label="Saved" />
        <Row href="/settings" icon={Settings} label="Settings & privacy" />
        {ADMIN_ROLES.has(String(role)) && <Row href="/admin" icon={Shield} label="Admin" />}
      </nav>

      <AppOnThisDevice />

      <label className="block rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Language</span>
        <select value={language} onChange={(event) => setLanguage(event.target.value as typeof language)} className="min-h-11 w-full rounded-xl border border-white/10 bg-velora-bg px-3 text-sm text-velora-textPrimary">
          {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.flag} {lang.nativeName}</option>)}
        </select>
      </label>

      <button onClick={() => signOut("/")} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 text-sm font-semibold text-red-300 hover:bg-red-500/10">
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </button>
    </main>
  );
}
