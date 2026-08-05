import { NotificationItem } from "@/types";

const STORAGE_KEY = "intimo_notifications";

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

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
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Filter out any legacy fake/demo notifications
            this.notifications = parsed.filter(
              (n: any) =>
                n.id !== "notif-1" &&
                n.id !== "notif-2" &&
                n.id !== "notif-3" &&
                !n.message?.includes("Prince Charming") &&
                !n.message?.includes("Alex sent you a new encrypted message") &&
                !n.message?.includes("Alex viewed your Intimo profile") &&
                !n.message?.includes("Valerie from Munich")
            );
            this.saveToStorage();
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load notifications from localStorage", err);
      }
    }
    this.notifications = [];
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
