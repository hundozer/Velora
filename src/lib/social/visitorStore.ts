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
  private visitors: ProfileVisitor[] = [
    {
      id: "vis-1",
      userId: "prof-1",
      name: "vrs",
      genderSymbol: "♂",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      isVerified: true,
      visitedAt: "10 mins ago",
    },
    {
      id: "vis-2",
      userId: "prof-2",
      name: "Miss_Mysterious",
      genderSymbol: "♀",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      isVerified: true,
      visitedAt: "25 mins ago",
    },
    {
      id: "vis-3",
      userId: "prof-3",
      name: "Belive10",
      genderSymbol: "♀",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
      isVerified: true,
      visitedAt: "1 hour ago",
    },
    {
      id: "vis-4",
      userId: "prof-4",
      name: "I understand.",
      genderSymbol: "♀",
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80",
      isVerified: true,
      visitedAt: "3 hours ago",
    },
    {
      id: "vis-5",
      userId: "prof-5",
      name: "DODO0666",
      genderSymbol: "♂",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      isVerified: true,
      hasUnreadMessage: true,
      visitedAt: "Yesterday",
    },
  ];

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
