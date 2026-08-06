"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/context/AuthContext";
import { userStore } from "@/lib/auth0/userStore";
import { LANGUAGES } from "@/context/LanguageContext";
import {
  MOCK_LIVE_STREAMS,
  MOCK_COMMUNITIES,
} from "@/lib/mockData";
import {
  VerificationRequest,
  ReportItem,
  ModerationLog,
  CreatorApplication,
  PayoutRequest,
  RefundItem,
  LiveStream,
  CommunityItem,
} from "@/types";
import {
  ShieldCheck,
  ShieldAlert,
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
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  Radio,
  Globe,
  BarChart3,
  TrendingUp,
  Activity,
  Languages as LanguagesIcon,
  CheckCircle2,
  ShieldX,
  Plus,
  AlertOctagon,
  Flame,
  Key,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, role, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState("VERIFICATIONS");

  // Load state from userStore
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);

  // Local streams & communities
  const [streams, setStreams] = useState<LiveStream[]>(MOCK_LIVE_STREAMS);
  const [communities, setCommunities] = useState<CommunityItem[]>(MOCK_COMMUNITIES);

  // Modals & inputs
  const [rejectionModalTarget, setRejectionModalTarget] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [reportModalTarget, setReportModalTarget] = useState<ReportItem | null>(null);
  const [reportActionReason, setReportActionReason] = useState("");
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Load data from userStore on mount and when changes happen
  const refreshData = () => {
    setVerificationRequests(userStore.getVerificationRequests());
    setReports(userStore.getReports());
    setCreatorApps(userStore.getCreatorApplications());
    setPayouts(userStore.getPayoutRequests());
    setRefunds(userStore.getRefundRequests());
    setLogs(userStore.getModerationLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- ACTIONS ---

  // Identity Verification
  const handleApproveVerification = (id: string, name: string) => {
    userStore.approveVerification(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: name,
      action: "WARN_USER", // mapping placeholder
      reason: "Identity photo verification approved and Level 3 biometric badge issued.",
    });
    refreshData();
  };

  const handleRejectVerification = (id: string) => {
    if (!rejectionReasonInput.trim()) return;
    const req = verificationRequests.find((r) => r.id === id);
    userStore.rejectVerification(id, rejectionReasonInput.trim());
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: req?.userName || "unknown_member",
      action: "WARN_USER",
      reason: `Identity photo verification rejected: ${rejectionReasonInput.trim()}`,
    });
    setRejectionModalTarget(null);
    setRejectionReasonInput("");
    refreshData();
  };

  // Creator Applications
  const handleApproveCreatorApp = (id: string, username: string) => {
    userStore.approveCreatorApplication(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_onboarding",
      targetUsername: username,
      action: "WARN_USER",
      reason: "Creator Onboarding application approved. Upgraded account role to VERIFIED_CREATOR.",
    });
    refreshData();
  };

  const handleRejectCreatorApp = (id: string, username: string) => {
    userStore.rejectCreatorApplication(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_onboarding",
      targetUsername: username,
      action: "WARN_USER",
      reason: "Creator Onboarding application rejected due to incomplete banking details or classification guidelines.",
    });
    refreshData();
  };

  // Compliance Reports
  const handleResolveReport = (report: ReportItem, actionType: any, reason: string) => {
    if (!reason.trim()) return;
    
    // Resolve report in store
    userStore.updateReportStatus(report.id, "RESOLVED");

    // Add moderation log
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: report.reportedUsername,
      action: actionType,
      reason: `${report.reason} report resolved: ${reason.trim()}`,
    });

    setReportModalTarget(null);
    setReportActionReason("");
    refreshData();
  };

  const handleDismissReport = (id: string, reportedUsername: string) => {
    userStore.updateReportStatus(id, "DISMISSED");
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: reportedUsername,
      action: "REMOVE_CONTENT",
      reason: "Compliance report dismissed after administrative review.",
    });
    refreshData();
  };

  // Payouts
  const handleApprovePayout = (id: string, username: string, amount: number) => {
    userStore.approvePayout(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Creator payout request of $${amount.toFixed(2)} approved for processing.`,
    });
    refreshData();
  };

  const handleRejectPayout = (id: string, username: string) => {
    userStore.rejectPayout(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Creator payout request rejected. Placed earnings on standard security hold.`,
    });
    refreshData();
  };

  // Refunds
  const handleApproveRefund = (id: string, username: string, amount: number, product: string) => {
    userStore.approveRefund(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Approved refund of $${amount.toFixed(2)} for product: ${product}.`,
    });
    refreshData();
  };

  const handleRejectRefund = (id: string, username: string, product: string) => {
    userStore.rejectRefund(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Rejected refund request for product: ${product}.`,
    });
    refreshData();
  };

  // Streams
  const handleSuspendStream = (streamId: string, title: string, host: string) => {
    setStreams(streams.map((s) => (s.id === streamId ? { ...s, status: "SUSPENDED" } : s)));
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: host,
      action: "SUSPEND_LIVE_STREAM",
      reason: `Emergency compliance suspension of live stream: "${title}".`,
    });
    refreshData();
  };

  // Communities
  const handleDeleteCommunityPost = (postId: string, communitySlug: string) => {
    // Audit log
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: `Community: ${communitySlug}`,
      action: "REMOVE_COMMUNITY_POST",
      reason: `Administrative removal of discussion post #${postId} due to safety report.`,
    });
    refreshData();
  };

  // ── ROLE GATE & LOCK SCREEN ──
  const isAdminAuthorized = role === "ADMIN";

  if (!isAdminAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Card variant="goldBorder" className="p-8 space-y-6 bg-velora-card/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-velora-gold/5 rounded-full blur-2xl" />
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8 text-velora-gold" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
              Access Restriction Gate
            </h2>
            <p className="text-xs text-velora-textMuted max-w-sm mx-auto leading-relaxed">
              You are attempting to access the Administrative Governance Portal. This route requires elevated credentials (e.g. `SYSTEM_ADMIN` or `CONTENT_MODERATOR`).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5">
            <span className="text-[10px] font-bold text-velora-gold uppercase tracking-wider block">
              Identity Management status
            </span>
            <div className="flex justify-between text-xs text-velora-textSecondary">
              <span>Current Account Email:</span>
              <span className="text-white font-mono">{user?.email || "anonymous@intimo.live"}</span>
            </div>
            <div className="flex justify-between text-xs text-velora-textSecondary">
              <span>Assigned RBAC Role:</span>
              <span className="text-red-400 font-bold font-mono">{role}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="gold"
              size="md"
              className="w-full font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2"
              onClick={() => switchRole("ADMIN")}
            >
              <Key className="w-4 h-4 text-black" />
              Simulate Login as System Admin
            </Button>
            <Link href="/dashboard" className="block text-xs text-velora-textMuted hover:text-velora-gold underline">
              Return to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // --- RENDERING TABS ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge type="admin" label="Administrator Portal" />
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Authorized Sandbox Session
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            Identity Verification & Governance Desk
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Review member verification selfies, process creator applications, resolve user reports, supervise streams, and authorize payments.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "VERIFICATIONS", label: "Verification Queue", count: verificationRequests.filter((r) => r.status === "PENDING").length },
            { id: "REPORTS", label: "Reports Queue", count: reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length },
            { id: "CREATORS", label: "Creator Application Queue", count: creatorApps.filter((a) => a.status === "PENDING").length },
            { id: "FINANCES", label: "Financial & Refund Desk", count: payouts.filter((p) => p.status === "PENDING").length + refunds.filter((r) => r.status === "PENDING").length },
            { id: "COMMUNITIES", label: "Community Desk", count: communities.length },
            { id: "STREAMS", label: "Live Supervision", count: streams.filter((s) => s.status === "LIVE").length },
            { id: "AUDIT", label: "Audit Log", count: logs.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="goldBorder" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-gold uppercase tracking-wider block">
            Platform Gross Volume
          </span>
          <span className="text-3xl font-serif font-bold text-velora-textPrimary">
            ${(18450.00 + payouts.filter(p => p.status === "APPROVED").reduce((acc, curr) => acc + curr.amount, 0)).toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">+18.4% this month</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Reports Queue
          </span>
          <span className="text-3xl font-serif font-bold text-red-400">
            {reports.filter((r) => r.status === "PENDING").length} Tickets
          </span>
          <span className="text-[11px] text-red-300 font-mono">1 Hour Response Target</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Monthly Active Users
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">12,480</span>
          <span className="text-[11px] text-emerald-400 font-mono">92.4% Retention Rate</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Live Broadcasts
          </span>
          <span className="text-3xl font-serif font-bold text-red-400">
            {streams.filter((s) => s.status === "LIVE").length}
          </span>
          <span className="text-[11px] text-velora-textMuted font-mono">Real-time WebRTC</span>
        </Card>
      </div>

      {/* VERIFICATIONS TAB */}
      {activeTab === "VERIFICATIONS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                Identity Verification Requests Queue ({verificationRequests.filter((r) => r.status === "PENDING").length} Pending)
              </h2>
              <p className="text-xs text-velora-textMuted">
                Review member verification selfies holding handwritten paper notes inscribed with <strong>&quot;INTIMO&quot;</strong> and current date.
              </p>
            </div>
          </div>

          {verificationRequests.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
              No verification requests submitted yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationRequests.map((req) => (
                <Card
                  key={req.id}
                  variant="goldBorder"
                  className="p-6 space-y-4 text-left bg-velora-card relative overflow-hidden"
                >
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-amber-400/40 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={req.userAvatarUrl} alt={req.userName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                          {req.userName}
                        </h3>
                        <p className="text-xs text-velora-textMuted">{req.userEmail}</p>
                        <p className="text-[10px] text-amber-300 font-mono mt-0.5">Submitted {req.submittedAt}</p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        req.status === "PENDING"
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                          : req.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/40"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-velora-textSecondary">
                      <span>Verification Selfie & Handwritten Paper Note:</span>
                      <button
                        type="button"
                        onClick={() => setZoomPhotoUrl(req.verificationPhotoUrl)}
                        className="text-amber-300 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5" /> Click to Zoom
                      </button>
                    </div>

                    <div
                      onClick={() => setZoomPhotoUrl(req.verificationPhotoUrl)}
                      className="h-56 w-full rounded-2xl bg-black border border-white/10 relative overflow-hidden group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.verificationPhotoUrl}
                        alt="Verification selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                          Inspect Photo & Note
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-velora-textMuted space-y-1">
                      <p className="text-white font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Administrative Checklist:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-velora-textSecondary pl-1">
                        <li>Member holds paper note with <strong>&quot;INTIMO&quot;</strong> inscribed.</li>
                        <li>Handwritten date matches submission timeframe.</li>
                        <li>Face and paper details are legible and unedited.</li>
                      </ul>
                    </div>
                  </div>

                  {req.status === "PENDING" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <Button
                        variant="glass"
                        size="md"
                        onClick={() => setRejectionModalTarget(req.id)}
                        className="w-1/2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4 mr-1" /> Reject Request
                      </Button>
                      <Button
                        variant="gold"
                        size="md"
                        onClick={() => handleApproveVerification(req.id, req.userName)}
                        className="w-1/2 text-xs font-bold uppercase tracking-wider shadow-gold-glow bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> Approve & Issue Badge
                      </Button>
                    </div>
                  )}

                  {req.status === "REJECTED" && (
                    <p className="text-xs text-red-400 italic">Rejection Reason: {req.rejectionReason}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              Security & Compliance Report Queue ({reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length} Open)
            </h2>
            <p className="text-xs text-velora-textMuted">
              Review and act on members flagging violations regarding underage suspicion, harassment, fake profiles, and fraud.
            </p>
          </div>

          {reports.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
              No compliance reports logged yet.
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <Card
                  key={rep.id}
                  variant={rep.reason.includes("Underage") ? "goldBorder" : "glass"}
                  className={`p-6 text-left relative overflow-hidden ${
                    rep.status === "RESOLVED"
                      ? "opacity-60 border-emerald-500/20"
                      : rep.status === "DISMISSED"
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rep.reason.includes("Underage")
                            ? "bg-red-500/20 text-red-400 border border-red-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}>
                          {rep.reason}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          rep.status === "PENDING"
                            ? "bg-white/10 text-white"
                            : rep.status === "INVESTIGATING"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">
                        Reported User: <span className="text-velora-gold">@{rep.reportedUsername}</span> ({rep.reportedUserRole})
                      </h3>
                      <p className="text-xs text-velora-textSecondary mt-1">
                        Submitted by: <span className="text-slate-300">@{rep.reporterUsername}</span> • {rep.submittedAt}
                      </p>
                    </div>

                    {rep.evidenceUrl && (
                      <button
                        onClick={() => setZoomPhotoUrl(rep.evidenceUrl || null)}
                        className="flex items-center gap-1 text-[11px] text-amber-300 hover:underline border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Chat Evidence Screenshot
                      </button>
                    )}
                  </div>

                  <div className="py-4 space-y-2">
                    <p className="text-xs text-velora-textMuted uppercase font-semibold tracking-wider">Report Details:</p>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white leading-relaxed italic">
                      &quot;{rep.details}&quot;
                    </div>
                  </div>

                  {rep.status !== "RESOLVED" && rep.status !== "DISMISSED" && (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/10 flex-wrap">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleDismissReport(rep.id, rep.reportedUsername)}
                        className="text-xs border-white/15 text-velora-textSecondary hover:bg-white/10"
                      >
                        Dismiss / Archive Report
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setReportModalTarget(rep)}
                        className="text-xs font-bold uppercase tracking-wider ml-auto"
                      >
                        <AlertOctagon className="w-4 h-4 mr-1 text-red-400" /> Take Compliance Action
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATOR APPLICATION QUEUE */}
      {activeTab === "CREATORS" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-velora-gold" />
              Creator Applications Queue ({creatorApps.filter((a) => a.status === "PENDING").length} Pending)
            </h2>
            <p className="text-xs text-velora-textMuted">
              Review requests from standard members looking to upgrade to full commercial Creator Accounts.
            </p>
          </div>

          {creatorApps.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
              No creator applications submitted yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creatorApps.map((app) => (
                <Card
                  key={app.id}
                  variant="goldBorder"
                  className={`p-6 space-y-4 text-left ${app.status !== "PENDING" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">@{app.user.username}</h3>
                      <p className="text-xs text-velora-textMuted">{app.user.email}</p>
                      <p className="text-[10px] text-amber-300 font-mono mt-0.5">Submitted {app.submittedAt}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      app.status === "PENDING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : app.status === "VERIFIED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Proposed Categories:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {app.categories.map((c) => (
                          <span key={c} className="px-2 py-0.5 bg-white/5 rounded-full text-white text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Monthly Subscription Price:</span>
                      <span className="text-velora-gold font-bold font-serif text-sm">${app.proposedMonthlyPrice} / month</span>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Creator Bio:</span>
                      <p className="p-3 bg-white/5 rounded-xl border border-white/5 italic text-white mt-1">
                        &quot;{app.bio}&quot;
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Payout Method:</span>
                      <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">{app.payoutMethod}: {app.payoutDetails}</span>
                    </div>
                  </div>

                  {app.status === "PENDING" && (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleRejectCreatorApp(app.id, app.user.username)}
                        className="w-1/2 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                      >
                        Reject Application
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleApproveCreatorApp(app.id, app.user.username)}
                        className="w-1/2 text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                      >
                        Approve Creator
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FINANCES & REFUND DESK */}
      {activeTab === "FINANCES" && (
        <div className="space-y-8">
          {/* PAYOUT REQUESTS */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Creator Payout Request Approvals Queue ({payouts.filter((p) => p.status === "PENDING").length} Pending)
            </h2>

            <div className="space-y-3">
              {payouts.map((p) => (
                <Card key={p.id} variant="glass" className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Creator: @{p.username}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : p.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-velora-textMuted mt-1">
                        Requested: {p.requestedAt} • Method: {p.payoutMethod} ({p.payoutDetails})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-serif font-bold text-velora-gold">${p.amount.toFixed(2)}</span>
                      {p.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="glass"
                            size="sm"
                            className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleRejectPayout(p.id, p.username)}
                          >
                            Reject Payout
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                            onClick={() => handleApprovePayout(p.id, p.username, p.amount)}
                          >
                            Approve Payout
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* REFUND REQUESTS */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-300" />
              Customer Refund Requests Queue ({refunds.filter((r) => r.status === "PENDING").length} Pending)
            </h2>

            <div className="space-y-3">
              {refunds.map((ref) => (
                <Card key={ref.id} variant="glass" className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Refund for: @{ref.username}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ref.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : ref.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}>
                          {ref.status}
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium">Product: {ref.productTitle}</p>
                      <p className="text-xs text-velora-textMuted italic">&quot;{ref.reason}&quot;</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Requested {ref.requestedAt}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-2xl font-serif font-bold text-white">${ref.amount.toFixed(2)}</span>
                      {ref.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="glass"
                            size="sm"
                            className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleRejectRefund(ref.id, ref.username, ref.productTitle)}
                          >
                            Deny Refund
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold uppercase"
                            onClick={() => handleApproveRefund(ref.id, ref.username, ref.amount, ref.productTitle)}
                          >
                            Approve Refund
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMMUNITIES TAB */}
      {activeTab === "COMMUNITIES" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-velora-gold" />
              Community & Private Group Governance
            </h2>
            <p className="text-xs text-velora-textMuted">
              Monitor active community salons and moderation flags for inappropriate discussion topics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communities.map((c) => (
              <Card key={c.id} variant="glass" className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{c.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-velora-gold/20 text-velora-gold">
                    {c.type}
                  </span>
                </div>
                <p className="text-xs text-velora-textMuted line-clamp-2">{c.description}</p>
                <div className="flex items-center justify-between text-xs font-mono text-velora-textSecondary pt-3 border-t border-white/10">
                  <span>{c.membersCount} Members • {c.postsCount} Discussions</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">Compliant</span>
                    <button
                      onClick={() => handleDeleteCommunityPost("post-active", c.slug)}
                      className="text-red-400 hover:text-red-300 hover:underline"
                    >
                      Audit Posts
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STREAMS TAB */}
      {activeTab === "STREAMS" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              Live Stream Supervision & Moderation
            </h2>
            <p className="text-xs text-velora-textMuted">
              Real-time WebRTC broadcast supervision desk. Suspend streams violating explicit safety guidelines.
            </p>
          </div>

          <div className="space-y-4">
            {streams.map((s) => (
              <Card key={s.id} variant="glass" className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{s.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === "LIVE" ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "bg-white/10 text-velora-textMuted"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-velora-textMuted mt-1">
                      Host: {s.creatorName} • Category: {s.category} • Viewers: {s.currentViewersCount}
                    </p>
                  </div>

                  {s.status === "LIVE" && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-xs font-bold gap-2"
                      onClick={() => handleSuspendStream(s.id, s.title, s.creatorName)}
                    >
                      <Ban className="w-4 h-4" /> Emergency Suspend Stream
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === "AUDIT" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-white">
            Moderation Action Audit Log
          </h2>

          <Card variant="glass" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-velora-textSecondary">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-velora-textMuted border-b border-white/10 pb-2">
                  <tr>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Admin</th>
                    <th className="py-2">Target</th>
                    <th className="py-2">Enforced Action</th>
                    <th className="py-2">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 font-bold text-velora-gold">@{log.adminUsername}</td>
                      <td className="py-3 text-white font-semibold">{log.targetUsername}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === "BAN_USER_PERMANENT"
                            ? "bg-red-500/25 text-red-300 border border-red-500/35"
                            : log.action === "SUSPEND_LIVE_STREAM"
                            ? "bg-amber-500/25 text-amber-300 border border-amber-500/35"
                            : "bg-blue-500/25 text-blue-300 border border-blue-500/35"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Compliance Action Modal */}
      {reportModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Enforce Compliance: @{reportModalTarget.reportedUsername}
            </h3>
            <p className="text-xs text-velora-textMuted">
              Select the administrative action to resolve this ticket. A detailed reason is required.
            </p>

            <textarea
              value={reportActionReason}
              onChange={(e) => setReportActionReason(e.target.value)}
              rows={3}
              placeholder="e.g. Account suspended for 7 days due to phishing link solicitation in private chats."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-red-400 resize-none"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleResolveReport(reportModalTarget, "WARN_USER", reportActionReason)}
                className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
              >
                Issue Warning
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleResolveReport(reportModalTarget, "SUSPEND_ACCOUNT_7_DAYS", reportActionReason)}
                className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                Suspend User
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleResolveReport(reportModalTarget, "BAN_USER_PERMANENT", reportActionReason)}
                className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 col-span-2"
              >
                Permanent IP Ban
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReportModalTarget(null);
                  setReportActionReason("");
                }}
                className="w-full text-xs text-velora-textSecondary"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Specify Rejection Reason
            </h3>
            <p className="text-xs text-velora-textMuted">
              Provide feedback for the member on why their verification photo was rejected so they can re-submit.
            </p>

            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              rows={3}
              placeholder="e.g., Handwritten date is illegible or missing the INTIMO inscription."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-red-400 resize-none"
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  setRejectionModalTarget(null);
                  setRejectionReasonInput("");
                }}
                className="w-1/2 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => handleRejectVerification(rejectionModalTarget)}
                className="w-1/2 text-xs font-bold uppercase border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Zoom Verification Photo Lightbox */}
      {zoomPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black/90 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomPhotoUrl} alt="Inspection selfie" className="w-full h-full object-contain max-h-[85vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
