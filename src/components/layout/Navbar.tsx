"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Search,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, role, logout } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" }).then((response) => response.ok ? response.json() : null).then((payload) => { if (payload) setUnreadCount(payload.unreadCount || 0); }).catch(() => {});
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 bg-velora-bg/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-full bg-gold-gradient p-[1px] shadow-gold-glow flex items-center justify-center">
            <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center group-hover:bg-velora-bg/80 transition-colors">
              <span className="font-serif font-bold text-lg text-velora-gold">I</span>
            </div>
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-widest gold-gradient-text uppercase">
              Intimo
            </span>
            <span className="block text-[10px] tracking-[0.25em] text-velora-textMuted uppercase font-sans">
              Private Social Club
            </span>
          </div>
        </Link>

        {/* Stable public navigation; member-only destinations are additive. */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary navigation">
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                pathname === "/"
                  ? "bg-white/10 text-velora-gold border border-velora-gold/30"
                  : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Home
            </Link>

            <Link
              href="/dating"
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                pathname.startsWith("/dating")
                  ? "bg-white/10 text-velora-gold border border-velora-gold/30"
                  : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"
              }`}
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
              Dating
            </Link>

            <Link href="/photos" className={`hidden xl:flex px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all items-center gap-2 ${pathname === "/photos" ? "bg-white/10 text-velora-gold border border-velora-gold/30" : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"}`}>
              <ImageIcon className="w-4 h-4" /> Photos
            </Link>
            <Link href="/videos" className={`hidden xl:flex px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all items-center gap-2 ${pathname === "/videos" ? "bg-white/10 text-velora-gold border border-velora-gold/30" : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"}`}>
              <Video className="w-4 h-4" /> Videos
            </Link>

            <Link
              href="/people"
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                pathname === "/people"
                  ? "bg-white/10 text-velora-gold border border-velora-gold/30"
                  : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4" />
              People
            </Link>

            {user && (
            <Link
              href="/search"
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                pathname === "/search"
                  ? "bg-white/10 text-velora-gold border border-velora-gold/30"
                  : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
            )}

            {user && (
            <Link
              href="/messages"
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                pathname === "/messages"
                  ? "bg-white/10 text-velora-gold border border-velora-gold/30"
                  : "text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {t("nav.messages")}
            </Link>
            )}
          </nav>

        {/* Right Section: Language Selector & Auth / Avatar Controls */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Notifications Trigger for Logged In User */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2.5 rounded-full bg-white/5 border border-white/10 text-velora-textSecondary hover:text-velora-gold hover:bg-white/10 transition-colors relative"
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

          {/* Global Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-velora-textPrimary hover:bg-white/10 transition-colors"
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
                <div className="px-3 py-1 text-[10px] uppercase font-bold text-velora-textMuted border-b border-white/10 mb-1">
                  Language / Jazyk
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                      language === lang.code
                        ? "bg-gold-gradient text-velora-bg font-bold"
                        : "text-velora-textPrimary hover:bg-white/10"
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
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/5 transition-colors"
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
                  <div className="px-4 py-3 border-b border-white/10 mb-1">
                    <p className="text-sm font-bold text-velora-textPrimary">{profile?.displayName || user.username}</p>
                    <p className="text-xs text-velora-textMuted truncate">{user.email}</p>
                    <div className="mt-2">
                      <Badge type={role === "CREATOR" ? "creator" : role === "COUPLE" ? "couple" : role === "ADMIN" ? "admin" : "verified"} />
                    </div>
                  </div>

                  <Link
                    href={`/profile/${profile?.id || "me"}`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5 rounded-xl font-medium"
                  >
                    <User className="w-4 h-4 text-velora-gold" />
                    My Profile
                  </Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=PHOTOS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5 rounded-xl font-medium"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-300" />
                    My Photos
                  </Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=VIDEOS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5 rounded-xl font-medium"
                  >
                    <Video className="w-4 h-4 text-emerald-400" />
                    My Videos
                  </Link>

                  <Link
                    href={`/profile/${profile?.id || "me"}?tab=ADS`}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5 rounded-xl font-medium"
                  >
                    <Megaphone className="w-4 h-4 text-rose-400" />
                    My Dating Ads
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5 rounded-xl"
                  >
                    <Settings className="w-4 h-4 text-velora-textMuted" />
                    Account Settings
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 rounded-xl mt-1 border-t border-white/5"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* CLEAN & HIGH-CONVERTING GUEST CTAS */
            <div className="flex items-center gap-3">
              <a
                href="/auth/login"
                className="px-4 py-2 rounded-full border border-velora-gold/40 text-velora-gold font-bold text-xs uppercase tracking-wider hover:bg-velora-gold/10 transition-all"
              >
                {t("auth.login")}
              </a>
              <a
                href="/auth/login?screen_hint=signup"
                className="px-6 py-2.5 rounded-full bg-gold-gradient text-velora-bg font-serif font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:scale-105 transition-all"
              >
                Join Intimo
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
