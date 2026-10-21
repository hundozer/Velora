"use client";

import React from "react";
import { Bell, Download, Smartphone } from "lucide-react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * Install Intimo and opt into device notifications (P1-23).
 * Nothing is requested automatically: permission is asked only after an explicit tap,
 * and push delivery itself arrives in Phase 2.
 */
export function AppOnThisDevice() {
  const [installPrompt, setInstallPrompt] = React.useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default");

  React.useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setPermission("Notification" in window ? Notification.permission : "unsupported");
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
    setPermission(await Notification.requestPermission());
  }

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-velora-textPrimary"><Smartphone className="h-4 w-4 text-velora-gold" aria-hidden />Intimo on this device</h2>
      {installed ? (
        <p className="text-xs text-velora-textSecondary">Installed. It opens like an app and shows only &ldquo;Intimo&rdquo; on your home screen.</p>
      ) : installPrompt ? (
        <button type="button" onClick={install} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gold-gradient px-4 text-xs font-bold text-velora-bg"><Download className="h-4 w-4" aria-hidden />Add to home screen</button>
      ) : isIos ? (
        <p className="text-xs text-velora-textSecondary">On iPhone: tap Share, then &ldquo;Add to Home Screen&rdquo;. The icon shows only &ldquo;Intimo&rdquo;.</p>
      ) : (
        <p className="text-xs text-velora-textSecondary">Use your browser menu → &ldquo;Install app&rdquo; or &ldquo;Add to home screen&rdquo;.</p>
      )}
      {permission !== "unsupported" && (
        <div className="space-y-1">
          {permission === "granted" ? (
            <p className="flex items-center gap-2 text-xs text-velora-success"><Bell className="h-3.5 w-3.5" aria-hidden />Notifications allowed on this device. They never show message text or names.</p>
          ) : permission === "denied" ? (
            <p className="text-xs text-velora-textMuted">Notifications are blocked in your browser settings.</p>
          ) : (
            <button type="button" onClick={enableNotifications} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-xs font-semibold text-velora-textSecondary hover:border-velora-gold/50"><Bell className="h-4 w-4" aria-hidden />Allow discreet notifications</button>
          )}
        </div>
      )}
    </section>
  );
}
