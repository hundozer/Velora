"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MOCK_PROFILES } from "@/lib/mockData";
import { connectionStore } from "@/lib/social/connectionStore";
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
  Bookmark,
  Users,
  Bell,
  CheckCircle2,
  PlusCircle,
  Clock,
  ChevronRight,
  Newspaper,
  UserCheck,
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
    genderSymbol: "♀" | "♂" | "👫";
    location: string;
  };
  type: "ALBUM" | "VIDEO" | "DATING_AD" | "TEXT";
  title: string;
  description: string;
  category: string;
  region: string;
  createdAt: string;
  photos?: string[];
  remainingPhotosCount?: number;
  videoUrl?: string;
  duration?: string;
  views: number;
  likes: number;
  hasLiked?: boolean;
  isSaved?: boolean;
  comments: FeedComment[];
}

const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: "feed-1",
    author: {
      id: "prof-1",
      displayName: "Three & Desire",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      genderSymbol: "👫",
      location: "Prague, Czech Republic",
    },
    type: "DATING_AD",
    title: "Weekend Salon & Private Getaway Connection",
    category: "Couple seeking man",
    region: "Prague Region",
    createdAt: "5 minutes ago",
    description:
      "We want to enjoy ourselves. If you also have the desire for discreet high-end chemistry and time this weekend, please write a few sentences about yourself so we can connect. 😉",
    views: 890,
    likes: 42,
    hasLiked: false,
    isSaved: false,
    comments: [],
  },
  {
    id: "feed-2",
    author: {
      id: "prof-2",
      displayName: "TmaziMary",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
      isVerified: true,
      genderSymbol: "♀",
      location: "Munich, Germany",
    },
    type: "ALBUM",
    title: "Red Silk & Late Night Monaco Memories 👠",
    category: "Solo Woman",
    region: "Bavaria & Riviera",
    createdAt: "18 minutes ago",
    description: "Capturing candid intimate moments from our private suite overlooking the harbor.",
    photos: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=80",
    ],
    remainingPhotosCount: 10,
    views: 3410,
    likes: 489,
    hasLiked: true,
    isSaved: true,
    comments: [
      {
        id: "c-1",
        authorName: "Alex",
        authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        text: "Stunning aesthetic Mary! The red dress is breathtaking.",
        createdAt: "10 minutes ago",
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
      genderSymbol: "👫",
      location: "Berlin, Germany",
    },
    type: "VIDEO",
    title: "Late Night Lounge & Champagne Vault",
    category: "VIP Lifestyle",
    region: "Berlin & Vienna",
    createdAt: "1 hour ago",
    description: "Private moments from our Monaco salon evening with curated electronic beats.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "1:20",
    views: 4120,
    likes: 620,
    hasLiked: false,
    isSaved: false,
    comments: [],
  },
];

const SIDEBAR_BEST_ALBUMS = [
  {
    id: "best-1",
    title: "Riviera Glamour",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
    views: "12.4k",
  },
  {
    id: "best-2",
    title: "Midnight Lace",
    imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80",
    views: "9.8k",
  },
];

const SIDEBAR_LATEST_ALBUMS = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80",
];

const RECENT_VISITORS = [
  { id: "vrs-1", name: "vrs", gender: "♂", isVerified: true, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-2", name: "Miss_Mysterious", gender: "♀", isVerified: true, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-3", name: "Belive10", gender: "♀", isVerified: true, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-4", name: "I understand.", gender: "♀", isVerified: true, avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-5", name: "DODO0666", gender: "♂", isVerified: true, hasMessage: true, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
];

export default function DashboardPage() {
  const { profile } = useAuth();

  // Feed State
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(INITIAL_FEED_POSTS);

  // Nav & Filter Tabs
  const [activeNavTab, setActiveNavTab] = useState<"NEWEST" | "FOLLOWED" | "FRIENDS">("FOLLOWED");
  const [activeFilterPill, setActiveFilterPill] = useState<string>("ALL");

  // Followed & Friends State
  const [followedIds, setFollowedIds] = useState(connectionStore.getFollowedUserIds());
  const [friendIds, setFriendIds] = useState(connectionStore.getFriendUserIds());

  React.useEffect(() => {
    setFollowedIds(connectionStore.getFollowedUserIds());
    setFriendIds(connectionStore.getFriendUserIds());
    const unsubscribe = connectionStore.subscribe(() => {
      setFollowedIds(connectionStore.getFollowedUserIds());
      setFriendIds(connectionStore.getFriendUserIds());
    });
    return unsubscribe;
  }, []);

  // Publisher Input State
  const [publisherInput, setPublisherInput] = useState("");

  // Lightbox Modal
  const [activePhotoModal, setActivePhotoModal] = useState<{ photos: string[]; title: string; index: number } | null>(null);

  // Comment Inputs State
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const filteredPosts = useMemo(() => {
    return feedPosts.filter((post) => {
      // Filter by Followed / Friends tabs
      if (activeNavTab === "FOLLOWED" && !followedIds.includes(post.author.id) && post.author.id !== "me") {
        return false;
      }
      if (activeNavTab === "FRIENDS" && !friendIds.includes(post.author.id) && post.author.id !== "me") {
        return false;
      }

      // Filter by Content Type Pill
      if (activeFilterPill === "ALL") return true;
      if (activeFilterPill === "ALBUM" && post.type === "ALBUM") return true;
      if (activeFilterPill === "VIDEOS" && post.type === "VIDEO") return true;
      if (activeFilterPill === "DATING" && post.type === "DATING_AD") return true;
      if (activeFilterPill === "TEXT" && post.type === "TEXT") return true;
      return true;
    });
  }, [feedPosts, activeNavTab, activeFilterPill, followedIds, friendIds]);

  const handleToggleLike = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          return { ...p, hasLiked, likes: hasLiked ? p.likes + 1 : p.likes - 1 };
        }
        return p;
      })
    );
  };

  const handleToggleSave = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: FeedComment = {
      id: `c-${Date.now()}`,
      authorName: profile?.displayName || "Me",
      authorAvatar: profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      text,
      createdAt: "Just now",
    };

    setFeedPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publisherInput.trim()) return;

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      author: {
        id: "me",
        displayName: profile?.displayName || "Prince Charming",
        avatarUrl: profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        isVerified: true,
        genderSymbol: "♂",
        location: "Monaco & Prague",
      },
      type: "TEXT",
      title: "Intimate Thoughts & Update",
      category: "Personal Post",
      region: "Prague Region",
      createdAt: "Just now",
      description: publisherInput.trim(),
      views: 1,
      likes: 0,
      hasLiked: false,
      comments: [],
    };

    setFeedPosts([newPost, ...feedPosts]);
    setPublisherInput("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* 3-Column Layout Grid matching Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT SIDEBAR (Col-Span 3) */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Best Albums Card */}
          <Card variant="goldBorder" className="p-4 space-y-3 bg-velora-card">
            <h3 className="text-sm font-bold text-amber-300 flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" /> Best Albums
              </span>
              <span className="text-[10px] text-velora-textMuted uppercase font-mono">Popular</span>
            </h3>

            <div className="space-y-3">
              {SIDEBAR_BEST_ALBUMS.map((alb) => (
                <div key={alb.id} className="relative h-44 rounded-2xl bg-black overflow-hidden border border-white/10 group cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={alb.imageUrl} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <span className="font-bold drop-shadow-md">{alb.title}</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                      {alb.views} views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Latest Albums (2x2 Grid) */}
          <Card variant="glass" className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> Latest Albums
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SIDEBAR_LATEST_ALBUMS.map((imgUrl, idx) => (
                <div key={idx} className="h-28 rounded-xl bg-black border border-white/10 overflow-hidden group cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt="Latest album" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </Card>

          {/* Best Videos Card */}
          <Card variant="glass" className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
              <VideoIcon className="w-4 h-4 text-red-400" /> Best Videos
            </h3>
            <div className="relative h-40 rounded-2xl bg-black border border-white/10 overflow-hidden group cursor-pointer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80" alt="Best Video" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-black ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 border border-white/20">
                Full HD • 0:30
              </div>
            </div>
          </Card>
        </aside>

        {/* CENTER MAIN FEED (Col-Span 6) */}
        <main className="lg:col-span-6 space-y-6">
          
          {/* Top Publisher Composer Bar */}
          <Card variant="goldBorder" className="p-4 bg-velora-card space-y-3">
            <form onSubmit={handleCreatePost} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"} alt="Me" className="w-full h-full object-cover" />
              </div>
              <input
                type="text"
                value={publisherInput}
                onChange={(e) => setPublisherInput(e.target.value)}
                placeholder="What are you thinking about?"
                className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-white placeholder-velora-textMuted focus:outline-none focus:border-amber-400 transition-colors"
              />
              <Button type="submit" variant="gold" size="sm" className="rounded-full text-xs font-bold shrink-0 px-4">
                Post
              </Button>
            </form>
          </Card>

          {/* Sub-Navigation Tabs & Filter Pills Bar */}
          <Card variant="glass" className="p-4 space-y-4">
            {/* Top Sub-Nav Tabs: Newest | Followed | Friends */}
            <div className="flex items-center gap-6 border-b border-white/10 pb-3 text-xs font-bold">
              <button
                onClick={() => setActiveNavTab("NEWEST")}
                className={`transition-colors relative pb-1 ${
                  activeNavTab === "NEWEST" ? "text-amber-400" : "text-velora-textMuted hover:text-white"
                }`}
              >
                Newest
                {activeNavTab === "NEWEST" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
              </button>

              <button
                onClick={() => setActiveNavTab("FOLLOWED")}
                className={`transition-colors relative pb-1 ${
                  activeNavTab === "FOLLOWED" ? "text-amber-400" : "text-velora-textMuted hover:text-white"
                }`}
              >
                Followed
                {activeNavTab === "FOLLOWED" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
              </button>

              <button
                onClick={() => setActiveNavTab("FRIENDS")}
                className={`transition-colors relative pb-1 ${
                  activeNavTab === "FRIENDS" ? "text-amber-400" : "text-velora-textMuted hover:text-white"
                }`}
              >
                Friends
                {activeNavTab === "FRIENDS" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
              </button>
            </div>

            {/* Content Type Filter Pills */}
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                { id: "ALL", label: "All" },
                { id: "ALBUM", label: "Album" },
                { id: "VIDEOS", label: "Videos" },
                { id: "TEXT", label: "Text posts" },
                { id: "DATING", label: "Dating" },
                { id: "STORIES", label: "Stories" },
                { id: "BLOGS", label: "Blogs" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilterPill(pill.id)}
                  className={`px-4 py-1.5 rounded-full transition-all text-[11px] uppercase tracking-wider ${
                    activeFilterPill === pill.id
                      ? "bg-amber-400 text-black shadow-gold-glow font-bold"
                      : "bg-white/5 text-velora-textSecondary hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Main Feed Posts Stream */}
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <Card variant="glass" className="p-8 text-center text-xs text-velora-textMuted italic">
                No posts found for this filter tab.
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card key={post.id} variant="goldBorder" className="p-6 space-y-4 bg-velora-card relative overflow-hidden">
                  
                  {/* Post Header: Avatar, Name, Gender Symbol, Verified Badge, Time */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full border-2 border-amber-400/40 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.author.avatarUrl} alt={post.author.displayName} className="w-full h-full object-cover" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{post.author.displayName}</span>
                          <span className="text-amber-400 font-bold text-xs">{post.author.genderSymbol}</span>
                          {post.author.isVerified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          )}
                          <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" />
                        </div>
                        <p className="text-[11px] text-velora-textMuted font-mono mt-0.5">{post.createdAt}</p>
                      </div>
                    </div>

                    <button className="text-velora-textMuted hover:text-white p-1">
                      •••
                    </button>
                  </div>

                  {/* Title & Category Badges */}
                  <div className="space-y-2">
                    <h3 className="text-base font-serif font-bold text-amber-300">{post.title}</h3>

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase font-mono">
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {post.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-400" /> {post.region}
                      </span>
                    </div>

                    <p className="text-xs text-velora-textSecondary leading-relaxed pt-1">{post.description}</p>
                  </div>

                  {/* MEDIA RENDERERS */}
                  {post.type === "ALBUM" && post.photos && post.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      {post.photos.slice(0, 4).map((photo, idx) => {
                        const isLast = idx === 3 && post.remainingPhotosCount;
                        return (
                          <div
                            key={idx}
                            onClick={() => setActivePhotoModal({ photos: post.photos!, title: post.title, index: idx })}
                            className="h-44 rounded-xl bg-black border border-white/10 relative overflow-hidden group cursor-pointer"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo} alt="Photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            {isLast && (
                              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                                <span className="text-lg font-bold text-white">+{post.remainingPhotosCount}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {post.type === "VIDEO" && post.videoUrl && (
                    <div className="h-64 sm:h-80 w-full rounded-2xl bg-black border border-white/10 relative overflow-hidden mt-2">
                      <video src={post.videoUrl} controls playsInline className="w-full h-full object-contain bg-black" />
                      {post.duration && (
                        <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-black/80 text-amber-300 font-mono text-[10px] border border-white/20 z-10 pointer-events-none">
                          Full HD • {post.duration}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post Actions Bar: Reply | Save / Favorite | Like */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById(`input-${post.id}`);
                        if (inputEl) inputEl.focus();
                      }}
                      className="flex items-center gap-1.5 text-amber-300 hover:underline font-bold"
                    >
                      <MessageSquare className="w-4 h-4" /> Reply
                    </button>

                    <button
                      onClick={() => handleToggleSave(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-all ${
                        post.isSaved ? "text-amber-400" : "text-velora-textMuted hover:text-white"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${post.isSaved ? "fill-amber-400" : ""}`} /> Save
                    </button>

                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full border transition-all ${
                        post.hasLiked
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-white/5 text-velora-textMuted border-white/10 hover:text-amber-300"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" /> {post.likes} Likes
                    </button>
                  </div>

                  {/* Comment Input */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <input
                      id={`input-${post.id}`}
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder="Write a reply..."
                      className="w-full px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <Button variant="gold" size="sm" onClick={() => handleAddComment(post.id)} className="text-[11px] font-bold shrink-0">
                      Post
                    </Button>
                  </div>

                  {/* Comments List */}
                  {post.comments.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {post.comments.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs">
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
                </Card>
              ))
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR (Col-Span 3) */}
        <aside className="lg:col-span-3 space-y-6">
          
          {/* Platform News & Updates Card */}
          <Card variant="goldBorder" className="p-4 space-y-3 bg-velora-card">
            <h3 className="text-sm font-bold text-amber-300 flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-amber-400" /> Platform News
              </span>
              <span className="text-[10px] text-velora-textMuted font-mono">Updates</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold">6/17</span>
                <p className="text-white font-semibold">Direct Cloudflare R2 Uploads Active</p>
                <p className="text-[11px] text-velora-textMuted">Upload videos up to 4 GB with direct presigned cloud URLs.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 font-bold">6/5</span>
                <p className="text-white font-semibold">Member Identity Verification</p>
                <p className="text-[11px] text-velora-textMuted">Submit handwritten note selfies for manual admin approval.</p>
              </div>
            </div>
          </Card>

          {/* Online Friends / Active Members */}
          <Card variant="glass" className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" /> Online Friends
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Active</span>
            </h3>
            <p className="text-xs text-velora-textMuted italic">No friends online right now.</p>
          </Card>

          {/* Recent Profile Visits */}
          <Card variant="glass" className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
              <UserCheck className="w-4 h-4 text-blue-400" /> Recent Visits
            </h3>

            <div className="space-y-2.5">
              {RECENT_VISITORS.map((v) => (
                <div key={v.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.avatar} alt={v.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-white flex items-center gap-1">
                      {v.name}
                      <span className="text-amber-400 font-bold text-[11px]">{v.gender}</span>
                      {v.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </span>
                  </div>

                  {v.hasMessage && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full py-1.5 text-center text-xs font-bold text-amber-300 hover:underline pt-2 border-t border-white/10">
              Show More Visitors →
            </button>
          </Card>
        </aside>

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
