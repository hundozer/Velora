"use client";

import React from "react";
import { Bell, BellOff, Check, LockKeyhole } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { pushSupport, subscribeThisDevice, thisDeviceRegistered } from "@/lib/notifications/pushClient";
import { Sheet } from "@/components/editorial/Sheet";

const OFFER_KEY = "intimo-push-onboarding-v1";

/** Only ask once per account on an installed, supported PWA.
 * Never request OS permission from an effect; only the Allow button may do so.
 * Settings > Intimo on this device remains the permanent manual opt-in.
 */
export function InstalledAppNotificationOffer() {
  const pathname = usePathname();
  const { user, authState, ageCheckStatus, isStaff } = useAuth();
  const { t, language } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const key = user?.id ? `${OFFER_KEY}:${user.id}` : "";

  React.useEffect(() => {
    setOpen(false);
    if (!key || authState !== "ACTIVE" || (!isStaff && ageCheckStatus !== "AGE_VERIFIED")) return;
    // Never interrupt account flows, sensitive conversations or unfinished onboarding.
    if (pathname !== "/" && pathname !== "/people" && pathname !== "/activity") return;
    if (typeof window === "undefined") return;
    const installed = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!installed || pushSupport() !== "supported" || Notification.permission === "denied") return;
    try { if (localStorage.getItem(key) === "done") return; } catch { /* private mode */ }

    let cancelled = false;
    // The OS may already have a working subscription. Check both browser and
    // server to avoid showing an unnecessary offer to returning members.
    thisDeviceRegistered()
      .then((registered) => {
        if (cancelled) return;
        if (registered) {
          try { localStorage.setItem(key, "done"); } catch { /* private mode */ }
          return;
        }
        setOpen(true);
      })
      .catch(() => { /* subscription state uncertain: no intrusive prompt */ });
    return () => { cancelled = true; };
  }, [key, authState, ageCheckStatus, isStaff, pathname]);

  function finish() {
    setOpen(false);
    try { if (key) localStorage.setItem(key, "done"); } catch { /* private mode */ }
  }

  async function allow() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      // Must run synchronously in the direct tap path before asynchronous work.
      const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") {
        finish();
        return;
      }
      const outcome = await subscribeThisDevice(language);
      if (outcome === "ok") {
        finish();
      } else {
        // Keep the offer open for a retry, and retain the Settings fallback.
        setError(outcome === "unavailable"
          ? "Notifications aren't available yet. Try again in Settings."
          : "We couldn't enable notifications on this device. Try again or use Settings.");
      }
    } catch {
      setError("We couldn't enable notifications on this device. Try again or use Settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={finish} label={t("Get discreet notifications")}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button type="button" disabled={busy} onClick={finish} className="min-h-12 rounded-xl border border-velora-line px-4 text-sm font-semibold text-velora-ink disabled:opacity-60">{t("Not now")}</button>
          <button type="button" disabled={busy} onClick={() => void allow()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-velora-accent px-4 text-sm font-bold text-velora-paper disabled:opacity-60"><Bell size={17} aria-hidden />{t(busy ? "Enabling…" : "Allow notifications")}</button>
        </div>
      }>
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-velora-night text-velora-accent"><Bell size={26} aria-hidden /></span>
        <div>
          <h2 className="font-display text-3xl leading-tight text-velora-ink">{t("Stay in touch with Intimo.")}</h2>
          <p className="mt-1 text-sm text-velora-ink2">{t("Get a discreet alert when something happens, even when the app is closed.")}</p>
        </div>
      </div>
      <div className="mt-5 space-y-3 text-sm text-velora-ink2">
        <p className="flex items-center gap-3"><Check size={18} className="shrink-0 text-velora-accent" aria-hidden />{t("New messages and private-photo access updates")}</p>
        <p className="flex items-center gap-3"><LockKeyhole size={18} className="shrink-0 text-velora-accent" aria-hidden />{t("No names, message text or private details on your lock screen.")}</p>
        <p className="flex items-center gap-3"><BellOff size={18} className="shrink-0 text-velora-accent" aria-hidden />{t("You can switch notifications off in Settings whenever you like.")}</p>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl border border-velora-line p-3 text-sm text-velora-danger">{t(error)}</p>}
    </Sheet>
  );
}
