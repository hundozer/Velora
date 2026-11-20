"use client";

import React from "react";
import Image from "next/image";
import { Download, Share2, X, SquarePlus, Check } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { Sheet } from "@/components/editorial/Sheet";
import { detectDevice } from "@/lib/installGuide.mjs";

type NativeInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const DISMISSED_KEY = "intimo-pwa-banner-dismissed-until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

/** Compact, non-blocking install offer on the mobile landing page.
 * Android uses the native install prompt when available. iOS requires manual
 * browser steps; never imply that a button can silently install a PWA.
 */
export function MobileInstallBanner() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [device, setDevice] = React.useState<ReturnType<typeof detectDevice> | null>(null);
  const [prompt, setPrompt] = React.useState<NativeInstallPrompt | null>(null);
  const [visible, setVisible] = React.useState(false);
  const [guide, setGuide] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const detected = detectDevice(navigator.userAgent, { maxTouchPoints: navigator.maxTouchPoints, standalone });
    setDevice(detected);
    let dismissed = false;
    try { dismissed = Number(localStorage.getItem(DISMISSED_KEY) || 0) > Date.now(); } catch { /* private browsing */ }
    setVisible(!standalone && !dismissed && (detected.os === "ios" || detected.os === "android"));
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as NativeInstallPrompt); };
    const onInstalled = () => { setVisible(false); setGuide(false); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setGuide(false);
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now() + DISMISS_MS)); } catch { /* private browsing */ }
  };

  async function install() {
    if (device?.os === "android" && prompt && !device.inApp) {
      setBusy(true);
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") { setVisible(false); setGuide(false); }
        else setGuide(true);
      } catch { setGuide(true); }
      finally { setPrompt(null); setBusy(false); }
      return;
    }
    setGuide(true);
  }

  if (pathname !== "/" || !visible || !device) return null;
  const ios = device.os === "ios";
  return (
    <>
      <aside aria-label={t("Install Intimo on your phone")} className="md:hidden relative z-30 border-b border-velora-line bg-velora-night px-4 py-3 text-velora-onPhoto">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Image src="/icons/icon-192.png" width={48} height={48} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-velora-onPhoto">{t("Intimo on your phone")}</p>
            <p className="mt-1 text-xs leading-snug text-velora-onPhoto/70">{t("Add it to your home screen. Free and discreet.")}</p>
          </div>
          <button type="button" disabled={busy} onClick={() => void install()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl bg-velora-accent px-3 text-xs font-bold text-velora-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velora-accent disabled:opacity-50">
            <Download size={15} aria-hidden />{t("Install")}
          </button>
          <button type="button" onClick={dismiss} aria-label={t("Dismiss install banner")} className="flex h-11 w-8 shrink-0 items-center justify-center text-velora-onPhoto/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent"><X size={20} aria-hidden /></button>
        </div>
      </aside>
      <Sheet open={guide} onClose={() => setGuide(false)} label={t("Install Intimo on your phone")} footer={<button type="button" onClick={() => setGuide(false)} className="min-h-12 w-full rounded-xl bg-velora-accent px-5 font-semibold text-velora-paper">{t("Got it")}</button>}>
        <div className="flex items-center gap-3">
          <Image src="/icons/icon-192.png" width={56} height={56} alt="" className="h-14 w-14 rounded-xl" />
          <div>
            <h2 className="font-display text-3xl text-velora-ink">{t("Intimo on your home screen.")}</h2>
            <p className="text-sm text-velora-ink2">{t("No app store needed.")}</p>
          </div>
        </div>
        {device.inApp ? (
          <p className="mt-6 rounded-xl border border-velora-line bg-velora-night p-4 text-sm text-velora-onPhoto">{ios ? t("First open intimo.live in Safari, outside this app.") : t("First open intimo.live in Chrome, outside this app.")}</p>
        ) : ios && device.browser !== "safari" ? (
          <p className="mt-6 rounded-xl border border-velora-line bg-velora-night p-4 text-sm text-velora-onPhoto">{t("For these steps, open intimo.live in Safari.")}</p>
        ) : null}
        <ol className="mt-6 space-y-4 text-sm text-velora-ink">
          {(ios
            ? [
                { icon: <Share2 size={20} aria-hidden />, text: t("In Safari, tap Share in the browser toolbar.") },
                { icon: <SquarePlus size={20} aria-hidden />, text: t("Choose Add to Home Screen.") },
                { icon: <Check size={20} aria-hidden />, text: t("Tap Add, then open Intimo from your home screen.") },
              ]
            : [
                { icon: <Share2 size={20} aria-hidden />, text: t("Open your browser menu (three dots).") },
                { icon: <SquarePlus size={20} aria-hidden />, text: t("Choose Install app or Add to Home screen.") },
                { icon: <Check size={20} aria-hidden />, text: t("Confirm, then open Intimo from your home screen.") },
              ]).map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-velora-night text-velora-accent">{step.icon}</span>
              <span className="pt-2 leading-relaxed">{step.text}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-velora-muted">{t("The app opens full-screen. Your private information is not stored for offline viewing.")}</p>
      </Sheet>
    </>
  );
}
