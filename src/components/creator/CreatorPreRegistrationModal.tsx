"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Sparkles,
  Crown,
  X,
  CheckCircle2,
  ShieldCheck,
  Upload,
  CreditCard,
  Banknote,
  FileText,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface CreatorPreRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatorPreRegistrationModal({
  isOpen,
  onClose,
}: CreatorPreRegistrationModalProps) {
  const { user, profile } = useAuth();
  const [stageName, setStageName] = useState(profile?.displayName || user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("Contemporary Art & Photography");
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !stageName.trim()) return;
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <Card variant="goldBorder" className="w-full max-w-2xl p-6 sm:p-8 space-y-6 text-left bg-velora-card relative shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-velora-textMuted hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-white/10 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest inline-flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> CREATOR PROGRAM — COMING SOON
            </span>
            <span className="text-[11px] text-amber-400 font-mono font-bold">• 0% Commission Launch Perk</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Pre-Register Your Intent as an Intimo Creator
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Direct creator registration is launching soon. Express your interest today to lock in early access, verified creator status, and 0% platform fees during our launch period.
          </p>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center mx-auto shadow-gold-glow">
              <CheckCircle2 className="w-8 h-8 text-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-serif font-bold text-white">Creator Intent Recorded!</h3>
              <p className="text-xs text-amber-200">
                You are <span className="font-mono font-bold text-amber-400">#142</span> on the Early Access Creator Waitlist.
              </p>
            </div>
            <p className="text-xs text-velora-textMuted max-w-md mx-auto leading-relaxed">
              We have reserved your stage name <strong className="text-white">&quot;{stageName}&quot;</strong> and will send launch instructions to <strong className="text-white">{email}</strong> as soon as creator onboarding opens.
            </p>
            <div className="pt-2">
              <Button variant="gold" size="sm" onClick={onClose} className="text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                Done & Return to Marketplace
              </Button>
            </div>
          </div>
        ) : (
          /* Infographic & Pre-Registration Form */
          <div className="space-y-6">
            {/* Visual 5-Step Infographic */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                How Becoming an Intimo Creator Works (5 Simple Steps):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {/* Step 1 */}
                <div className="p-3 rounded-2xl bg-black/40 border border-amber-400/30 text-center space-y-1.5 relative group hover:border-amber-400 transition-all">
                  <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center mx-auto border border-amber-400/40">
                    1
                  </div>
                  <div className="text-xs font-bold text-white">1. Register</div>
                  <p className="text-[10px] text-velora-textMuted leading-tight">Pre-register profile & creator intent</p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-2xl bg-black/40 border border-purple-500/30 text-center space-y-1.5 relative group hover:border-purple-400 transition-all">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center mx-auto border border-purple-500/40">
                    2
                  </div>
                  <div className="text-xs font-bold text-white">2. Get Verified</div>
                  <p className="text-[10px] text-velora-textMuted leading-tight">Manually reviewed Photo Verified badge</p>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-2xl bg-black/40 border border-sky-500/30 text-center space-y-1.5 relative group hover:border-sky-400 transition-all">
                  <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center mx-auto border border-sky-500/40">
                    3
                  </div>
                  <div className="text-xs font-bold text-white">3. Upload</div>
                  <p className="text-[10px] text-velora-textMuted leading-tight">Photo, 4K video & live salons</p>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded-2xl bg-black/40 border border-emerald-500/30 text-center space-y-1.5 relative group hover:border-emerald-400 transition-all">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center mx-auto border border-emerald-500/40">
                    4
                  </div>
                  <div className="text-xs font-bold text-white">4. Users Buy</div>
                  <p className="text-[10px] text-velora-textMuted leading-tight">Subscriptions & PPV media</p>
                </div>

                {/* Step 5 */}
                <div className="p-3 rounded-2xl bg-black/40 border border-amber-400/50 text-center space-y-1.5 relative group hover:border-amber-400 transition-all">
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center mx-auto shadow-gold-glow">
                    5
                  </div>
                  <div className="text-xs font-bold text-amber-300">5. Get Paid</div>
                  <p className="text-[10px] text-velora-textMuted leading-tight">Direct payouts to your bank account</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Express Your Creator Intent:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-velora-textMuted">Stage / Creator Display Name</label>
                  <Input
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. Elena Vance, Velvet Night"
                    required
                    className="w-full text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-velora-textMuted">Contact Email for Launch</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@domain.com"
                    required
                    className="w-full text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-velora-textMuted">Primary Content Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="Contemporary Art & Photography">Contemporary Art & Photography</option>
                  <option value="Erotic Photography & Journals">Erotic Photography & Journals</option>
                  <option value="Fine Art Nude">Fine Art Nude</option>
                  <option value="Lifestyle & Luxury Experiences">Lifestyle & Luxury Experiences</option>
                  <option value="Salon Live Performances & Concerts">Salon Live Performances & Concerts</option>
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                  required
                />
                <span className="text-xs text-velora-textSecondary">
                  Pre-register my intent & notify me when Creator Registration opens with 0% launch fees.
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="glass" size="sm" onClick={onClose} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" variant="gold" size="sm" className="text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                  Submit Creator Pre-Registration
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
}
