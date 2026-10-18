"use client";

import React from "react";
import { ArrowLeft, Check } from "lucide-react";

/**
 * One-question-per-screen flow chrome: a thin progress bar, a back arrow,
 * a big question and an optional sticky action at the bottom.
 */
export function FlowScreen({ step, total, onBack, title, children, action }: {
  step: number;
  total: number;
  onBack?: () => void;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-5 pb-6 pt-4">
      <div className="flex h-12 items-center gap-4">
        {onBack
          ? <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-velora-textPrimary hover:bg-ink/5"><ArrowLeft className="h-6 w-6" /></button>
          : <span className="h-11 w-9" />}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step}>
          <div className="h-full rounded-full bg-velora-accent transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
      <h1 className="mt-8 font-display text-5xl leading-[1.02] text-velora-ink sm:text-6xl">{title}</h1>
      <div className="mt-8 flex-1 space-y-3">{children}</div>
      {action && <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-velora-bg via-velora-bg to-transparent px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">{action}</div>}
    </div>
  );
}

/** A big tappable answer. Single-choice screens advance on tap. */
export function ChoiceCard({ label, icon, selected, onClick, compact = false }: {
  label: React.ReactNode;
  icon?: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-3xl border-2 text-left font-semibold text-velora-textPrimary transition active:scale-[0.98] ${compact ? "min-h-16 px-5 text-lg" : "min-h-20 px-6 text-xl"} ${selected ? "border-velora-accent bg-velora-accent/[0.06]" : "border-velora-line bg-velora-surface hover:border-velora-ink/30"}`}
    >
      {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center text-velora-gold">{icon}</span>}
      <span className="flex-1">{label}</span>
      {selected && <Check className="h-6 w-6 shrink-0 text-velora-gold" aria-hidden />}
    </button>
  );
}

export function BigButton({ children, disabled, onClick, type = "button" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className="flex min-h-16 w-full items-center justify-center rounded-full bg-velora-accent px-8 text-lg font-semibold text-velora-paper transition hover:bg-velora-accentHover active:scale-[0.98] disabled:opacity-35">
      {children}
    </button>
  );
}

export const BigInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  function BigInput({ label, error, id, ...props }, ref) {
    const inputId = id || label.toLowerCase().replace(/\W+/g, "-");
    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-base font-semibold text-velora-textSecondary">{label}</label>
        <input ref={ref} id={inputId} className={`min-h-16 w-full rounded-3xl border bg-velora-surface px-6 text-2xl [color-scheme:dark] text-velora-textPrimary placeholder:text-velora-textMuted focus:outline-none ${error ? "border-red-600" : "border-velora-line focus:border-velora-accent"}`} {...props} />
        {error && <p role="alert" className="text-base text-red-700">{error}</p>}
      </div>
    );
  },
);
