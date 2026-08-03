"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CREATOR_CATEGORIES } from "@/lib/mockData";
import { Crown, CheckCircle2 } from "lucide-react";

interface CreatorActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorActivationModal: React.FC<CreatorActivationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Contemporary Art"]);
  const [monthlyPrice, setMonthlyPrice] = useState("24.99");
  const [welcomeBio, setWelcomeBio] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("SEPA Direct Bank Transfer");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Activate Creator Studio Mode" maxWidth="lg">
      {submitted ? (
        <div className="text-center space-y-4 py-6 text-left">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-serif font-bold text-velora-textPrimary text-center">
            Creator Application Submitted!
          </h3>
          <p className="text-xs text-velora-textMuted leading-relaxed glass-panel p-4 rounded-2xl">
            Your Creator Mode activation request has been logged in our Compliance & Creator Onboarding Queue (Ref ID: #CR-{Math.floor(Math.random() * 90000 + 10000)}). Our team will review your application within 2 hours.
          </p>
          <Button variant="gold" size="sm" className="w-full font-bold uppercase" onClick={handleReset}>
            Close Window
          </Button>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          {/* Header Banner */}
          <div className="flex items-center gap-3 p-4 glass-panel-gold rounded-2xl border border-velora-gold/50">
            <Crown className="w-6 h-6 text-velora-gold shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-velora-textPrimary">Intimo Creator Economy</h4>
              <p className="text-[11px] text-velora-textMuted">
                Monetize premium photo albums, exclusive video journals, and monthly subscriptions.
              </p>
            </div>
          </div>

          {/* STEP 1: Categories & Pricing */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Select Creator Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {CREATOR_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          isSelected
                            ? "bg-gold-gradient text-velora-bg font-bold shadow-gold-glow"
                            : "glass-panel text-velora-textMuted hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  Proposed Monthly Subscription Price ($USD)
                </label>
                <Input
                  type="number"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  placeholder="24.99"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="gold" size="sm" className="text-xs font-bold" onClick={() => setStep(2)}>
                  Continue to Details
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Bio & Payout */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  Creator Welcome Bio & Channel Pitch
                </label>
                <textarea
                  rows={3}
                  value={welcomeBio}
                  onChange={(e) => setWelcomeBio(e.target.value)}
                  placeholder="Describe your exclusive content, posting frequency, and what subscribers will enjoy..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                  Payout Method Placeholder
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
                >
                  <option value="SEPA Direct Bank Transfer">SEPA Direct Bank Transfer (EU)</option>
                  <option value="Wire Transfer">SWIFT Wire Transfer (International)</option>
                  <option value="Crypto USDT Wallet">USDT Crypto Wallet (Trc20)</option>
                </select>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="gold" size="sm" className="text-xs font-bold" onClick={() => setStep(3)}>
                  Continue to Terms
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Creator Agreement Terms */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 glass-panel rounded-2xl border border-white/10 text-xs text-velora-textMuted space-y-2 max-h-40 overflow-y-auto leading-relaxed">
                <p className="font-bold text-velora-textPrimary">Intimo Creator Terms & Compliance Agreement</p>
                <p>1. All content published must comply with 18+ adult consent laws.</p>
                <p>2. Non-consensual imagery, unauthorized recordings, or copyright infringement will result in permanent account ban.</p>
                <p>3. Creators retain 80% net revenue on subscriptions and pay-per-view unlocks.</p>
              </div>

              <label className="flex items-center gap-3 p-4 glass-panel rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="accent-velora-gold w-5 h-5 cursor-pointer"
                />
                <span className="text-xs font-bold text-velora-textPrimary">
                  I agree to Intimo Creator Standards and 18+ Verification Rules.
                </span>
              </label>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  className="text-xs font-bold uppercase tracking-wider"
                  disabled={!agreedToTerms}
                  onClick={handleSubmit}
                >
                  Submit Creator Application
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
