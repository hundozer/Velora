"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { NotificationItem } from "@/types";
import { notificationStore } from "@/lib/notifications/notificationStore";
import { Bell, Eye, Heart, MessageSquare, ShieldCheck, X, Trash2 } from "lucide-react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    notificationStore.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationStore.clearAllNotifications();
  };

  const handleItemClick = (id: string) => {
    notificationStore.markAsRead(id);
    onClose();
  };

  const handleRemoveItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    notificationStore.removeNotification(id);
  };

  return (
    <div className="absolute right-0 top-14 w-80 sm:w-96 glass-panel-gold rounded-3xl p-5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 text-left bg-velora-card/95 backdrop-blur-xl border border-velora-gold/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-velora-gold" />
          <h3 className="text-sm font-serif font-bold text-velora-textPrimary">Notifications</h3>
          {notificationStore.getUnreadCount() > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
              {notificationStore.getUnreadCount()} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {notificationStore.getUnreadCount() > 0 && (
            <button onClick={handleMarkAllRead} className="text-[10px] text-velora-gold hover:underline font-semibold">
              Mark read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-[10px] text-red-400 hover:underline font-semibold flex items-center gap-0.5"
              title="Clear all notifications"
            >
              Clear all
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-full text-velora-textMuted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className="text-xs text-velora-textMuted text-center py-8 italic">No notifications.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`group relative rounded-2xl transition-all border ${
                !n.isRead ? "bg-amber-400/10 border-amber-400/40 shadow-sm" : "glass-panel hover:bg-white/5 border-transparent"
              }`}
            >
              <Link
                href={n.targetLink || "/notifications"}
                onClick={() => handleItemClick(n.id)}
                className="block p-3 pr-8"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-velora-card border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    {n.type === "PROFILE_VIEW" && <Eye className="w-4 h-4 text-blue-400" />}
                    {n.type === "FAVORITED" && <Heart className="w-4 h-4 text-rose-400" />}
                    {n.type === "VERIFICATION_APPROVED" && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                    {n.type === "NEW_MESSAGE" && <MessageSquare className="w-4 h-4 text-velora-gold" />}
                  </div>

                  <div className="flex-1 text-xs min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 truncate">
                        {n.title}
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                      </span>
                      <span className="text-[10px] text-velora-textMuted font-mono shrink-0 ml-1">{n.createdAt}</span>
                    </div>
                    <p className="text-[11px] text-velora-textSecondary mt-0.5 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Individual Delete Button */}
              <button
                onClick={(e) => handleRemoveItem(e, n.id)}
                className="absolute top-3 right-2 p-1 text-velora-textMuted hover:text-red-400 hover:bg-white/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Remove notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pt-3 border-t border-white/10 mt-3 text-center">
        <Link
          href="/notifications"
          onClick={onClose}
          className="text-xs text-velora-gold font-bold uppercase tracking-wider hover:underline"
        >
          View All Activity & Notifications →
        </Link>
      </div>
    </div>
  );
};
