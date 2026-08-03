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
} from "@/lib/mockData";
import { ContentAlbum, ContentVideo, VisibilityLevel } from "@/types";
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
} from "lucide-react";

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [albums, setAlbums] = useState<ContentAlbum[]>(MOCK_CREATOR_ALBUMS);
  const [videos, setVideos] = useState<ContentVideo[]>(MOCK_CREATOR_VIDEOS);

  // New Content Upload Modal State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [contentType, setContentType] = useState<"ALBUM" | "VIDEO">("ALBUM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Contemporary Art");
  const [price, setPrice] = useState("20.00");
  const [visibility, setVisibility] = useState<VisibilityLevel>("PAID_PER_VIEW");
  const [createdSuccess, setCreatedSuccess] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge type="custom" label="Creator Studio" className="bg-amber-500/20 text-amber-300 border-amber-500/40" />
            <span className="text-xs text-velora-gold font-mono">• Active Creator Channel</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Crown className="w-8 h-8 text-velora-gold" />
            Creator Studio & Content Vault
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Manage your photo albums, exclusive video journals, subscriber permissions, and revenue analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
          { id: "SUBSCRIBERS", label: "Active Subscribers (185)" },
          { id: "ANALYTICS", label: "Revenue & Growth Analytics" },
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
                <span className="text-xs font-semibold uppercase tracking-wider">Monthly Revenue</span>
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">$4,623.50</span>
              <p className="text-[11px] text-emerald-400 font-mono">+18.4% vs last month</p>
            </Card>

            <Card variant="glass" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-velora-textMuted">Active Subscribers</span>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">185</span>
              <p className="text-[11px] text-velora-textMuted font-mono">$24.99 / monthly tier</p>
            </Card>

            <Card variant="glass" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-purple-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-velora-textMuted">Total Channel Followers</span>
                <Crown className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">1,420</span>
              <p className="text-[11px] text-velora-textMuted font-mono">+42 new followers this week</p>
            </Card>

            <Card variant="glass" className="p-6 space-y-2">
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-velora-textMuted">Pay-per-view Unlocks</span>
                <Lock className="w-5 h-5" />
              </div>
              <span className="text-3xl font-serif font-bold text-velora-textPrimary">148</span>
              <p className="text-[11px] text-velora-textMuted font-mono">Avg unlock price $22.50</p>
            </Card>
          </div>

          {/* Quick Actions & Recent Uploads */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card variant="glass" className="lg:col-span-2 p-6 space-y-4">
              <h3 className="text-lg font-serif font-bold text-velora-textPrimary flex items-center justify-between">
                <span>Recent Published Media</span>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveTab("CONTENT")}>
                  View All Vault
                </Button>
              </h3>

              <div className="space-y-3">
                {albums.slice(0, 3).map((alb) => (
                  <div key={alb.id} className="p-3 glass-panel rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-velora-card overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={alb.previewImages[0]} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-velora-textPrimary">{alb.title}</p>
                        <p className="text-[10px] text-velora-textMuted">
                          {alb.category} • {alb.totalPhotosCount} Photos • ${alb.price}
                        </p>
                      </div>
                    </div>
                    <Badge type="custom" label={alb.visibility.replace(/_/g, " ")} className="text-[10px]" />
                  </div>
                ))}
              </div>
            </Card>

            <Card variant="glass" className="p-6 space-y-4">
              <h3 className="text-lg font-serif font-bold text-velora-textPrimary">Creator Channel Tools</h3>
              <div className="space-y-3 text-xs">
                <div className="p-4 glass-panel rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-velora-textPrimary">Monthly Subscription Price</p>
                    <p className="text-velora-textMuted text-[10px]">Current tier: $24.99/mo</p>
                  </div>
                  <Button variant="glass" size="sm" className="text-[10px]">Edit Tier</Button>
                </div>

                <div className="p-4 glass-panel rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-velora-textPrimary">SEPA Bank Payout</p>
                    <p className="text-velora-textMuted text-[10px]">Verified Payout Target</p>
                  </div>
                  <Badge type="verified" label="Active" />
                </div>
              </div>
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
                  <div className="pt-2 flex items-center justify-between text-[11px] text-velora-textMuted font-mono border-t border-white/10">
                    <span>{alb.totalPhotosCount} Photos</span>
                    <span>{alb.createdAt}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
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
                  <tr>
                    <td className="py-3 font-bold text-velora-textPrimary">Marcus Monaco (@marcus_m)</td>
                    <td className="py-3 text-velora-gold">$24.99 / mo</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">ACTIVE</span></td>
                    <td className="py-3 font-mono">2026-08-28</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-6">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
            Revenue & Views Performance Analytics
          </h2>
          <Card variant="glass" className="p-8 text-center space-y-4">
            <TrendingUp className="w-12 h-12 text-velora-gold mx-auto" />
            <h3 className="text-lg font-serif font-bold text-velora-textPrimary">Monthly Revenue Breakdown</h3>
            <p className="text-xs text-velora-textMuted max-w-md mx-auto">
              Your channel generated <strong>$4,623.50</strong> this calendar month across subscriptions (72%) and pay-per-view album unlocks (28%).
            </p>
          </Card>
        </div>
      )}

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

            <div>
              <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your content..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
                >
                  {CREATOR_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                  Unlock Price ($USD)
                </label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="20.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                Visibility Access Tier
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as VisibilityLevel)}
                className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary"
              >
                <option value="SUBSCRIBERS_ONLY">Subscribers Only (Included in Monthly Tier)</option>
                <option value="PAID_PER_VIEW">Pay-Per-View (Separate One-Time Purchase)</option>
                <option value="PUBLIC">Free Public Preview</option>
              </select>
            </div>

            {/* Media Upload Box */}
            <div className="p-4 glass-panel rounded-2xl border border-dashed border-white/20 text-center space-y-2">
              <Upload className="w-5 h-5 text-velora-gold mx-auto" />
              <p className="text-xs font-bold text-velora-textPrimary">Upload Media Files</p>
              <Button variant="glass" size="sm" className="text-[10px]">Select Files from Device</Button>
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
