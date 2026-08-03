"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { MOCK_VERIFICATION_REQUESTS, MOCK_REPORTS } from "@/lib/mockData";
import { VerificationRequest, ReportItem } from "@/types";
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
} from "lucide-react";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("VERIFICATION");
  const [verifications, setVerifications] = useState<VerificationRequest[]>(MOCK_VERIFICATION_REQUESTS);
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  const handleApproveVerification = (id: string) => {
    setVerifications(verifications.map((v) => (v.id === id ? { ...v, status: "VERIFIED" } : v)));
  };

  const handleRejectVerification = (id: string) => {
    setVerifications(verifications.map((v) => (v.id === id ? { ...v, status: "REJECTED" } : v)));
  };

  const handleResolveReport = (id: string) => {
    setReports(reports.map((r) => (r.id === id ? { ...r, status: "RESOLVED" } : r)));
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
            Review 18+ legal biometric verification submissions, reported member flags, and audit security logs.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "VERIFICATION", label: "ID Verification Queue", count: verifications.filter((v) => v.status === "PENDING").length },
            { id: "REPORTS", label: "Moderation Reports", count: reports.filter((r) => r.status === "PENDING").length },
            { id: "AUDIT", label: "System Metrics" },
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
          <span className="text-[11px] text-velora-textMuted">Avg response time: 14 mins</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Moderation Flags
          </span>
          <span className="text-3xl font-serif font-bold text-red-400">
            {reports.filter((r) => r.status === "PENDING").length}
          </span>
          <span className="text-[11px] text-velora-textMuted">Zero-tolerance policy</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Verified Adult Ratio
          </span>
          <span className="text-3xl font-serif font-bold text-emerald-400">98.6%</span>
          <span className="text-[11px] text-velora-textMuted">100% biometric requirement</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Compliance Records (2257)
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">Compliant</span>
          <span className="text-[11px] text-velora-textMuted">Encrypted vault storage</span>
        </Card>
      </div>

      {/* VERIFICATION QUEUE TAB */}
      {activeTab === "VERIFICATION" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Pending 18+ ID Verification Queue
          </h2>

          <div className="space-y-4">
            {verifications.map((v) => (
              <Card key={v.id} variant="glass" className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-velora-textPrimary">@{v.user.username}</h3>
                      <Badge type={v.user.role === "CREATOR" ? "creator" : "verified"} label={v.user.role} />
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
                        <X className="w-3.5 h-3.5" /> Reject Document
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

                {/* Encrypted Document Inspection Thumbnails */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 glass-panel rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">
                      1. Passport / Government ID Document
                    </span>
                    <div className="h-40 w-full bg-velora-card rounded-xl overflow-hidden relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.idDocumentUrl} alt="ID Document" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-velora-gold font-bold">Encrypted Document Preview</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 glass-panel rounded-2xl space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">
                      2. Biometric Selfie with Date Note
                    </span>
                    <div className="h-40 w-full bg-velora-card rounded-xl overflow-hidden relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.selfieWithNoteUrl} alt="Selfie Note" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-velora-gold font-bold">Biometric Match Verified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODERATION REPORTS TAB */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Active Member Moderation Reports
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

                  {r.status === "PENDING" && (
                    <Button
                      variant="gold"
                      size="sm"
                      className="text-xs font-bold"
                      onClick={() => handleResolveReport(r.id)}
                    >
                      Resolve & Enforce Sanction
                    </Button>
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
    </div>
  );
}
