"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import {
  MOCK_VERIFICATION_REQUESTS,
  MOCK_REPORTS,
  MOCK_MODERATION_LOGS,
  MOCK_CREATOR_APPLICATIONS,
} from "@/lib/mockData";
import { VerificationRequest, ReportItem, ModerationLog, CreatorApplication } from "@/types";
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  UserCheck,
  Check,
  X,
  Eye,
  AlertTriangle,
  Users,
  Lock,
  Ban,
  Clock,
  Trash2,
  Crown,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("VERIFICATION");
  const [verifications, setVerifications] = useState<VerificationRequest[]>(MOCK_VERIFICATION_REQUESTS);
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>(MOCK_CREATOR_APPLICATIONS);
  const [logs, setLogs] = useState<ModerationLog[]>(MOCK_MODERATION_LOGS);

  const handleApproveVerification = (id: string) => {
    setVerifications(verifications.map((v) => (v.id === id ? { ...v, status: "VERIFIED" } : v)));
  };

  const handleRejectVerification = (id: string) => {
    setVerifications(verifications.map((v) => (v.id === id ? { ...v, status: "REJECTED" } : v)));
  };

  const handleApproveCreator = (id: string) => {
    setCreatorApps(creatorApps.map((c) => (c.id === id ? { ...c, status: "VERIFIED" } : c)));
  };

  const handleRejectCreator = (id: string) => {
    setCreatorApps(creatorApps.map((c) => (c.id === id ? { ...c, status: "REJECTED" } : c)));
  };

  const handleApplySanction = (reportId: string, actionType: string, username: string) => {
    setReports(reports.map((r) => (r.id === reportId ? { ...r, status: "RESOLVED" } : r)));

    const newLog: ModerationLog = {
      id: "log-" + Date.now(),
      adminUsername: "admin_compliance",
      targetUsername: username,
      action: actionType as any,
      reason: "Action enforced following compliance audit.",
      timestamp: "Just now",
    };
    setLogs([newLog, ...logs]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge type="admin" label="Administrator Portal" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-red-400" />
            Compliance, Verification & Moderation Desk
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Review 4-level verification requests, approve creator mode applications, investigate flags, and audit logs.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "VERIFICATION", label: "Verification Queue", count: verifications.filter((v) => v.status === "PENDING").length },
            { id: "CREATORS", label: "Creator Mode Applications", count: creatorApps.filter((c) => c.status === "PENDING").length },
            { id: "REPORTS", label: "Reports Investigation Desk", count: reports.filter((r) => r.status !== "RESOLVED").length },
            { id: "AUDIT", label: "Moderation Log History", count: logs.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Pending ID Verifications
          </span>
          <span className="text-3xl font-serif font-bold text-velora-gold">
            {verifications.filter((v) => v.status === "PENDING").length}
          </span>
          <span className="text-[11px] text-velora-textMuted">Avg response time: 12 mins</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Creator Mode Applications
          </span>
          <span className="text-3xl font-serif font-bold text-amber-400">
            {creatorApps.filter((c) => c.status === "PENDING").length}
          </span>
          <span className="text-[11px] text-velora-textMuted">Creator agreement required</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Moderation Flags
          </span>
          <span className="text-3xl font-serif font-bold text-red-400">
            {reports.filter((r) => r.status !== "RESOLVED").length}
          </span>
          <span className="text-[11px] text-velora-textMuted">Zero-tolerance policy</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Enforced Sanctions
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">{logs.length}</span>
          <span className="text-[11px] text-velora-textMuted">Audit trail active</span>
        </Card>
      </div>

      {/* VERIFICATION QUEUE TAB */}
      {activeTab === "VERIFICATION" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Level 1 to Level 4 Verification Queue
          </h2>

          <div className="space-y-4">
            {verifications.map((v) => (
              <Card key={v.id} variant="glass" className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-velora-textPrimary">@{v.user.username}</h3>
                      <Badge type="custom" label={v.requestedLevel.replace(/_/g, " ")} />
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        v.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300"
                          : v.status === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-velora-textMuted mt-0.5">
                      Submitted: {v.submittedAt} • Email: {v.user.email}
                    </p>
                  </div>

                  {v.status === "PENDING" && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => handleRejectVerification(v.id)}
                      >
                        <X className="w-3.5 h-3.5" /> Reject Request
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="text-xs font-bold gap-1"
                        onClick={() => handleApproveVerification(v.id)}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Verification
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {v.idDocumentUrl && (
                    <div className="p-4 glass-panel rounded-2xl space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">
                        Government ID Document
                      </span>
                      <div className="h-40 w-full bg-velora-card rounded-xl overflow-hidden relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.idDocumentUrl} alt="ID" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}

                  {v.selfieWithNoteUrl && (
                    <div className="p-4 glass-panel rounded-2xl space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">
                        Biometric Selfie Date Note
                      </span>
                      <div className="h-40 w-full bg-velora-card rounded-xl overflow-hidden relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.selfieWithNoteUrl} alt="Selfie" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* CREATOR APPLICATIONS TAB */}
      {activeTab === "CREATORS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Creator Mode Applications Review Queue
          </h2>

          <div className="space-y-4">
            {creatorApps.map((c) => (
              <Card key={c.id} variant="goldBorder" className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-velora-textPrimary">@{c.user.username}</h3>
                      <Badge type="custom" label="Creator Mode Request" className="bg-amber-500/20 text-amber-300 border-amber-500/40" />
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300"
                          : c.status === "VERIFIED"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-velora-textMuted mt-0.5">
                      Submitted: {c.submittedAt} • Email: {c.user.email} • Proposed Tier: ${c.proposedMonthlyPrice}/mo
                    </p>
                  </div>

                  {c.status === "PENDING" && (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => handleRejectCreator(c.id)}
                      >
                        <X className="w-3.5 h-3.5" /> Reject Creator Mode
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="text-xs font-bold gap-1"
                        onClick={() => handleApproveCreator(c.id)}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Creator Account
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-velora-textMuted">
                    <strong className="text-velora-textPrimary">Categories:</strong> {(c.categories || []).join(", ")}
                  </p>
                  <p className="text-velora-textMuted">
                    <strong className="text-velora-textPrimary">Payout Method:</strong> {c.payoutMethod} ({c.payoutDetails})
                  </p>
                  <p className="text-velora-textSecondary glass-panel p-4 rounded-2xl leading-relaxed">
                    "{c.bio}"
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* REPORTS INVESTIGATION TAB */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Reports Investigation & Sanction Desk
          </h2>

          <div className="space-y-4">
            {reports.map((r) => (
              <Card key={r.id} variant="glass" className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <h3 className="text-sm font-bold text-velora-textPrimary">
                        Reported User: @{r.reportedUsername}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300">
                        {r.reason}
                      </span>
                    </div>
                    <p className="text-xs text-velora-textMuted mt-1">
                      Filed by @{r.reporterUsername} on {r.submittedAt}
                    </p>
                  </div>

                  {r.status !== "RESOLVED" && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="glass"
                        size="sm"
                        className="text-[11px]"
                        onClick={() => handleApplySanction(r.id, "WARN_USER", r.reportedUsername)}
                      >
                        Warn User
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        className="text-[11px] border-amber-500/40 text-amber-300"
                        onClick={() => handleApplySanction(r.id, "SUSPEND_ACCOUNT_7_DAYS", r.reportedUsername)}
                      >
                        Suspend 7d
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-[11px] font-bold"
                        onClick={() => handleApplySanction(r.id, "BAN_USER_PERMANENT", r.reportedUsername)}
                      >
                        Permanent Ban
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-velora-textSecondary glass-panel p-4 rounded-2xl leading-relaxed">
                  {r.details}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODERATION HISTORY LOG TAB */}
      {activeTab === "AUDIT" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Moderation Action Audit Log
          </h2>

          <Card variant="glass" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-velora-textSecondary">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-velora-textMuted border-b border-white/10 pb-2">
                  <tr>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Admin</th>
                    <th className="py-2">Target User</th>
                    <th className="py-2">Enforced Action</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 font-bold text-velora-gold">@{log.adminUsername}</td>
                      <td className="py-3 text-velora-textPrimary font-semibold">@{log.targetUsername}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
