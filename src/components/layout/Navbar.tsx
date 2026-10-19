"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isFlowPath } from "@/lib/flowRoutes";
import { useAuth } from "@/context/AuthContext";
import { useTranslation, LANGUAGES, SupportedLanguage } from "@/context/LanguageContext";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { Badge } from "@/components/ui/Badge";
import {
  Compass,
  MessageSquare,
  Bell,
  ChevronDown,
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
  const { language, setLanguage, t } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
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
        <Link href="/" className="shrink-0 font-display text-3xl leading-none text-velora-ink">Intimo</Link>

        {/* Home · People · Tonight · Messages; Me lives in the account menu. */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
          {[
            { href: "/", label: "Home", active: pathname === "/" },
            { href: "/people", label: "People", active: pathname.startsWith("/people") },
            { href: "/tonight", label: "Tonight", active: pathname.startsWith("/tonight") },
            ...(user ? [{ href: "/messages", label: t("nav.messages"), active: pathname.startsWith("/messages") }] : []),
          ].map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={`rounded-full px-4 py-2 text-[15px] font-medium transition ${item.active ? "bg-velora-ink text-velora-paper" : "text-velora-ink2 hover:bg-velora-ink/5 hover:text-velora-ink"}`}>
              {item.label}
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
                title="Notifications"
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

          {/* Global Language Selector Dropdown (on phones it lives on the Me page) */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink/5 border border-ink/10 text-xs font-semibold text-velora-textPrimary hover:bg-ink/10 transition-colors"
              title="Change platform language"
            >
              <span>{LANGUAGES.find((l) => l.code === language)?.flag || "🇬🇧"}</span>
              <span className="uppercase text-[11px] font-bold">{language}</span>
              <ChevronDown className="w-3 h-3 text-velora-textMuted" />
            </button>

            {isLangDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-44 glass-panel-gold rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setIsLangDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-velora-textMuted border-b border-ink/10 mb-1">
                  Language / Jazyk
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                      language === lang.code
                        ? "bg-gold-gradient text-velora-bg font-bold"
                        : "text-velora-textPrimary hover:bg-ink/10"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase opacity-60">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                    <img src={profile.avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center text-sm font-bold text-velora-gold" aria-label="Profile without an avatar">
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
                    <User className="w-4 h-4 text-velora-gold" />
                    My Profile
                  </Link>

                  <Link
                    href="/albums/manage"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <ImageIcon className="w-4 h-4 text-velora-accent" />
                    My Photos
                  </Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=VIDEOS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <Video className="w-4 h-4 text-emerald-700" />
                    My Videos
                  </Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=ADS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <Megaphone className="w-4 h-4 text-rose-400" />
                    My Dating Ads
                  </Link>

                  <Link
                    href="/favorites"
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl font-medium"
                  >
                    <Bookmark className="w-4 h-4 text-velora-accent" />
                    Saved items
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 rounded-xl"
                  >
                    <Settings className="w-4 h-4 text-velora-textMuted" />
                    Account Settings
                  </Link>

                  <button
                    onClick={() => signOut("/")}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-600 hover:bg-red-500/10 rounded-xl mt-1 border-t border-ink/5"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* CLEAN & HIGH-CONVERTING GUEST CTAS */
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/auth/login"
                className="whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium text-velora-ink hover:bg-velora-ink/5"
              >
                {t("auth.login")}
              </a>
              <a
                href="/auth/login?screen_hint=signup"
                className="whitespace-nowrap rounded-full bg-velora-accent px-5 py-2.5 text-[15px] font-semibold text-velora-paper transition hover:bg-velora-accentHover"
              >
                Join free
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
