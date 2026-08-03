"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NotificationItem } from "@/types";
import { MOCK_NOTIFICATIONS } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bell, Eye, Heart, MessageSquare, ShieldCheck, X } from "lucide-react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="absolute right-0 top-14 w-80 sm:w-96 glass-panel-gold rounded-3xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-left">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-velora-gold" />
          <h3 className="text-sm font-serif font-bold text-velora-textPrimary">Notifications</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-[10px] text-velora-gold hover:underline">
            Mark all read
          </button>
          <button onClick={onClose} className="p-1 rounded-full text-velora-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={n.targetLink || "/notifications"}
            onClick={onClose}
            className={`block p-3 rounded-2xl transition-all border ${
              !n.isRead ? "glass-panel-gold border-velora-gold/40" : "glass-panel hover:bg-white/5 border-transparent"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-velora-card border border-white/10 flex items-center justify-center shrink-0">
                {n.type === "PROFILE_VIEW" && <Eye className="w-4 h-4 text-blue-400" />}
                {n.type === "FAVORITED" && <Heart className="w-4 h-4 text-rose-400" />}
                {n.type === "VERIFICATION_APPROVED" && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                {n.type === "NEW_MESSAGE" && <MessageSquare className="w-4 h-4 text-velora-gold" />}
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-velora-textPrimary">{n.title}</span>
                  <span className="text-[10px] text-velora-textMuted">{n.createdAt}</span>
                </div>
                <p className="text-[11px] text-velora-textSecondary mt-0.5 leading-relaxed">
                  {n.message}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-3 border-t border-white/10 mt-3 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs text-velora-gold font-bold uppercase tracking-wider hover:underline"
        >
          View All Notifications →
        </Link>
      </div>
    </div>
  );
};
