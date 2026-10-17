"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Heart, Compass, LogIn, ShieldAlert } from "lucide-react";

export default function GoodbyePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 text-left relative overflow-hidden bg-intimo-bg">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-velora-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />

      <Card variant="goldBorder" className="w-full max-w-lg p-8 relative z-10 space-y-6 text-center bg-velora-card/60 backdrop-blur-md shadow-2xl">
        {/* Golden Broken Heart Render Image */}
        <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border border-velora-gold/30 shadow-2xl bg-black flex items-center justify-center group">
          <Image
            src="/goodbye.jpg" 
            alt="Goodbye" 
            width={192}
            height={192}
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-105 group-hover:scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="space-y-3">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 inline-block animate-pulse">
            Account Permanently Erased
          </span>
          <h2 className="text-3xl font-serif font-bold text-velora-textPrimary tracking-wide">
            We're Sad to See You Go! 💔
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed max-w-sm mx-auto">
            Was it something we said? Or did you finally find &quot;The One&quot;? Either way, we hope your journey was absolutely spectacular.
          </p>
        </div>

        {/* Informative details */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left text-xs text-velora-textMuted space-y-2 leading-relaxed font-mono">
          <div className="flex items-start gap-2 text-[11px]">
            <Heart className="w-4 h-4 text-velora-gold shrink-0 mt-0.5" />
            <span>Your account deletion request was accepted. Profile data, messages, and media follow the documented deletion/anonymization workflow and any legitimate safety or legal retention duties.</span>
          </div>
          <div className="flex items-start gap-2 text-[11px]">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>We respect your Right to be Forgotten. No hidden trackers, backups, or legacy footings remain. You are officially off the grid.</span>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="pt-2 space-y-3">
          <Link href="/register" className="block">
            <Button
              variant="gold"
              size="lg"
              className="w-full font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-black" />
              Start Fresh & Re-Register
            </Button>
          </Link>

          <Link href="/" className="block">
            <Button
              variant="glass"
              size="md"
              className="w-full text-xs border-white/10 hover:border-velora-gold/30 flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 text-velora-gold" />
              Return to Landing Page
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
