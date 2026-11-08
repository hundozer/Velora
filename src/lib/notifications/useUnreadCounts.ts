"use client";

import React from "react";
import { useMessageRealtime } from "@/lib/messaging/useMessageRealtime";

export type UnreadCounts = { messages: number; notifications: number };
const NONE: UnreadCounts = { messages: 0, notifications: 0 };
const REFRESH_MS = 60_000;

type BadgeNavigator = Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

/** The installed app's icon shows the same total (supported on iOS 16.4+, Android and desktop). */
function syncAppBadge(total: number) {
  const nav = navigator as BadgeNavigator;
  try {
    if (total > 0) nav.setAppBadge?.(total).catch(() => undefined);
    else nav.clearAppBadge?.().catch(() => undefined);
  } catch { /* badges are a nicety */ }
}

/**
 * Unread messages and notifications for the tab bar. Refreshes on navigation,
 * on new messages (Realtime), when the app comes back to the foreground and once
 * a minute while visible. The API applies blocks and account state.
 */
export function useUnreadCounts(profileId: string | undefined, pathname: string): UnreadCounts {
  const [counts, setCounts] = React.useState<UnreadCounts>(NONE);
  const inFlight = React.useRef(false);
  const again = React.useRef(false);
  // Bumped on sign-out/account change, so a late response can't restore old counts.
  const generation = React.useRef(0);

  const refresh = React.useCallback(() => {
    if (!profileId || document.visibilityState !== "visible") return;
    if (inFlight.current) { again.current = true; return; } // e.g. a read landed mid-request
    inFlight.current = true;
    const mine = generation.current;
    fetch("/api/messages/unread", { cache: "no-store", credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!payload || mine !== generation.current) return;
        const next = { messages: Number(payload.messages) || 0, notifications: Number(payload.notifications) || 0 };
        setCounts(next);
        syncAppBadge(next.messages + next.notifications);
      })
      .catch(() => undefined)
      .finally(() => {
        inFlight.current = false;
        if (again.current && mine === generation.current) { again.current = false; refresh(); }
      });
  }, [profileId]);

  React.useEffect(() => {
    generation.current += 1;
    again.current = false;
    if (!profileId) {
      // Signed out: never leave the previous member's count on the app icon.
      setCounts(NONE);
      syncAppBadge(0);
      return;
    }
  }, [profileId]);

  React.useEffect(() => {
    if (profileId) refresh();
  }, [profileId, pathname, refresh]);

  React.useEffect(() => {
    if (!profileId) return;
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [profileId, refresh]);

  useMessageRealtime(profileId, refresh, "tab-bar-unread");
  return counts;
}
