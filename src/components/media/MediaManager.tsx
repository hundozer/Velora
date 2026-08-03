"use client";

import React, { useState } from "react";
import { MediaItem, VisibilityLevel } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Upload,
  Trash2,
  Lock,
  Globe,
  Users,
  Star,
  DollarSign,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface MediaManagerProps {
  initialImages?: MediaItem[];
  onChange?: (images: MediaItem[]) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  initialImages = [],
  onChange,
}) => {
  const [images, setImages] = useState<MediaItem[]>(
    initialImages.length > 0
      ? initialImages
      : [
          {
            id: "img-1",
            url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
            type: "IMAGE",
            visibility: "PUBLIC",
            isProfilePhoto: true,
            sortOrder: 1,
          },
          {
            id: "img-2",
            url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
            type: "IMAGE",
            visibility: "PRIVATE_MEMBERS",
            sortOrder: 2,
          },
        ]
  );

  const [uploading, setUploading] = useState(false);

  const handleSimulatedUpload = () => {
    setUploading(true);
    setTimeout(() => {
      const newImg: MediaItem = {
        id: "img-" + Date.now(),
        url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
        type: "IMAGE",
        visibility: "PUBLIC",
        sortOrder: images.length + 1,
      };
      const updated = [...images, newImg];
      setImages(updated);
      if (onChange) onChange(updated);
      setUploading(false);
    }, 800);
  };

  const handleDelete = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    setImages(updated);
    if (onChange) onChange(updated);
  };

  const handleSetProfilePhoto = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isProfilePhoto: img.id === id,
    }));
    setImages(updated);
    if (onChange) onChange(updated);
  };

  const handleVisibilityChange = (id: string, newVisibility: VisibilityLevel) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, visibility: newVisibility } : img
    );
    setImages(updated);
    if (onChange) onChange(updated);
  };

  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === images.length - 1)
    )
      return;

    const updated = [...images];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate sort orders
    const ordered = updated.map((img, i) => ({ ...img, sortOrder: i + 1 }));
    setImages(ordered);
    if (onChange) onChange(ordered);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header & Upload Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-velora-gold" />
            Media Vault & Album Management
          </h3>
          <p className="text-xs text-velora-textMuted mt-0.5">
            Organize public gallery images, set private album access permissions, and reorder photos.
          </p>
        </div>

        <Button
          variant="gold"
          size="sm"
          disabled={uploading}
          onClick={handleSimulatedUpload}
          className="text-xs font-bold uppercase tracking-wider gap-2 shrink-0"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload New Photo"}
        </Button>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((img, idx) => (
          <Card key={img.id} variant="glass" className="p-4 space-y-4 relative group">
            {/* Image Preview Container */}
            <div className="h-56 w-full rounded-2xl overflow-hidden bg-velora-card relative border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />

              {/* Status Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1">
                {img.isProfilePhoto && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-velora-gold text-velora-bg shadow-gold-glow">
                    Primary Profile Photo
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 text-white backdrop-blur-md">
                  Order #{img.sortOrder || idx + 1}
                </span>
              </div>

              {/* Order Controls */}
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <button
                  disabled={idx === 0}
                  onClick={() => handleMoveOrder(idx, "up")}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:text-velora-gold disabled:opacity-30 backdrop-blur-md"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={idx === images.length - 1}
                  onClick={() => handleMoveOrder(idx, "down")}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:text-velora-gold disabled:opacity-30 backdrop-blur-md"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visibility Selector & Actions */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-velora-textMuted mb-1.5">
                  Access Visibility Tier
                </label>
                <select
                  value={img.visibility}
                  onChange={(e) => handleVisibilityChange(img.id, e.target.value as VisibilityLevel)}
                  className="w-full bg-velora-card border border-white/10 rounded-xl p-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                >
                  <option value="PUBLIC">Public (Visible to Everyone)</option>
                  <option value="PRIVATE_MEMBERS">Members Only (Requires Login)</option>
                  <option value="FAVORITES_ONLY">Favorites Only (Saved Contacts)</option>
                  <option value="SUBSCRIBERS_ONLY">Subscribers Only (Paid Tier)</option>
                  <option value="PAID_PER_VIEW">Pay-Per-View Unlock</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                {!img.isProfilePhoto ? (
                  <button
                    onClick={() => handleSetProfilePhoto(img.id)}
                    className="text-xs font-semibold text-velora-gold hover:underline flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Set as Profile Photo
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-medium">Primary Avatar Active</span>
                )}

                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
