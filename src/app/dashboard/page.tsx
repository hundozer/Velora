"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MOCK_PROFILES } from "@/lib/mockData";
import {
  Compass,
  Sparkles,
  MapPin,
  Heart,
  MessageSquare,
  ShieldCheck,
  Flame,
  Filter,
  Image as ImageIcon,
  Video as VideoIcon,
  Megaphone,
  ThumbsUp,
  Eye,
  SlidersHorizontal,
  Play,
  Share2,
  Send,
  X,
  Layers,
} from "lucide-react";

export interface FeedComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
    location: string;
  };
  type: "ALBUM" | "VIDEO" | "DATING_AD";
  title: string;
  description: string;
  category: string;
  createdAt: string;
  photos?: string[];
  videoUrl?: string;
  duration?: string;
  views: number;
  likes: number;
  hasLiked?: boolean;
  comments: FeedComment[];
}

const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: "feed-1",
    author: {
      id: "prof-1",
      displayName: "Alex",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      location: "Prague, Czech Republic",
    },
    type: "VIDEO",
    title: "Private Riviera Yacht Teaser 🛥️",
    description: "Exclusive sunset lifestyle footage along the Monte Carlo coastline with champagne.",
    category: "Couple",
    createdAt: "15 mins ago",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "1:20",
    views: 1420,
    likes: 189,
    hasLiked: false,
    comments: [
      {
        id: "c-1",
        authorName: "Valerie",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        text: "Stunning views! We love the French Riviera vibes.",
        createdAt: "10 mins ago",
      },
    ],
  },
  {
    id: "feed-2",
    author: {
      id: "prof-2",
      displayName: "Valerie",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      location: "Munich, Germany",
    },
    type: "ALBUM",
    title: "Monaco Salon Evening & High Fashion 🥂",
    description: "Capturing candid intimate moments from our private suite in Monaco.",
    category: "Solo Woman",
    createdAt: "45 mins ago",
    photos: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    ],
    views: 2180,
    likes: 312,
    hasLiked: true,
    comments: [
      {
        id: "c-2",
        authorName: "Marcus & Sophia",
        authorAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
        text: "Gorgeous outfit and lighting! ✨",
        createdAt: "30 mins ago",
      },
    ],
  },
  {
    id: "feed-3",
    author: {
      id: "prof-3",
      displayName: "Marcus & Sophia",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      location: "Berlin, Germany",
    },
    type: "VIDEO",
    title: "Late Night Lounge & Champagne Vault",
    description: "Private moments from our Monaco salon evening with curated electronic music.",
    category: "VIP Lifestyle",
    createdAt: "2 hours ago",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: "2:45",
    views: 3150,
    likes: 420,
    hasLiked: false,
    comments: [],
  },
  {
    id: "feed-4",
    author: {
      id: "prof-4",
      displayName: "Elena",
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      location: "Vienna, Austria",
    },
    type: "DATING_AD",
    title: "Seeking Discreet Dinner & Opera Companion in Vienna 🍷",
    description: "Looking for an open-minded gentleman or couple to join me for a luxury evening at the Vienna State Opera.",
    category: "VIP Dining & Lounge",
    createdAt: "3 hours ago",
    views: 890,
    likes: 95,
    hasLiked: false,
    comments: [],
  },
];

const CATEGORIES = [
  "ALL CATEGORIES",
  "Couple",
  "Solo Woman",
  "VIP Lifestyle",
  "Outdoor & Travel",
  "Soft Erotica",
  "Fetish & Details",
  "VIP Dining & Lounge",
];

export default function DashboardPage() {
  const { profile, role } = useAuth();

  // Feed State
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(INITIAL_FEED_POSTS);

  // Filters State
  const [selectedType, setSelectedType] = useState<"ALL" | "ALBUM" | "VIDEO" | "DATING_AD">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL CATEGORIES");
  const [verifiedOnlyFilter, setVerifiedOnlyFilter] = useState<boolean>(false);

  // Active Lightbox / Comments State
  const [activePhotoModal, setActivePhotoModal] = useState<{ photos: string[]; title: string; index: number } | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // Filtered Posts Logic
  const filteredPosts = useMemo(() => {
    return feedPosts.filter((post) => {
      // Filter by Type
      if (selectedType !== "ALL" && post.type !== selectedType) return false;
      // Filter by Category
      if (selectedCategory !== "ALL CATEGORIES" && post.category !== selectedCategory) return false;
      // Filter by Verified Only
      if (verifiedOnlyFilter && !post.author.isVerified) return false;
      return true;
    });
  }, [feedPosts, selectedType, selectedCategory, verifiedOnlyFilter]);

  const handleToggleLike = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const hasLiked = !post.hasLiked;
          return {
            ...post,
            hasLiked,
            likes: hasLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: FeedComment = {
      id: `comment-${Date.now()}`,
      authorName: profile?.displayName || "Me",
      authorAvatar: profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      text,
      createdAt: "Just now",
    };

    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment],
          };
        }
        return post;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Welcome Banner */}
      <div className="relative glass-panel-gold rounded-3xl p-6 sm:p-8 shadow-gold-glow overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-3">
            <Badge type={role === "CREATOR" ? "creator" : role === "COUPLE" ? "couple" : role === "ADMIN" ? "admin" : "verified"} />
            <span className="text-xs text-velora-textMuted uppercase tracking-widest font-mono">
              Member Feed • Real-Time Stream
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-velora-textPrimary">
            Welcome back, <span className="gold-gradient-text">{profile?.displayName || "Intimo Member"}</span>
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-xl">
            Browse the latest verified photos, HD lifestyle video clips, and personal announcements uploaded by members.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/discovery">
              <Button variant="gold" size="sm" className="font-bold uppercase tracking-wider gap-2 text-xs">
                <Compass className="w-4 h-4" />
                Launch Discovery Map
              </Button>
            </Link>
            <Link href="/profile/me">
              <Button variant="glass" size="sm" className="font-bold uppercase tracking-wider gap-2 text-xs border-amber-400/40 text-amber-300">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Upload Photo & Video
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Feed Filter Bar */}
      <Card variant="goldBorder" className="p-4 sm:p-5 space-y-4 bg-velora-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-velora-gold" />
            <h2 className="text-base font-serif font-bold text-white">
              Filter Feed Content ({filteredPosts.length} Items)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-velora-textMuted flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnlyFilter}
                onChange={(e) => setVerifiedOnlyFilter(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verified Adult Members Only
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
          {/* Content Type Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                selectedType === "ALL"
                  ? "bg-amber-400 text-black shadow-gold-glow"
                  : "bg-white/5 text-velora-textSecondary hover:bg-white/10 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> All Feed Media
            </button>

            <button
              onClick={() => setSelectedType("ALBUM")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                selectedType === "ALBUM"
                  ? "bg-amber-400 text-black shadow-gold-glow"
                  : "bg-white/5 text-velora-textSecondary hover:bg-white/10 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photos & Albums
            </button>

            <button
              onClick={() => setSelectedType("VIDEO")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                selectedType === "VIDEO"
                  ? "bg-amber-400 text-black shadow-gold-glow"
                  : "bg-white/5 text-velora-textSecondary hover:bg-white/10 hover:text-white"
              }`}
            >
              <VideoIcon className="w-3.5 h-3.5" /> HD Video Clips
            </button>

            <button
              onClick={() => setSelectedType("DATING_AD")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                selectedType === "DATING_AD"
                  ? "bg-amber-400 text-black shadow-gold-glow"
                  : "bg-white/5 text-velora-textSecondary hover:bg-white/10 hover:text-white"
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" /> Dating Ads
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-velora-textMuted shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-velora-card text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Chronological Media Stream */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <Card variant="glass" className="p-12 text-center text-xs text-velora-textMuted italic space-y-2">
            <p>No media posts found matching your filter selection.</p>
            <button
              onClick={() => {
                setSelectedType("ALL");
                setSelectedCategory("ALL CATEGORIES");
                setVerifiedOnlyFilter(false);
              }}
              className="text-amber-400 underline font-bold uppercase tracking-wider text-[11px]"
            >
              Reset Filters
            </button>
          </Card>
        ) : (
          filteredPosts.map((post) => (
            <Card
              key={post.id}
              variant="goldBorder"
              className="p-5 sm:p-6 space-y-4 bg-velora-card/95 relative overflow-hidden"
            >
              {/* Post Author Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${post.author.id}`} className="shrink-0">
                    <div className="w-11 h-11 rounded-full border-2 border-amber-400/40 overflow-hidden hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
                    </div>
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${post.author.id}`} className="font-bold text-white hover:text-amber-300 transition-colors">
                        {post.author.displayName}
                      </Link>
                      {post.author.isVerified && (
                        <span title="Biometric Verified Adult">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-velora-textMuted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-400" /> {post.author.location} • <span className="font-mono text-amber-300/80">{post.createdAt}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-white">{post.title}</h3>
                <p className="text-xs text-velora-textSecondary leading-relaxed">{post.description}</p>
              </div>

              {/* MEDIA RENDERER */}
              {post.type === "ALBUM" && post.photos && post.photos.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {post.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhotoModal({ photos: post.photos!, title: post.title, index: idx })}
                        className="h-56 rounded-2xl bg-black border border-white/10 relative overflow-hidden group cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo}
                          alt={`${post.title} photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs font-bold text-white bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                            Click to View Photo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {post.type === "VIDEO" && post.videoUrl && (
                <div className="h-72 sm:h-96 w-full rounded-2xl bg-black border border-white/10 relative overflow-hidden">
                  <video
                    src={post.videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                  {post.duration && (
                    <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-md bg-black/80 text-amber-300 font-mono text-[11px] border border-white/20 z-10 pointer-events-none">
                      Duration: {post.duration}
                    </div>
                  )}
                </div>
              )}

              {post.type === "DATING_AD" && (
                <div className="p-5 rounded-2xl bg-white/5 border border-amber-400/30 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Megaphone className="w-4 h-4" /> Personal Dating Announcement
                  </div>
                  <p className="text-velora-textSecondary leading-relaxed">{post.description}</p>
                </div>
              )}

              {/* Post Footer & Social Interactions */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-velora-textMuted">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 font-bold transition-all px-3 py-1.5 rounded-full border ${
                      post.hasLiked
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-white/5 text-velora-textSecondary border-white/10 hover:text-amber-300"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${post.hasLiked ? "fill-emerald-400 text-emerald-400" : ""}`} />
                    <span>{post.likes} Likes</span>
                  </button>

                  <span className="flex items-center gap-1 font-mono">
                    <Eye className="w-4 h-4 text-amber-400" /> {post.views} Views
                  </span>
                </div>

                <Link href={`/profile/${post.author.id}`}>
                  <Button variant="glass" size="sm" className="text-xs font-bold border-white/20">
                    View Member Profile
                  </Button>
                </Link>
              </div>

              {/* Interactive Comments Section */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"} alt="Me" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder="Write a comment on this feed item..."
                      className="text-xs bg-white/5 border-white/10"
                    />
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      className="text-xs font-bold shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" /> Post
                    </Button>
                  </div>
                </div>

                {/* Render Posted Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {post.comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs">
                        <div className="w-7 h-7 rounded-full border border-amber-400/30 overflow-hidden shrink-0 mt-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">{c.authorName}</span>
                            <span className="text-[10px] text-velora-textMuted font-mono">{c.createdAt}</span>
                          </div>
                          <p className="text-velora-textSecondary mt-0.5 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Photo Lightbox Modal */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative max-w-4xl max-h-[90vh] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setActivePhotoModal(null)}
              className="absolute top-4 right-4 text-white bg-black/60 p-2 rounded-full hover:bg-black/90 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhotoModal.photos[activePhotoModal.index]}
              alt={activePhotoModal.title}
              className="w-full h-full object-contain max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
