import { UserAccountModel } from "@/lib/auth/userModel";

/**
 * Interface defining user storage operations
 */
export interface IUserStore {
  findByAuth0Id(auth0UserId: string): UserAccountModel | undefined;
  findByEmail(email: string): UserAccountModel | undefined;
  findById(id: string): UserAccountModel | undefined;
  save(user: UserAccountModel): UserAccountModel;
  getAll(): UserAccountModel[];
}

class InMemoryUserStore implements IUserStore {
  private usersByAuth0Id: Map<string, UserAccountModel> = new Map();
  private usersByEmail: Map<string, UserAccountModel> = new Map();
  private usersById: Map<string, UserAccountModel> = new Map();

  public findByAuth0Id(auth0UserId: string): UserAccountModel | undefined {
    return this.usersByAuth0Id.get(auth0UserId);
  }

  public findByEmail(email: string): UserAccountModel | undefined {
    return this.usersByEmail.get(email.toLowerCase());
  }

  public findById(id: string): UserAccountModel | undefined {
    return this.usersById.get(id);
  }

  public save(user: UserAccountModel): UserAccountModel {
    const updated = {
      ...user,
      updatedAt: new Date().toISOString(),
    };

    if (updated.auth0_user_id) {
      this.usersByAuth0Id.set(updated.auth0_user_id, updated);
    }
    this.usersByEmail.set(updated.email.toLowerCase(), updated);
    this.usersById.set(updated.id, updated);

    return updated;
  }

  public getAll(): UserAccountModel[] {
    return Array.from(this.usersById.values());
  }
}

export const userStore = new InMemoryUserStore();
