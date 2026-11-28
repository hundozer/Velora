"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import { ArrowLeft, Check } from "lucide-react";

/**
 * One-question-per-screen flow chrome: a thin progress bar, a back arrow,
 * a big question and an optional sticky action at the bottom.
 */
export function FlowScreen({ step, total, onBack, title, children, action, utility }: {
  step: number;
  total: number;
  onBack?: () => void;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  utility?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="intimo-member-page mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col px-4 pb-6 pt-4 sm:px-6">
      <div className="flex h-12 items-center gap-4">
        {onBack
          ? <button type="button" onClick={onBack} aria-label={t("Back")} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-velora-textPrimary hover:bg-ink/5"><ArrowLeft className="h-6 w-6" /></button>
          : <span className="h-11 w-9" />}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step}>
          <div className="h-full rounded-full bg-velora-accent transition-all duration-300" style={{ width: `${(step / total) * 100}%` }} />
        </div>
      </div>
      {utility && <div className="mt-3 flex flex-wrap items-center justify-end gap-2">{utility}</div>}
      <h1 className="mt-6 font-display text-[clamp(2.75rem,10vw,4rem)] leading-[1.02] text-velora-ink">{t(title)}</h1>
      <div className="mt-6 flex-1 space-y-3">{children}</div>
      {action && <div className="sticky bottom-0 -mx-4 mt-6 border-t border-velora-line bg-velora-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:-mx-6 sm:px-6">{action}</div>}
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
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-xl border text-left font-semibold text-velora-textPrimary transition-colors ${compact ? "min-h-14 px-3 text-sm sm:px-4 sm:text-base" : "min-h-16 px-5 text-lg"} ${selected ? "border-velora-accent bg-velora-accent/[0.06]" : "border-velora-line bg-velora-surface hover:border-velora-ink/30"}`}
    >
      {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center text-velora-gold">{icon}</span>}
      <span className="flex-1">{t(label)}</span>
      {selected && <Check className="h-6 w-6 shrink-0 text-velora-gold" aria-hidden />}
    </button>
  );
}

export function BigButton({ children, disabled, onClick, type = "button" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className="flex min-h-12 w-full items-center justify-center rounded-full bg-velora-warm px-8 text-lg font-semibold text-velora-paper transition hover:bg-velora-warmHover active:scale-[0.98] disabled:opacity-35">
      {children}
    </button>
  );
}

export const BigInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  function BigInput({ label, error, id, ...props }, ref) {
  const { t } = useTranslation();
    const inputId = id || label.toLowerCase().replace(/\W+/g, "-");
    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="block text-base font-semibold text-velora-textSecondary">{t(label)}</label>
        <input ref={ref} id={inputId} className={`min-h-16 w-full rounded-xl border bg-velora-surface px-4 text-lg [color-scheme:dark] text-velora-textPrimary placeholder:text-velora-textMuted focus:ring-2 focus:ring-velora-accent/30 ${error ? "border-velora-danger" : "border-velora-control focus:border-velora-accent"}`} {...props} />
        {error && <p role="alert" className="text-base text-velora-danger">{t(error)}</p>}
      </div>
    );
  },
);
