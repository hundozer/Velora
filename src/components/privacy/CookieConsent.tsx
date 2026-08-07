"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Preferences = { necessary: true; analytics: boolean; marketing: boolean };
const COOKIE = "intimo_cookie_consent";

export function CookieConsent() {
  const [open, setOpen] = React.useState(false);
  const [manage, setManage] = React.useState(false);
  const [preferences, setPreferences] = React.useState<Preferences>({ necessary: true, analytics: false, marketing: false });

  React.useEffect(() => {
    setOpen(!document.cookie.split("; ").some((item) => item.startsWith(`${COOKIE}=`)));
  }, []);

  const save = (next: Preferences) => {
    const value = encodeURIComponent(JSON.stringify({ ...next, version: "cookie-v1-draft", timestamp: new Date().toISOString() }));
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE}=${value}; Max-Age=15552000; Path=/; SameSite=Lax${secure}`;
    window.dispatchEvent(new CustomEvent("intimo:cookie-consent", { detail: next }));
    setPreferences(next);
    setOpen(false);
  };

  if (!open) return null;
  return (
    <section role="dialog" aria-modal="true" aria-labelledby="cookie-title" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-velora-gold/40 bg-velora-bg p-5 shadow-2xl">
      <h2 id="cookie-title" className="text-base font-bold text-white">Cookie preferences</h2>
      <p className="mt-2 text-xs leading-relaxed text-velora-textSecondary">Necessary authentication and security cookies operate to provide the service. Optional analytics and marketing are off unless you choose them. Intimo does not currently activate marketing tracking.</p>
      {manage && <div className="mt-4 space-y-2">
        <label className="flex justify-between rounded-xl border border-white/10 p-3 text-xs"><span><strong>Necessary</strong><span className="block text-velora-textMuted">Authentication, security and consent storage</span></span><input type="checkbox" checked disabled aria-label="Necessary cookies always enabled" /></label>
        <label className="flex justify-between rounded-xl border border-white/10 p-3 text-xs"><span><strong>Analytics</strong><span className="block text-velora-textMuted">Privacy-preserving product measurement only</span></span><input type="checkbox" checked={preferences.analytics} onChange={(event) => setPreferences({ ...preferences, analytics: event.target.checked })} /></label>
        <label className="flex justify-between rounded-xl border border-white/10 p-3 text-xs"><span><strong>Marketing</strong><span className="block text-velora-textMuted">Currently unused</span></span><input type="checkbox" checked={preferences.marketing} onChange={(event) => setPreferences({ ...preferences, marketing: event.target.checked })} /></label>
      </div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="gold" onClick={() => save({ necessary: true, analytics: true, marketing: true })}>Accept all</Button>
        <Button size="sm" variant="glass" onClick={() => save({ necessary: true, analytics: false, marketing: false })}>Reject non-essential</Button>
        {manage ? <Button size="sm" variant="outline" onClick={() => save(preferences)}>Save preferences</Button> : <Button size="sm" variant="ghost" onClick={() => setManage(true)}>Manage preferences</Button>}
        <Link href="/legal/cookie-policy" className="self-center text-xs text-velora-gold underline">Cookie policy</Link>
      </div>
    </section>
  );
}
