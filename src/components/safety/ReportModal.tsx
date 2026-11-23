"use client";

import { useTranslation } from "@/context/LanguageContext";
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUsername?: string;
  targetProfileId?: string;
  contentType?: "PROFILE" | "PHOTO" | "ALBUM" | "VIDEO" | "MESSAGE" | "POST" | "COMMENT" | "COMMUNITY" | "EVENT" | "LIVESTREAM";
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
  const { t } = useTranslation();
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
      setSubmitError(payload.error || "Your report didn't go through. Try again?");
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
    <Modal isOpen={isOpen} onClose={resetAndClose} title={t("Tell us what happened")}>
      {submitted ? (
        <div className="space-y-4 py-6 text-left">
          <CheckCircle2 className="w-12 h-12 text-velora-success mx-auto" />
          <h3 className="text-lg font-display font-bold text-velora-textPrimary text-center">{t("Thank you for telling us.")}</h3>
          <p className="text-sm text-velora-textSecondary leading-relaxed rounded-2xl border border-velora-line bg-velora-surface p-4">{t("Your report regarding")}{" "}<strong>@{targetUsername}</strong>{" "}{t("is with our team. Reference: {value}. Urgent safety concerns are escalated automatically; response times depend on risk and available evidence.", { value: referenceId || t("available in your report history") })}</p>
          <Button variant="gold" size="sm" className="w-full font-bold uppercase" onClick={resetAndClose}>{t("Close")}</Button>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-3 rounded-2xl border border-velora-line bg-velora-surface p-4">
            <ShieldAlert className="w-6 h-6 text-velora-danger shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-velora-textPrimary">{t("Report @{targetUsername}", { targetUsername })}</h4>
              <p className="text-[11px] text-velora-textMuted">{t("Adults only. Consent always. No harassment. Tell us what happened and our team will review it.")}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{t("What's it mainly about?")}</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-velora-card border border-ink/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              <option value="SUSPECTED_MINOR">{t("Someone might be under 18 (urgent)")}</option>
              <option value="NON_CONSENSUAL_INTIMATE_CONTENT">{t("Intimate content shared without consent (urgent)")}</option>
              <option value="NON_CONSENSUAL_SCREENSHOT">{t("Shared screenshot or recording without consent")}</option>
              <option value="HARASSMENT">{t("Harassment")}</option>
              <option value="THREATS">{t("Threats")}</option>
              <option value="IMPERSONATION">{t("Pretending to be someone else")}</option>
              <option value="SCAM_FRAUD">{t("Scam or fraud")}</option>
              <option value="ILLEGAL_CONTENT">{t("Illegal content")}</option>
              <option value="EXPLOITATION_TRAFFICKING">{t("Exploitation or trafficking (urgent)")}</option>
              <option value="COPYRIGHT_INFRINGEMENT">{t("Copyright infringement")}</option>
              <option value="PRIVACY_VIOLATION">{t("Privacy violation")}</option>
              <option value="PROHIBITED_COMMERCIAL_SEXUAL_SERVICES">{t("Selling sex or paid sexual services")}</option>
              <option value="SPAM">{t("Spam")}</option>
              <option value="OTHER">{t("Other")}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{t("What happened?")}</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t("Tell us in your own words: which messages, when, what happened...")}
              className="w-full bg-ink/5 border border-ink/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />
          </div>

          <p className="text-[11px] text-velora-textMuted">{t("Please don't upload anything illegal, even as proof. If we need more information, we'll ask securely.")}</p>
          {submitError && <p className="text-xs text-velora-danger" role="alert">{submitError}</p>}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={resetAndClose}>{t("Cancel")}</Button>
            <Button
              variant="danger"
              className="w-2/3 text-xs font-bold uppercase tracking-wider"
              onClick={handleSubmit}
              disabled={details.trim().length < 10}
            >{t("Send to our team")}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
