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
  MOCK_COMMUNITIES,
  MOCK_EVENTS,
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
  VeloraEvent,
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
  Globe,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("FINANCES");
  const [verifications, setVerifications] = useState<VerificationRequest[]>(MOCK_VERIFICATION_REQUESTS);
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>(MOCK_CREATOR_APPLICATIONS);
  const [payouts, setPayouts] = useState<PayoutRequest[]>(MOCK_PAYOUT_REQUESTS);
  const [refunds, setRefunds] = useState<RefundItem[]>(MOCK_REFUND_REQUESTS);
  const [streams, setStreams] = useState<LiveStream[]>(MOCK_LIVE_STREAMS);
  const [communities, setCommunities] = useState<CommunityItem[]>(MOCK_COMMUNITIES);
  const [events, setEvents] = useState<VeloraEvent[]>(MOCK_EVENTS);
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
            Compliance, Operational Analytics & Governance
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Audit platform metrics, approve creator payouts, monitor live broadcasts, and analyze retention.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "FINANCES", label: "Financial Desk", count: payouts.filter((p) => p.status === "PENDING").length },
            { id: "ANALYTICS", label: "Platform Analytics", count: 0 },
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
          <span className="text-3xl font-serif font-bold text-velora-textPrimary">$18,450.00</span>
          <span className="text-[11px] text-emerald-400 font-mono">+18.4% this month</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Monthly Active Users
          </span>
          <span className="text-3xl font-serif font-bold text-amber-300">12,480</span>
          <span className="text-[11px] text-emerald-400 font-mono">92.4% Retention Rate</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Direct Messages Exchanged
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">84,920</span>
          <span className="text-[11px] text-velora-textMuted font-mono">100% End-to-End Encrypted</span>
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

      {/* ANALYTICS TAB */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-8">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-velora-gold" />
            Operational & Marketplace Performance Analytics (Non-AI Traditional Metrics)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="glass" className="p-6 space-y-4 text-left">
              <h3 className="text-sm font-bold text-velora-textPrimary flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                User Registrations & Growth Trajectory
              </h3>
              <div className="h-40 flex items-end justify-between gap-2 pt-4 border-b border-white/10">
                {[
                  { month: "Jan", count: 3200 },
                  { month: "Feb", count: 4800 },
                  { month: "Mar", count: 6200 },
                  { month: "Apr", count: 8100 },
                  { month: "May", count: 9900 },
                  { month: "Jun", count: 12480 },
                ].map((bar) => (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      style={{ height: `${(bar.count / 13000) * 100}%` }}
                      className="w-full bg-gold-gradient rounded-t-lg shadow-gold-glow min-h-[10px]"
                    />
                    <span className="text-[10px] font-mono text-velora-textMuted">{bar.month}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-velora-textMuted">
                Net growth rate: +26% month-over-month driven by high referral conversion.
              </p>
            </Card>

            <Card variant="glass" className="p-6 space-y-4 text-left">
              <h3 className="text-sm font-bold text-velora-textPrimary flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-300" />
                Marketplace Activity & Search Breakdown
              </h3>
              <ul className="space-y-3 text-xs text-velora-textSecondary">
                <li className="flex items-center justify-between p-2.5 glass-panel rounded-xl">
                  <span>Transparent Rule-Based Discovery Searches</span>
                  <span className="font-mono font-bold text-velora-gold">142,100</span>
                </li>
                <li className="flex items-center justify-between p-2.5 glass-panel rounded-xl">
                  <span>Rich Profile Page Views</span>
                  <span className="font-mono font-bold text-amber-300">284,500</span>
                </li>
                <li className="flex items-center justify-between p-2.5 glass-panel rounded-xl">
                  <span>Pay-Per-View Content Unlocks</span>
                  <span className="font-mono font-bold text-emerald-400">1,840</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* COMMUNITIES TAB */}
      {activeTab === "COMMUNITIES" && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
              <Globe className="w-5 h-5 text-velora-gold" />
              Community & Private Group Governance
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communities.map((c) => (
                <Card key={c.id} variant="glass" className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-velora-textPrimary">{c.name}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-velora-gold/20 text-velora-gold">
                      {c.type}
                    </span>
                  </div>
                  <p className="text-xs text-velora-textMuted line-clamp-2">{c.description}</p>
                  <div className="flex items-center justify-between text-xs font-mono text-velora-textSecondary pt-2 border-t border-white/10">
                    <span>{c.membersCount} Members • {c.postsCount} Discussions</span>
                    <span className="text-emerald-400">Compliant</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* AUDIT LOG TAB */}
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
