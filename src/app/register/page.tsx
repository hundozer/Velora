"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { UserRole } from "@/types";
import { ShieldCheck, UserCheck, Users, Sparkles, ArrowRight, CheckCircle2, Lock } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as UserRole) || "MEMBER";

  const { register } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    username: "",
    password: "",
  });

  const handleNextStep = () => {
    if (step === 1) {
      if (!ageConfirmed || !termsAgreed) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      register({
        displayName: formData.displayName || formData.username,
        email: formData.email,
        username: formData.username,
        role: role,
      });
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-gold-gradient text-velora-bg font-bold text-xs flex items-center justify-center shadow-gold-glow">
              {step}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-velora-gold font-serif">
              {step === 1 ? "Age & Consent" : step === 2 ? "Account Type" : "Account Credentials"}
            </span>
          </div>
          <span className="text-xs text-velora-textMuted uppercase tracking-widest">
            Step {step} of 3
          </span>
        </div>

        <Card variant="goldBorder" className="p-8 sm:p-10 space-y-8">
          {/* STEP 1: Age & Consent */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <ShieldCheck className="w-12 h-12 text-velora-gold mx-auto mb-2" />
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-velora-textPrimary">
                  Age & Discretion Agreement
                </h1>
                <p className="text-xs text-velora-textSecondary leading-relaxed">
                  Before applying for Velora membership, you must confirm your age and agree to our luxury community standards.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/10">
                <label className="flex items-start gap-3 p-4 glass-panel rounded-2xl cursor-pointer hover:border-velora-gold/40 transition-all">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-1 accent-velora-gold w-4 h-4 rounded"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-velora-textPrimary">I am 18 years of age or older</p>
                    <p className="text-velora-textMuted mt-0.5">
                      I certify under penalty of perjury that I am an adult of legal age in my jurisdiction.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 glass-panel rounded-2xl cursor-pointer hover:border-velora-gold/40 transition-all">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-1 accent-velora-gold w-4 h-4 rounded"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-velora-textPrimary">I agree to Velora Terms & Discretion Policy</p>
                    <p className="text-velora-textMuted mt-0.5">
                      I respect mutual consent, privacy of all members, non-disclosure, and strict copyright laws.
                    </p>
                  </div>
                </label>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full font-bold uppercase tracking-wider gap-2"
                disabled={!ageConfirmed || !termsAgreed}
                onClick={handleNextStep}
              >
                Continue to Account Type
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Role Selection */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-serif font-bold text-velora-textPrimary">
                  Select Your Membership Role
                </h1>
                <p className="text-xs text-velora-textSecondary">
                  Choose how you will participate in the Velora ecosystem. You can activate additional modes anytime.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Member Option */}
                <div
                  onClick={() => setRole("MEMBER")}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    role === "MEMBER"
                      ? "glass-panel-gold border-velora-gold shadow-gold-glow"
                      : "glass-panel hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-velora-textPrimary">Private Member</p>
                      <p className="text-xs text-velora-textMuted">Individual searching for discreet connections</p>
                    </div>
                  </div>
                  {role === "MEMBER" && <CheckCircle2 className="w-5 h-5 text-velora-gold" />}
                </div>

                {/* Couple Option */}
                <div
                  onClick={() => setRole("COUPLE")}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    role === "COUPLE"
                      ? "glass-panel-gold border-purple-500 shadow-gold-glow"
                      : "glass-panel hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-velora-textPrimary">Couple Profile</p>
                      <p className="text-xs text-velora-textMuted">Dual partner details & shared lifestyle preferences</p>
                    </div>
                  </div>
                  {role === "COUPLE" && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                </div>

                {/* Creator Option */}
                <div
                  onClick={() => setRole("CREATOR")}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    role === "CREATOR"
                      ? "glass-panel-gold border-amber-500 shadow-gold-glow"
                      : "glass-panel hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-velora-textPrimary">Creator Account</p>
                      <p className="text-xs text-velora-textMuted">Monetize exclusive albums, videos & live streams</p>
                    </div>
                  </div>
                  {role === "CREATOR" && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="gold" className="w-2/3 text-xs font-bold uppercase tracking-wider" onClick={handleNextStep}>
                  Proceed to Credentials
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Credentials */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-center space-y-2">
                <Badge type={role === "CREATOR" ? "creator" : role === "COUPLE" ? "couple" : "verified"} />
                <h1 className="text-2xl font-serif font-bold text-velora-textPrimary">
                  Create Your Velora Passkey
                </h1>
                <p className="text-xs text-velora-textSecondary">
                  Your credentials are encrypted with bank-grade security protocols.
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Display Name"
                  placeholder={role === "COUPLE" ? "e.g. Julian & Sophia" : "e.g. Elena Vance"}
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />

                <Input
                  label="Private Email Address"
                  type="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                  label="Handle / Username"
                  placeholder="elena_vance"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="gold" className="w-2/3 text-xs font-bold uppercase tracking-wider" onClick={handleNextStep}>
                  Create Account & Start Onboarding
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-velora-gold">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

