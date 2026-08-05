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
import { visitorStore } from "@/lib/social/visitorStore";
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

export interface FeedInteractionUser {
  id: string;
  name: string;
  avatarUrl: string;
  genderSymbol?: "♀" | "♂" | "👫";
  isVerified?: boolean;
  timestamp: string;
  commentText?: string;
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
  title?: string;
  description: string;
  category: string;
  region: string;
  createdAt: string;
  photos?: string[];
  remainingPhotosCount?: number;
  videoUrl?: string;
  duration?: string;
  views?: number;
  likes?: number;
  viewersList?: FeedInteractionUser[];
  votersList?: FeedInteractionUser[];
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
      location: "",
    },
    type: "DATING_AD",
    title: "Weekend Salon & Private Getaway Connection",
    category: "Couple seeking man",
    region: "Prague Region",
    createdAt: "5 minutes ago",
    description:
      "We want to enjoy ourselves. If you also have the desire for discreet high-end chemistry and time this weekend, please write a few sentences about yourself so we can connect. 😉",
    hasLiked: false,
    isSaved: false,
    viewersList: [
      { id: "prof-2", name: "TmaziMary", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", genderSymbol: "♀", isVerified: true, timestamp: "10 minutes ago" },
      { id: "prof-3", name: "Marcus & Sophia", avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80", genderSymbol: "👫", isVerified: true, timestamp: "15 minutes ago" },
      { id: "prof-4", name: "vrs", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", genderSymbol: "♂", isVerified: true, timestamp: "25 minutes ago" },
    ],
    votersList: [
      { id: "prof-2", name: "TmaziMary", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", genderSymbol: "♀", isVerified: true, timestamp: "10 minutes ago" },
    ],
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
      location: "",
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
    hasLiked: true,
    isSaved: true,
    viewersList: [
      { id: "me", name: "Prince Charming", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", genderSymbol: "♂", isVerified: true, timestamp: "Just now" },
      { id: "prof-1", name: "Three & Desire", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", genderSymbol: "👫", isVerified: true, timestamp: "5 minutes ago" },
      { id: "prof-3", name: "Marcus & Sophia", avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80", genderSymbol: "👫", isVerified: true, timestamp: "12 minutes ago" },
      { id: "prof-4", name: "Belive10", avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80", genderSymbol: "♀", isVerified: true, timestamp: "15 minutes ago" },
    ],
    votersList: [
      { id: "me", name: "Prince Charming", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", genderSymbol: "♂", isVerified: true, timestamp: "Just now" },
      { id: "prof-4", name: "Belive10", avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80", genderSymbol: "♀", isVerified: true, timestamp: "15 minutes ago" },
    ],
    comments: [
      {
        id: "c-1",
        authorName: "Prince Charming",
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
      location: "",
    },
    type: "VIDEO",
    title: "Late Night Lounge & Champagne Vault",
    category: "VIP Lifestyle",
    region: "Berlin & Vienna",
    createdAt: "1 hour ago",
    description: "Private moments from our Monaco salon evening with curated electronic beats.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: "1:20",
    hasLiked: false,
    isSaved: false,
    viewersList: [
      { id: "prof-2", name: "TmaziMary", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", genderSymbol: "♀", isVerified: true, timestamp: "20 minutes ago" },
      { id: "prof-5", name: "DODO0666", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80", genderSymbol: "♂", isVerified: true, timestamp: "45 minutes ago" },
    ],
    votersList: [
      { id: "prof-2", name: "TmaziMary", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80", genderSymbol: "♀", isVerified: true, timestamp: "20 minutes ago" },
    ],
    comments: [],
  },
];

export interface SidebarAlbumItem {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerGender: "FEMALE" | "MALE" | "COUPLE";
  title: string;
  imageUrl: string;
  views: string;
  createdAt: string;
}

const ALL_SIDEBAR_ALBUMS: SidebarAlbumItem[] = [
  // --- FEMALE USERS' ALBUMS (Shown for Men looking for Women) ---
  {
    id: "alb-f1",
    ownerId: "prof-2",
    ownerName: "Valerie",
    ownerGender: "FEMALE",
    title: "Red Silk & Monaco Memories 👠",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    views: "14.2k",
    createdAt: "2 hours ago",
  },
  {
    id: "alb-f2",
    ownerId: "prof-2",
    ownerName: "Valerie",
    ownerGender: "FEMALE",
    title: "Midnight Lace & Fine Dining",
    imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80",
    views: "9.8k",
    createdAt: "5 hours ago",
  },
  {
    id: "alb-f3",
    ownerId: "prof-elena",
    ownerName: "Elena Vance",
    ownerGender: "FEMALE",
    title: "French Riviera Sunbathing",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    views: "18.5k",
    createdAt: "1 day ago",
  },
  {
    id: "alb-f4",
    ownerId: "prof-elena",
    ownerName: "Elena Vance",
    ownerGender: "FEMALE",
    title: "Sunset Champagne Lounge",
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    views: "11.3k",
    createdAt: "3 hours ago",
  },
  {
    id: "alb-f5",
    ownerId: "prof-4",
    ownerName: "Chloe V.",
    ownerGender: "FEMALE",
    title: "Riviera Glamour & Poolside",
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    views: "16.1k",
    createdAt: "Just now",
  },
  {
    id: "alb-f6",
    ownerId: "prof-4",
    ownerName: "Chloe V.",
    ownerGender: "FEMALE",
    title: "Summer Sunset & High Heels",
    imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    views: "8.7k",
    createdAt: "6 hours ago",
  },
  {
    id: "alb-f7",
    ownerId: "prof-tmazi",
    ownerName: "TmaziMary",
    ownerGender: "FEMALE",
    title: "Monaco Harbor Suite Teaser",
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    views: "12.9k",
    createdAt: "4 hours ago",
  },
  {
    id: "alb-f8",
    ownerId: "prof-tmazi",
    ownerName: "TmaziMary",
    ownerGender: "FEMALE",
    title: "Private Villa Photoshoot",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    views: "21.4k",
    createdAt: "Yesterday",
  },

  // --- MALE USERS' ALBUMS (Shown for Women looking for Men) ---
  {
    id: "alb-m1",
    ownerId: "prof-1",
    ownerName: "Alex",
    ownerGender: "MALE",
    title: "Prague Penthouse & Cocktails 🍸",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    views: "15.8k",
    createdAt: "1 hour ago",
  },
  {
    id: "alb-m2",
    ownerId: "prof-1",
    ownerName: "Alex",
    ownerGender: "MALE",
    title: "VIP Jet Journey & Fitness",
    imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    views: "11.2k",
    createdAt: "4 hours ago",
  },
  {
    id: "alb-m3",
    ownerId: "prof-lucas",
    ownerName: "Lucas R.",
    ownerGender: "MALE",
    title: "Mediterranean Yacht Expedition",
    imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    views: "19.3k",
    createdAt: "2 hours ago",
  },
  {
    id: "alb-m4",
    ownerId: "prof-lucas",
    ownerName: "Lucas R.",
    ownerGender: "MALE",
    title: "Monte Carlo Casino Salon",
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    views: "13.6k",
    createdAt: "5 hours ago",
  },
  {
    id: "alb-m5",
    ownerId: "prof-marco",
    ownerName: "Marco B.",
    ownerGender: "MALE",
    title: "Vintage Automobile & Cellar",
    imageUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80",
    views: "10.4k",
    createdAt: "Yesterday",
  },
  {
    id: "alb-m6",
    ownerId: "prof-dodo",
    ownerName: "DODO0666",
    ownerGender: "MALE",
    title: "Private Studio Beat Sessions",
    imageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
    views: "7.9k",
    createdAt: "3 hours ago",
  },
];

const RECENT_VISITORS = [
  { id: "vrs-1", name: "vrs", gender: "♂", isVerified: true, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-2", name: "Miss_Mysterious", gender: "♀", isVerified: true, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-3", name: "Belive10", gender: "♀", isVerified: true, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-4", name: "I understand.", gender: "♀", isVerified: true, avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80" },
  { id: "vrs-5", name: "DODO0666", gender: "♂", isVerified: true, hasMessage: true, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80" },
];

import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function DashboardPage() {
  const { user, profile } = useAuth();

  // Determine target gender for sidebar albums based on user's preference
  // (Men looking for women -> FEMALE albums, Women looking for men -> MALE albums)
  const targetGender = useMemo(() => {
    const rawGender = String(profile?.gender || (user as any)?.gender || "MALE").toUpperCase();
    if (rawGender.includes("MALE") && !rawGender.includes("FE")) {
      return "FEMALE";
    } else if (rawGender.includes("FEMALE")) {
      return "MALE";
    }
    return "FEMALE";
  }, [profile?.gender, user]);

  // Sidebar Albums State (Best Albums & Latest Albums)
  const [sidebarBestAlbums, setSidebarBestAlbums] = useState<SidebarAlbumItem[]>([]);
  const [sidebarLatestAlbums, setSidebarLatestAlbums] = useState<SidebarAlbumItem[]>([]);

  // Randomize albums on mount/page refresh based on target gender
  React.useEffect(() => {
    const eligiblePool = ALL_SIDEBAR_ALBUMS.filter((alb) => alb.ownerGender === targetGender);
    const fallbackPool = ALL_SIDEBAR_ALBUMS.length > 0 ? ALL_SIDEBAR_ALBUMS : eligiblePool;
    const finalPool = eligiblePool.length >= 6 ? eligiblePool : fallbackPool;

    // Fisher-Yates random shuffle on every page refresh
    const shuffled = [...finalPool].sort(() => 0.5 - Math.random());

    setSidebarBestAlbums(shuffled.slice(0, 2));
    setSidebarLatestAlbums(shuffled.slice(2, 6));
  }, [targetGender]);


  // Helper to sync feed posts and merge dating ads from local storage
  const syncFeedPosts = React.useCallback(() => {
    if (typeof window === "undefined") return;

    let posts: FeedPost[] = [];
    const savedPostsStr = localStorage.getItem("intimo_feed_posts");
    if (savedPostsStr) {
      try {
        posts = JSON.parse(savedPostsStr);
      } catch (e) {
        console.error("Failed to parse saved feed posts:", e);
      }
    }
    if (!posts || posts.length === 0) {
      posts = INITIAL_FEED_POSTS;
    }

    // Merge dating ads into feed posts if not already present
    const savedAdsStr = localStorage.getItem("intimo_all_dating_ads");
    if (savedAdsStr) {
      try {
        const ads = JSON.parse(savedAdsStr);
        if (Array.isArray(ads) && ads.length > 0) {
          const map = new Map<string, FeedPost>();
          // Add existing feed posts first
          posts.forEach((p) => map.set(p.id, p));

          // Map each dating ad to a FeedPost
          ads.forEach((ad: any) => {
            if (!map.has(ad.id)) {
              map.set(ad.id, {
                id: ad.id,
                author: {
                  id: ad.authorId || "me",
                  displayName: ad.authorName || "Intimo Member",
                  avatarUrl: ad.authorAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
                  isVerified: ad.isVerified ?? true,
                  genderSymbol: "👫",
                  location: ad.region || ad.country || "",
                },
                type: "DATING_AD",
                title: ad.title,
                description: ad.text,
                category: ad.category,
                region: ad.region || ad.country || "",
                createdAt: ad.createdAt || "Recently",
                photos: ad.photoUrl ? [ad.photoUrl] : undefined,
                hasLiked: false,
                isSaved: ad.saved ?? false,
                comments: [],
              });
            }
          });

          posts = Array.from(map.values());
        }
      } catch (e) {
        console.error("Failed to parse dating ads for feed:", e);
      }
    }

    setFeedPosts(posts);
  }, []);

  // Feed State
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);

  // Sync on mount and event triggers
  React.useEffect(() => {
    syncFeedPosts();
    const handleUpdate = () => syncFeedPosts();
    window.addEventListener("intimo_ads_updated", handleUpdate);
    window.addEventListener("focus", handleUpdate);
    return () => {
      window.removeEventListener("intimo_ads_updated", handleUpdate);
      window.removeEventListener("focus", handleUpdate);
    };
  }, [syncFeedPosts]);

  // Save feedPosts to localStorage on change
  React.useEffect(() => {
    if (typeof window !== "undefined" && feedPosts.length > 0) {
      localStorage.setItem("intimo_feed_posts", JSON.stringify(feedPosts));
    }
  }, [feedPosts]);

  // Nav & Filter Tabs
  const [activeNavTab, setActiveNavTab] = useState<"NEWEST" | "FOLLOWED" | "FRIENDS">("FOLLOWED");
  const [activeFilterPill, setActiveFilterPill] = useState<string>("ALL");

  // Followed & Friends State
  const [followedIds, setFollowedIds] = useState(connectionStore.getFollowedUserIds());
  const [friendIds, setFriendIds] = useState(connectionStore.getFriendUserIds());

  // Profile Visitors State
  const [visitors, setVisitors] = useState(visitorStore.getRecentVisitors());
  const [allVisitorsModalOpen, setAllVisitorsModalOpen] = useState(false);

  React.useEffect(() => {
    setFollowedIds(connectionStore.getFollowedUserIds());
    setFriendIds(connectionStore.getFriendUserIds());
    setVisitors(visitorStore.getRecentVisitors());

    const unsubscribeConn = connectionStore.subscribe(() => {
      setFollowedIds(connectionStore.getFollowedUserIds());
      setFriendIds(connectionStore.getFriendUserIds());
    });

    const unsubscribeVis = visitorStore.subscribe(() => {
      setVisitors(visitorStore.getRecentVisitors());
    });

    return () => {
      unsubscribeConn();
      unsubscribeVis();
    };
  }, []);

  // Publisher Input State
  const [publisherInput, setPublisherInput] = useState("");

  // Lightbox Modal
  const [activePhotoModal, setActivePhotoModal] = useState<{ photos: string[]; title: string; index: number } | null>(null);

  // Comment Inputs State
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const filteredPosts = useMemo(() => {
    return feedPosts.filter((post) => {
      const isUserOwnPost =
        post.author.id === user?.id ||
        post.author.id === profile?.id ||
        post.author.id === "me" ||
        (profile?.displayName && post.author.displayName === profile.displayName) ||
        (user?.username && post.author.displayName === user.username);

      // Filter by Followed / Friends tabs
      if (activeNavTab === "FOLLOWED" && !followedIds.includes(post.author.id) && !isUserOwnPost) {
        return false;
      }
      if (activeNavTab === "FRIENDS" && !friendIds.includes(post.author.id) && !isUserOwnPost) {
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
  }, [feedPosts, activeNavTab, activeFilterPill, followedIds, friendIds, user?.id, profile?.id, profile?.displayName, user?.username]);

  // Feed Interactions Modal State (Views, Comments, Likes)
  const [feedInteractionsModal, setFeedInteractionsModal] = useState<{
    title: string;
    type: "VIEWS" | "COMMENTS" | "LIKES";
    users: FeedInteractionUser[];
  } | null>(null);

  const openFeedInteractionsModal = (post: FeedPost, type: "VIEWS" | "COMMENTS" | "LIKES") => {
    let usersList: FeedInteractionUser[] = [];
    if (type === "VIEWS") {
      usersList = post.viewersList || [];
    } else if (type === "LIKES") {
      usersList = post.votersList || [];
    } else if (type === "COMMENTS") {
      usersList = post.comments.map((c) => ({
        id: c.id,
        name: c.authorName,
        avatarUrl: c.authorAvatar,
        timestamp: c.createdAt,
        commentText: c.text,
      }));
    }

    setFeedInteractionsModal({
      title: post.title || "Post Interactions",
      type,
      users: usersList,
    });
  };

  const handleToggleLike = (postId: string) => {
    const myId = profile?.id || "me";
    const myName = profile?.displayName || "Prince Charming";
    const myAvatar = profile?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d";

    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          let currentVoters = p.votersList || [];
          if (nextLiked) {
            if (!currentVoters.some((v) => v.id === myId || v.name === myName)) {
              currentVoters = [
                { id: myId, name: myName, avatarUrl: myAvatar, isVerified: true, timestamp: "Just now", genderSymbol: "♂" },
                ...currentVoters,
              ];
            }
          } else {
            currentVoters = currentVoters.filter((v) => v.id !== myId && v.name !== myName);
          }
          return { ...p, hasLiked: nextLiked, votersList: currentVoters };
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
        location: profile?.location || [profile?.city, profile?.country].filter(Boolean).join(", ") || "",
      },
      type: "TEXT",
      category: "Personal Post",
      region: profile?.city || profile?.country || "",
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

  if (!user) {
    return <BehindTheDoorLanding />;
  }

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
              {sidebarBestAlbums.map((alb) => (
                <Link key={alb.id} href={`/profile/${alb.ownerId}?tab=PHOTOS`} className="block">
                  <div className="relative h-44 rounded-2xl bg-black overflow-hidden border border-white/10 group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={alb.imageUrl}
                      alt={alb.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {alb.ownerName}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                      <span className="font-bold drop-shadow-md truncate max-w-[140px]">{alb.title}</span>
                      <span className="text-[10px] font-mono text-amber-300 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 shrink-0">
                        {alb.views} views
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Latest Albums (2x2 Grid) */}
          <Card variant="glass" className="p-4 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/10 pb-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> Latest Albums
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {sidebarLatestAlbums.map((alb) => (
                <Link key={alb.id} href={`/profile/${alb.ownerId}?tab=PHOTOS`} className="block">
                  <div className="relative h-28 rounded-xl bg-black border border-white/10 overflow-hidden group cursor-pointer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={alb.imageUrl}
                      alt={alb.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white truncate drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                      {alb.ownerName}
                    </div>
                  </div>
                </Link>
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
                    {post.title && <h3 className="text-base font-serif font-bold text-amber-300">{post.title}</h3>}

                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase font-mono">
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        {post.category}
                      </span>
                      {post.region && (
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-400" /> {post.region}
                        </span>
                      )}
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
                            onClick={() => setActivePhotoModal({ photos: post.photos!, title: post.title || "Photo Album", index: idx })}
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

                  {/* Clean Single Metrics & Action Bar: Views (modal) | Comments (focus input) | Likes (toggle & modal) */}
                  {(() => {
                    const realViews = post.viewersList ? post.viewersList.length : (post.views || 0);
                    const realComments = post.comments.length;
                    const realLikes = post.votersList ? post.votersList.length : (post.hasLiked ? 1 : 0);
                    return (
                      <div className="flex items-center justify-between text-xs text-velora-textMuted font-mono pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => openFeedInteractionsModal(post, "VIEWS")}
                          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-bold cursor-pointer"
                          title="Click to see list of members who viewed this post"
                        >
                          <Eye className="w-4 h-4 text-amber-400" /> {realViews} {realViews === 1 ? "View" : "Views"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (realComments > 0) {
                              openFeedInteractionsModal(post, "COMMENTS");
                            } else {
                              const inputEl = document.getElementById(`input-${post.id}`);
                              if (inputEl) inputEl.focus();
                            }
                          }}
                          className="flex items-center gap-1.5 hover:text-amber-300 transition-colors font-bold cursor-pointer"
                          title="Click to view comments or reply"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-400" /> {realComments} {realComments === 1 ? "Comment" : "Comments"}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(post.id)}
                            className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                              post.hasLiked ? "text-emerald-400" : "hover:text-amber-300"
                            }`}
                            title="Click to Like / Unlike this post"
                          >
                            <ThumbsUp className={`w-4 h-4 ${post.hasLiked ? "fill-emerald-400 text-emerald-400" : ""}`} /> {realLikes} {realLikes === 1 ? "Like" : "Likes"}
                          </button>

                          {realLikes > 0 && (
                            <button
                              type="button"
                              onClick={() => openFeedInteractionsModal(post, "LIKES")}
                              className="text-[10px] text-amber-300 hover:underline"
                              title="Click to view list of members who liked this post"
                            >
                              (Who liked)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

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
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-400" /> Recent Visits
              </span>
              <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                {visitors.length} Visitors
              </span>
            </h3>

            <div className="space-y-2.5">
              {visitors.slice(0, 5).map((v) => (
                <Link key={v.id} href={`/profile/${v.userId}`} className="flex items-center justify-between text-xs hover:bg-white/5 p-1.5 rounded-xl transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.avatarUrl} alt={v.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="font-bold text-white flex items-center gap-1">
                        {v.name}
                        <span className="text-amber-400 font-bold text-[11px]">{v.genderSymbol}</span>
                        {v.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      </span>
                      <p className="text-[10px] text-velora-textMuted font-mono">{v.visitedAt}</p>
                    </div>
                  </div>

                  {v.hasUnreadMessage && (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center shadow-sm">
                      1
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <button
              onClick={() => setAllVisitorsModalOpen(true)}
              className="w-full py-1.5 text-center text-xs font-bold text-amber-300 hover:underline pt-2 border-t border-white/10"
            >
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

      {/* All Recent Profile Visitors Modal */}
      {allVisitorsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <button
              onClick={() => setAllVisitorsModalOpen(false)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" /> Recent Profile Visitors
              </h3>
              <p className="text-xs text-velora-textMuted">Members who recently viewed your verified Intimo profile.</p>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {visitors.map((v) => (
                <div key={v.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.avatarUrl} alt={v.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        {v.name}
                        <span className="text-amber-400 text-xs">{v.genderSymbol}</span>
                        {v.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      </p>
                      <p className="text-[10px] text-velora-textMuted font-mono">Visited {v.visitedAt}</p>
                    </div>
                  </div>

                  <Link href={`/profile/${v.userId}`} onClick={() => setAllVisitorsModalOpen(false)}>
                    <Button variant="glass" size="sm" className="text-[11px] font-bold">
                      View Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Feed Interaction Modal (Viewers / Commenters / Likers) */}
      {feedInteractionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <button
              onClick={() => setFeedInteractionsModal(null)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-white/10 pb-3">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                {feedInteractionsModal.type === "VIEWS" && <Eye className="w-5 h-5 text-amber-400" />}
                {feedInteractionsModal.type === "COMMENTS" && <MessageSquare className="w-5 h-5 text-blue-400" />}
                {feedInteractionsModal.type === "LIKES" && <ThumbsUp className="w-5 h-5 text-emerald-400 fill-emerald-400" />}
                {feedInteractionsModal.type === "VIEWS" && "Members Who Viewed"}
                {feedInteractionsModal.type === "COMMENTS" && "Members Who Commented"}
                {feedInteractionsModal.type === "LIKES" && "Members Who Liked"}
              </h3>
              <p className="text-xs text-amber-300 font-semibold truncate">
                "{feedInteractionsModal.title}" • {feedInteractionsModal.users.length} {feedInteractionsModal.users.length === 1 ? "Member" : "Members"}
              </p>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {feedInteractionsModal.users.length === 0 ? (
                <p className="text-xs text-velora-textMuted italic text-center py-6">
                  No {feedInteractionsModal.type.toLowerCase()} recorded yet.
                </p>
              ) : (
                feedInteractionsModal.users.map((u, idx) => (
                  <div
                    key={u.id + "-" + idx}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:border-amber-400/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1">
                          {u.name}
                          {u.genderSymbol && <span className="text-amber-400 text-xs">{u.genderSymbol}</span>}
                          {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        </p>
                        {u.commentText ? (
                          <p className="text-[11px] text-amber-200/90 italic font-serif">"{u.commentText}"</p>
                        ) : (
                          <p className="text-[10px] text-velora-textMuted font-mono">{u.timestamp}</p>
                        )}
                      </div>
                    </div>

                    <Link href={`/profile/${u.id === "me" ? "me" : u.id}`} onClick={() => setFeedInteractionsModal(null)}>
                      <Button variant="glass" size="sm" className="text-[11px] font-bold">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <Button variant="glass" size="sm" onClick={() => setFeedInteractionsModal(null)} className="text-xs">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
