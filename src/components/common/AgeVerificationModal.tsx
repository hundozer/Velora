"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Mandatory 18+ gate. A full screen with one question and two answers; the
 * declaration is recorded server-side by confirmAge before anything shows.
 */
export const AgeVerificationModal: React.FC = () => {
  const { isAgeVerified, confirmAge } = useAuth();
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isAgeVerified) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [isAgeVerified]);

  if (isAgeVerified) return null;

  async function confirm() {
    setSubmitting(true);
    setError("");
    try { await confirmAge(); } catch { setError("That didn't work. Try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="age-gate-title" className="fixed inset-0 z-[200] flex flex-col bg-velora-bg">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-10">
        <p className="font-serif text-2xl font-bold gold-gradient-text">Intimo</p>
        <h1 id="age-gate-title" className="mt-6 font-serif text-5xl font-bold leading-tight text-velora-textPrimary">Are you 18 or older?</h1>
        <p className="mt-4 text-lg text-velora-textSecondary">Intimo is for consenting adults. What you see here stays here.</p>
        <div className="mt-10 space-y-3">
          <button type="button" autoFocus disabled={submitting} onClick={confirm} className="flex min-h-20 w-full items-center justify-center rounded-3xl bg-gold-gradient px-6 text-xl font-bold text-velora-bg shadow-gold-glow transition active:scale-[0.98] disabled:opacity-60">
            {submitting ? "One moment…" : "Yes, I'm 18+"}
          </button>
          <a href="https://www.google.com" className="flex min-h-20 w-full items-center justify-center rounded-3xl border-2 border-white/10 px-6 text-xl font-semibold text-velora-textSecondary transition hover:border-white/30">
            No, take me out
          </a>
        </div>
        {error && <p role="alert" className="mt-4 text-base text-red-300">{error}</p>}
      </div>
    </div>
  );
};
