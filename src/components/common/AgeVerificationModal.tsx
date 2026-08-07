"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AgeVerificationModal: React.FC = () => {
  const { isAgeVerified, confirmAge } = useAuth();

  if (isAgeVerified) return null;

  return (
    <Modal isOpen={!isAgeVerified} onClose={() => {}} title="Welcome to Intimo" maxWidth="md">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-gold-gradient p-[1px] mx-auto shadow-gold-glow">
          <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-velora-gold" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold gold-gradient-text">
            Age & Discretion Agreement
          </h2>
          <p className="text-xs text-velora-textSecondary mt-2 leading-relaxed">
            Intimo is a private, verified adult social platform for consenting adults aged 18 and older.
          </p>
          <p className="text-[11px] text-amber-300 mt-2 leading-relaxed">
            This declaration is an initial access gate, not stronger age verification. Some explicit-content features remain unavailable until appropriate age assurance is implemented.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl text-left space-y-3 text-xs text-velora-textSecondary">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-velora-gold shrink-0 mt-0.5" />
            <span>I confirm that I am at least <strong>18 years of age</strong> (or legal majority in my jurisdiction).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>I agree to uphold the community standards of mutual consent, privacy, and non-disclosure.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="gold"
            size="lg"
            className="w-full font-bold uppercase tracking-wider"
            onClick={confirmAge}
          >
            I am 18+ • Enter Intimo
          </Button>
          <a
            href="https://google.com"
            className="w-full px-5 py-3 text-xs text-center uppercase tracking-wider text-velora-textMuted hover:text-velora-textSecondary transition-colors flex items-center justify-center"
          >
            Exit Site
          </a>
        </div>
      </div>
    </Modal>
  );
};
