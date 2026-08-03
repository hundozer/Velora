"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, Upload, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUsername?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetUsername = "user",
}) => {
  const [reason, setReason] = useState("HARASSMENT");
  const [details, setDetails] = useState("");
  const [evidenceUploaded, setEvidenceUploaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setDetails("");
    setEvidenceUploaded(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Security & Compliance Report">
      {submitted ? (
        <div className="text-center space-y-4 py-6 text-left">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-velora-textPrimary text-center">
            Report Submitted & Logged
          </h3>
          <p className="text-xs text-velora-textMuted leading-relaxed glass-panel p-4 rounded-2xl">
            Your report regarding <strong>@{targetUsername}</strong> has been logged in our Compliance Queue (Ref ID: #REP-{Math.floor(Math.random() * 90000 + 10000)}). Our moderation team will investigate within 1 hour.
          </p>
          <Button variant="gold" size="sm" className="w-full font-bold uppercase" onClick={resetAndClose}>
            Close Window
          </Button>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-3 p-4 glass-panel rounded-2xl border border-red-500/30">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-velora-textPrimary">Report @{targetUsername}</h4>
              <p className="text-[11px] text-velora-textMuted">
                Velora strictly enforces 18+ verification, consent, and non-harassment rules.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
              Select Primary Violation Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              <option value="UNDERAGE_SUSPICION">Underage Suspicion (Strict Priority)</option>
              <option value="HARASSMENT">Harassment or Non-consensual Language</option>
              <option value="FAKE_PROFILE">Fake Profile / Impersonation</option>
              <option value="SPAM_SOLICITATION">Spam or Automated Solicitation</option>
              <option value="SCAM_BEHAVIOUR">Scam Behaviour or Financial Fraud</option>
              <option value="NON_CONSENTUAL_CONTENT">Non-consensual Content Sharing</option>
              <option value="OFFSITE_PAYMENT">Offsite Unverified Payment Request</option>
              <option value="OTHER">Other Compliance Issue</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
              Explanation & Evidence Details
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide specific details about messages or behavior..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />
          </div>

          {/* Evidence Upload Placeholder */}
          <div className="p-4 glass-panel rounded-2xl border border-dashed border-white/20 text-center space-y-2">
            <Upload className="w-5 h-5 text-velora-gold mx-auto" />
            <p className="text-xs font-bold text-velora-textPrimary">Attach Screenshot or Chat Evidence</p>
            <p className="text-[10px] text-velora-textMuted">JPG, PNG, PDF up to 10MB</p>
            <Button
              variant="glass"
              size="sm"
              className="text-[10px] border-white/10 mt-1"
              onClick={() => setEvidenceUploaded(true)}
            >
              {evidenceUploaded ? "Evidence File Attached ✓" : "Upload File"}
            </Button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-2/3 text-xs font-bold uppercase tracking-wider"
              onClick={handleSubmit}
            >
              Submit Moderation Report
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
