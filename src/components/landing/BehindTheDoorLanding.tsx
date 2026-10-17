"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

/**
 * Shared progressive-authentication boundary for member-only screens.
 * Public community discovery remains available through the links below.
 */
export function BehindTheDoorLanding() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-4xl items-center px-4 py-12 sm:px-6">
      <section className="w-full rounded-2xl border border-white/10 bg-[#11151e] p-6 text-center sm:p-10">
        <LockKeyhole className="mx-auto h-9 w-9 text-amber-300" aria-hidden="true" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Member action</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-white">Sign in to continue</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
          This screen contains account-specific activity. You can browse public people, albums, photos, videos, and dating classifieds without signing in.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/auth/login" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-5 text-sm font-bold text-slate-950">Sign in</Link>
          <Link href="/auth/login?screen_hint=signup" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-semibold text-white">Join Intimo free<ArrowRight className="h-4 w-4" /></Link>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white">Browse public community</Link>
        </div>
      </section>
    </main>
  );
}
