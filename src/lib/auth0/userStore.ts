import { UserAccountModel, IdentityVerificationRequest } from "@/lib/auth/userModel";

/**
 * Interface defining user storage operations
 */
export interface IUserStore {
  findByAuth0Id(auth0UserId: string): UserAccountModel | undefined;
  findByEmail(email: string): UserAccountModel | undefined;
  findById(id: string): UserAccountModel | undefined;
  save(user: UserAccountModel): UserAccountModel;
  getAll(): UserAccountModel[];
  submitVerificationRequest(req: IdentityVerificationRequest): IdentityVerificationRequest;
  getVerificationRequests(): IdentityVerificationRequest[];
  approveVerification(requestId: string): boolean;
  rejectVerification(requestId: string, reason: string): boolean;
}

class InMemoryUserStore implements IUserStore {
  private usersByAuth0Id: Map<string, UserAccountModel> = new Map();
  private usersByEmail: Map<string, UserAccountModel> = new Map();
  private usersById: Map<string, UserAccountModel> = new Map();
  private verificationRequests: Map<string, IdentityVerificationRequest> = new Map();

  constructor() {
    // Initial mock verification requests for Admin Queue testing
    const sampleReq1: IdentityVerificationRequest = {
      id: "req-101",
      userId: "usr_alexander",
      userEmail: "alexander.v@intimo.live",
      userName: "Alexander V. (Monaco)",
      userAvatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      verificationPhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
      submittedAt: "10 mins ago",
      status: "PENDING",
    };

    const sampleReq2: IdentityVerificationRequest = {
      id: "req-102",
      userId: "usr_elena",
      userEmail: "elena.m@intimo.live",
      userName: "Elena M.",
      userAvatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      verificationPhotoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      submittedAt: "1 hour ago",
      status: "PENDING",
    };

    this.verificationRequests.set(sampleReq1.id, sampleReq1);
    this.verificationRequests.set(sampleReq2.id, sampleReq2);
  }

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

  public submitVerificationRequest(req: IdentityVerificationRequest): IdentityVerificationRequest {
    this.verificationRequests.set(req.id, req);

    // Update user record verification status to PENDING_REVIEW
    const user = this.findById(req.userId);
    if (user) {
      this.save({
        ...user,
        verificationStatus: "PENDING_REVIEW",
        verificationSubmittedAt: req.submittedAt,
        verificationPhotoUrl: req.verificationPhotoUrl,
      });
    }

    return req;
  }

  public getVerificationRequests(): IdentityVerificationRequest[] {
    return Array.from(this.verificationRequests.values());
  }

  public approveVerification(requestId: string): boolean {
    const req = this.verificationRequests.get(requestId);
    if (!req) return false;

    req.status = "APPROVED";
    req.reviewedAt = new Date().toISOString();

    const user = this.findById(req.userId);
    if (user) {
      this.save({
        ...user,
        verificationStatus: "IDENTITY_VERIFIED",
        role: "VERIFIED_MEMBER",
      });
    }

    return true;
  }

  public rejectVerification(requestId: string, reason: string): boolean {
    const req = this.verificationRequests.get(requestId);
    if (!req) return false;

    req.status = "REJECTED";
    req.reviewedAt = new Date().toISOString();
    req.rejectionReason = reason;

    const user = this.findById(req.userId);
    if (user) {
      this.save({
        ...user,
        verificationStatus: "REJECTED",
        verificationRejectionReason: reason,
      });
    }

    return true;
  }
}

export const userStore = new InMemoryUserStore();
