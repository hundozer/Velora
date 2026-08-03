"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";
import { NotificationItem } from "@/types";
import { Bell, Eye, Heart, MessageSquare, ShieldCheck, Check } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
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

        <Button
          variant="glass"
          size="sm"
          className="text-xs"
          onClick={() => setNotifications(notifications.map((n) => ({ ...n, isRead: true })))}
        >
          Mark All Read
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <Card
            key={n.id}
            variant={!n.isRead ? "goldBorder" : "glass"}
            className="p-6 space-y-3 flex items-center justify-between gap-4"
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
                  <h3 className="text-sm font-bold text-velora-textPrimary">{n.title}</h3>
                  <span className="text-[10px] text-velora-textMuted">• {n.createdAt}</span>
                </div>
                <p className="text-xs text-velora-textSecondary mt-1 leading-relaxed">
                  {n.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {n.targetLink && (
                <Link href={n.targetLink}>
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
