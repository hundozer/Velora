"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import {
  Sparkles,
  DollarSign,
  Users,
  Video,
  Upload,
  Calendar,
  TrendingUp,
  Lock,
  Plus,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function CreatorStudioPage() {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [subPrice, setSubPrice] = useState(19.99);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge type="creator" label="Creator Studio Active" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-amber-400" />
            Creator Studio & Monetization Hub
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Manage your subscription tiers, exclusive video content, live streams, and payout analytics.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "OVERVIEW", label: "Overview" },
            { id: "CONTENT", label: "Content Vault" },
            { id: "LIVESTREAM", label: "Live Streams" },
            { id: "ANALYTICS", label: "Earnings" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="goldBorder" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Gross Revenue (30d)
          </span>
          <span className="text-3xl font-serif font-bold gold-gradient-text">$12,480.00</span>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
          </span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Active Subscribers
          </span>
          <span className="text-3xl font-serif font-bold text-velora-textPrimary">624</span>
          <span className="text-[11px] text-velora-textMuted">Avg retention: 4.8 months</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Pay-Per-View Unlocks
          </span>
          <span className="text-3xl font-serif font-bold text-amber-300">142</span>
          <span className="text-[11px] text-velora-textMuted">$35.00 avg per unlock</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Payout Status
          </span>
          <span className="text-xl font-serif font-bold text-emerald-400">Verified Direct Deposit</span>
          <span className="text-[11px] text-velora-textMuted">Next payout: Aug 15</span>
        </Card>
      </div>

      {/* Content Management & Scheduling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload & Live Stream Scheduler */}
        <div className="lg:col-span-2 space-y-8">
          {/* Upload New Exclusive Content */}
          <Card variant="glass" className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                Upload Premium Media Item
              </h2>
              <span className="text-xs text-amber-300 font-medium">Auto-Watermarked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Media Title" placeholder="e.g. Midnight Private Violin Journal #4" />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                  Access Visibility Tier
                </label>
                <select className="w-full bg-velora-card border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary">
                  <option>Subscribers Only (Included in $19.99/mo)</option>
                  <option>Pay-Per-View (Custom Unlock Price)</option>
                  <option>Public Teaser (Free Preview)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border border-dashed border-amber-500/30 rounded-2xl text-center space-y-2">
              <Video className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs font-bold text-velora-textPrimary">Drop High-Definition Video or Album File</p>
              <p className="text-[11px] text-velora-textMuted">Supports 4K ProRes, MP4, MOV up to 10GB per file.</p>
              <Button variant="glass" size="sm" className="mt-2 text-xs border-amber-500/30 text-amber-300">
                Browse Files
              </Button>
            </div>

            <Button variant="gold" className="w-full font-bold uppercase tracking-wider">
              Publish Exclusive Media
            </Button>
          </Card>

          {/* Schedule Live Experience */}
          <Card variant="glass" className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Schedule Paid Live Experience
              </h2>
              <Badge type="custom" label="Live Stream Engine" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Experience Title" placeholder="e.g. VIP Private Violin Recital & Q&A" />
              <Input label="Scheduled Date & Time" type="datetime-local" />
            </div>

            <Button variant="outline" className="w-full text-xs uppercase font-bold tracking-wider border-purple-500/40 text-purple-300">
              Schedule Live Event Room
            </Button>
          </Card>
        </div>

        {/* Right Column: Subscription Pricing & Settings */}
        <div className="space-y-8">
          <Card variant="goldBorder" className="p-8 space-y-6">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary border-b border-white/10 pb-3">
              Subscription Price Manager
            </h2>

            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
                Monthly Subscription Fee ($)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.99"
                  value={subPrice}
                  onChange={(e) => setSubPrice(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-3 text-lg font-serif font-bold text-velora-gold"
                />
                <Button variant="gold" size="sm" className="font-bold">
                  Update
                </Button>
              </div>
              <p className="text-[11px] text-velora-textMuted leading-relaxed">
                Creators retain 85% of gross revenues. Payouts are transferred automatically via encrypted wire transfer every 14 days.
              </p>
            </div>
          </Card>

          <Card variant="glass" className="p-6 space-y-4">
            <h3 className="text-sm font-serif font-bold text-velora-textPrimary">Creator Guidelines</h3>
            <ul className="space-y-2 text-xs text-velora-textMuted">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                All participants in videos must be 18+ verified.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                Copyright protection watermarks applied automatically.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
