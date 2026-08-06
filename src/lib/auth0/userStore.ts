import { UserAccountModel, IdentityVerificationRequest } from "@/lib/auth/userModel";
import { ReportItem, CreatorApplication, PayoutRequest, RefundItem, ModerationLog } from "@/types";

/**
 * Interface defining user and admin governance storage operations
 */
export interface IUserStore {
  findByAuth0Id(auth0UserId: string): UserAccountModel | undefined;
  findByEmail(email: string): UserAccountModel | undefined;
  findById(id: string): UserAccountModel | undefined;
  save(user: UserAccountModel): UserAccountModel;
  getAll(): UserAccountModel[];
  
  // Identity Verifications
  submitVerificationRequest(req: IdentityVerificationRequest): IdentityVerificationRequest;
  getVerificationRequests(): IdentityVerificationRequest[];
  approveVerification(requestId: string): boolean;
  rejectVerification(requestId: string, reason: string): boolean;

  // Compliance Reports
  getReports(): ReportItem[];
  submitReport(report: Omit<ReportItem, "id" | "status" | "submittedAt">): ReportItem;
  updateReportStatus(reportId: string, status: ReportItem["status"]): boolean;

  // Creator Applications
  getCreatorApplications(): CreatorApplication[];
  submitCreatorApplication(app: CreatorApplication): CreatorApplication;
  approveCreatorApplication(appId: string): boolean;
  rejectCreatorApplication(appId: string): boolean;

  // Payouts
  getPayoutRequests(): PayoutRequest[];
  approvePayout(payoutId: string): boolean;
  rejectPayout(payoutId: string): boolean;

  // Refunds
  getRefundRequests(): RefundItem[];
  approveRefund(refundId: string): boolean;
  rejectRefund(refundId: string): boolean;

  // Moderation Audit Logs
  getModerationLogs(): ModerationLog[];
  addModerationLog(log: Omit<ModerationLog, "id" | "timestamp">): ModerationLog;
}

class InMemoryUserStore implements IUserStore {
  private usersByAuth0Id: Map<string, UserAccountModel> = new Map();
  private usersByEmail: Map<string, UserAccountModel> = new Map();
  private usersById: Map<string, UserAccountModel> = new Map();
  private verificationRequests: Map<string, IdentityVerificationRequest> = new Map();
  private reports: Map<string, ReportItem> = new Map();
  private creatorApplications: Map<string, CreatorApplication> = new Map();
  private payoutRequests: Map<string, PayoutRequest> = new Map();
  private refundRequests: Map<string, RefundItem> = new Map();
  private moderationLogs: ModerationLog[] = [];

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

    // Initial mock user reports
    const report1: ReportItem = {
      id: "rep-101",
      reporterUsername: "valerie_33",
      reportedUsername: "DODO0666",
      reportedUserRole: "MEMBER",
      reason: "Underage Suspicion (Strict Priority)",
      details: "This user profile claims to be 29 but in live streams they look significantly younger. Requesting safety team to audit ID documents.",
      submittedAt: "2 hours ago",
      status: "PENDING",
    };

    const report2: ReportItem = {
      id: "rep-102",
      reporterUsername: "alex_travels",
      reportedUsername: "spammer_vip",
      reportedUserRole: "MEMBER",
      reason: "Spam or Automated Solicitation",
      details: "Sending identical messages with offsite payment links to join external private groups.",
      submittedAt: "4 hours ago",
      status: "INVESTIGATING",
    };

    this.reports.set(report1.id, report1);
    this.reports.set(report2.id, report2);

    // Initial mock creator applications
    const creatorApp1: CreatorApplication = {
      id: "app-201",
      user: {
        id: "usr-lucas",
        username: "Lucas R.",
        email: "lucas.skipper@med-charters.com",
      },
      categories: ["Yacht Life", "Luxury Travel", "Male Fitness"],
      proposedMonthlyPrice: 9.99,
      bio: "Fictional Demo application. Yacht captain sharing sailing tips and fitness routines from the Mediterranean.",
      payoutMethod: "IBAN",
      payoutDetails: "IT89 VEN 0123 4567 8901 2345",
      status: "PENDING",
      submittedAt: "3 hours ago",
    };

    const creatorApp2: CreatorApplication = {
      id: "app-202",
      user: {
        id: "usr-elena",
        username: "Elena Vance",
        email: "elena.vance@riviera.live",
      },
      categories: ["Mediterranean Glamour", "Fine Wine"],
      proposedMonthlyPrice: 19.99,
      bio: "Fictional Demo application. Sharing Riviera sunset lifestyle, private wine tastings, and fashion collections.",
      payoutMethod: "Stripe Connect",
      payoutDetails: "acct_1NJ248FKH8A9SF",
      status: "PENDING",
      submittedAt: "Yesterday",
    };

    this.creatorApplications.set(creatorApp1.id, creatorApp1);
    this.creatorApplications.set(creatorApp2.id, creatorApp2);

    // Initial mock payouts
    const payout1: PayoutRequest = {
      id: "pay-301",
      username: "Valerie",
      amount: 1450.00,
      currency: "USD",
      payoutMethod: "SEPA Transfer",
      payoutDetails: "DE89 3704 0044 0532 0130 00",
      status: "PENDING",
      requestedAt: "5 hours ago",
    };

    const payout2: PayoutRequest = {
      id: "pay-302",
      username: "Chloe V.",
      amount: 890.50,
      currency: "USD",
      payoutMethod: "Stripe Instant Debit",
      payoutDetails: "card_1Nk23984fsd",
      status: "PENDING",
      requestedAt: "Yesterday",
    };

    this.payoutRequests.set(payout1.id, payout1);
    this.payoutRequests.set(payout2.id, payout2);

    // Initial mock refund requests
    const refund1: RefundItem = {
      id: "ref-401",
      username: "john_doe_99",
      productTitle: "Private Munich Dinner Salon - Event Ticket",
      amount: 150.00,
      reason: "Creator cancelled the attendance due to flight delays.",
      status: "PENDING",
      requestedAt: "3 hours ago",
    };

    const refund2: RefundItem = {
      id: "ref-402",
      username: "mark_gold",
      productTitle: "Valerie's Midnight Lace Album Unlock",
      amount: 25.00,
      reason: "Accidental double-click purchase due to connection latency.",
      status: "PENDING",
      requestedAt: "Yesterday",
    };

    this.refundRequests.set(refund1.id, refund1);
    this.refundRequests.set(refund2.id, refund2);

    // Initial moderation logs
    this.moderationLogs = [
      {
        id: "log-1",
        adminUsername: "admin_compliance",
        targetUsername: "bad_user_123",
        action: "BAN_USER_PERMANENT",
        reason: "Uploading non-consensual graphic images in public forums.",
        timestamp: "2 days ago",
      },
      {
        id: "log-2",
        adminUsername: "admin_finance",
        targetUsername: "Marcus & Sophia",
        action: "WARN_USER",
        reason: "Attempting to advertise offsite payment profiles (OnlyFans links) in stream title.",
        timestamp: "3 days ago",
      },
    ];
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

  // ── Verifications ──
  public submitVerificationRequest(req: IdentityVerificationRequest): IdentityVerificationRequest {
    this.verificationRequests.set(req.id, req);

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

  // ── Compliance Reports ──
  public getReports(): ReportItem[] {
    return Array.from(this.reports.values());
  }

  public submitReport(report: Omit<ReportItem, "id" | "status" | "submittedAt">): ReportItem {
    const newReport: ReportItem = {
      ...report,
      id: "rep-" + Date.now(),
      status: "PENDING",
      submittedAt: "Just now",
    };
    this.reports.set(newReport.id, newReport);
    return newReport;
  }

  public updateReportStatus(reportId: string, status: ReportItem["status"]): boolean {
    const report = this.reports.get(reportId);
    if (!report) return false;
    report.status = status;
    return true;
  }

  // ── Creator Applications ──
  public getCreatorApplications(): CreatorApplication[] {
    return Array.from(this.creatorApplications.values());
  }

  public submitCreatorApplication(app: CreatorApplication): CreatorApplication {
    this.creatorApplications.set(app.id, app);
    return app;
  }

  public approveCreatorApplication(appId: string): boolean {
    const app = this.creatorApplications.get(appId);
    if (!app) return false;
    app.status = "VERIFIED";

    const user = this.findById(app.user.id);
    if (user) {
      this.save({
        ...user,
        creatorStatus: "APPROVED",
        role: "VERIFIED_CREATOR",
      });
    }
    return true;
  }

  public rejectCreatorApplication(appId: string): boolean {
    const app = this.creatorApplications.get(appId);
    if (!app) return false;
    app.status = "REJECTED";

    const user = this.findById(app.user.id);
    if (user) {
      this.save({
        ...user,
        creatorStatus: "REJECTED",
      });
    }
    return true;
  }

  // ── Payouts ──
  public getPayoutRequests(): PayoutRequest[] {
    return Array.from(this.payoutRequests.values());
  }

  public approvePayout(payoutId: string): boolean {
    const req = this.payoutRequests.get(payoutId);
    if (!req) return false;
    req.status = "APPROVED";
    return true;
  }

  public rejectPayout(payoutId: string): boolean {
    const req = this.payoutRequests.get(payoutId);
    if (!req) return false;
    req.status = "REJECTED";
    return true;
  }

  // ── Refunds ──
  public getRefundRequests(): RefundItem[] {
    return Array.from(this.refundRequests.values());
  }

  public approveRefund(refundId: string): boolean {
    const req = this.refundRequests.get(refundId);
    if (!req) return false;
    req.status = "APPROVED";
    return true;
  }

  public rejectRefund(refundId: string): boolean {
    const req = this.refundRequests.get(refundId);
    if (!req) return false;
    req.status = "REJECTED";
    return true;
  }

  // ── Moderation Audit Logs ──
  public getModerationLogs(): ModerationLog[] {
    return this.moderationLogs;
  }

  public addModerationLog(log: Omit<ModerationLog, "id" | "timestamp">): ModerationLog {
    const newLog: ModerationLog = {
      ...log,
      id: "log-" + Date.now(),
      timestamp: "Just now",
    };
    this.moderationLogs = [newLog, ...this.moderationLogs];
    return newLog;
  }
}

export const userStore = new InMemoryUserStore();
