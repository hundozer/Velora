import React from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient p-[2px] shadow-gold-glow">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-velora-bg">
              <span className="select-none font-serif text-2xl font-bold gold-gradient-text">I</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">{title}</h1>
          {subtitle && <p className="text-sm text-velora-textSecondary">{subtitle}</p>}
        </div>
        <div className="space-y-5 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl backdrop-blur-xl sm:p-8">{children}</div>
        {footer && <div className="text-center text-sm text-velora-textSecondary">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthField({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{label}</label>
      <input id={id} name={id} className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-base text-velora-textPrimary placeholder:text-velora-textMuted focus:border-velora-gold/60 focus:outline-none focus:ring-1 focus:ring-velora-gold/60" {...props} />
    </div>
  );
}

export function AuthMessage({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={tone === "error" ? "rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200" : "rounded-xl border border-velora-gold/30 bg-velora-gold/10 px-4 py-3 text-sm text-velora-textPrimary"}>
      {children}
    </p>
  );
}

export const submitClass = "inline-flex min-h-12 w-full items-center justify-center rounded-full border border-velora-amber/40 bg-gold-gradient px-6 text-sm font-bold uppercase tracking-[0.12em] text-velora-bg shadow-gold-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

/** Supabase error messages are user-safe but terse; map the common ones. */
export function friendlyAuthError(message: string | undefined): string {
  const text = (message || "").toLowerCase();
  if (text.includes("invalid login credentials")) return "That email and password don't match.";
  if (text.includes("email not confirmed")) return "Confirm your email first — check your inbox for the link.";
  if (text.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (text.includes("rate limit") || text.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (text.includes("password")) return message || "Choose a stronger password.";
  return "Something went wrong. Please try again.";
}
