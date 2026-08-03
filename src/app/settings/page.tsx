"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { VerificationWizard } from "@/components/verification/VerificationWizard";
import { MOCK_SAFETY_SETTINGS } from "@/lib/mockData";
import { UserSafetySettings, MessagePermissionRules } from "@/types";
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
} from "lucide-react";

export default function SettingsPage() {
  const [safety, setSafety] = useState<UserSafetySettings>(MOCK_SAFETY_SETTINGS);
  const [blockedUsers, setBlockedUsers] = useState([
    { id: "usr-blk-1", username: "spammer_bot_99", blockedAt: "Yesterday" },
    { id: "usr-blk-2", username: "unwanted_contact", blockedAt: "3 days ago" },
  ]);
  const [verificationWizardOpen, setVerificationWizardOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUnblock = (id: string) => {
    setBlockedUsers(blockedUsers.filter((u) => u.id !== id));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-velora-gold" />
          <div>
            <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
              Privacy, Safety & Messaging Rules
            </h1>
            <p className="text-xs text-velora-textSecondary mt-1">
              Manage messaging permissions, stealth mode, location precision, and blocked contacts.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          size="sm"
          className="text-xs font-bold uppercase tracking-wider gap-2 shrink-0"
          onClick={() => setVerificationWizardOpen(true)}
        >
          <UserCheck className="w-4 h-4" />
          Verification Center
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-4 glass-panel-gold border-velora-gold rounded-2xl flex items-center gap-3 text-xs text-velora-gold font-bold">
          <CheckCircle2 className="w-5 h-5 text-velora-gold" />
          Privacy & Message Rules updated successfully!
        </div>
      )}

      {/* 1. MESSAGE PERMISSIONS */}
      <Card variant="goldBorder" className="p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <MessageSquare className="w-5 h-5 text-velora-gold" />
          <h2 className="text-lg font-serif font-bold text-velora-textPrimary">
            Message Permissions & Inbound Rules
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
              Who Can Send Me Messages?
            </label>
            <select
              value={safety.whoCanMessageMe}
              onChange={(e) =>
                setSafety({ ...safety, whoCanMessageMe: e.target.value as MessagePermissionRules })
              }
              className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            >
              <option value="EVERYONE">Everyone (All Registered Members)</option>
              <option value="VERIFIED_ONLY">100% ID Verified Members Only</option>
              <option value="FAVORITES_ONLY">Saved Favorites Contacts Only</option>
              <option value="NOBODY">Nobody (Pause All New Messages)</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-velora-textPrimary">Allow Photo & Media Attachments</p>
                <p className="text-velora-textMuted text-[11px]">Permit contacts to send image attachments in chat</p>
              </div>
              <input
                type="checkbox"
                checked={safety.allowPhotoMessages}
                onChange={(e) => setSafety({ ...safety, allowPhotoMessages: e.target.checked })}
                className="accent-velora-gold w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-velora-textPrimary">Enable Automated Message Filtering</p>
                <p className="text-velora-textMuted text-[11px]">Filter spam, offsite links, and suspicious language</p>
              </div>
              <input
                type="checkbox"
                checked={safety.enableMessageFiltering}
                onChange={(e) => setSafety({ ...safety, enableMessageFiltering: e.target.checked })}
                className="accent-velora-gold w-5 h-5 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* 2. PRIVACY & STEALTH CONTROLS */}
      <Card variant="glass" className="p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <EyeOff className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-serif font-bold text-velora-textPrimary">
            Privacy, Stealth & Location Precision
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
              Profile Public Visibility Setting
            </label>
            <select
              value={safety.profileVisibilitySetting}
              onChange={(e) => setSafety({ ...safety, profileVisibilitySetting: e.target.value as any })}
              className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
            >
              <option value="EVERYONE">Everyone (Public Discovery & Web)</option>
              <option value="MEMBERS_ONLY">Members Only (Requires Velora Login)</option>
              <option value="VERIFIED_ONLY">Verified Members Only</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-velora-textPrimary">Appear in Search Discovery</p>
                <p className="text-velora-textMuted text-[11px]">Allow profile to be discovered via marketplace search</p>
              </div>
              <input
                type="checkbox"
                checked={safety.appearInSearch}
                onChange={(e) => setSafety({ ...safety, appearInSearch: e.target.checked })}
                className="accent-velora-gold w-5 h-5 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 glass-panel rounded-2xl cursor-pointer">
              <div>
                <p className="font-bold text-velora-textPrimary">Hide Online Active Status</p>
                <p className="text-velora-textMuted text-[11px]">Hide green online indicator and active timestamps</p>
              </div>
              <input
                type="checkbox"
                checked={safety.hideLastActive}
                onChange={(e) => setSafety({ ...safety, hideLastActive: e.target.checked })}
                className="accent-velora-gold w-5 h-5 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </Card>

      {/* 3. BLOCKED USERS MANAGEMENT */}
      <Card variant="glass" className="p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Ban className="w-5 h-5 text-red-400" />
          <h2 className="text-lg font-serif font-bold text-velora-textPrimary">
            Managed Blocked Users ({blockedUsers.length})
          </h2>
        </div>

        <div className="space-y-3">
          {blockedUsers.length > 0 ? (
            blockedUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 glass-panel rounded-2xl flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-bold text-velora-textPrimary">@{u.username}</p>
                  <p className="text-velora-textMuted text-[10px]">Blocked on {u.blockedAt}</p>
                </div>
                <Button
                  variant="glass"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleUnblock(u.id)}
                >
                  Unblock Contact
                </Button>
              </div>
            ))
          ) : (
            <p className="text-xs text-velora-textMuted">No blocked users.</p>
          )}
        </div>
      </Card>

      <div className="flex justify-end pt-4">
        <Button variant="gold" size="lg" className="font-bold uppercase tracking-wider" onClick={handleSave}>
          Save Privacy Settings
        </Button>
      </div>

      {/* Verification Wizard Modal */}
      <VerificationWizard
        isOpen={verificationWizardOpen}
        onClose={() => setVerificationWizardOpen(false)}
      />
    </div>
  );
}
