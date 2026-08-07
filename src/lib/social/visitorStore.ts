export interface ProfileVisitor {
  id: string;
  userId: string;
  name: string;
  genderSymbol: "♀" | "♂" | "👫";
  avatarUrl: string;
  isVerified: boolean;
  visitedAt: string;
  hasUnreadMessage?: boolean;
}

class VisitorStore {
  private visitors: ProfileVisitor[] = [];

  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getRecentVisitors(): ProfileVisitor[] {
    return [...this.visitors];
  }

  recordProfileVisit(visitor: Omit<ProfileVisitor, "id" | "visitedAt">): void {
    // Check if visitor already exists in list, move to top or insert
    const existingIdx = this.visitors.findIndex((v) => v.userId === visitor.userId || v.name === visitor.name);
    
    const newVisitor: ProfileVisitor = {
      ...visitor,
      id: `vis-${Date.now()}`,
      visitedAt: "Just now",
    };

    if (existingIdx !== -1) {
      this.visitors.splice(existingIdx, 1);
    }

    this.visitors = [newVisitor, ...this.visitors];
    this.notify();
  }
}

export const visitorStore = new VisitorStore();
