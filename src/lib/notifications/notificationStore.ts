import { NotificationItem } from "@/types";

const STORAGE_KEY = "intimo_notifications";

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    userId: "me",
    type: "VERIFICATION_APPROVED",
    title: "Identity Verification Active 🛡️",
    message: "Get verified today by uploading a selfie holding a handwritten note with 'INTIMO' and current date.",
    isRead: false,
    createdAt: "10 mins ago",
    targetLink: "/profile/me",
  },
  {
    id: "notif-2",
    userId: "me",
    type: "NEW_MESSAGE",
    title: "New Private Lounge Message 💬",
    message: "Alex sent you a new encrypted message: 'Hey! Are you free for drinks tonight?'",
    isRead: false,
    createdAt: "1 hour ago",
    targetLink: "/messages",
  },
  {
    id: "notif-3",
    userId: "me",
    type: "PROFILE_VIEW",
    title: "New Profile Visitor 👀",
    message: "Valerie from Munich viewed your verified Intimo profile.",
    isRead: true,
    createdAt: "Yesterday",
    targetLink: "/discovery",
  },
];

class NotificationStore {
  private notifications: NotificationItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          this.notifications = JSON.parse(saved);
          return;
        }
      } catch (err) {
        console.error("Failed to load notifications from localStorage", err);
      }
    }
    this.notifications = DEFAULT_NOTIFICATIONS;
  }

  private saveToStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
      } catch (err) {
        console.error("Failed to save notifications to localStorage", err);
      }
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
  }

  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.isRead).length;
  }

  markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, isRead: true }));
    this.notify();
  }

  markAsRead(id: string): void {
    this.notifications = this.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    this.notify();
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }

  clearAllNotifications(): void {
    this.notifications = [];
    this.notify();
  }

  addNotification(notification: Omit<NotificationItem, "id" | "createdAt">): void {
    const newNotif: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: "Just now",
    };
    this.notifications = [newNotif, ...this.notifications];
    this.notify();
  }
}

export const notificationStore = new NotificationStore();
