"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notificationStore } from "@/lib/notifications/notificationStore";
import { NotificationItem } from "@/types";
import { Bell, Eye, Heart, MessageSquare, ShieldCheck, Check, Trash2 } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    notificationStore.getNotifications()
  );

  useEffect(() => {
    setNotifications(notificationStore.getNotifications());
    const unsubscribe = notificationStore.subscribe(() => {
      setNotifications(notificationStore.getNotifications());
    });
    return unsubscribe;
  }, []);

  const handleMarkRead = (id: string) => {
    notificationStore.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    notificationStore.markAllAsRead();
  };

  const handleRemove = (id: string) => {
    notificationStore.removeNotification(id);
  };

  const handleClearAll = () => {
    notificationStore.clearAllNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-velora-gold" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
              Activity & Notifications
            </h1>
            <p className="text-xs text-velora-textSecondary mt-1">
              Profile views, saved favorites, encrypted messages, and account verification updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notificationStore.getUnreadCount() > 0 && (
            <Button
              variant="glass"
              size="sm"
              className="text-xs border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="glass"
              size="sm"
              className="text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 gap-1.5"
              onClick={handleClearAll}
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card variant="glass" className="p-12 text-center text-xs text-velora-textMuted italic">
            You have no activity notifications.
          </Card>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              variant={!n.isRead ? "goldBorder" : "glass"}
              className={`p-6 space-y-3 flex items-center justify-between gap-4 transition-all ${
                !n.isRead ? "bg-amber-400/5" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-velora-card border border-white/10 flex items-center justify-center shrink-0">
                  {n.type === "PROFILE_VIEW" && <Eye className="w-5 h-5 text-blue-400" />}
                  {n.type === "FAVORITED" && <Heart className="w-5 h-5 text-rose-400" />}
                  {n.type === "VERIFICATION_APPROVED" && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                  {n.type === "NEW_MESSAGE" && <MessageSquare className="w-5 h-5 text-velora-gold" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-velora-textPrimary flex items-center gap-2">
                      {n.title}
                      {!n.isRead && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400 text-black uppercase font-mono">
                          Unread
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] text-velora-textMuted">• {n.createdAt}</span>
                  </div>
                  <p className="text-xs text-velora-textSecondary mt-1 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {n.targetLink && (
                  <Link href={n.targetLink} onClick={() => handleMarkRead(n.id)}>
                    <Button variant="gold" size="sm" className="text-xs font-bold">
                      View
                    </Button>
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-2 rounded-full glass-panel text-velora-textMuted hover:text-white"
                    title="Mark as Read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleRemove(n.id)}
                  className="p-2 rounded-full glass-panel text-velora-textMuted hover:text-red-400 transition-colors"
                  title="Remove Notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
