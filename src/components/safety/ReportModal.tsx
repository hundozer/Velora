"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUsername?: string;
  targetProfileId?: string;
  contentType?: "PROFILE" | "PHOTO" | "VIDEO" | "MESSAGE" | "POST" | "COMMENT" | "COMMUNITY" | "EVENT" | "LIVESTREAM";
  contentId?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetUsername = "user",
  targetProfileId,
  contentType = "PROFILE",
  contentId,
}) => {
  const [reason, setReason] = useState("HARASSMENT");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async () => {
    setSubmitError("");
    const response = await fetch("/api/reports", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportedUserId: targetProfileId, contentType, contentId, reason, description: details }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSubmitError(payload.error || "Report submission failed");
      return;
    }
    setReferenceId(payload.report?.id || "");
    setSubmitted(true);
  };

  const resetAndClose = () => {
    setSubmitted(false);
    setDetails("");
    setSubmitError("");
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
            Your report regarding <strong>@{targetUsername}</strong> has been logged for review. Reference: {referenceId || "available in your report history"}. Critical safety reports are escalated automatically; response times depend on risk and available evidence.
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
                Intimo strictly enforces 18+ verification, consent, and non-harassment rules.
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
              <option value="SUSPECTED_MINOR">Suspected minor (critical)</option>
              <option value="NON_CONSENSUAL_INTIMATE_CONTENT">Non-consensual intimate content (critical)</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="THREATS">Threats</option>
              <option value="IMPERSONATION">Impersonation</option>
              <option value="SCAM_FRAUD">Scam or fraud</option>
              <option value="ILLEGAL_CONTENT">Illegal content</option>
              <option value="EXPLOITATION_TRAFFICKING">Exploitation or trafficking concern (critical)</option>
              <option value="COPYRIGHT_INFRINGEMENT">Copyright infringement</option>
              <option value="PRIVACY_VIOLATION">Privacy violation</option>
              <option value="PROHIBITED_COMMERCIAL_SEXUAL_SERVICES">Prohibited commercial sexual services</option>
              <option value="SPAM">Spam</option>
              <option value="OTHER">Other</option>
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

          <p className="text-[11px] text-velora-textMuted">Do not upload or redistribute illegal material. Moderators can preserve existing platform content by its reference. Additional evidence may be requested securely.</p>
          {submitError && <p className="text-xs text-red-400" role="alert">{submitError}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-2/3 text-xs font-bold uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={details.trim().length < 10}
            >
              Submit Moderation Report
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
