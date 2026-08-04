class ConnectionStore {
  private followedUserIds: Set<string> = new Set(["prof-1", "prof-2"]); // Seed initial followed users
  private friendUserIds: Set<string> = new Set(["prof-2"]); // Seed initial mutual friends
  private pendingFriendRequests: Set<string> = new Set();
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

  isFollowing(userId: string): boolean {
    return this.followedUserIds.has(userId);
  }

  toggleFollow(userId: string): boolean {
    if (this.followedUserIds.has(userId)) {
      this.followedUserIds.delete(userId);
    } else {
      this.followedUserIds.add(userId);
    }
    this.notify();
    return this.followedUserIds.has(userId);
  }

  getFriendStatus(userId: string): "NONE" | "PENDING" | "FRIEND" {
    if (this.friendUserIds.has(userId)) return "FRIEND";
    if (this.pendingFriendRequests.has(userId)) return "PENDING";
    return "NONE";
  }

  toggleFriendRequest(userId: string): "NONE" | "PENDING" | "FRIEND" {
    const current = this.getFriendStatus(userId);
    if (current === "NONE") {
      this.pendingFriendRequests.add(userId);
    } else if (current === "PENDING") {
      this.pendingFriendRequests.delete(userId);
      this.friendUserIds.add(userId); // Accept for demo purpose
    } else if (current === "FRIEND") {
      this.friendUserIds.delete(userId);
    }
    this.notify();
    return this.getFriendStatus(userId);
  }

  getFollowedUserIds(): string[] {
    return Array.from(this.followedUserIds);
  }

  getFriendUserIds(): string[] {
    return Array.from(this.friendUserIds);
  }
}

export const connectionStore = new ConnectionStore();
