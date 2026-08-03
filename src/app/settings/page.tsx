"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { VerificationWizard } from "@/components/verification/VerificationWizard";
import { MOCK_SAFETY_SETTINGS } from "@/lib/mockData";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/CurrencyService";
import { UserSafetySettings, LanguageCode, CurrencyCode } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  Shield,
  EyeOff,
  Bell,
  Lock,
  MessageSquare,
  Ban,
  MapPin,
  CheckCircle2,
  Sliders,
  UserCheck,
  Globe,
  DollarSign,
  Download,
  Trash2,
  LogOut,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPage() {
  const { logout } = useAuth();
  const [safety, setSafety] = useState<UserSafetySettings>(MOCK_SAFETY_SETTINGS);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("USD");
  const [blockedUsers, setBlockedUsers] = useState([
    { id: "usr-blk-1", username: "spammer_bot_99", blockedAt: "Yesterday" },
    { id: "usr-blk-2", username: "unwanted_contact", blockedAt: "3 days ago" },
  ]);
  const [verificationWizardOpen, setVerificationWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleUnblock = (id: string) => {
    setBlockedUsers(blockedUsers.filter((u) => u.id !== id));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportGdprData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user: { username: "elena_vance", email: "elena@velora.club", role: "CREATOR" },
      profile: { displayName: "Elena Vance", city: "Monte Carlo", country: "Monaco" },
      gdprExportDate: new Date().toISOString(),
    }));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "velora_gdpr_data_export.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-velora-gold" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
              Privacy, Safety & Regional Settings
            </h1>
            <p className="text-xs text-velora-textSecondary mt-1">
              Manage messaging permissions, GDPR data privacy, push notifications, language, and currency.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          size="sm"
          className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0"
          onClick={handleSave}
        >
          <CheckCircle2 className="w-4 h-4" /> Save Settings
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
        </div>
      )}

      {/* SECTION 1: GLOBAL & REGIONAL SETTINGS */}
      <Card variant="glass" className="p-6 space-y-6">
        <h2 className="text-sm font-serif font-bold text-velora-textPrimary uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <Globe className="w-4 h-4 text-velora-gold" />
          Language & Currency Localization
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
              Display Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-velora-card text-white">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
              Preferred Payment Currency
            </label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code} className="bg-velora-card text-white">
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* SECTION 2: MOBILE PUSH NOTIFICATIONS */}
      <Card variant="glass" className="p-6 space-y-6">
        <h2 className="text-sm font-serif font-bold text-velora-textPrimary uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <Bell className="w-4 h-4 text-velora-gold" />
          Mobile Push Notification Controls
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 glass-panel rounded-2xl cursor-pointer">
            <div>
              <span className="text-xs font-bold text-velora-textPrimary block">Direct Message Push Alerts</span>
              <span className="text-[11px] text-velora-textMuted">Notify when a verified member sends a message</span>
            </div>
            <input
              type="checkbox"
              checked={safety.enablePushMessages ?? true}
              onChange={(e) => setSafety({ ...safety, enablePushMessages: e.target.checked })}
              className="w-4 h-4 accent-velora-gold"
            />
          </label>

          <label className="flex items-center justify-between p-3 glass-panel rounded-2xl cursor-pointer">
            <div>
              <span className="text-xs font-bold text-velora-textPrimary block">Livestream Start Notifications</span>
              <span className="text-[11px] text-velora-textMuted">Notify when creators you follow go live</span>
            </div>
            <input
              type="checkbox"
              checked={safety.enablePushLivestreams ?? true}
              onChange={(e) => setSafety({ ...safety, enablePushLivestreams: e.target.checked })}
              className="w-4 h-4 accent-velora-gold"
            />
          </label>
        </div>
      </Card>

      {/* SECTION 3: GDPR DATA PRIVACY & ACCOUNT ERASURE */}
      <Card variant="glass" className="p-6 space-y-6">
        <h2 className="text-sm font-serif font-bold text-velora-textPrimary uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          GDPR Data Rights & Account Management
        </h2>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
            <div>
              <h4 className="text-xs font-bold text-velora-textPrimary">Export Personal Data Archive (GDPR Art. 20)</h4>
              <p className="text-[11px] text-velora-textMuted mt-0.5">
                Download a complete JSON export of your profile, messages, transactions, and media history.
              </p>
            </div>
            <Button
              variant="glass"
              size="sm"
              className="text-xs font-bold border-emerald-500/40 text-emerald-300 shrink-0 gap-2"
              onClick={handleExportGdprData}
            >
              <Download className="w-4 h-4" /> Download Data Archive
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-panel rounded-2xl border border-velora-gold/30">
            <div>
              <h4 className="text-xs font-bold text-velora-gold">Log Out of Velora Account</h4>
              <p className="text-[11px] text-velora-textMuted mt-0.5">
                Sign out of your active session on this device.
              </p>
            </div>
            <Button
              variant="gold"
              size="sm"
              className="text-xs font-bold shrink-0 gap-2 shadow-gold-glow"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4" /> Log Out
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-panel rounded-2xl border border-red-500/30">
            <div>
              <h4 className="text-xs font-bold text-red-400">Permanently Delete Velora Account (GDPR Right to be Forgotten)</h4>
              <p className="text-[11px] text-velora-textMuted mt-0.5">
                Permanently purge all profile data, messages, wallet records, and media vaults.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              className="text-xs font-bold shrink-0 gap-2"
              onClick={() => setDeleteModalOpen(true)}
            >
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Deletion Confirmation Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Account Deletion">
        <div className="space-y-4 text-left">
          <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 leading-relaxed">
              This action is permanent and cannot be undone. All your profile media, messages, wallet balances, and subscriptions will be permanently purged.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/2 text-xs" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="w-1/2 text-xs font-bold uppercase tracking-wider" onClick={() => setDeleteModalOpen(false)}>
              Confirm Permanent Erasure
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verification Wizard Modal */}
      <VerificationWizard
        isOpen={verificationWizardOpen}
        onClose={() => setVerificationWizardOpen(false)}
      />
    </div>
  );
}
