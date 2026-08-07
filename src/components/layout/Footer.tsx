"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full glass-panel border-t border-white/10 mt-20 bg-velora-bg/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Philosophy */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-gradient p-[1px]">
                <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
                  <span className="font-serif font-bold text-sm text-velora-gold">I</span>
                </div>
              </div>
              <span className="font-serif text-xl font-bold gold-gradient-text uppercase tracking-widest">
                Intimo
              </span>
            </div>
            <p className="text-xs text-velora-textSecondary leading-relaxed max-w-md">
              Intimo is a free adults-only social discovery platform built around privacy, consent, safety, and transparent discovery.
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-velora-gold font-medium">
                <ShieldCheck className="w-4 h-4" />
                18+ Verified Adult
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <Lock className="w-4 h-4" />
                Secure Sessions
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                <EyeOff className="w-4 h-4" />
                Privacy Center
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-velora-gold mb-4 font-serif">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-xs text-velora-textSecondary">
              <li>
                <Link href="/about" className="hover:text-velora-textPrimary transition-colors">
                  About Intimo Club
                </Link>
              </li>
              <li>
                <Link href="/discovery" className="hover:text-velora-textPrimary transition-colors">
                  Discovery Marketplace
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-velora-textPrimary transition-colors">
                  Safety & Ethics Policy
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-velora-textPrimary transition-colors">
                  Verification Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-velora-gold mb-4 font-serif">
              Compliance
            </h4>
            <ul className="space-y-2.5 text-xs text-velora-textSecondary">
              <li>
                <Link href="/legal/privacy-policy" className="hover:text-velora-textPrimary transition-colors">
                  Privacy Policy (Draft)
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-velora-textPrimary transition-colors">
                  Terms of Service (Draft)
                </Link>
              </li>
              <li>
                <Link href="/legal/cookie-policy" className="hover:text-velora-textPrimary transition-colors">
                  Cookie Policy (Draft)
                </Link>
              </li>
              <li>
                <Link href="/legal/moderation" className="hover:text-velora-textPrimary transition-colors">
                  Moderation & Appeals (Draft)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-velora-textMuted gap-4">
          <p>© {new Date().getFullYear()} Intimo International. All rights reserved. Strictly 18+.</p>
          <p className="tracking-widest uppercase">Elegance • Discretion • Authenticity</p>
        </div>
      </div>
    </footer>
  );
};
