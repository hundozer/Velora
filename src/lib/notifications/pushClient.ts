"use client";

// Browser side of web push. Permission itself is requested only in
// AppOnThisDevice, after an explicit tap; these helpers never prompt.

export type PushSupport = "supported" | "needs-install" | "unsupported";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) return "unsupported";
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // iPhone and iPad deliver web push only to apps added to the Home Screen.
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone) return "needs-install";
  return "PushManager" in window ? "supported" : "unsupported";
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  return existing || navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function currentPushSubscription() {
  if (pushSupport() !== "supported") return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? reg.pushManager.getSubscription() : null;
}

function keyBytes(base64url: string) {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

/** Registers this device for push. Call only after permission is "granted". */
export async function subscribeThisDevice(locale: string): Promise<"ok" | "unavailable" | "failed"> {
  try {
    const config = await fetch("/api/push/subscription", { credentials: "same-origin", cache: "no-store" }).then((response) => (response.ok ? response.json() : null));
    if (!config?.enabled || !config.publicKey) return "unavailable";
    const reg = await registration();
    await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) subscription = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(config.publicKey) });
    const response = await fetch("/api/push/subscription", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), locale }),
    });
    return response.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
}

/**
 * Stops push on this device for this account (also used on sign-out).
 * The browser unsubscribes first, with no network involved: from then on the push
 * service rejects deliveries (404/410) and the server deletes the row on its next
 * attempt, so a slow or failed request can't leave a shared device notifying.
 * The server DELETE is a keepalive request that survives the sign-out navigation.
 */
export async function unsubscribeThisDevice(): Promise<void> {
  let subscription: PushSubscription | null = null;
  try { subscription = await currentPushSubscription(); } catch { return; }
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => false);
  void fetch("/api/push/subscription", {
    method: "DELETE", credentials: "same-origin", keepalive: true, headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
}

/** True only when this browser is subscribed AND the server has it on file for this member. */
export async function thisDeviceRegistered(): Promise<boolean> {
  const subscription = await currentPushSubscription();
  if (!subscription) return false;
  const response = await fetch(`/api/push/subscription?endpoint=${encodeURIComponent(subscription.endpoint)}`, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) return false;
  const payload = await response.json().catch(() => null);
  return payload?.thisDevice === true;
}
