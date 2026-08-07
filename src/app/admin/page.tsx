"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { useAuth } from "@/context/AuthContext";
import { userStore } from "@/lib/auth0/userStore";
import { LANGUAGES } from "@/context/LanguageContext";
import {
  MOCK_LIVE_STREAMS,
  MOCK_COMMUNITIES,
} from "@/lib/mockData";
import {
  VerificationRequest,
  ReportItem,
  ModerationLog,
  CreatorApplication,
  PayoutRequest,
  RefundItem,
  LiveStream,
  CommunityItem,
} from "@/types";
import {
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Eye,
  AlertTriangle,
  Users,
  Lock,
  Ban,
  Clock,
  Trash2,
  Crown,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  Radio,
  Globe,
  BarChart3,
  TrendingUp,
  Activity,
  Languages as LanguagesIcon,
  CheckCircle2,
  ShieldX,
  Plus,
  AlertOctagon,
  Flame,
  Key,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, role, switchRole, impersonateUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("VERIFICATIONS");

  // Load state from userStore
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);

  // Superpowers States
  const [ghostMode, setGhostMode] = useState(false);
  const [impersonateQuery, setImpersonateQuery] = useState("");
  const [broadcastInput, setBroadcastInput] = useState("");
  const [broadcastTheme, setBroadcastTheme] = useState<"gold" | "amber" | "crimson">("gold");

  // Finance Superpowers States
  const [walletQuery, setWalletQuery] = useState("");
  const [walletAmount, setWalletAmount] = useState<number>(100);
  const [walletReason, setWalletReason] = useState("Loyalty credits reward");
  const [giftQuery, setGiftQuery] = useState("");
  const [giftTier, setGiftTier] = useState("PREMIUM");
  const [giftDuration, setGiftDuration] = useState("1 Month");
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({});

  // Local streams & communities
  const [streams, setStreams] = useState<LiveStream[]>(MOCK_LIVE_STREAMS);
  const [communities, setCommunities] = useState<CommunityItem[]>(MOCK_COMMUNITIES);

  // Modals & inputs
  const [rejectionModalTarget, setRejectionModalTarget] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [biometricModalTarget, setBiometricModalTarget] = useState<any>(null);
  const [reportModalTarget, setReportModalTarget] = useState<ReportItem | null>(null);

  const handleManualVerificationOverride = (userId: string, level: string) => {
    const userObj = userStore.findById(userId);
    if (userObj) {
      userStore.save({
        ...userObj,
        verificationLevel: level as any,
        verificationStatus: "IDENTITY_VERIFIED",
      });
      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: userObj.username,
        action: "WARN_USER",
        reason: `Manually set user verification level to: ${level}`,
      });
      refreshData();
      alert(`User verification level manually updated to ${level}!`);
    } else {
      alert("Error: User account not found in local store.");
    }
  };
  const [reportActionReason, setReportActionReason] = useState("");
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Load data from userStore on mount and when changes happen
  const refreshData = () => {
    setVerificationRequests(userStore.getVerificationRequests());
    setReports(userStore.getReports());
    setCreatorApps(userStore.getCreatorApplications());
    setPayouts(userStore.getPayoutRequests());
    setRefunds(userStore.getRefundRequests());
    setLogs(userStore.getModerationLogs());
  };

  useEffect(() => {
    refreshData();
    if (typeof window !== "undefined") {
      setGhostMode(localStorage.getItem("intimo_admin_ghost_mode") === "true");
      
      const savedBroadcast = localStorage.getItem("intimo_active_broadcast_banner");
      if (savedBroadcast) {
        try {
          const parsed = JSON.parse(savedBroadcast);
          setBroadcastInput(parsed.text);
          setBroadcastTheme(parsed.theme);
        } catch {}
      }

      // Hydrate cooldown states
      const loadedCooldowns: Record<string, boolean> = {};
      MOCK_COMMUNITIES.forEach((c) => {
        loadedCooldowns[c.id] = localStorage.getItem(`intimo_room_cooldown_${c.id}`) === "true";
      });
      setCooldowns(loadedCooldowns);
    }
  }, []);

  const handleToggleCooldown = (roomId: string, roomName: string) => {
    const nextVal = !cooldowns[roomId];
    setCooldowns((prev) => ({ ...prev, [roomId]: nextVal }));
    if (nextVal) {
      localStorage.setItem(`intimo_room_cooldown_${roomId}`, "true");
      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: roomName,
        action: "WARN_USER",
        reason: `Placed chatroom '${roomName}' in cooldown mode (Read-Only enabled).`,
      });
      alert(`Chatroom "${roomName}" is now in COOLDOWN mode!`);
    } else {
      localStorage.removeItem(`intimo_room_cooldown_${roomId}`);
      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: roomName,
        action: "WARN_USER",
        reason: `Removed chatroom '${roomName}' from cooldown mode (Write access restored).`,
      });
      alert(`Chatroom "${roomName}" has been removed from cooldown.`);
    }
    refreshData();
  };

  const handleToggleGhostMode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setGhostMode(checked);
    if (checked) {
      localStorage.setItem("intimo_admin_ghost_mode", "true");
      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: "Compliance Service",
        action: "WARN_USER",
        reason: "Activated Admin Ghost Mode (Profile visits will be anonymous).",
      });
    } else {
      localStorage.removeItem("intimo_admin_ghost_mode");
      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: "Compliance Service",
        action: "WARN_USER",
        reason: "Deactivated Admin Ghost Mode.",
      });
    }
    refreshData();
  };

  const handleShadowbanUser = (reportedUsername: string) => {
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: reportedUsername,
      action: "WARN_USER",
      reason: `Silently shadowbanned user account @${reportedUsername} (Shadowban lock active).`,
    });
    alert(`User @${reportedUsername} has been shadowbanned successfully!`);
    refreshData();
  };

  const handleWalletAdjustment = (action: "add" | "deduct") => {
    if (!walletQuery.trim()) return;
    const q = walletQuery.trim().toLowerCase();
    const allUsers = userStore.getAll();
    const target = allUsers.find(
      (u) => u.email.toLowerCase() === q || u.username.toLowerCase() === q
    );
    
    if (target) {
      const currentBalance = target.walletBalance || 0;
      const adjustment = action === "add" ? walletAmount : -walletAmount;
      const newBalance = Math.max(0, currentBalance + adjustment);
      
      userStore.save({
        ...target,
        walletBalance: newBalance,
      });

      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: target.username,
        action: "WARN_USER",
        reason: `Wallet Balance Adjustment: ${action === "add" ? "+" : "-"}${walletAmount} credits. Reason: ${walletReason}. New Balance: ${newBalance} credits.`,
      });

      alert(`Wallet balance for @${target.username} updated successfully! New Balance: ${newBalance} credits.`);
      setWalletQuery("");
      refreshData();
    } else {
      alert(`User "${walletQuery}" not found! Please check username spelling (e.g. member@intimo.live or Alexander).`);
    }
  };

  const handleGiftPremium = () => {
    if (!giftQuery.trim()) return;
    const q = giftQuery.trim().toLowerCase();
    const allUsers = userStore.getAll();
    const target = allUsers.find(
      (u) => u.email.toLowerCase() === q || u.username.toLowerCase() === q
    );
    
    if (target) {
      userStore.save({
        ...target,
        memberTier: giftTier as any,
      });

      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: target.username,
        action: "WARN_USER",
        reason: `Gifted Premium Access: Upgraded to ${giftTier} tier for ${giftDuration}.`,
      });

      alert(`Successfully gifted ${giftTier} membership tier to @${target.username} for ${giftDuration}!`);
      setGiftQuery("");
      refreshData();
    } else {
      alert(`User "${giftQuery}" not found! Please check username spelling.`);
    }
  };

  const handleQuickImpersonate = () => {
    if (!impersonateQuery.trim()) return;
    const q = impersonateQuery.trim().toLowerCase();
    
    // Attempt to locate target user profile in mock store
    const allUsers = userStore.getAll();
    const target = allUsers.find(
      (u) => u.email.toLowerCase() === q || u.username.toLowerCase() === q
    );

    if (target) {
      const targetProfile = {
        id: `prof_${target.id}`,
        userId: target.id,
        displayName: target.username,
        age: target.age || 26,
        gender: target.gender || "FEMALE",
        sexualOrientation: target.sexualOrientation || "BISEXUAL",
        country: target.country || "Czech Republic",
        city: target.city || "Prague",
        location: target.location || "Prague, CZ",
        languages: ["English"],
        headline: target.headline || "Private Intimo Member Profile",
        bio: target.bio || "Discreet, open-minded member exploring connections on Intimo.",
        interests: target.interests || ["Friends with Benefits", "Casual Chatting"],
        lifestyleTags: target.lifestyleTags || ["Discreet"],
        hobbies: target.hobbies || [],
        relationshipStatus: target.relationshipStatus || "SINGLE",
        lookingFor: target.lookingFor || ["Connections"],
        isCoupleProfile: target.isCoupleProfile || false,
        publicProfileVisibility: true,
        photoVisibilityDefault: "PUBLIC",
        locationPrecision: "CITY",
        showOnlineStatus: true,
        showDistance: true,
        allowDirectMessages: true,
        requireVerificationToMessage: false,
        verified: target.verificationStatus === "IDENTITY_VERIFIED",
        isOnline: true,
        compatibilityScore: 95,
        avatarUrl: target.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        coverPhotoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        galleryImages: [],
      };

      impersonateUser(target as any, targetProfile as any);
      userStore.addModerationLog({
        adminUsername: user?.username || "admin_compliance",
        targetUsername: target.username,
        action: "WARN_USER",
        reason: `Initiated administrative session impersonation for user: ${target.username}`,
      });
      router.push("/dashboard");
    } else {
      alert(`User "${impersonateQuery}" not found in userStore! Please check the spelling (e.g. member@intimo.live or Alexander).`);
    }
  };

  const handlePublishBroadcast = () => {
    if (!broadcastInput.trim()) return;
    const payload = { text: broadcastInput.trim(), theme: broadcastTheme };
    localStorage.setItem("intimo_active_broadcast_banner", JSON.stringify(payload));
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: "Global Broadcast",
      action: "WARN_USER",
      reason: `Published system-wide alert: "${broadcastInput.trim()}" (Theme: ${broadcastTheme})`,
    });
    refreshData();
    alert("System-wide broadcast banner published successfully!");
  };

  const handleClearBroadcast = () => {
    localStorage.removeItem("intimo_active_broadcast_banner");
    setBroadcastInput("");
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: "Global Broadcast",
      action: "WARN_USER",
      reason: "Deactivated system-wide alert banner.",
    });
    refreshData();
    alert("System-wide broadcast banner cleared.");
  };

  // --- ACTIONS ---

  // Identity Verification
  const handleApproveVerification = (id: string, name: string) => {
    userStore.approveVerification(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: name,
      action: "WARN_USER", // mapping placeholder
      reason: "Identity photo verification approved and Level 3 biometric badge issued.",
    });
    refreshData();
  };

  const handleRejectVerification = (id: string) => {
    if (!rejectionReasonInput.trim()) return;
    const req = verificationRequests.find((r) => r.id === id);
    userStore.rejectVerification(id, rejectionReasonInput.trim());
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: req?.userName || "unknown_member",
      action: "WARN_USER",
      reason: `Identity photo verification rejected: ${rejectionReasonInput.trim()}`,
    });
    setRejectionModalTarget(null);
    setRejectionReasonInput("");
    refreshData();
  };

  // Creator Applications
  const handleApproveCreatorApp = (id: string, username: string) => {
    userStore.approveCreatorApplication(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_onboarding",
      targetUsername: username,
      action: "WARN_USER",
      reason: "Creator Onboarding application approved. Upgraded account role to VERIFIED_CREATOR.",
    });
    refreshData();
  };

  const handleRejectCreatorApp = (id: string, username: string) => {
    userStore.rejectCreatorApplication(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_onboarding",
      targetUsername: username,
      action: "WARN_USER",
      reason: "Creator Onboarding application rejected due to incomplete banking details or classification guidelines.",
    });
    refreshData();
  };

  // Compliance Reports
  const handleResolveReport = (report: ReportItem, actionType: any, reason: string) => {
    if (!reason.trim()) return;
    
    // Resolve report in store
    userStore.updateReportStatus(report.id, "RESOLVED");

    // Add moderation log
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: report.reportedUsername,
      action: actionType,
      reason: `${report.reason} report resolved: ${reason.trim()}`,
    });

    setReportModalTarget(null);
    setReportActionReason("");
    refreshData();
  };

  const handleDismissReport = (id: string, reportedUsername: string) => {
    userStore.updateReportStatus(id, "DISMISSED");
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: reportedUsername,
      action: "REMOVE_CONTENT",
      reason: "Compliance report dismissed after administrative review.",
    });
    refreshData();
  };

  // Payouts
  const handleApprovePayout = (id: string, username: string, amount: number) => {
    userStore.approvePayout(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Creator payout request of $${amount.toFixed(2)} approved for processing.`,
    });
    refreshData();
  };

  const handleRejectPayout = (id: string, username: string) => {
    userStore.rejectPayout(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Creator payout request rejected. Placed earnings on standard security hold.`,
    });
    refreshData();
  };

  // Refunds
  const handleApproveRefund = (id: string, username: string, amount: number, product: string) => {
    userStore.approveRefund(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Approved refund of $${amount.toFixed(2)} for product: ${product}.`,
    });
    refreshData();
  };

  const handleRejectRefund = (id: string, username: string, product: string) => {
    userStore.rejectRefund(id);
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_finance",
      targetUsername: username,
      action: "WARN_USER",
      reason: `Rejected refund request for product: ${product}.`,
    });
    refreshData();
  };

  // Streams
  const handleSuspendStream = (streamId: string, title: string, host: string) => {
    setStreams(streams.map((s) => (s.id === streamId ? { ...s, status: "SUSPENDED" } : s)));
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: host,
      action: "SUSPEND_LIVE_STREAM",
      reason: `Emergency compliance suspension of live stream: "${title}".`,
    });
    refreshData();
  };

  // Communities
  const handleDeleteCommunityPost = (postId: string, communitySlug: string) => {
    // Audit log
    userStore.addModerationLog({
      adminUsername: user?.username || "admin_compliance",
      targetUsername: `Community: ${communitySlug}`,
      action: "REMOVE_COMMUNITY_POST",
      reason: `Administrative removal of discussion post #${postId} due to safety report.`,
    });
    refreshData();
  };

  // ── ROLE GATE & LOCK SCREEN ──
  const isAdminAuthorized = role === "ADMIN";

  if (!isAdminAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <Card variant="goldBorder" className="p-8 space-y-6 bg-velora-card/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-velora-gold/5 rounded-full blur-2xl" />
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8 text-velora-gold" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
              Access Restriction Gate
            </h2>
            <p className="text-xs text-velora-textMuted max-w-sm mx-auto leading-relaxed">
              You are attempting to access the Administrative Governance Portal. This route requires elevated credentials (e.g. `SYSTEM_ADMIN` or `CONTENT_MODERATOR`).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5">
            <span className="text-[10px] font-bold text-velora-gold uppercase tracking-wider block">
              Identity Management status
            </span>
            <div className="flex justify-between text-xs text-velora-textSecondary">
              <span>Current Account Email:</span>
              <span className="text-white font-mono">{user?.email || "anonymous@intimo.live"}</span>
            </div>
            <div className="flex justify-between text-xs text-velora-textSecondary">
              <span>Assigned RBAC Role:</span>
              <span className="text-red-400 font-bold font-mono">{role}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="gold"
              size="md"
              className="w-full font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2"
              onClick={() => switchRole("ADMIN")}
            >
              <Key className="w-4 h-4 text-black" />
              Simulate Login as System Admin
            </Button>
            <Link href="/dashboard" className="block text-xs text-velora-textMuted hover:text-velora-gold underline">
              Return to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // --- RENDERING TABS ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge type="admin" label="Administrator Portal" />
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Authorized Sandbox Session
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            Identity Verification & Governance Desk
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Review member verification selfies, process creator applications, resolve user reports, supervise streams, and authorize payments.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "VERIFICATIONS", label: "Verification Queue", count: verificationRequests.filter((r) => r.status === "PENDING").length },
            { id: "REPORTS", label: "Reports Queue", count: reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length },
            { id: "CREATORS", label: "Creator Application Queue", count: creatorApps.filter((a) => a.status === "PENDING").length },
            { id: "FINANCES", label: "Financial & Refund Desk", count: payouts.filter((p) => p.status === "PENDING").length + refunds.filter((r) => r.status === "PENDING").length },
            { id: "COMMUNITIES", label: "Community Desk", count: communities.length },
            { id: "STREAMS", label: "Live Supervision", count: streams.filter((s) => s.status === "LIVE").length },
            { id: "AUDIT", label: "Audit Log", count: logs.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Admin Superpowers Global Controls Console */}
      <Card variant="goldBorder" className="p-6 bg-velora-card/75 border-amber-400/20 space-y-4">
        <h2 className="text-sm font-bold font-mono text-velora-gold uppercase tracking-widest flex items-center gap-2">
          <Crown className="w-4 h-4 text-velora-gold" /> Admin Superpowers Control Center
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ghost Mode & Impersonate Search */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-white block">Compliance Ghost Mode</span>
                <span className="text-[10px] text-velora-textMuted block">Browse profiles and rooms invisibly without leaving visitor logs.</span>
              </div>
              <input
                type="checkbox"
                checked={ghostMode}
                onChange={handleToggleGhostMode}
                className="w-10 h-5 rounded-full bg-white/10 border-white/20 checked:bg-velora-gold cursor-pointer transition-colors focus:ring-0 focus:outline-none"
              />
            </div>
            
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-xs font-semibold text-white block">Quick Member Impersonation</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter email or username..."
                  value={impersonateQuery}
                  onChange={(e) => setImpersonateQuery(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-velora-gold"
                />
                <Button variant="gold" size="sm" className="text-xs font-bold text-black py-1 px-4" onClick={handleQuickImpersonate}>
                  Impersonate
                </Button>
              </div>
            </div>
          </div>

          {/* Broadcast Banner Editor */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-xs font-semibold text-white block">System-Wide Broadcast Banner</span>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter alert text (e.g. Scheduled updates at 02:00 CET...)"
                value={broadcastInput}
                onChange={(e) => setBroadcastInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-velora-gold"
              />
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex gap-1.5">
                  {(["gold", "amber", "crimson"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBroadcastTheme(t)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono border transition-all ${
                        broadcastTheme === t
                          ? "bg-amber-400 text-black border-amber-400 shadow-gold-glow"
                          : "bg-white/5 text-velora-textMuted border-white/10 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="gold" size="sm" className="text-[10px] font-bold text-black py-1 px-3.5" onClick={handlePublishBroadcast}>
                    Publish
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[10px] text-red-400 border border-red-500/20 py-1 px-3" onClick={handleClearBroadcast}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="goldBorder" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-gold uppercase tracking-wider block">
            Platform Gross Volume
          </span>
          <span className="text-3xl font-serif font-bold text-velora-textPrimary">
            ${(18450.00 + payouts.filter(p => p.status === "APPROVED").reduce((acc, curr) => acc + curr.amount, 0)).toFixed(2)}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono">+18.4% this month</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Reports Queue
          </span>
          <span className="text-3xl font-serif font-bold text-red-400">
            {reports.filter((r) => r.status === "PENDING").length} Tickets
          </span>
          <span className="text-[11px] text-red-300 font-mono">1 Hour Response Target</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Monthly Active Users
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">12,480</span>
          <span className="text-[11px] text-emerald-400 font-mono">92.4% Retention Rate</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Live Broadcasts
          </span>
          <span className="text-3xl font-serif font-bold text-red-400">
            {streams.filter((s) => s.status === "LIVE").length}
          </span>
          <span className="text-[11px] text-velora-textMuted font-mono">Real-time WebRTC</span>
        </Card>
      </div>

      {/* VERIFICATIONS TAB */}
      {activeTab === "VERIFICATIONS" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                Identity Verification Requests Queue ({verificationRequests.filter((r) => r.status === "PENDING").length} Pending)
              </h2>
              <p className="text-xs text-velora-textMuted">
                Review member verification selfies holding handwritten paper notes inscribed with <strong>&quot;INTIMO&quot;</strong> and current date.
              </p>
            </div>
          </div>

          {verificationRequests.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
              No verification requests submitted yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationRequests.map((req) => (
                <Card
                  key={req.id}
                  variant="goldBorder"
                  className="p-6 space-y-4 text-left bg-velora-card relative overflow-hidden"
                >
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-amber-400/40 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={req.userAvatarUrl} alt={req.userName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                          {req.userName}
                        </h3>
                        <p className="text-xs text-velora-textMuted">{req.userEmail}</p>
                        <p className="text-[10px] text-amber-300 font-mono mt-0.5">Submitted {req.submittedAt}</p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        req.status === "PENDING"
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                          : req.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border-red-500/40"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-velora-textSecondary">
                      <span>Verification Selfie & Handwritten Paper Note:</span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setBiometricModalTarget(req)}
                          className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px] font-bold"
                        >
                          <Crown className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Biometric Match
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomPhotoUrl(req.verificationPhotoUrl)}
                          className="text-amber-300 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" /> Click to Zoom
                        </button>
                      </div>
                    </div>

                    <div
                      onClick={() => setZoomPhotoUrl(req.verificationPhotoUrl)}
                      className="h-56 w-full rounded-2xl bg-black border border-white/10 relative overflow-hidden group cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.verificationPhotoUrl}
                        alt="Verification selfie"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                          Inspect Photo & Note
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-velora-textMuted space-y-2">
                      <p className="text-white font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Administrative Checklist:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-velora-textSecondary pl-1">
                        <li>Member holds paper note with <strong>&quot;INTIMO&quot;</strong> inscribed.</li>
                        <li>Handwritten date matches submission timeframe.</li>
                        <li>Face and paper details are legible and unedited.</li>
                      </ul>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-white">Manual Level Override:</span>
                        <div className="flex gap-1">
                          {["LEVEL_1_EMAIL", "LEVEL_2_ID", "LEVEL_3_PROFILE_BIOMETRIC"].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handleManualVerificationOverride(req.userId, lvl)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 text-[9px] font-mono text-amber-300 border border-amber-500/20 hover:bg-amber-400 hover:text-black transition-colors"
                            >
                              {lvl.split("_").pop()}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {req.status === "PENDING" && (
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                      <Button
                        variant="glass"
                        size="md"
                        onClick={() => setRejectionModalTarget(req.id)}
                        className="w-1/2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4 mr-1" /> Reject Request
                      </Button>
                      <Button
                        variant="gold"
                        size="md"
                        onClick={() => handleApproveVerification(req.id, req.userName)}
                        className="w-1/2 text-xs font-bold uppercase tracking-wider shadow-gold-glow bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                      >
                        <ShieldCheck className="w-4 h-4 mr-1 text-emerald-400" /> Approve & Issue Badge
                      </Button>
                    </div>
                  )}

                  {req.status === "REJECTED" && (
                    <p className="text-xs text-red-400 italic">Rejection Reason: {req.rejectionReason}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === "REPORTS" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              Security & Compliance Report Queue ({reports.filter((r) => r.status === "PENDING" || r.status === "INVESTIGATING").length} Open)
            </h2>
            <p className="text-xs text-velora-textMuted">
              Review and act on members flagging violations regarding underage suspicion, harassment, fake profiles, and fraud.
            </p>
          </div>

          {reports.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
              No compliance reports logged yet.
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <Card
                  key={rep.id}
                  variant={rep.reason.includes("Underage") ? "goldBorder" : "glass"}
                  className={`p-6 text-left relative overflow-hidden ${
                    rep.status === "RESOLVED"
                      ? "opacity-60 border-emerald-500/20"
                      : rep.status === "DISMISSED"
                      ? "opacity-40"
                      : ""
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rep.reason.includes("Underage")
                            ? "bg-red-500/20 text-red-400 border border-red-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}>
                          {rep.reason}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          rep.status === "PENDING"
                            ? "bg-white/10 text-white"
                            : rep.status === "INVESTIGATING"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">
                        Reported User: <span className="text-velora-gold">@{rep.reportedUsername}</span> ({rep.reportedUserRole})
                      </h3>
                      <p className="text-xs text-velora-textSecondary mt-1">
                        Submitted by: <span className="text-slate-300">@{rep.reporterUsername}</span> • {rep.submittedAt}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-velora-textMuted flex-wrap">
                        <span>Device ID: dfa3-94c2-9e90 (CZ IP: 194.22.84.102)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const bans = JSON.parse(localStorage.getItem("intimo_banned_fingerprints") || "[]");
                            if (!bans.includes("dfa3-94c2-9e90")) {
                              bans.push("dfa3-94c2-9e90");
                              localStorage.setItem("intimo_banned_fingerprints", JSON.stringify(bans));
                              userStore.addModerationLog({
                                adminUsername: user?.username || "admin_compliance",
                                targetUsername: rep.reportedUsername,
                                action: "BAN_USER_PERMANENT",
                                reason: `Issued hardware fingerprint/IP ban for device: dfa3-94c2-9e90 (${rep.reportedUsername})`,
                              });
                              alert(`Hardware device fingerprint dfa3-94c2-9e90 has been banned!`);
                              refreshData();
                            } else {
                              alert("Device fingerprint is already banned.");
                            }
                          }}
                          className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-400 hover:text-black transition-colors"
                        >
                          IP/Device Ban
                        </button>
                      </div>
                    </div>

                    {rep.evidenceUrl && (
                      <button
                        onClick={() => setZoomPhotoUrl(rep.evidenceUrl || null)}
                        className="flex items-center gap-1 text-[11px] text-amber-300 hover:underline border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Chat Evidence Screenshot
                      </button>
                    )}
                  </div>

                  <div className="py-4 space-y-2">
                    <p className="text-xs text-velora-textMuted uppercase font-semibold tracking-wider">Report Details:</p>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-xs text-white leading-relaxed italic">
                      &quot;{rep.details}&quot;
                    </div>
                  </div>

                  {rep.status !== "RESOLVED" && rep.status !== "DISMISSED" && (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/10 flex-wrap">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleDismissReport(rep.id, rep.reportedUsername)}
                        className="text-xs border-white/15 text-velora-textSecondary hover:bg-white/10"
                      >
                        Dismiss / Archive Report
                      </Button>
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleShadowbanUser(rep.reportedUsername)}
                        className="text-xs border-white/15 text-purple-300 hover:bg-purple-500/10 flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5 mr-0.5 text-purple-400" /> Shadowban User
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setReportModalTarget(rep)}
                        className="text-xs font-bold uppercase tracking-wider ml-auto"
                      >
                        <AlertOctagon className="w-4 h-4 mr-1 text-red-400" /> Take Compliance Action
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* NSFW AI Moderation Override Queue */}
          <div className="pt-8 border-t border-white/10 space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400 animate-pulse" />
                Real-Time AI NSFW Photo Scan Queue (Moderation Override)
              </h3>
              <p className="text-xs text-velora-textMuted">
                Reviews public feed media flagged by automatic neural filters. Override safety flags to approve content or confirm deletion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { id: "ai-1", name: "vixen_night", score: "98.4% NSFW (Adult Material)", url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=300&q=80" },
                { id: "ai-2", name: "monaco_play", score: "91.2% NSFW (Restricted Dress)", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80" }
              ].map((item) => (
                <Card key={item.id} variant="glass" className="p-4 space-y-3 relative overflow-hidden text-xs bg-velora-card">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold text-white font-mono">@{item.name}</span>
                    <span className="text-[10px] text-red-400 font-mono font-bold bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      {item.score}
                    </span>
                  </div>
                  
                  <div className="h-44 rounded-xl bg-black overflow-hidden relative border border-white/10">
                    {/* Blurred Image representing flagged content */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="Flagged" className="w-full h-full object-cover blur-xl" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col p-2 text-center space-y-1.5">
                      <ShieldX className="w-8 h-8 text-red-400" />
                      <span className="text-[10px] text-velora-textSecondary">Content Blocked by AI Filter</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        userStore.addModerationLog({
                          adminUsername: user?.username || "admin_compliance",
                          targetUsername: item.name,
                          action: "WARN_USER",
                          reason: `AI Moderation override: Approved blocked photo for member @${item.name} (TOS confirmed compliant).`,
                        });
                        alert(`NSFW flag overridden: Content approved for @${item.name}!`);
                        refreshData();
                      }}
                      className="w-1/2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-all text-[10px] uppercase font-mono"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        userStore.addModerationLog({
                          adminUsername: user?.username || "admin_compliance",
                          targetUsername: item.name,
                          action: "REMOVE_COMMUNITY_POST",
                          reason: `AI Moderation confirmed: Deleted flagged graphic photo for member @${item.name}.`,
                        });
                        alert(`AI flag confirmed: Flagged photo permanently deleted for @${item.name}!`);
                        refreshData();
                      }}
                      className="w-1/2 py-1.5 rounded-lg bg-red-500/20 text-red-300 font-bold border border-red-500/30 hover:bg-red-500/30 transition-all text-[10px] uppercase font-mono"
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATOR APPLICATION QUEUE */}
      {activeTab === "CREATORS" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-velora-gold" />
              Creator Applications Queue ({creatorApps.filter((a) => a.status === "PENDING").length} Pending)
            </h2>
            <p className="text-xs text-velora-textMuted">
              Review requests from standard members looking to upgrade to full commercial Creator Accounts.
            </p>
          </div>

          {creatorApps.length === 0 ? (
            <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
              No creator applications submitted yet.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creatorApps.map((app) => (
                <Card
                  key={app.id}
                  variant="goldBorder"
                  className={`p-6 space-y-4 text-left ${app.status !== "PENDING" ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between border-b border-white/10 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">@{app.user.username}</h3>
                      <p className="text-xs text-velora-textMuted">{app.user.email}</p>
                      <p className="text-[10px] text-amber-300 font-mono mt-0.5">Submitted {app.submittedAt}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      app.status === "PENDING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : app.status === "VERIFIED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Proposed Categories:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {app.categories.map((c) => (
                          <span key={c} className="px-2 py-0.5 bg-white/5 rounded-full text-white text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Monthly Subscription Price:</span>
                      <span className="text-velora-gold font-bold font-serif text-sm">${app.proposedMonthlyPrice} / month</span>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Creator Bio:</span>
                      <p className="p-3 bg-white/5 rounded-xl border border-white/5 italic text-white mt-1">
                        &quot;{app.bio}&quot;
                      </p>
                    </div>
                    <div className="pt-2">
                      <span className="font-semibold text-velora-textSecondary block uppercase tracking-wider text-[10px]">Payout Method:</span>
                      <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">{app.payoutMethod}: {app.payoutDetails}</span>
                    </div>
                  </div>

                  {app.status === "PENDING" && (
                    <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => handleRejectCreatorApp(app.id, app.user.username)}
                        className="w-1/2 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                      >
                        Reject Application
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handleApproveCreatorApp(app.id, app.user.username)}
                        className="w-1/2 text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                      >
                        Approve Creator
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FINANCES & REFUND DESK */}
      {activeTab === "FINANCES" && (
        <div className="space-y-8">
          {/* Global Finances Superpowers Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wallet Adjustments Panel */}
            <Card variant="goldBorder" className="p-6 bg-velora-card/75 space-y-4">
              <h3 className="text-sm font-bold font-mono text-velora-gold uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-velora-gold" /> Member Wallet Console
              </h3>
              <p className="text-[11px] text-velora-textMuted leading-relaxed">
                Add or deduct credits from user balances instantly for loyalty rewards, refunds, or system audits.
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-velora-textSecondary uppercase block mb-1">Target Account Name/Email</label>
                  <input
                    type="text"
                    placeholder="Enter email or username (e.g. member@intimo.live)"
                    value={walletQuery}
                    onChange={(e) => setWalletQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-velora-gold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-velora-textSecondary uppercase block mb-1">Adjustment Credits</label>
                    <input
                      type="number"
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-velora-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-velora-textSecondary uppercase block mb-1">Adjustment Reason</label>
                    <input
                      type="text"
                      placeholder="Audit reason..."
                      value={walletReason}
                      onChange={(e) => setWalletReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-velora-gold"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleWalletAdjustment("add")}
                    className="w-1/2 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 hover:bg-emerald-500/35 transition-all text-xs uppercase"
                  >
                    Add Credits
                  </button>
                  <button
                    onClick={() => handleWalletAdjustment("deduct")}
                    className="w-1/2 py-2 rounded-xl bg-red-500/20 text-red-300 font-bold border border-red-500/30 hover:bg-red-500/35 transition-all text-xs uppercase"
                  >
                    Deduct Credits
                  </button>
                </div>
              </div>
            </Card>

            {/* Premium VIP Gifting Panel */}
            <Card variant="goldBorder" className="p-6 bg-velora-card/75 space-y-4">
              <h3 className="text-sm font-bold font-mono text-velora-gold uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-velora-gold" /> Premium Tier Gifting Desk
              </h3>
              <p className="text-[11px] text-velora-textMuted leading-relaxed">
                Gift membership tiers (Premium, Elite VIP) to members for marketing rewards, system comps, or support resolutions.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-velora-textSecondary uppercase block mb-1">Target Account Name/Email</label>
                  <input
                    type="text"
                    placeholder="Enter email or username (e.g. member@intimo.live)"
                    value={giftQuery}
                    onChange={(e) => setGiftQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-velora-gold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-velora-textSecondary uppercase block mb-1">VIP Tier</label>
                    <select
                      value={giftTier}
                      onChange={(e) => setGiftTier(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-velora-gold"
                    >
                      <option value="MEMBER">Standard Member</option>
                      <option value="VERIFIED_MEMBER">Verified Member</option>
                      <option value="PREMIUM">Premium VIP</option>
                      <option value="ELITE_VIP">Elite VIP Creator</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-velora-textSecondary uppercase block mb-1">Duration</label>
                    <select
                      value={giftDuration}
                      onChange={(e) => setGiftDuration(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-velora-gold"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="6 Months">6 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="Lifetime">Lifetime (Permanent)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleGiftPremium}
                    className="w-full py-2 rounded-xl bg-velora-gold text-black font-bold hover:bg-white transition-all text-xs uppercase"
                  >
                    Gift Membership Tier
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* PAYOUT REQUESTS */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              Creator Payout Request Approvals Queue ({payouts.filter((p) => p.status === "PENDING").length} Pending)
            </h2>

            <div className="space-y-3">
              {payouts.map((p) => (
                <Card key={p.id} variant="glass" className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Creator: @{p.username}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : p.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-velora-textMuted mt-1">
                        Requested: {p.requestedAt} • Method: {p.payoutMethod} ({p.payoutDetails})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-serif font-bold text-velora-gold">${p.amount.toFixed(2)}</span>
                      {p.status === "PENDING" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="glass"
                            size="sm"
                            className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleRejectPayout(p.id, p.username)}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                            onClick={() => handleApprovePayout(p.id, p.username, p.amount)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold uppercase tracking-wider py-1 px-3.5 flex items-center gap-1 bg-amber-400 text-black hover:bg-white transition-all shadow-md shrink-0"
                            onClick={() => {
                              // Fast-Track Payout
                              userStore.addModerationLog({
                                adminUsername: user?.username || "admin_compliance",
                                targetUsername: p.username,
                                action: "WARN_USER",
                                reason: `🚀 Fast-Track Payout processed instantly: Approved and credited $${p.amount} (bypassed queue logs).`,
                              });
                              handleApprovePayout(p.id, p.username, p.amount);
                              alert("🚀 Fast-Track Payout speed-lane approval successful!");
                            }}
                          >
                            🚀 Fast-Track
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* REFUND REQUESTS */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-300" />
              Customer Refund Requests Queue ({refunds.filter((r) => r.status === "PENDING").length} Pending)
            </h2>

            <div className="space-y-3">
              {refunds.map((ref) => (
                <Card key={ref.id} variant="glass" className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Refund for: @{ref.username}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ref.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : ref.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}>
                          {ref.status}
                        </span>
                      </div>
                      <p className="text-xs text-white font-medium">Product: {ref.productTitle}</p>
                      <p className="text-xs text-velora-textMuted italic">&quot;{ref.reason}&quot;</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Requested {ref.requestedAt}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-2xl font-serif font-bold text-white">${ref.amount.toFixed(2)}</span>
                      {ref.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="glass"
                            size="sm"
                            className="text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleRejectRefund(ref.id, ref.username, ref.productTitle)}
                          >
                            Deny
                          </Button>
                          <Button
                            variant="gold"
                            size="sm"
                            className="text-xs font-bold uppercase"
                            onClick={() => handleApproveRefund(ref.id, ref.username, ref.amount, ref.productTitle)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="text-xs font-bold uppercase flex items-center gap-1"
                            onClick={() => {
                              // Instant Chargeback Refund
                              userStore.addModerationLog({
                                adminUsername: user?.username || "admin_compliance",
                                targetUsername: ref.username,
                                action: "WARN_USER",
                                reason: `Instant Refund Chargeback triggered: Reversed purchase of '${ref.productTitle}' for $${ref.amount}.`,
                              });
                              handleApproveRefund(ref.id, ref.username, ref.amount, ref.productTitle);
                              alert("Instant chargeback reversed successfully!");
                            }}
                          >
                            ⚡ Chargeback
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COMMUNITIES TAB */}
      {activeTab === "COMMUNITIES" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-velora-gold" />
              Community & Private Group Governance
            </h2>
            <p className="text-xs text-velora-textMuted">
              Monitor active community salons and moderation flags for inappropriate discussion topics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communities.map((c) => (
              <Card key={c.id} variant="glass" className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{c.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-velora-gold/20 text-velora-gold">
                    {c.type}
                  </span>
                </div>
                <p className="text-xs text-velora-textMuted line-clamp-2">{c.description}</p>
                <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs font-mono text-velora-textSecondary">
                    <span>{c.membersCount} Members • {c.postsCount} Discussions</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">Compliant</span>
                      <button
                        onClick={() => handleDeleteCommunityPost("post-active", c.slug)}
                        className="text-red-400 hover:text-red-300 hover:underline font-bold"
                      >
                        Audit Posts
                      </button>
                    </div>
                  </div>

                  {/* Cooldown Toggle Switch */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-white">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cooldown Mode (Read-Only)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!cooldowns[c.id]}
                      onChange={() => handleToggleCooldown(c.id, c.name)}
                      className="w-8 h-4 rounded-full bg-white/10 border-white/20 checked:bg-velora-gold cursor-pointer transition-colors focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* STREAMS TAB */}
      {activeTab === "STREAMS" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              Live Stream Supervision & Moderation
            </h2>
            <p className="text-xs text-velora-textMuted">
              Real-time WebRTC broadcast supervision desk. Suspend streams violating explicit safety guidelines.
            </p>
          </div>

          <div className="space-y-4">
            {streams.map((s) => (
              <Card key={s.id} variant="glass" className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{s.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        s.status === "LIVE" ? "bg-red-500/20 text-red-400 animate-pulse border border-red-500/30" : "bg-white/10 text-velora-textMuted"
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-velora-textMuted mt-1">
                      Host: {s.creatorName} • Category: {s.category} • Viewers: {s.currentViewersCount}
                    </p>
                  </div>

                  {s.status === "LIVE" && (
                    <Button
                      variant="danger"
                      size="sm"
                      className="text-xs font-bold gap-2"
                      onClick={() => handleSuspendStream(s.id, s.title, s.creatorName)}
                    >
                      <Ban className="w-4 h-4" /> Emergency Suspend Stream
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === "AUDIT" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-white">
            Moderation Action Audit Log
          </h2>

          <Card variant="glass" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-velora-textSecondary">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-velora-textMuted border-b border-white/10 pb-2">
                  <tr>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Admin</th>
                    <th className="py-2">Target</th>
                    <th className="py-2">Enforced Action</th>
                    <th className="py-2">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 font-bold text-velora-gold">@{log.adminUsername}</td>
                      <td className="py-3 text-white font-semibold">{log.targetUsername}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.action === "BAN_USER_PERMANENT"
                            ? "bg-red-500/25 text-red-300 border border-red-500/35"
                            : log.action === "SUSPEND_LIVE_STREAM"
                            ? "bg-amber-500/25 text-amber-300 border border-amber-500/35"
                            : "bg-blue-500/25 text-blue-300 border border-blue-500/35"
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300">{log.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Compliance Action Modal */}
      {reportModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Enforce Compliance: @{reportModalTarget.reportedUsername}
            </h3>
            <p className="text-xs text-velora-textMuted">
              Select the administrative action to resolve this ticket. A detailed reason is required.
            </p>

            <textarea
              value={reportActionReason}
              onChange={(e) => setReportActionReason(e.target.value)}
              rows={3}
              placeholder="e.g. Account suspended for 7 days due to phishing link solicitation in private chats."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-red-400 resize-none"
            />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleResolveReport(reportModalTarget, "WARN_USER", reportActionReason)}
                className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
              >
                Issue Warning
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleResolveReport(reportModalTarget, "SUSPEND_ACCOUNT_7_DAYS", reportActionReason)}
                className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                Suspend User
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleResolveReport(reportModalTarget, "BAN_USER_PERMANENT", reportActionReason)}
                className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 col-span-2"
              >
                Permanent IP Ban
              </Button>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReportModalTarget(null);
                  setReportActionReason("");
                }}
                className="w-full text-xs text-velora-textSecondary"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Specify Rejection Reason
            </h3>
            <p className="text-xs text-velora-textMuted">
              Provide feedback for the member on why their verification photo was rejected so they can re-submit.
            </p>

            <textarea
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              rows={3}
              placeholder="e.g., Handwritten date is illegible or missing the INTIMO inscription."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-red-400 resize-none"
            />

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  setRejectionModalTarget(null);
                  setRejectionReasonInput("");
                }}
                className="w-1/2 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => handleRejectVerification(rejectionModalTarget)}
                className="w-1/2 text-xs font-bold uppercase border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Confirm Rejection
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Biometric Verification Audit Modal */}
      {biometricModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <Card variant="goldBorder" className="w-full max-w-2xl p-6 sm:p-8 space-y-6 bg-velora-card relative shadow-2xl border-amber-400/40">
            <button
              onClick={() => setBiometricModalTarget(null)}
              className="absolute top-4 right-4 p-1 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-mono">
                🧬 Biometric Matching Audit
              </span>
              <h3 className="text-xl font-serif font-bold text-white pt-1">
                Facial Recognition Verification Check
              </h3>
              <p className="text-xs text-velora-textMuted leading-relaxed">
                Platform similarity audit for member account <strong className="text-white">@{biometricModalTarget.userName}</strong>.
              </p>
            </div>

            {/* Side-by-Side Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-velora-textSecondary uppercase tracking-wider block text-center">Profile Avatar Image</span>
                <div className="h-64 w-full rounded-2xl border border-white/10 overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={biometricModalTarget.userAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-velora-textSecondary uppercase tracking-wider block text-center">Submitted ID Selfie</span>
                <div className="h-64 w-full rounded-2xl border border-white/10 overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={biometricModalTarget.verificationPhotoUrl} alt="ID Selfie" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs text-velora-textSecondary">
                <span>Facial Match Similarity Score:</span>
                <span className="text-emerald-400 font-mono font-bold">95.8% Match Rate</span>
              </div>
              <div className="flex items-center justify-between text-xs text-velora-textSecondary">
                <span>Liveness Detection Check:</span>
                <span className="text-emerald-400 font-mono font-bold">PASS (3D Biometric Match)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-velora-textSecondary">
                <span>Verification Decision Recommendation:</span>
                <span className="text-emerald-400 font-bold uppercase">APPROVED</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setBiometricModalTarget(null)}
                className="w-1/2 text-xs"
              >
                Close Audit
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => {
                  handleApproveVerification(biometricModalTarget.id, biometricModalTarget.userName);
                  setBiometricModalTarget(null);
                }}
                className="w-1/2 text-xs font-bold uppercase tracking-wider shadow-gold-glow bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
              >
                Approve & Issue Badge
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Zoom Verification Photo Lightbox */}
      {zoomPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black/90 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomPhotoUrl} alt="Inspection selfie" className="w-full h-full object-contain max-h-[85vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
