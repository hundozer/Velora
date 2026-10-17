"use client";

import React from "react";

export type DurableNotification = {
  id: string; type: string; title: string; message: string; actorName?: string | null;
  actorAvatar?: string | null; targetLink?: string | null; isRead: boolean; createdAt: string;
};

export function useDurableNotifications(enabled = true) {
  const [notifications, setNotifications] = React.useState<DurableNotification[]>([]);
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState("");
  const load = React.useCallback(() => {
    if (!enabled) { setNotifications([]); setLoading(false); return; }
    setLoading(true);
    fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Notifications unavailable");
      setNotifications(payload.notifications || []); setError("");
    }).catch((cause) => setError(cause.message || "Notifications unavailable")).finally(() => setLoading(false));
  }, [enabled]);
  React.useEffect(load, [load]);
  const update = React.useCallback(async (method: "PATCH" | "DELETE", target: { id?: string; all?: boolean }) => {
    const suffix = method === "DELETE" ? `?${target.all ? "all=true" : `id=${encodeURIComponent(target.id || "")}`}` : "";
    const response = await fetch(`/api/notifications${suffix}`, { method, credentials: "same-origin", headers: method === "PATCH" ? { "Content-Type": "application/json" } : undefined, body: method === "PATCH" ? JSON.stringify(target) : undefined });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || "Notification update failed"); }
    load();
  }, [load]);
  return { notifications, loading, error, unreadCount: notifications.filter((item) => !item.isRead).length, load, markRead: (id: string) => update("PATCH", { id }), markAllRead: () => update("PATCH", { all: true }), remove: (id: string) => update("DELETE", { id }), clear: () => update("DELETE", { all: true }) };
}
