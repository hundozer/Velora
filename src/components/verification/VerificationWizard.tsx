"use client";

import React, { useState } from "react";
import { VerificationLevel } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Mail,
  Phone,
  UserCheck,
  Crown,
  CheckCircle2,
  Upload,
  ArrowRight,
} from "lucide-react";

interface VerificationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel?: VerificationLevel;
}

export const VerificationWizard: React.FC<VerificationWizardProps> = ({
  isOpen,
  onClose,
  currentLevel = "LEVEL_1_EMAIL",
}) => {
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>("LEVEL_3_PROFILE_BIOMETRIC");
  const [step, setStep] = useState<number>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setSubmitted(true);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Intimo Trust & Verification Levels" maxWidth="lg">
      {submitted ? (
        <div className="text-center space-y-4 py-6 text-left">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-serif font-bold text-velora-textPrimary text-center">
            Verification Submitted
          </h3>
          <p className="text-xs text-velora-textMuted leading-relaxed glass-panel p-4 rounded-2xl">
            Your photo verification selfie has been submitted for manual review. No government identity document is required for this badge.
          </p>
          <Button variant="gold" size="sm" className="w-full font-bold uppercase" onClick={handleReset}>
            Close Window
          </Button>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          {/* Level Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Level 1 */}
            <div className="p-4 glass-panel rounded-2xl border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-velora-textPrimary">Level 1: Email Verified</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-velora-textMuted text-[11px] mt-0.5">Basic account creation completed</p>
              </div>
            </div>

            {/* Level 2 */}
            <div className="p-4 glass-panel rounded-2xl border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-velora-textPrimary">Level 2: Phone SMS</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-velora-textMuted text-[11px] mt-0.5">SMS multi-factor authentication</p>
              </div>
            </div>

            {/* Level 3 */}
            <div
              onClick={() => setSelectedLevel("LEVEL_3_PROFILE_BIOMETRIC")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedLevel === "LEVEL_3_PROFILE_BIOMETRIC"
                  ? "glass-panel-gold border-velora-gold shadow-gold-glow"
                  : "glass-panel hover:border-white/20"
              }`}
            >
              <div className="p-2 rounded-xl bg-velora-gold/10 text-velora-gold shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-velora-textPrimary block">Level 3: Photo Verified</span>
                <p className="text-velora-textMuted text-[11px] mt-0.5">Selfie with Intimo, username and current date</p>
              </div>
            </div>

            {/* Level 4 */}
            <div
              onClick={() => setSelectedLevel("LEVEL_4_CREATOR")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                selectedLevel === "LEVEL_4_CREATOR"
                  ? "glass-panel-gold border-amber-500 shadow-gold-glow"
                  : "glass-panel hover:border-white/20"
              }`}
            >
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <Crown className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-velora-textPrimary block">Level 4: Creator Verified</span>
                <p className="text-velora-textMuted text-[11px] mt-0.5">Enhanced identity review for trusted creator publishing</p>
              </div>
            </div>
          </div>

          {/* Submission Form Steps */}
          {step === 1 && (
            <div className="space-y-4 pt-2 border-t border-white/10">
              <h4 className="text-sm font-serif font-bold text-velora-textPrimary">
                Photo verification submission
              </h4>
              <p className="text-xs text-velora-textMuted">
                Upload one selfie while holding a handwritten note showing Intimo, your username, and today&apos;s date.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 glass-panel rounded-2xl border border-dashed border-white/20 text-center space-y-2">
                  <Upload className="w-5 h-5 text-velora-gold mx-auto" />
                  <p className="text-xs font-bold text-velora-textPrimary">Upload verification selfie</p>
                  <Button variant="glass" size="sm" className="text-[10px] border-white/10">
                    Select Selfie Image
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={handleReset}>
              Cancel
            </Button>
            <Button variant="gold" className="w-2/3 text-xs font-bold uppercase tracking-wider" onClick={handleNext}>
              Submit Verification Request
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
