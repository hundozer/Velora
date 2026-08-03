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
                  <span className="font-serif font-bold text-sm text-velora-gold">V</span>
                </div>
              </div>
              <span className="font-serif text-xl font-bold gold-gradient-text uppercase tracking-widest">
                Velora
              </span>
            </div>
            <p className="text-xs text-velora-textSecondary leading-relaxed max-w-md">
              Velora is an exclusive private social marketplace crafted for discerning adults. Built on principles of privacy, consent, safety, and modern social discovery.
            </p>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-velora-gold font-medium">
                <ShieldCheck className="w-4 h-4" />
                18+ Verified Adult
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <Lock className="w-4 h-4" />
                End-to-End Encrypted
              </div>
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium">
                <EyeOff className="w-4 h-4" />
                Discreet Billing
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
                  About Velora Club
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
                <Link href="/safety" className="hover:text-velora-textPrimary transition-colors">
                  2257 Record-Keeping
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-velora-textPrimary transition-colors">
                  GDPR & Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-velora-textPrimary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-velora-textPrimary transition-colors">
                  Content Moderation Guidelines
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-velora-textMuted gap-4">
          <p>© {new Date().getFullYear()} Velora International. All rights reserved. Strictly 18+.</p>
          <p className="tracking-widest uppercase">Elegance • Discretion • Authenticity</p>
        </div>
      </div>
    </footer>
  );
};
