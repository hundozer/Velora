"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import {
  MOCK_CREATOR_ALBUMS,
  MOCK_CREATOR_VIDEOS,
  CREATOR_CATEGORIES,
  MOCK_TRANSACTIONS,
} from "@/lib/mockData";
import { ContentAlbum, ContentVideo, VisibilityLevel, PayoutRequest } from "@/types";
import {
  Crown,
  Sparkles,
  DollarSign,
  Users,
  Eye,
  Plus,
  Upload,
  Lock,
  FileImage,
  Video,
  BarChart3,
  Settings,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Receipt,
} from "lucide-react";

import { CreatorPreRegistrationModal } from "@/components/creator/CreatorPreRegistrationModal";

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [intentModalOpen, setIntentModalOpen] = useState(false);
  const [albums, setAlbums] = useState<ContentAlbum[]>(MOCK_CREATOR_ALBUMS);
  const [videos, setVideos] = useState<ContentVideo[]>(MOCK_CREATOR_VIDEOS);

  // Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [contentType, setContentType] = useState<"ALBUM" | "VIDEO">("ALBUM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Contemporary Art");
  const [price, setPrice] = useState("20.00");
  const [visibility, setVisibility] = useState<VisibilityLevel>("PAID_PER_VIEW");
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const contentFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([]);

  const handleMediaFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const urls = Array.from(e.target.files).map((f) => URL.createObjectURL(f));
      setUploadedPreviews((prev) => [...prev, ...urls]);
    }
  };

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("850.00");
  const [payoutMethod, setPayoutMethod] = useState("SEPA Direct Bank Transfer");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handleCreateContent = () => {
    if (!title.trim()) return;

    const defaultImg = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80";
    const finalPreviews = uploadedPreviews.length > 0 ? uploadedPreviews : [defaultImg];

    if (contentType === "ALBUM") {
      const newAlbum: ContentAlbum = {
        id: "alb-" + Date.now(),
        creatorId: "prof-1",
        creatorName: "Elena Vance",
        creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        title: title.trim(),
        description: description.trim() || "Exclusive private album",
        category,
        previewImages: finalPreviews,
        lockedImages: finalPreviews,
        price: parseFloat(price) || 20,
        visibility,
        publicationStatus: "PUBLISHED",
        totalPhotosCount: finalPreviews.length,
        createdAt: "Just now",
      };
      setAlbums([newAlbum, ...albums]);
    } else {
      const newVideo: ContentVideo = {
        id: "vid-" + Date.now(),
        creatorId: "prof-1",
        creatorName: "Elena Vance",
        creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        title: title.trim(),
        description: description.trim() || "Exclusive video release",
        category,
        previewThumbnail: finalPreviews[0] || defaultImg,
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-classical-violinist-performing-41584-large.mp4",
        durationSeconds: 180,
        price: parseFloat(price) || 25,
        visibility,
        publicationStatus: "PUBLISHED",
        createdAt: "Just now",
      };
      setVideos([newVideo, ...videos]);
    }

    setCreatedSuccess(true);
    setTimeout(() => {
      setUploadModalOpen(false);
      setCreatedSuccess(false);
      setTitle("");
      setDescription("");
      setUploadedPreviews([]);
    }, 1500);
  };

  const handleRequestPayout = () => {
    setPayoutSuccess(true);
    setTimeout(() => {
      setPayoutSuccess(false);
      setPayoutModalOpen(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Creator Registration Coming Soon & Pre-Registration Banner */}
      <Card variant="goldBorder" className="p-6 space-y-4 bg-gradient-to-r from-amber-500/10 via-velora-card to-purple-900/10 border-amber-400/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> CREATOR REGISTRATION — COMING SOON
              </span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">• Pre-Launch Waitlist Active</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Express Your Creator Intent & Lock In 0% Launch Commission
            </h2>
            <p className="text-xs text-velora-textSecondary max-w-3xl leading-relaxed">
              Direct creator registration is launching soon. Pre-register your intent now to get early access, verified creator status, and 0% platform fee during launch.
            </p>
          </div>

          <Button
            variant="gold"
            size="sm"
            onClick={() => setIntentModalOpen(true)}
            className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0 text-black"
          >
            <Crown className="w-4 h-4 text-black" /> Express Creator Intent
          </Button>
        </div>

        {/* 5-Step Visual Process Infographic */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            How Becoming an Intimo Creator Works (5 Simple Steps):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-2xl bg-black/50 border border-amber-400/30 text-center space-y-1 relative group hover:border-amber-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs flex items-center justify-center mx-auto border border-amber-400/40">1</div>
              <div className="text-xs font-bold text-white">1. Register</div>
              <div className="text-[10px] text-velora-textMuted leading-tight">Pre-register profile & creator intent</div>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-purple-500/30 text-center space-y-1 relative group hover:border-purple-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center mx-auto border border-purple-500/40">2</div>
              <div className="text-xs font-bold text-white">2. Get Verified</div>
              <div className="text-[10px] text-velora-textMuted leading-tight">Selfie photo biometric badge</div>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-sky-500/30 text-center space-y-1 relative group hover:border-sky-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center mx-auto border border-sky-500/40">3</div>
              <div className="text-xs font-bold text-white">3. Upload</div>
              <div className="text-[10px] text-velora-textMuted leading-tight">Photo, 4K video & live salons</div>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 text-center space-y-1 relative group hover:border-emerald-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center mx-auto border border-emerald-500/40">4</div>
              <div className="text-xs font-bold text-white">4. Users Buy</div>
              <div className="text-[10px] text-velora-textMuted leading-tight">Subscriptions & PPV media</div>
            </div>

            <div className="p-3 rounded-2xl bg-black/50 border border-amber-400/50 text-center space-y-1 relative group hover:border-amber-400 transition-all">
              <div className="w-7 h-7 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center mx-auto shadow-gold-glow">5</div>
              <div className="text-xs font-bold text-amber-300">5. Get Paid</div>
              <div className="text-[10px] text-velora-textMuted leading-tight">Direct payouts to your bank account</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge type="custom" label="Creator Studio" className="bg-amber-500/20 text-amber-300 border-amber-500/40" />
            <span className="text-xs text-velora-gold font-mono">• Level 4 Verified Channel</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Crown className="w-8 h-8 text-velora-gold" />
            Creator Studio & Financial Desk
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Manage your content vault, view net revenue splits, and request earnings payouts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="glass"
            size="sm"
            className="text-xs font-bold gap-2 border-velora-gold/40 text-velora-gold"
            onClick={() => setPayoutModalOpen(true)}
          >
            <ArrowUpRight className="w-4 h-4" /> Request Payout
          </Button>
          <Button
            variant="gold"
            size="sm"
            className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow"
            onClick={() => setUploadModalOpen(true)}
          >
            <Plus className="w-4 h-4" /> Publish New Content
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: "OVERVIEW", label: "Studio Overview" },
          { id: "CONTENT", label: `Content Vault (${albums.length + videos.length})` },
          { id: "FINANCES", label: "Earnings & Sales Ledger" },
          { id: "SUBSCRIBERS", label: "Active Subscribers (185)" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* OVERVIEW TAB */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-8">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="goldBorder" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-velora-gold">
                <span className="text-xs font-semibold uppercase tracking-wider">Net Monthly Revenue</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">$4,623.50</span>
              <p className="text-[11px] text-emerald-400 font-mono">85% Net Payout Rate</p>
            </Card>

            <Card variant="glass" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-velora-textMuted">Available Payout</span>
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">$1,450.00</span>
              <p className="text-[11px] text-velora-textMuted font-mono">Min payout $100.00</p>
            </Card>

            <Card variant="glass" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-purple-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-velora-textMuted">Active Subscribers</span>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">185</span>
              <p className="text-[11px] text-velora-textMuted font-mono">$24.99 / mo tier</p>
            </Card>

            <Card variant="glass" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-velora-textMuted">Pay-per-view Unlocks</span>
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">148</span>
              <p className="text-[11px] text-velora-textMuted font-mono">Avg unlock $22.50</p>
            </Card>
          </div>
        </div>
      )}

      {/* CONTENT VAULT TAB */}
      {activeTab === "CONTENT" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
              Content Vault & Published Media
            </h2>
            <Button variant="gold" size="sm" className="text-xs font-bold gap-2" onClick={() => setUploadModalOpen(true)}>
              <Plus className="w-4 h-4" /> Add Album or Video
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((alb) => (
              <Card key={alb.id} variant="glass" className="p-0 overflow-hidden space-y-3 text-left">
                <div className="h-44 w-full bg-velora-card relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={alb.previewImages[0]} alt={alb.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-velora-card/90 text-velora-gold border border-velora-gold/40">
                    ${alb.price}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-300 block">{alb.category}</span>
                  <h4 className="text-sm font-bold text-velora-textPrimary">{alb.title}</h4>
                  <p className="text-xs text-velora-textMuted line-clamp-2">{alb.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* FINANCES TAB */}
      {activeTab === "FINANCES" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <Receipt className="w-5 h-5 text-velora-gold" />
            Net Sales & Commission Split Ledger
          </h2>

          <Card variant="glass" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-velora-textSecondary">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-velora-textMuted border-b border-white/10 pb-2">
                  <tr>
                    <th className="py-2">Date / Time</th>
                    <th className="py-2">Product Title</th>
                    <th className="py-2">Buyer</th>
                    <th className="py-2">Gross Price</th>
                    <th className="py-2">Platform Cut (15%)</th>
                    <th className="py-2">Net Creator Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {MOCK_TRANSACTIONS.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 font-mono text-[11px]">{tx.createdAt}</td>
                      <td className="py-3 font-bold text-velora-textPrimary">{tx.productTitle}</td>
                      <td className="py-3 text-velora-gold">@{tx.buyerUsername}</td>
                      <td className="py-3 font-mono">${tx.grossAmount.toFixed(2)}</td>
                      <td className="py-3 font-mono text-red-400">-${tx.platformCut.toFixed(2)}</td>
                      <td className="py-3 font-bold text-emerald-400">${tx.creatorEarnings.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUBSCRIBERS TAB */}
      {activeTab === "SUBSCRIBERS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Active Channel Subscribers (185)
          </h2>
          <Card variant="glass" className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-velora-textSecondary">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-velora-textMuted border-b border-white/10 pb-2">
                  <tr>
                    <th className="py-2">Subscriber Member</th>
                    <th className="py-2">Subscription Tier</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Next Renewal Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-3 font-bold text-velora-textPrimary">Julian & Sophia (@julian_sophia)</td>
                    <td className="py-3 text-velora-gold">$24.99 / mo</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">ACTIVE</span></td>
                    <td className="py-3 font-mono">2026-09-01</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* PAYOUT REQUEST MODAL */}
      <Modal isOpen={payoutModalOpen} onClose={() => setPayoutModalOpen(false)} title="Request Earnings Payout">
        {payoutSuccess ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-velora-textPrimary">Payout Request Logged!</h3>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="p-4 glass-panel-gold rounded-2xl border border-velora-gold/40 text-xs">
              <p className="text-velora-textMuted">Available Payout Balance:</p>
              <p className="text-2xl font-serif font-bold text-velora-gold">$1,450.00</p>
              <p className="text-[10px] text-velora-textMuted mt-1">Minimum payout threshold: $100.00</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                Payout Amount ($USD)
              </label>
              <Input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="1450.00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                Target Payout Method
              </label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
              >
                <option value="SEPA Direct Bank Transfer">SEPA Direct Bank Transfer (EU)</option>
                <option value="SWIFT Wire Transfer">SWIFT Wire Transfer (International)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setPayoutModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" className="w-2/3 text-xs font-bold uppercase" onClick={handleRequestPayout}>
                Submit Payout Request
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* UPLOAD NEW CONTENT MODAL */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Publish New Creator Content" maxWidth="lg">
        {createdSuccess ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-velora-textPrimary">Content Published to Vault!</h3>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className="flex gap-2">
              <Button
                variant={contentType === "ALBUM" ? "gold" : "glass"}
                size="sm"
                className="w-1/2 text-xs font-bold"
                onClick={() => setContentType("ALBUM")}
              >
                <FileImage className="w-4 h-4 mr-1" /> Photo Album
              </Button>
              <Button
                variant={contentType === "VIDEO" ? "gold" : "glass"}
                size="sm"
                className="w-1/2 text-xs font-bold"
                onClick={() => setContentType("VIDEO")}
              >
                <Video className="w-4 h-4 mr-1" /> Premium Video
              </Button>
            </div>

            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={contentFileInputRef}
              accept={contentType === "ALBUM" ? "image/*" : "video/*,image/*"}
              multiple
              className="hidden"
              onChange={handleMediaFileSelect}
            />

            {/* Dropzone File Selector */}
            <div
              onClick={() => contentFileInputRef.current?.click()}
              className="p-5 border-2 border-dashed border-white/20 rounded-2xl text-center cursor-pointer hover:border-velora-gold/50 transition-colors bg-white/5"
            >
              <Upload className="w-6 h-6 text-velora-gold mx-auto mb-1.5" />
              <p className="text-xs font-bold text-velora-textPrimary">Click to upload media files from your device</p>
              <p className="text-[10px] text-velora-textMuted mt-0.5">Supports JPG, PNG, WEBP, MP4, MOV (Max 500MB)</p>
            </div>

            {/* Selected File Thumbnail Previews */}
            {uploadedPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {uploadedPreviews.map((url, i) => (
                  <div key={i} className="h-16 rounded-xl overflow-hidden bg-velora-card border border-white/10 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                Content Title
              </label>
              <Input
                type="text"
                placeholder="e.g. Monte Carlo Art Salon Behind-The-Scenes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" className="w-2/3 text-xs font-bold uppercase" onClick={handleCreateContent}>
                Publish to Content Vault
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Creator Pre-Registration Modal */}
      <CreatorPreRegistrationModal
        isOpen={intentModalOpen}
        onClose={() => setIntentModalOpen(false)}
      />
    </div>
  );
}
