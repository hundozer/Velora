import React from "react";
import Link from "next/link";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-10 font-serif text-2xl font-bold gold-gradient-text">Intimo</Link>
      <h1 className="font-serif text-4xl font-bold leading-tight text-velora-textPrimary sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 text-lg text-velora-textSecondary">{subtitle}</p>}
      <div className="mt-10 space-y-5">{children}</div>
      {footer && <div className="mt-8 text-lg text-velora-textSecondary">{footer}</div>}
    </div>
  );
}

export function AuthField({ id, label, ...props }: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-base font-semibold text-velora-textSecondary">{label}</label>
      <input id={id} name={id} className="min-h-16 w-full rounded-3xl border-2 border-white/10 bg-white/[0.04] px-6 text-xl text-velora-textPrimary placeholder:text-velora-textMuted focus:border-velora-gold focus:outline-none" {...props} />
    </div>
  );
}

export function AuthMessage({ tone, children }: { tone: "error" | "info"; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={tone === "error" ? "rounded-2xl bg-red-500/10 px-5 py-4 text-base text-red-200" : "rounded-2xl bg-velora-gold/10 px-5 py-4 text-base text-velora-textPrimary"}>
      {children}
    </p>
  );
}

export const submitClass = "flex min-h-16 w-full items-center justify-center rounded-full bg-gold-gradient px-8 text-lg font-bold text-velora-bg shadow-gold-glow transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

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

/** Asks the server to email an auth link; it never reveals whether an account exists. */
export async function requestAuthEmail(payload: { action: "signup" | "magiclink" | "recovery"; email: string; password?: string; adult?: boolean; terms?: boolean; next?: string }): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (response.ok) return null;
    const body = await response.json().catch(() => ({}));
    return typeof body.error === "string" ? body.error : "Something went wrong. Please try again.";
  } catch {
    return "Check your connection and try again.";
  }
}
