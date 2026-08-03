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
  MOCK_PAYOUT_REQUESTS,
  MOCK_REFUND_REQUESTS,
  MOCK_LIVE_STREAMS,
} from "@/lib/mockData";
import {
  VerificationRequest,
  ReportItem,
  ModerationLog,
  CreatorApplication,
  PayoutRequest,
  RefundItem,
  LiveStream,
} from "@/types";
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
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  Radio,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("FINANCES");
  const [verifications, setVerifications] = useState<VerificationRequest[]>(MOCK_VERIFICATION_REQUESTS);
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>(MOCK_CREATOR_APPLICATIONS);
  const [payouts, setPayouts] = useState<PayoutRequest[]>(MOCK_PAYOUT_REQUESTS);
  const [refunds, setRefunds] = useState<RefundItem[]>(MOCK_REFUND_REQUESTS);
  const [streams, setStreams] = useState<LiveStream[]>(MOCK_LIVE_STREAMS);
  const [logs, setLogs] = useState<ModerationLog[]>(MOCK_MODERATION_LOGS);

  const handleSuspendStream = (streamId: string, title: string) => {
    setStreams(streams.map((s) => (s.id === streamId ? { ...s, status: "SUSPENDED" } : s)));

    const newLog: ModerationLog = {
      id: "log-" + Date.now(),
      adminUsername: "admin_compliance",
      targetUsername: title,
      action: "SUSPEND_LIVE_STREAM",
      reason: "Emergency live stream suspension enforced by compliance desk.",
      timestamp: "Just now",
    };
    setLogs([newLog, ...logs]);
  };

  const handleApprovePayout = (id: string) => {
    setPayouts(payouts.map((p) => (p.id === id ? { ...p, status: "APPROVED" } : p)));
  };

  const handleRejectPayout = (id: string) => {
    setPayouts(payouts.map((p) => (p.id === id ? { ...p, status: "REJECTED" } : p)));
  };

  const handleApproveRefund = (id: string) => {
    setRefunds(refunds.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r)));
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
            Compliance, Financial & Live Stream Portal
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Audit live broadcasts, approve creator payouts, process refunds, and monitor compliance.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "FINANCES", label: "Financial Desk & Payouts", count: payouts.filter((p) => p.status === "PENDING").length },
            { id: "STREAMS", label: "Live Stream Supervision", count: streams.filter((s) => s.status === "LIVE").length },
            { id: "VERIFICATION", label: "Verification Queue", count: verifications.filter((v) => v.status === "PENDING").length },
            { id: "CREATORS", label: "Creator Applications", count: creatorApps.filter((c) => c.status === "PENDING").length },
            { id: "AUDIT", label: "Moderation Log History", count: logs.length },
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
          <span className="text-3xl font-serif font-bold text-velora-textPrimary">$18,450.00</span>
          <span className="text-[11px] text-emerald-400 font-mono">100% Settled</span>
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

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Pending Creator Payouts
          </span>
          <span className="text-3xl font-serif font-bold text-amber-400">
            ${payouts.filter((p) => p.status === "PENDING").reduce((acc, p) => acc + p.amount, 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-velora-textMuted font-mono">{payouts.filter((p) => p.status === "PENDING").length} Requests</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Refund Request Volume
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">
            ${refunds.filter((r) => r.status === "PENDING").reduce((acc, r) => acc + r.amount, 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-velora-textMuted font-mono">Low dispute rate</span>
        </Card>
      </div>

      {/* STREAMS TAB */}
      {activeTab === "STREAMS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <Radio className="w-5 h-5 text-red-400" />
            Live Stream Supervision & Moderation
          </h2>

          <div className="space-y-4">
            {streams.map((s) => (
              <Card key={s.id} variant="glass" className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-velora-textPrimary">{s.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === "LIVE" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-white/10 text-velora-textMuted"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-velora-textMuted mt-0.5">
                      Host: {s.creatorName} • Category: {s.category} • Viewers: {s.currentViewersCount}
                    </p>
                  </div>

                  {s.status === "LIVE" && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-xs font-bold gap-2"
                      onClick={() => handleSuspendStream(s.id, s.title)}
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

      {/* FINANCES TAB */}
      {activeTab === "FINANCES" && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
              Creator Payout Request Approvals Desk
            </h2>

            <div className="space-y-3">
              {payouts.map((p) => (
                <Card key={p.id} variant="glass" className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-velora-textPrimary">Creator: @{p.username}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : p.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-velora-textMuted mt-0.5">
                        Requested: {p.requestedAt} • Method: {p.payoutMethod} ({p.payoutDetails})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xl font-serif font-bold text-velora-gold">${p.amount.toFixed(2)}</span>
                      {p.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="danger"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleRejectPayout(p.id)}
                          >
                            Reject Payout
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold"
                            onClick={() => handleApprovePayout(p.id)}
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
                    <th className="py-2">Target</th>
                    <th className="py-2">Enforced Action</th>
                    <th className="py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 font-bold text-velora-gold">@{log.adminUsername}</td>
                      <td className="py-3 text-velora-textPrimary font-semibold">{log.targetUsername}</td>
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
