"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const AgeVerificationModal: React.FC = () => {
  const { isAgeVerified, confirmAge } = useAuth();
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (isAgeVerified) return null;

  return (
    <Modal isOpen={!isAgeVerified} onClose={() => {}} title="Welcome to Intimo" maxWidth="lg" showCloseButton={false}>
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 rounded-full bg-gold-gradient p-[1px] mx-auto shadow-gold-glow">
          <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-velora-gold" />
          </div>
        </div>

        <div className="mx-auto max-w-md">
          <h2 className="text-2xl sm:text-[1.7rem] font-serif font-bold gold-gradient-text">
            Age & Discretion Agreement
          </h2>
          <p className="mt-2 text-sm leading-6 text-velora-textSecondary">
            Intimo is a private, verified adult social platform for consenting adults aged 18 and older.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 text-left space-y-4 text-sm leading-5 text-velora-textSecondary">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-velora-gold shrink-0 mt-0.5" aria-hidden="true" />
            <span>I confirm that I am at least <strong>18 years of age</strong> (or legal majority in my jurisdiction).</span>
          </div>
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>I agree to uphold the community standards of mutual consent, privacy, and non-disclosure.</span>
          </div>
        </div>

        <div className="grid gap-3 pt-1 sm:grid-cols-[1.65fr_1fr]">
          <Button
            variant="gold"
            size="lg"
            className="min-h-14 w-full rounded-xl px-6 text-sm font-bold uppercase tracking-[0.12em]"
            disabled={submitting}
            onClick={async () => {
              setSubmitting(true);
              setError("");
              try { await confirmAge(); } catch { setError("We could not record your declaration. Please try again."); }
              finally { setSubmitting(false); }
            }}
          >
            {submitting ? "Recording declaration…" : "I am 18+ · Enter Intimo"}
          </Button>
          <a
            href="https://google.com"
            className="flex min-h-14 w-full items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-velora-textMuted transition-colors hover:border-white/20 hover:bg-white/5 hover:text-velora-textSecondary"
          >
            Exit Site
          </a>
        </div>
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>
    </Modal>
  );
};
