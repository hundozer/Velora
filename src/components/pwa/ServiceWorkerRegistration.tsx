"use client";

import { useEffect } from "react";

/** Registers the minimal service worker (offline page + discreet push) in production builds. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    // Opening Intimo clears the home-screen badge a push may have set.
    const clearBadge = () => { if (document.visibilityState === "visible" && "clearAppBadge" in navigator) (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => undefined); };
    clearBadge();
    document.addEventListener("visibilitychange", clearBadge);
    return () => document.removeEventListener("visibilitychange", clearBadge);
  }, []);
  return null;
}
