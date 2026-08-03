"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Sparkles, ArrowRight, CheckCircle2, Heart, ShieldCheck, Compass } from "lucide-react";

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form Data
  const [headline, setHeadline] = useState("Art Curator & High-Discretion Private Hostess");
  const [bio, setBio] = useState("Open-minded, confident, and looking for authentic chemistry and luxury experiences across Europe.");
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(["Dating", "Social Events", "Travel Partner"]);

  const toggleLookingFor = (item: string) => {
    if (selectedLookingFor.includes(item)) {
      setSelectedLookingFor(selectedLookingFor.filter((i) => i !== item));
    } else {
      setSelectedLookingFor([...selectedLookingFor, item]);
    }
  };

  const handleFinish = () => {
    router.push("/discovery");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-left space-y-8">
      {/* Step Indicator Bar */}
      <div className="space-y-2 text-center">
        <span className="text-xs font-mono uppercase tracking-widest text-velora-gold">
          Step {step} of 3 • Craft Your Private Identity
        </span>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            style={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-gold-gradient transition-all duration-500 shadow-gold-glow"
          />
        </div>
      </div>

      <Card variant="goldBorder" className="p-8 space-y-6">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              Tell us what you are looking for
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Velora members are clear and transparent about their desires. Select all that match your intent.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                "Dating & Chemistry",
                "Casual Connections",
                "Social & Dining Events",
                "Travel Partner",
                "Couples Networking",
                "Creator Content & Livestreams",
              ].map((item) => {
                const isSelected = selectedLookingFor.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleLookingFor(item)}
                    className={`p-3.5 rounded-2xl border text-xs font-semibold text-left transition-all ${
                      isSelected
                        ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold shadow-gold-glow"
                        : "glass-panel text-velora-textMuted hover:text-white"
                    }`}
                  >
                    {item} {isSelected ? "✓" : ""}
                  </button>
                );
              })}
            </div>

            <Button
              variant="gold"
              className="w-full text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
              onClick={() => setStep(2)}
            >
              <span>Next: About Your Persona</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              Profile Headline & Biography
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Express your personality, lifestyle, and discretion preferences to attract compatible members.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Profile Headline
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Seductive Art Curator & Hostess"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                About Your Persona
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="gold"
                className="w-2/3 text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2"
                onClick={() => setStep(3)}
              >
                <span>Next: Verification Check</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <ShieldCheck className="w-12 h-12 text-velora-gold mx-auto" />
            <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
              Your Private Identity is Ready
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed max-w-md mx-auto">
              Your profile is created. You can now start discovering open-minded adults nearby or complete Level 3 Biometric Verification for maximum trust.
            </p>

            <Button
              variant="gold"
              size="lg"
              className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-gold-glow flex items-center justify-center gap-2"
              onClick={handleFinish}
            >
              <Compass className="w-4 h-4" />
              <span>Start Discovering People Nearby</span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
