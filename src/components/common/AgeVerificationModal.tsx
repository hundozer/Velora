"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Mandatory 18+ gate. A full screen with one question and two answers; the
 * declaration is recorded server-side by confirmAge before anything shows.
 */
export const AgeVerificationModal: React.FC = () => {
  const { isAgeVerified, confirmAge } = useAuth();
  const dialog = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isAgeVerified) return;
    const previous = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>("button")?.focus());
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog.current) return;
      const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"));
      const first = focusable[0]; const last = focusable.at(-1);
      if (!first || !last) { event.preventDefault(); return; }
      const outside = !dialog.current.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || outside)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || outside)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; opener?.focus(); };
  }, [isAgeVerified]);

  if (isAgeVerified) return null;

  async function confirm() {
    setSubmitting(true);
    setError("");
    try { await confirmAge(); } catch { setError("That didn't work. Try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="age-gate-title" className="fixed inset-0 z-[200] flex flex-col bg-velora-bg">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-10">
        <p className="font-display text-3xl text-velora-ink">Intimo</p>
        <h1 id="age-gate-title" className="mt-6 font-display text-6xl leading-[1.02] text-velora-ink">Are you 18 or older?</h1>
        <p className="mt-4 text-lg text-velora-textSecondary">Intimo is for consenting adults. What you see here stays here.</p>
        <div className="mt-10 space-y-3">
          <button type="button" autoFocus disabled={submitting} onClick={confirm} className="flex min-h-20 w-full items-center justify-center rounded-3xl bg-velora-accent px-6 text-xl font-semibold text-velora-paper transition active:scale-[0.98] disabled:opacity-60">
            {submitting ? "One moment…" : "Yes, I'm 18+"}
          </button>
          <a href="https://www.google.com" className="flex min-h-20 w-full items-center justify-center rounded-3xl border border-velora-line bg-velora-surface px-6 text-xl font-semibold text-velora-ink2 transition hover:border-velora-ink/30">
            No, take me out
          </a>
        </div>
        {error && <p role="alert" className="mt-4 text-base text-velora-danger">{error}</p>}
      </div>
    </div>
  );
};
