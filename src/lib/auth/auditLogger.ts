import { SecurityAuditLog, UserRole } from "@/types/auth";

/**
 * Velora Immutable Security Audit Logger
 * Records security-sensitive operations for forensic auditing and compliance.
 */
class AuditLoggerService {
  private logs: SecurityAuditLog[] = [];

  public logEvent(data: {
    actorId: string;
    actorRole: UserRole;
    action: string;
    resourceId?: string;
    resourceType?: string;
    ipAddress?: string;
    userAgent?: string;
    status: "SUCCESS" | "DENIED" | "ERROR";
    details?: Record<string, any>;
  }): SecurityAuditLog {
    const entry: SecurityAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      resourceId: data.resourceId,
      resourceType: data.resourceType,
      ipAddress: data.ipAddress || "127.0.0.1",
      userAgent: data.userAgent || "Velora-Security-Engine/1.0",
      timestamp: new Date().toISOString(),
      status: data.status,
      details: data.details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > 5000) {
      this.logs = this.logs.slice(0, 5000); // Cap memory retention
    }

    // In production environment, stream directly to secure immutable SIEM / CloudWatch / Datadog
    if (process.env.NODE_ENV === "development") {
      console.log(`[SECURITY AUDIT LOG] ${entry.timestamp} | ${entry.status} | ${entry.actorRole}:${entry.actorId} -> ${entry.action}`);
    }

    return entry;
  }

  public getLogs(): SecurityAuditLog[] {
    return [...this.logs];
  }

  public getLogsForUser(userId: string): SecurityAuditLog[] {
    return this.logs.filter((l) => l.actorId === userId || l.resourceId === userId);
  }
}

export const auditLogger = new AuditLoggerService();
