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

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
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

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("850.00");
  const [payoutMethod, setPayoutMethod] = useState("SEPA Direct Bank Transfer");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const handleCreateContent = () => {
    if (!title.trim()) return;

    if (contentType === "ALBUM") {
      const newAlbum: ContentAlbum = {
        id: "alb-" + Date.now(),
        creatorId: "prof-1",
        creatorName: "Elena Vance",
        creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        title,
        description,
        category,
        previewImages: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"],
        lockedImages: ["https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"],
        price: parseFloat(price) || 0,
        visibility,
        publicationStatus: "PUBLISHED",
        totalPhotosCount: 12,
        createdAt: "Just now",
      };
      setAlbums([newAlbum, ...albums]);
    } else {
      const newVideo: ContentVideo = {
        id: "vid-" + Date.now(),
        creatorId: "prof-1",
        creatorName: "Elena Vance",
        creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        title,
        description,
        category,
        previewThumbnail: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
        videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-classical-violinist-performing-41584-large.mp4",
        durationSeconds: 180,
        price: parseFloat(price) || 0,
        visibility,
        publicationStatus: "PUBLISHED",
        createdAt: "Just now",
      };
      setVideos([newVideo, ...videos]);
    }

    setCreatedSuccess(true);
    setTimeout(() => {
      setCreatedSuccess(false);
      setUploadModalOpen(false);
      setTitle("");
      setDescription("");
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
    </div>
  );
}
