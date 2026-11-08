"use client";
import { Logo } from "@/components/brand/Logo";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isFlowPath } from "@/lib/flowRoutes";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { Badge } from "@/components/ui/Badge";
import { FoundingMemberMenuLink } from "@/components/community/FoundingMemberMenuLink";
import {
  Compass,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Image as ImageIcon,
  Video,
  Megaphone,
  Heart,
  Bookmark,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuth();
  const { t } = useTranslation();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).then((payload) => { if (payload) setUnreadCount(payload.unreadCount || 0); }).catch(() => {});
  }, [user]);

  if (isFlowPath(pathname)) return null;
  // On phones, member People draws its own header (wordmark + Introductions/Everyone)
  // over the full-bleed opening; notifications stay reachable from You.
  const phoneHidden = Boolean(user) && (pathname.startsWith("/people") || pathname.startsWith("/profile/") || pathname.startsWith("/messages") || pathname.startsWith("/tonight"));

  return (
    <header className={`${phoneHidden ? "hidden md:block" : ""} sticky top-0 z-40 w-full border-b border-velora-line/70 bg-velora-paper/85 backdrop-blur-xl`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 lg:h-20 flex items-center justify-between gap-4">
        <Link href="/" aria-label={t("Intimo")} className="shrink-0 text-velora-ink"><Logo className="h-8 w-auto lg:h-9" /></Link>

        {/* Me lives in the account menu. */}
        <nav className="hidden lg:flex items-center gap-1" aria-label={t("Primary navigation")}>
          {[
            { href: "/", label: "Home", active: pathname === "/" },
            { href: "/people", label: "People", active: pathname.startsWith("/people") },
            { href: "/personal-ads", label: "Dating Ads", active: pathname.startsWith("/personal-ads") },
            { href: "/tonight", label: "Tonight", active: pathname.startsWith("/tonight") },
            ...(user ? [{ href: "/rooms", label: "Rooms", active: pathname.startsWith("/rooms") }] : []),
            ...(user ? [{ href: "/messages", label: t("nav.messages"), active: pathname.startsWith("/messages") }] : []),
          ].map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={`rounded-full px-4 py-2 text-[15px] font-medium transition ${item.active ? "bg-velora-accent text-velora-paper" : "text-velora-ink2 hover:bg-velora-ink/5 hover:text-velora-ink"}`}>
              {t(item.label)}
            </Link>
          ))}
        </nav>

        {/* Right Section: Language Selector & Auth / Avatar Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Notifications Trigger for Logged In User */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-full bg-ink/5 border border-ink/10 text-velora-textSecondary hover:text-velora-gold hover:bg-ink/10 transition-colors relative"
                title={t("Notifications")}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-velora-gold text-velora-bg font-bold text-[10px] flex items-center justify-center shadow-gold-glow animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <NotificationDrawer
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                onUnreadChange={setUnreadCount}
              />
            </div>
          )}

          {/* Czech / English: always visible so visitors can switch in one tap. */}
          <LanguageSwitch />

          {/* USER ACCOUNT DROPDOWN VS PUBLIC GUEST SIGN-IN / REGISTER CTAS */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-ink/5 transition-colors"
              >
                <div className="w-10 h-10 rounded-full border-2 border-velora-gold/50 overflow-hidden bg-velora-card">
                  {profile?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatarUrl} alt={t("User avatar")} className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-sm font-bold text-velora-gold" aria-label={t("Profile without an avatar")}>
                      {(profile?.displayName || user.username || "I").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
              </button>

              {isUserDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 glass-panel-gold rounded-2xl p-2 shadow-2xl z-50"
                  onClick={() => setIsUserDropdownOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-ink/10 mb-1">
                    <p className="text-sm font-bold text-velora-textPrimary">{profile?.displayName || user.username}</p>
                    <p className="text-xs text-velora-textMuted truncate">{user.email}</p>
                    <div className="mt-2">
                      <Badge type={role === "CREATOR" ? "creator" : role === "COUPLE" ? "couple" : role === "ADMIN" ? "admin" : "verified"} />
                    </div>
                  </div>

                  <Link
                    href={`/profile/${profile?.id || "me"}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <User className="w-4 h-4 text-velora-gold" />{t("My Profile")}</Link>

                  <Link
                    href="/albums/manage"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <ImageIcon className="w-4 h-4 text-velora-accent" />{t("My Photos")}</Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=VIDEOS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <Video className="w-4 h-4 text-velora-success" />{t("My Videos")}</Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=ADS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <Megaphone className="w-4 h-4 text-velora-danger" />{t("My Dating Ads")}</Link>

                  <Link
                    href="/favorites"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <Bookmark className="w-4 h-4 text-velora-accent" />{t("Saved items")}</Link>

                  <FoundingMemberMenuLink />

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl"
                  >
                    <Settings className="w-4 h-4 text-velora-textMuted" />{t("Account Settings")}</Link>

                  <button
                    onClick={() => signOut("/")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-velora-danger hover:bg-red-500/10 rounded-xl mt-1 border-t border-ink/5"
                  >
                    <LogOut className="w-4 h-4" />{t("Sign Out")}</button>
                </div>
              )}
            </div>
          ) : (
            /* CLEAN & HIGH-CONVERTING GUEST CTAS */
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/auth/login"
                className="whitespace-nowrap rounded-full px-3 py-2.5 text-[15px] font-medium text-velora-ink hover:bg-velora-ink/5 sm:px-4"
              >
                {t("auth.login")}
              </a>
              <a
                href="/auth/login?screen_hint=signup"
                className="hidden whitespace-nowrap rounded-full bg-velora-accent px-5 py-2.5 text-[15px] font-semibold text-velora-paper transition hover:bg-velora-accentHover min-[440px]:inline-block"
              >{t("Join free")}</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
