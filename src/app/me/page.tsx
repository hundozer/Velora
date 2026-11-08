"use client";

import React from "react";
import Link from "next/link";
import { Activity, Bell, Bookmark, ChevronRight, EyeOff, Flame, Hand, Lock, Image as ImageIcon, LogOut, MessageSquare, Settings, Shield, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { useDurableNotifications } from "@/lib/notifications/useDurableNotifications";
import { AppOnThisDevice } from "@/components/pwa/AppOnThisDevice";
import { StoryAvatar } from "@/components/stories/StoryAvatar";
import { FoundingMemberMenuLink } from "@/components/community/FoundingMemberMenuLink";
import { MailPlus } from "lucide-react";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "SYSTEM_ADMIN", "TRUST_AND_SAFETY_ADMIN", "CONTENT_MODERATOR", "PRIVACY_ADMIN", "SUPPORT_ADMIN", "COMMUNITY_ADMIN"]);

function Row({ href, icon: Icon, label, detail }: { href: string; icon: React.ElementType; label: string; detail?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 text-velora-textPrimary hover:bg-ink/5">
      <Icon className="h-5 w-5 shrink-0 text-velora-gold" aria-hidden />
      <span className="flex-1 text-sm font-semibold">{t(label)}</span>
      {t(detail)}
      <ChevronRight className="h-4 w-4 text-velora-textMuted" aria-hidden />
    </Link>
  );
}

/** Mobile account hub: everything that lives in the desktop avatar menu. */
export default function MePage() {
  const { user, profile, role, isAuthLoading, signIn, signOut } = useAuth();
  const { t } = useTranslation();
  const notifications = useDurableNotifications();

  if (isAuthLoading) return <main className="mx-auto max-w-lg px-4 py-10 text-sm text-velora-textMuted">{t("Loading…")}</main>;

  if (!user) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center">
        <h1 className="font-display font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">{t("Your account")}</h1>
        <p className="text-sm text-velora-textSecondary">{t("Sign in to see your profile, messages and settings.")}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => signIn()} className="min-h-11 rounded-full border border-velora-gold/40 px-5 text-sm font-bold text-velora-gold">{t("Sign in")}</button>
          <button onClick={() => signIn("signup")} className="min-h-11 rounded-full bg-gold-gradient px-5 text-sm font-bold text-velora-bg">{t("Join with an invitation")}</button>
        </div>
      </main>
    );
  }

  const name = profile?.displayName || user.username || "Member";
  return (
    <main className="mx-auto max-w-lg space-y-5 px-4 py-6">
      <div className="flex items-center gap-4">
        {profile?.id&&<StoryAvatar ownerId={profile.id} name={name} src={profile.avatarUrl} size={64} fallbackHref="/stories"/>}
        {!profile?.id&&<div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-velora-gold/50 bg-velora-card">
          {profile?.avatarUrl
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
            : <span className="text-xl font-bold text-velora-gold">{name.slice(0, 1).toUpperCase()}</span>}
        </div>}
        <div className="min-w-0">
          <h1 className="truncate font-display font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">{name}</h1>
          <p className="truncate text-xs text-velora-textMuted">{user.email}</p>
        </div>
      </div>

      <nav aria-label={t("Account")} className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.02]">
        <Row href="/activity" icon={Activity} label={t("Activity: interest & visitors")} />
        <Row href={`/profile/${profile?.id || "me"}`} icon={User} label={t("My profile")} />
        <Row href="/notifications" icon={Bell} label={t("Notifications")} detail={notifications.unreadCount > 0 ? <span className="rounded-full bg-velora-gold px-2 py-0.5 text-[11px] font-bold text-velora-bg">{notifications.unreadCount}</span> : null} />
        <Row href="/me/desires" icon={Flame} label={t("My desires")} />
        <Row href="/me/boundaries" icon={Hand} label={t("My boundaries")} />
        <Row href="/albums/manage" icon={ImageIcon} label={t("My photos & albums")} />
        <Row href="/stories" icon={ImageIcon} label={t("Stories · your next 24 hours")} />
        <Row href="/rooms" icon={MessageSquare} label={t("Rooms")} />
        <Row href="/me/private-photos" icon={Lock} label={t("Private photo access")} />
        <Row href="/favorites" icon={Bookmark} label={t("Saved")} />
        <Row href="/settings#privacy" icon={EyeOff} label={t("Privacy Center")} />
        <Row href="/me/invite" icon={MailPlus} label={t("Invite friends")} />
        <FoundingMemberMenuLink mobile />
        <Row href="/settings" icon={Settings} label={t("Settings")} />
        {ADMIN_ROLES.has(String(role)) && <Row href="/admin" icon={Shield} label={t("Admin")} />}
      </nav>

      <AppOnThisDevice />

      <section className="rounded-2xl border border-ink/10 bg-ink/[0.02] px-4 py-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{t("Language")}</h2>
        <LanguageSwitch variant="list" />
      </section>

      <button onClick={() => signOut("/")} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/30 text-sm font-semibold text-velora-danger hover:bg-red-500/10">
        <LogOut className="h-4 w-4" aria-hidden />{" "}{t("Sign out")}</button>
    </main>
  );
}
