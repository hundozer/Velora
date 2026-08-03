"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MOCK_PROFILES } from "@/lib/mockData";
import {
  MapPin,
  Heart,
  MessageSquare,
  Lock,
  Sparkles,
  ShieldCheck,
  Users,
  CheckCircle2,
  Share2,
  Eye,
  Crown,
  Globe,
  ShieldAlert,
  Ban,
  Tag,
  Smile,
  Sliders,
} from "lucide-react";

export default function RichProfileViewPage() {
  const params = useParams();
  const profileId = (params?.id as string) || "prof-1";

  const targetProfile = MOCK_PROFILES.find((p) => p.id === profileId) || MOCK_PROFILES[0];
  const [isFavorited, setIsFavorited] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [actionDone, setActionDone] = useState("");
  const [selectedUnlockItem, setSelectedUnlockItem] = useState<{ title: string; price: number } | null>(null);

  const isCreator = targetProfile.userId === "user-3";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Profile Cover & Header */}
      <div className="relative rounded-3xl overflow-hidden glass-panel-gold border border-velora-gold/30 shadow-2xl">
        {/* Cover Photo */}
        <div className="h-64 sm:h-80 w-full bg-velora-card relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={targetProfile.coverPhotoUrl || targetProfile.avatarUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/40 to-transparent" />
        </div>

        {/* Profile Avatar & Info Overlay */}
        <div className="p-6 sm:p-10 relative -mt-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 border-velora-gold shadow-gold-glow overflow-hidden bg-velora-card relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={targetProfile.avatarUrl}
                alt={targetProfile.displayName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-serif font-bold text-velora-textPrimary">
                  {targetProfile.displayName}, {targetProfile.age}
                </h1>
                {targetProfile.verified && <Badge type="verified" />}
                {targetProfile.isCoupleProfile && <Badge type="couple" />}
                {isCreator && <Badge type="creator" />}
                {targetProfile.compatibilityScore && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gold-gradient text-velora-bg shadow-gold-glow">
                    <Sparkles className="w-3.5 h-3.5 fill-velora-bg text-velora-bg" />
                    {targetProfile.compatibilityScore}% Compatibility
                  </span>
                )}
              </div>

              <p className="text-xs font-medium text-velora-gold flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {targetProfile.city ? `${targetProfile.city}, ${targetProfile.country}` : targetProfile.location}
                {targetProfile.distanceKm ? ` (${targetProfile.distanceKm} km away)` : ""}
                <span className="text-velora-textMuted ml-2">• Active {targetProfile.isOnline ? "Now" : "10m ago"}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Message, Follow, Subscribe, Favorite, Report, Block */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {targetProfile.verificationLevel === "LEVEL_4_CREATOR" && (
              <Button variant="gold" size="lg" className="w-full sm:w-auto text-xs uppercase font-bold tracking-wider gap-2 shadow-gold-glow">
                <Crown className="w-4 h-4" />
                Subscribe ${targetProfile.monthlySubscriptionPrice || 24.99} / mo
              </Button>
            )}

            <Link href="/messages" className="flex-1 md:flex-none">
              <Button variant="glass" size="lg" className="w-full text-xs uppercase font-bold tracking-wider gap-2">
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            </Link>

            <Button
              variant={isFavorited ? "gold" : "glass"}
              size="lg"
              className="p-3.5 rounded-full"
              onClick={() => setIsFavorited(!isFavorited)}
              title="Save to Favorites"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? "fill-velora-bg text-velora-bg" : "text-rose-400"}`} />
            </Button>

            <button
              onClick={() => setReportModalOpen(true)}
              className="p-3 rounded-full glass-panel text-velora-textMuted hover:text-red-400 hover:border-red-500/40 transition-colors"
              title="Report Profile"
            >
              <ShieldAlert className="w-5 h-5" />
            </button>

            <button
              onClick={() => setBlockModalOpen(true)}
              className="p-3 rounded-full glass-panel text-velora-textMuted hover:text-red-400 hover:border-red-500/40 transition-colors"
              title="Block User"
            >
              <Ban className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Structured Profile Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: About */}
          <Card variant="glass" className="p-8 space-y-4">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary border-b border-white/10 pb-3">
              About & Persona
            </h2>

            {targetProfile.headline && (
              <p className="text-sm font-bold text-velora-gold italic font-serif">
                "{targetProfile.headline}"
              </p>
            )}

            <p className="text-xs text-velora-textSecondary leading-relaxed whitespace-pre-line">
              {targetProfile.bio}
            </p>

            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">Relationship</span>
                <span className="font-semibold text-velora-textPrimary">{targetProfile.relationshipStatus}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">Orientation</span>
                <span className="font-semibold text-velora-textPrimary">{targetProfile.sexualOrientation}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">Languages</span>
                <span className="font-semibold text-velora-textPrimary">{(targetProfile.languages || ["English"]).join(", ")}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-velora-textMuted block">Discretion</span>
                <span className="font-semibold text-emerald-400">High Stealth</span>
              </div>
            </div>
          </Card>

          {/* Couple Specs (if applicable) */}
          {targetProfile.isCoupleProfile && (
            <Card variant="goldBorder" className="p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Badge type="couple" />
                <h2 className="text-xl font-serif font-bold text-purple-300">Couple Attributes</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-velora-textSecondary pt-2">
                <div className="p-4 glass-panel rounded-2xl space-y-1">
                  <p className="font-bold text-velora-textPrimary">Partner 1</p>
                  <p>Julian (Male, 32 years)</p>
                </div>
                <div className="p-4 glass-panel rounded-2xl space-y-1">
                  <p className="font-bold text-velora-textPrimary">Partner 2</p>
                  <p>{targetProfile.partnerDisplayName || "Sophia"} ({targetProfile.partnerGender || "Female"}, {targetProfile.partnerAge || 29} years)</p>
                </div>
              </div>
            </Card>
          )}

          {/* Section: Lifestyle, Passions & Hobbies */}
          <Card variant="glass" className="p-8 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-velora-gold mb-3 font-serif">
                Lifestyle Passions & Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {targetProfile.interests.map((item) => (
                  <span key={item} className="px-3.5 py-1.5 rounded-full text-xs bg-white/5 text-velora-textPrimary border border-white/10">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {targetProfile.hobbies && targetProfile.hobbies.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-3 font-serif">
                  Personal Hobbies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {targetProfile.hobbies.map((item) => (
                    <span key={item} className="px-3.5 py-1.5 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Section: Looking For */}
          <Card variant="glass" className="p-8 space-y-4">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary border-b border-white/10 pb-3">
              Looking For Connection Types
            </h2>
            <div className="flex flex-wrap gap-2 pt-2">
              {targetProfile.lookingFor.map((item) => (
                <span key={item} className="px-4 py-2 rounded-full text-xs font-semibold bg-velora-gold/15 text-velora-gold border border-velora-gold/30">
                  {item}
                </span>
              ))}
            </div>
          </Card>

          {/* Section: Gallery Vault */}
          <Card variant="glass" className="p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Gallery Vault
              </h2>
              <span className="text-xs text-velora-textMuted font-mono">
                {targetProfile.galleryImages.length} Albums
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {targetProfile.galleryImages.map((m) => (
                <div key={m.id} className="relative rounded-2xl overflow-hidden glass-panel border border-white/10 group">
                  <div className="h-48 w-full bg-velora-card relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.url}
                      alt="Media"
                      className={`w-full h-full object-cover ${m.visibility !== "PUBLIC" ? "blur-md" : ""}`}
                    />

                    {m.visibility !== "PUBLIC" && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center space-y-2">
                        <Lock className="w-8 h-8 text-velora-gold" />
                        <p className="text-xs font-bold text-velora-textPrimary">
                          {m.title || "Private Member Media"}
                        </p>
                        <p className="text-[10px] text-velora-textMuted">
                          {m.visibility === "SUBSCRIBERS_ONLY" ? "Subscriber Exclusive" : `Unlock Access for $${m.price || 25}`}
                        </p>
                        <Button
                          variant="gold"
                          size="sm"
                          className="text-[10px] uppercase font-bold"
                          onClick={() => {
                            setSelectedUnlockItem({ title: m.title || "Private Media Album", price: m.price || 25 });
                            setUnlockModalOpen(true);
                          }}
                        >
                          Request Unlock
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column Specs */}
        <div className="space-y-8">
          {/* Section: Preferences */}
          <Card variant="glass" className="p-8 space-y-4">
            <h3 className="text-sm font-serif font-bold text-velora-textPrimary border-b border-white/10 pb-3">
              Member Preferences
            </h3>
            <div className="space-y-3 text-xs text-velora-textSecondary">
              <div className="flex justify-between">
                <span className="text-velora-textMuted">Preferred Age:</span>
                <span className="font-bold text-velora-textPrimary">21 - 55 yrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-velora-textMuted">Max Radius:</span>
                <span className="font-bold text-velora-textPrimary">150 km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-velora-textMuted">Photo Requirement:</span>
                <span className="font-bold text-emerald-400">Photos Available</span>
              </div>
            </div>
          </Card>

          {/* Verification Guarantee */}
          <Card variant="goldBorder" className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-velora-gold" />
              <div>
                <h4 className="text-sm font-bold text-velora-textPrimary font-serif">100% ID Verified</h4>
                <p className="text-[11px] text-velora-textMuted">Biometrically audited adult account</p>
              </div>
            </div>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              This member has satisfied Velora identity confirmation & 18+ legal compliance standards.
            </p>
          </Card>
        </div>
      </div>

      {/* Unlock / Purchase Modal */}
      <Modal isOpen={unlockModalOpen} onClose={() => setUnlockModalOpen(false)} title="Confirm Unlock Access">
        <div className="text-center space-y-6">
          <Lock className="w-12 h-12 text-velora-gold mx-auto" />
          <div>
            <h3 className="text-lg font-serif font-bold text-velora-textPrimary">
              {selectedUnlockItem?.title}
            </h3>
            <p className="text-xs text-velora-textMuted mt-1">
              Discreet transaction • Total charge: <strong className="text-velora-gold">${selectedUnlockItem?.price}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setUnlockModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" className="w-2/3 text-xs font-bold uppercase" onClick={() => setUnlockModalOpen(false)}>
              Confirm & Unlock (${selectedUnlockItem?.price})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Report Profile">
        <div className="space-y-4 text-left">
          <p className="text-xs text-velora-textSecondary">
            Submit a report regarding @{targetProfile.displayName}. Our compliance team audits reports within 1 hour.
          </p>
          <select className="w-full bg-velora-card border border-white/10 rounded-xl p-3 text-xs text-velora-textPrimary">
            <option>Underage Suspicion</option>
            <option>Harassment or Non-consensual Language</option>
            <option>Fake Profile / Impersonation</option>
            <option>Offsite Payment Solicitation</option>
          </select>
          <textarea
            rows={3}
            placeholder="Details..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-velora-textPrimary"
          />
          <div className="flex gap-3">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setReportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-2/3 text-xs font-bold"
              onClick={() => {
                setActionDone("Report submitted");
                setReportModalOpen(false);
              }}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* Block Modal */}
      <Modal isOpen={blockModalOpen} onClose={() => setBlockModalOpen(false)} title="Block Member">
        <div className="space-y-4 text-left">
          <p className="text-xs text-velora-textSecondary">
            Blocking @{targetProfile.displayName} will prevent them from seeing your profile, viewing your media, or sending messages.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setBlockModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="w-2/3 text-xs font-bold"
              onClick={() => {
                setActionDone("User blocked");
                setBlockModalOpen(false);
              }}
            >
              Confirm Block
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
