"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Settings, Shield, EyeOff, Bell, Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-velora-gold" />
        <div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
            Account & Privacy Settings
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Manage your account security, stealth mode, and privacy permissions.
          </p>
        </div>
      </div>

      <Card variant="glass" className="p-8 space-y-6">
        <h2 className="text-lg font-serif font-bold text-velora-textPrimary border-b border-white/10 pb-3 flex items-center gap-2">
          <EyeOff className="w-5 h-5 text-velora-gold" />
          Stealth & Visibility Preferences
        </h2>

        <div className="space-y-4 text-xs text-velora-textSecondary">
          <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
            <div>
              <p className="font-bold text-velora-textPrimary">Stealth Mode (Invisible in Discovery)</p>
              <p className="text-velora-textMuted">Only people you message or favorite can view your profile</p>
            </div>
            <input type="checkbox" className="accent-velora-gold w-5 h-5" />
          </label>

          <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
            <div>
              <p className="font-bold text-velora-textPrimary">Fuzz Location Distance</p>
              <p className="text-velora-textMuted">Randomize displayed distance by +/- 5km for enhanced privacy</p>
            </div>
            <input type="checkbox" defaultChecked className="accent-velora-gold w-5 h-5" />
          </label>
        </div>
      </Card>
    </div>
  );
}
