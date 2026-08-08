"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { VerificationWizard } from "@/components/verification/VerificationWizard";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { LanguageCode } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";
import {
  Settings,
  Shield,
  EyeOff,
  Lock,
  MessageSquare,
  Ban,
  MapPin,
  CheckCircle2,
  Sliders,
  UserCheck,
  Globe,
  Download,
  Trash2,
  LogOut,
  AlertTriangle,
  Camera,
} from "lucide-react";

export default function SettingsPage() {
  const { user, profile, updateUserProfile, logout, logoutWithAuth0 } = useAuth();
  const [nickname, setNickname] = useState(profile?.displayName || user?.username || "");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>("en");
  const [privacy, setPrivacy] = useState({
    profileVisibility: "MEMBERS_ONLY",
    sensitiveFieldsVisibility: "PRIVATE",
    locationPrecision: "CITY",
    messagePermission: "MEMBERS_ONLY",
    showOnlineStatus: false,
    showDistance: true,
  });
  const [sensitiveConsentGranted, setSensitiveConsentGranted] = useState(false);
  const [verificationWizardOpen, setVerificationWizardOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [mediaUploadPending, setMediaUploadPending] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user && profile) {
      const file = e.target.files[0];
      try {
        setMediaUploadPending(true);
        setSettingsError("");
        const declaration = await requestParticipantDeclaration();
        const result = await uploadFileToR2(file, "avatars", undefined, declaration);
        await updateUserProfile({ ...user, avatarUrl: result.publicUrl }, { ...profile, avatarUrl: result.publicUrl });
      } catch (error) {
        setSettingsError(error instanceof Error ? error.message : "Profile photo could not be uploaded");
      } finally {
        setMediaUploadPending(false);
        e.target.value = "";
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && user && profile) {
      const file = e.target.files[0];
      try {
        setMediaUploadPending(true);
        setSettingsError("");
        const declaration = await requestParticipantDeclaration();
        const result = await uploadFileToR2(file, "covers", undefined, declaration);
        await updateUserProfile(user, { ...profile, coverPhotoUrl: result.publicUrl });
      } catch (error) {
        setSettingsError(error instanceof Error ? error.message : "Cover photo could not be uploaded");
      } finally {
        setMediaUploadPending(false);
        e.target.value = "";
      }
    }
  };

  React.useEffect(() => {
    Promise.all([
      fetch("/api/privacy/settings", { credentials: "same-origin" }).then((response) => response.ok ? response.json() : null),
      fetch("/api/privacy/consents", { credentials: "same-origin" }).then((response) => response.ok ? response.json() : null),
    ]).then(([settingsPayload, consentPayload]) => {
      const settings = settingsPayload?.settings;
      if (settings) setPrivacy({
        profileVisibility: settings.profile_visibility || "MEMBERS_ONLY",
        sensitiveFieldsVisibility: settings.sensitive_fields_visibility || "PRIVATE",
        locationPrecision: settings.location_precision || "CITY",
        messagePermission: settings.message_permission || "MEMBERS_ONLY",
        showOnlineStatus: settings.show_online_status === true,
        showDistance: settings.show_distance === true,
      });
      const latest = consentPayload?.consents?.find((item: any) => item.consent_type === "SPECIAL_CATEGORY_PROFILE");
      setSensitiveConsentGranted(latest?.consent_status === "GRANTED");
    }).catch(() => undefined);
  }, []);

  const handleSave = async () => {
    if (user && profile && nickname.trim()) {
      const updatedUser = {
        ...user,
        username: nickname.trim().toLowerCase().replace(/\s+/g, "_"),
      };
      const updatedProfile = {
        ...profile,
        displayName: nickname.trim(),
      };
      updateUserProfile(updatedUser, updatedProfile);
    }
    const response = await fetch("/api/privacy/settings", {
      method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(privacy),
    });
    if (response.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleExportGdprData = async () => {
    const response = await fetch("/api/privacy/export", { credentials: "same-origin" });
    if (!response.ok) return;
    const blob = await response.blob();
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = URL.createObjectURL(blob);
    downloadAnchor.download = `intimo-data-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(downloadAnchor.href);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const updateSensitiveConsent = async (granted: boolean) => {
    const response = await fetch("/api/privacy/consents", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentType: "SPECIAL_CATEGORY_PROFILE", granted }),
    });
    if (response.ok) setSensitiveConsentGranted(granted);
  };

  const handleDeleteAccount = async () => {
    if (user) {
      try {
        const response = await fetch("/api/auth/delete-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmation: "DELETE" }),
        });
        if (!response.ok) throw new Error("Account deletion was not completed");
      } catch (err) {
        console.error("API call to delete account failed:", err);
      }
      setDeleteModalOpen(false);
      
      // The SDK clears its httpOnly session and validates the return target.
      window.location.href = "/auth/logout?returnTo=%2Fgoodbye";
    }
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
              Manage messaging permissions, privacy rights, consent, language, and safety controls.
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
      {settingsError && <div role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300">{settingsError}</div>}

      {/* SECTION 0: PRIVATE IDENTITY, AVATAR & BANNER */}
      <Card variant="glass" className="p-6 space-y-6">
        <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={handleCoverUpload} />

        <h2 className="text-sm font-serif font-bold text-velora-textPrimary uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <UserCheck className="w-4 h-4 text-velora-gold" />
          Private Identity, Avatar & Cover Banner
        </h2>

        <div className="space-y-6">
          {/* Avatar & Cover Upload Buttons */}
          <div className="flex flex-wrap items-center gap-6 pb-2 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-velora-gold/60 overflow-hidden bg-velora-card relative group shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile?.avatarUrl || user?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => !mediaUploadPending && avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  title="Upload New Avatar"
                >
                  <Camera className="w-5 h-5 text-velora-gold" />
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Profile Picture / Avatar</p>
                <p className="text-[10px] text-velora-textMuted mb-2">Upload a custom profile photo</p>
                <Button variant="glass" size="sm" disabled={mediaUploadPending} onClick={() => avatarInputRef.current?.click()} className="text-[11px] gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-velora-gold" /> {mediaUploadPending ? "Uploading…" : "Upload New Avatar"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="w-24 h-16 rounded-2xl border border-white/20 overflow-hidden bg-velora-card relative group shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile?.coverPhotoUrl || profile?.avatarUrl} alt="Cover Banner" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  title="Upload New Cover Banner"
                >
                  <Camera className="w-5 h-5 text-velora-gold" />
                </button>
              </div>
              <div>
                <p className="text-xs font-bold text-white">Cover Banner Image</p>
                <p className="text-[10px] text-velora-textMuted mb-2">Upload header background banner</p>
                <Button variant="glass" size="sm" onClick={() => coverInputRef.current?.click()} className="text-[11px] gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-velora-gold" /> Upload New Banner
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
              Club Nickname / Display Name
            </label>
            <Input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname (e.g. Lucas, Prince Charming, Valerie)"
              className="w-full text-xs"
            />
            <p className="text-[10px] text-velora-textMuted mt-1.5">
              This nickname will represent your verified identity across Intimo feeds, messaging, and community salons.
            </p>
          </div>
        </div>
      </Card>

      {/* SECTION 1: GLOBAL & REGIONAL SETTINGS */}
      <Card variant="glass" className="p-6 space-y-6">
        <h2 className="text-sm font-serif font-bold text-velora-textPrimary uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <Globe className="w-4 h-4 text-velora-gold" />
          Language
        </h2>

        <div className="grid grid-cols-1 gap-6">
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

        </div>
      </Card>

      <Card variant="glass" className="p-6 space-y-5">
        <h2 className="text-sm font-serif font-bold text-velora-textPrimary uppercase tracking-wider flex items-center gap-2 border-b border-white/10 pb-3">
          <EyeOff className="w-4 h-4 text-emerald-400" /> Privacy Center
        </h2>
        <p className="text-xs text-velora-textSecondary">Sensitive profile fields default to private. Exact coordinates are never shown through public profile APIs.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["Profile visibility", "profileVisibility", ["EVERYONE", "MEMBERS_ONLY", "MATCHING_USERS", "APPROVED_USERS", "PRIVATE"]],
            ["Sensitive fields", "sensitiveFieldsVisibility", ["EVERYONE", "MEMBERS_ONLY", "MATCHING_USERS", "APPROVED_USERS", "PRIVATE"]],
            ["Location display", "locationPrecision", ["HIDDEN", "CITY", "APPROXIMATE_DISTANCE"]],
            ["Who may message", "messagePermission", ["EVERYONE", "MEMBERS_ONLY", "MATCHING_USERS", "APPROVED_USERS", "PRIVATE"]],
          ].map(([label, key, options]) => (
            <label key={key as string} className="text-xs text-velora-textSecondary">
              <span className="block mb-2 font-semibold">{label as string}</span>
              <select value={(privacy as any)[key as string]} onChange={(event) => setPrivacy({ ...privacy, [key as string]: event.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white">
                {(options as string[]).map((option) => <option key={option} value={option} className="bg-velora-card">{option.replaceAll("_", " ")}</option>)}
              </select>
            </label>
          ))}
        </div>
        <label className="flex items-center justify-between p-3 glass-panel rounded-xl text-xs"><span>Show online status</span><input type="checkbox" checked={privacy.showOnlineStatus} onChange={(event) => setPrivacy({ ...privacy, showOnlineStatus: event.target.checked })} /></label>
        <label className="flex items-center justify-between p-3 glass-panel rounded-xl text-xs"><span>Show approximate distance</span><input type="checkbox" checked={privacy.showDistance} onChange={(event) => setPrivacy({ ...privacy, showDistance: event.target.checked })} /></label>
        <div className="p-4 border border-emerald-500/30 rounded-xl space-y-3">
          <p className="text-xs font-bold">Explicit sensitive-data consent</p>
          <p className="text-[11px] text-velora-textMuted">Controls processing of sexual orientation and intimate preferences for your profile and discovery. Withdrawal may make these features unavailable; it does not replace a deletion request.</p>
          <Button variant="glass" size="sm" onClick={() => updateSensitiveConsent(!sensitiveConsentGranted)}>{sensitiveConsentGranted ? "Withdraw consent" : "Grant consent"}</Button>
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
                Download a server-generated JSON export of your profile, messages, connections, consent history, and dating ads.
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
              <h4 className="text-xs font-bold text-velora-gold">Log Out of Intimo Account</h4>
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
              <h4 className="text-xs font-bold text-red-400">Permanently Delete Intimo Account (GDPR Right to be Forgotten)</h4>
              <p className="text-[11px] text-velora-textMuted mt-0.5">
                Start permanent deletion of your profile data, messages, and media, subject to documented safety/legal retention exceptions.
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
              This action is permanent and cannot be undone. Your profile, messages, and media will be deleted or anonymized through the documented deletion workflow, subject to legitimate safety or legal retention duties.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/2 text-xs" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" className="w-1/2 text-xs font-bold uppercase tracking-wider" onClick={handleDeleteAccount}>
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
