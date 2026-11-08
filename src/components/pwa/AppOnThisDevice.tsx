"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import { Bell, BellOff, Download, Smartphone } from "lucide-react";
import { pushSupport, thisDeviceRegistered, subscribeThisDevice, unsubscribeThisDevice, type PushSupport } from "@/lib/notifications/pushClient";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Install Intimo and opt into discreet device notifications (P1-23, web push).
 * Nothing is requested automatically: permission is asked only after an explicit tap.
 */
export function AppOnThisDevice() {
  const { t, language } = useTranslation();
  const [installPrompt, setInstallPrompt] = React.useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default");
  const [support, setSupport] = React.useState<PushSupport>("unsupported");
  const [subscribed, setSubscribed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [problem, setProblem] = React.useState("");

  React.useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setPermission("Notification" in window ? Notification.permission : "unsupported");
    setSupport(pushSupport());
    // A browser subscription alone isn't enough: the server must have it, or show Allow again.
    thisDeviceRegistered().then(setSubscribed).catch(() => setSubscribed(false));
    const onPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    setProblem("");
    setBusy(true);
    try {
      const next = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      setPermission(next);
      if (next !== "granted" || support !== "supported") return;
      const result = await subscribeThisDevice(language);
      setSubscribed(result === "ok");
      if (result === "unavailable") setProblem("Notifications aren't available yet. Try again later.");
      if (result === "failed") setProblem("This device couldn't be set up for notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disableNotifications() {
    setBusy(true);
    await unsubscribeThisDevice();
    setSubscribed(false);
    setBusy(false);
  }

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-velora-textPrimary"><Smartphone className="h-4 w-4 text-velora-gold" aria-hidden />{t("Intimo on this device")}</h2>
      {installed ? (
        <p className="text-xs text-velora-textSecondary">{t("Installed. It opens like an app and shows only “Intimo” on your home screen.")}</p>
      ) : installPrompt ? (
        <button type="button" onClick={install} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gold-gradient px-4 text-xs font-bold text-velora-bg"><Download className="h-4 w-4" aria-hidden />{t("Add to home screen")}</button>
      ) : isIos ? (
        <p className="text-xs text-velora-textSecondary">{t("On iPhone: tap Share, then “Add to Home Screen”. The icon shows only “Intimo”.")}</p>
      ) : (
        <p className="text-xs text-velora-textSecondary">{t("Use your browser menu → “Install app” or “Add to home screen”.")}</p>
      )}
      {support === "needs-install" ? (
        <p className="flex items-center gap-2 text-xs text-velora-textMuted"><Bell className="h-3.5 w-3.5" aria-hidden />{t("To get notifications on iPhone, add Intimo to your Home Screen first, then open it from there.")}</p>
      ) : permission !== "unsupported" && (
        <div className="space-y-2">
          {permission === "denied" ? (
            <p className="text-xs text-velora-textMuted">{t("Notifications are blocked in your browser settings.")}</p>
          ) : subscribed ? (
            <>
              <p className="flex items-center gap-2 text-xs text-velora-success"><Bell className="h-3.5 w-3.5" aria-hidden />{t("Notifications are on for this device. They never show message text or names.")}</p>
              <button type="button" onClick={disableNotifications} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-xs font-semibold text-velora-textSecondary hover:border-velora-gold/50 disabled:opacity-50"><BellOff className="h-4 w-4" aria-hidden />{t("Turn off on this device")}</button>
            </>
          ) : (
            <button type="button" onClick={enableNotifications} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-xs font-semibold text-velora-textSecondary hover:border-velora-gold/50 disabled:opacity-50"><Bell className="h-4 w-4" aria-hidden />{t("Allow discreet notifications")}</button>
          )}
          {problem && <p className="text-xs text-velora-danger" role="alert">{t(problem)}</p>}
        </div>
      )}
    </section>
  );
}
