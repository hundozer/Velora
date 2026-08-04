"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReportModal } from "@/components/safety/ReportModal";
import { GetVerifiedModal } from "@/components/profile/GetVerifiedModal";
import { userStore } from "@/lib/auth0/userStore";
import { MOCK_PROFILES, MOCK_CREATOR_ALBUMS } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { uploadFileToR2 } from "@/lib/storage/clientUpload";
import { Input } from "@/components/ui/Input";
import {
  MapPin,
  Heart,
  MessageSquare,
  ShieldCheck,
  Lock,
  Sparkles,
  Flame,
  Globe,
  UserCheck,
  CheckCircle2,
  Calendar,
  Eye,
  Crown,
  LogOut,
  Camera,
  Image,
  Video,
  Megaphone,
  Plus,
  Play,
  X,
  Coins,
  ThumbsUp,
  Tag,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  EyeOff,
  Edit3,
} from "lucide-react";

const AMATERI_TOPICS = [
  "Anal",
  "BDSM",
  "Big Asses",
  "Big tits",
  "Bulls",
  "Candaulism",
  "Clothes",
  "Crossdresser",
  "Deepthroat",
  "Details",
  "Dildos and other toys",
  "Erotic art",
  "Fetish",
  "Fisting",
  "Footfetish",
  "Footjob",
  "Funny and creative",
  "Gangbang",
  "Gloryhole",
  "Group sex",
  "Masturbation",
  "MILFs",
  "Natural body hair",
  "Oral sex",
  "Outdoor sex",
  "Piercing",
  "Piss",
  "Sex and porn",
  "Sex in public",
  "Sex in the car",
  "Soft erotica",
  "Solo",
  "Sperm",
  "Squirt",
  "Swallowing",
  "Trans and Transvestites",
  "Vacation",
  "VIP Lifestyle",
];

interface MediaComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  createdAt: string;
}

interface MediaVoter {
  id: string;
  name: string;
  avatarUrl: string;
  isVerified?: boolean;
  votedAt: string;
}

interface UserVideoItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail: string;
  videoUrl?: string;
  monetization: "FREE" | "CREDITS";
  creditsPrice?: number;
  category: string;
  commentPermission: "ANYONE" | "ALBUM_HOLDERS" | "VERIFIED" | "NOBODY";
  votingPermission: "ANYONE" | "DISABLED";
  topics: string[];
  views: number;
  comments: number;
  likes: number;
  status: "On web" | "In profile only" | "Pending correction" | "Disabled";
  createdAt: string;
  commentsList?: MediaComment[];
  votersList?: MediaVoter[];
  hasUserVoted?: boolean;
}

interface UserPhotoAlbumItem {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  photoCount: number;
  photos?: string[];
  monetization: "FREE" | "CREDITS";
  creditsPrice?: number;
  category: string;
  topics: string[];
  views: number;
  comments: number;
  likes: number;
  status: "On web" | "In profile only" | "Disabled";
  createdAt: string;
  commentsList?: MediaComment[];
  votersList?: MediaVoter[];
  hasUserVoted?: boolean;
}

export default function SingleProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { logout, user: currentUser, profile: currentProfile, updateUserProfile } = useAuth();
  const profileId = (params?.id as string) || "me";
  const tabQuery = searchParams.get("tab");

  const isSelf =
    profileId === "me" ||
    profileId === "my-profile" ||
    (currentProfile?.id && profileId === currentProfile.id) ||
    (currentUser?.id && profileId === currentUser.id) ||
    (currentProfile?.userId && profileId === currentProfile.userId);

  const profile = isSelf && currentProfile ? currentProfile : (MOCK_PROFILES.find((p) => p.id === profileId) || MOCK_PROFILES[0]);

  const [isFavorited, setIsFavorited] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Interactive Media Vault Menu State (My Photos, My Videos, My Dating Ads)
  const [mediaTab, setMediaTab] = useState<"PHOTOS" | "VIDEOS" | "ADS">("PHOTOS");

  React.useEffect(() => {
    if (tabQuery === "PHOTOS") setMediaTab("PHOTOS");
    else if (tabQuery === "VIDEOS") setMediaTab("VIDEOS");
    else if (tabQuery === "ADS") setMediaTab("ADS");
  }, [tabQuery]);

  // Rich Photo Albums
  const [userPhotoAlbums, setUserPhotoAlbums] = useState<UserPhotoAlbumItem[]>([
    {
      id: "alb-1",
      title: "Monaco Luxury Villa Portfolio",
      description: "Private photography session at our coastal suite.",
      coverUrl: profile.avatarUrl,
      photoCount: 4,
      photos: [
        profile.avatarUrl,
        profile.coverPhotoUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      ],
      monetization: "FREE",
      category: "Man",
      topics: ["Erotic Art", "Details", "Soft Erotica"],
      views: 2910,
      comments: 2,
      likes: 129,
      status: "On web",
      createdAt: "Dec 31, 2025",
      commentsList: [
        {
          id: "c-1",
          authorName: "Elena V.",
          authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          text: "Stunning photography! Love the composition and lighting.",
          createdAt: "2 hours ago",
        },
        {
          id: "c-2",
          authorName: "Marco & Sofia",
          authorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
          text: "Very aesthetic shots, super classy aesthetic.",
          createdAt: "5 hours ago",
        },
      ],
      votersList: [
        {
          id: "v-1",
          name: "Elena V.",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          isVerified: true,
          votedAt: "2 hours ago",
        },
        {
          id: "v-2",
          name: "Marco & Sofia",
          avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80",
          isVerified: true,
          votedAt: "5 hours ago",
        },
        {
          id: "v-3",
          name: "Sophia K.",
          avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
          isVerified: true,
          votedAt: "Yesterday",
        },
      ],
    },
    {
      id: "alb-2",
      title: "French Riviera Yachting & Sunbathing",
      description: "Discreet afternoon photos along the Mediterranean coast.",
      coverUrl: profile.coverPhotoUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      photoCount: 3,
      photos: [
        profile.coverPhotoUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        profile.avatarUrl,
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
      ],
      monetization: "CREDITS",
      creditsPrice: 10,
      category: "Couple",
      topics: ["Outdoor Sex", "Sex in Public", "VIP Lifestyle"],
      views: 4180,
      comments: 1,
      likes: 310,
      status: "On web",
      createdAt: "Oct 15, 2025",
      commentsList: [
        {
          id: "c-3",
          authorName: "Sophia K.",
          authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
          text: "Worth every credit, amazing villa shoot!",
          createdAt: "1 day ago",
        },
      ],
      votersList: [
        {
          id: "v-4",
          name: "Sophia K.",
          avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
          isVerified: true,
          votedAt: "1 day ago",
        },
        {
          id: "v-5",
          name: "Lucas & Mia",
          avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
          isVerified: true,
          votedAt: "3 days ago",
        },
      ],
    },
  ]);

  // Rich Videos List
  const [userVideos, setUserVideos] = useState<UserVideoItem[]>([
    {
      id: "v1",
      title: "Private Riviera Yacht Teaser",
      description: "Exclusive lifestyle footage along the Monte Carlo coastline.",
      duration: "1:20",
      thumbnail: profile.coverPhotoUrl || profile.avatarUrl,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      monetization: "FREE",
      category: "Couple",
      commentPermission: "ANYONE",
      votingPermission: "ANYONE",
      topics: ["VIP Lifestyle", "Outdoor Sex", "Soft Erotica"],
      views: 1290,
      comments: 18,
      likes: 142,
      status: "On web",
      createdAt: "Dec 31, 2025",
    },
    {
      id: "v2",
      title: "Late Night Lounge & Champagne Vault",
      description: "Private moments from our Monaco salon evening.",
      duration: "2:45",
      thumbnail: profile.avatarUrl,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      monetization: "CREDITS",
      creditsPrice: 5,
      category: "Woman",
      commentPermission: "VERIFIED",
      votingPermission: "ANYONE",
      topics: ["VIP Lifestyle", "Fetish", "Details"],
      views: 2410,
      comments: 34,
      likes: 289,
      status: "On web",
      createdAt: "Oct 28, 2025",
    },
  ]);

  // Dating Ads List
  const [userDatingAds, setUserDatingAds] = useState<{ id: string; title: string; category: string; description: string; date: string }[]>([
    {
      id: "ad-1",
      title: "Discreet Fine Dining & Champagne Evening",
      category: "VIP Dining & Lounge",
      description: "Looking for an open-minded, sophisticated partner for private dining in Monte Carlo this Friday.",
      date: "Active • Posted 2 days ago",
    },
    {
      id: "ad-2",
      title: "Weekend Riviera Yacht & Sunbathing",
      category: "Weekend Getaway",
      description: "Seeking a fun, attractive companion to join for a weekend cruise along the Côte d'Azur.",
      date: "Active • Posted 5 days ago",
    },
  ]);

  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const photoUploadRef = React.useRef<HTMLInputElement>(null);
  const videoUploadRef = React.useRef<HTMLInputElement>(null);

  // Amateri-Style Category Publisher Modal State
  const modalFileRef = React.useRef<HTMLInputElement>(null);
  const [modalPreviews, setModalPreviews] = useState<string[]>([]);
  const [uploadingProgress, setUploadingProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string>("");
  const [publisherModalOpen, setPublisherModalOpen] = useState(false);
  const [publisherType, setPublisherType] = useState<"VIDEO" | "ALBUM">("VIDEO");
  const [pubMonetization, setPubMonetization] = useState<"FREE" | "CREDITS">("FREE");
  const [pubCreditsPrice, setPubCreditsPrice] = useState<number>(5);
  const [pubTitle, setPubTitle] = useState("");
  const [pubDescription, setPubDescription] = useState("");
  const [pubCategory, setPubCategory] = useState("Man");
  const [pubCommentSetting, setPubCommentSetting] = useState<"ANYONE" | "VERIFIED" | "NOBODY">("ANYONE");
  const [pubVotingSetting, setPubVotingSetting] = useState<"ANYONE" | "DISABLED">("ANYONE");
  const [pubSelectedTopics, setPubSelectedTopics] = useState<string[]>(["VIP Lifestyle", "Soft erotica"]);

  // Dating Ad Modal State
  const [newAdModalOpen, setNewAdModalOpen] = useState(false);
  const [newAdTitle, setNewAdTitle] = useState("");
  const [newAdCategory, setNewAdCategory] = useState("VIP Lifestyle");
  const [newAdDescription, setNewAdDescription] = useState("");

  // Lightbox Album Viewer State
  const [activeViewerAlbum, setActiveViewerAlbum] = useState<UserPhotoAlbumItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [albumCommentInput, setAlbumCommentInput] = useState("");

  // Editing Media Item State
  const [editingVideoItem, setEditingVideoItem] = useState<UserVideoItem | null>(null);
  const [editingAlbumItem, setEditingAlbumItem] = useState<UserPhotoAlbumItem | null>(null);

  // Member Verification State
  const [getVerifiedModalOpen, setGetVerifiedModalOpen] = useState(false);
  const [userVerificationStatus, setUserVerificationStatus] = useState<"UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED">("UNVERIFIED");

  const handleVerificationSubmitted = (verificationPhotoUrl: string) => {
    setUserVerificationStatus("PENDING_REVIEW");

    userStore.submitVerificationRequest({
      id: `req-${Date.now()}`,
      userId: currentUser?.id || "me",
      userEmail: currentUser?.email || profile.displayName.toLowerCase().replace(/\s+/g, "") + "@intimo.live",
      userName: currentProfile?.displayName || profile.displayName,
      userAvatarUrl: currentProfile?.avatarUrl || profile.avatarUrl,
      verificationPhotoUrl,
      submittedAt: "Just now",
      status: "PENDING",
    });
  };

  // Voters List Modal State
  const [votersModalOpen, setVotersModalOpen] = useState(false);
  const [votersListTarget, setVotersListTarget] = useState<{ title: string; voters: MediaVoter[] } | null>(null);

  // Video Viewer State
  const [activeViewerVideo, setActiveViewerVideo] = useState<UserVideoItem | null>(null);
  const [videoCommentInput, setVideoCommentInput] = useState("");

  const openAlbumViewer = (alb: UserPhotoAlbumItem) => {
    setActiveViewerAlbum(alb);
    setActivePhotoIndex(0);
  };

  const openVideoViewer = (vid: UserVideoItem) => {
    setActiveViewerVideo(vid);
  };

  const handleToggleVideoVisibility = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const nextStatus = v.status === "On web" ? "Disabled" : "On web";
          return { ...v, status: nextStatus };
        }
        return v;
      })
    );
  };

  const handleDeleteVideo = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserVideos((prev) => prev.filter((v) => v.id !== videoId));
  };

  const handleToggleAlbumVisibility = (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserPhotoAlbums((prev) =>
      prev.map((a) => {
        if (a.id === albumId) {
          const nextStatus = a.status === "On web" ? "Disabled" : "On web";
          return { ...a, status: nextStatus };
        }
        return a;
      })
    );
  };

  const handleDeleteAlbum = (albumId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUserPhotoAlbums((prev) => prev.filter((a) => a.id !== albumId));
  };

  const openEditVideoModal = (vid: UserVideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVideoItem(vid);
    setPublisherType("VIDEO");
    setPubTitle(vid.title);
    setPubDescription(vid.description);
    setPubMonetization(vid.monetization);
    setPubCreditsPrice(vid.creditsPrice || 5);
    setPubCategory(vid.category);
    setPubCommentSetting(vid.commentPermission === "NOBODY" ? "NOBODY" : vid.commentPermission === "VERIFIED" ? "VERIFIED" : "ANYONE");
    setPubVotingSetting(vid.votingPermission);
    setPubSelectedTopics(vid.topics || ["VIP Lifestyle"]);
    setPublisherModalOpen(true);
  };

  const openEditAlbumModal = (alb: UserPhotoAlbumItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAlbumItem(alb);
    setPublisherType("ALBUM");
    setPubTitle(alb.title);
    setPubDescription(alb.description);
    setPubMonetization(alb.monetization);
    setPubCreditsPrice(alb.creditsPrice || 10);
    setPubCategory(alb.category);
    setPubSelectedTopics(alb.topics || ["VIP Lifestyle"]);
    setPublisherModalOpen(true);
  };

  const handleToggleAlbumVote = (albumId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setUserPhotoAlbums((prev) =>
      prev.map((alb) => {
        if (alb.id === albumId) {
          const hasVoted = alb.hasUserVoted;
          const newLikes = hasVoted ? alb.likes - 1 : alb.likes + 1;
          const myVoterObj: MediaVoter = {
            id: currentUser?.id || "me",
            name: currentProfile?.displayName || currentUser?.username || "You",
            avatarUrl: currentProfile?.avatarUrl || currentUser?.avatarUrl || profile.avatarUrl,
            isVerified: true,
            votedAt: "Just now",
          };

          const newVoters = hasVoted
            ? (alb.votersList || []).filter((v) => v.id !== (currentUser?.id || "me"))
            : [myVoterObj, ...(alb.votersList || [])];

          const updated = {
            ...alb,
            likes: Math.max(0, newLikes),
            hasUserVoted: !hasVoted,
            votersList: newVoters,
          };

          if (activeViewerAlbum?.id === albumId) {
            setActiveViewerAlbum(updated);
          }

          return updated;
        }
        return alb;
      })
    );
  };

  const openVotersModal = (title: string, voters: MediaVoter[] = [], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVotersListTarget({ title, voters });
    setVotersModalOpen(true);
  };

  const handleAddAlbumComment = () => {
    if (!albumCommentInput.trim() || !activeViewerAlbum) return;

    const newComment: MediaComment = {
      id: `c-${Date.now()}`,
      authorName: currentProfile?.displayName || currentUser?.username || "Verified Member",
      authorAvatar: currentProfile?.avatarUrl || currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      text: albumCommentInput.trim(),
      createdAt: "Just now",
    };

    const updatedAlbum: UserPhotoAlbumItem = {
      ...activeViewerAlbum,
      comments: activeViewerAlbum.comments + 1,
      commentsList: [newComment, ...(activeViewerAlbum.commentsList || [])],
    };

    setActiveViewerAlbum(updatedAlbum);
    setUserPhotoAlbums((prev) => prev.map((a) => (a.id === updatedAlbum.id ? updatedAlbum : a)));
    setAlbumCommentInput("");
  };

  const handleModalFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const targetFolder = publisherType === "VIDEO" ? "videos" : "photos";

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setUploadingFileName(file.name);
        setUploadingProgress(5);

        try {
          const result = await uploadFileToR2(file, targetFolder, (percent) => {
            setUploadingProgress(percent);
          });
          setModalPreviews((prev) => [...prev, result.publicUrl]);
        } catch (err: any) {
          console.error("Cloudflare R2 Direct Upload Error:", err);
        } finally {
          setUploadingProgress(null);
          setUploadingFileName("");
        }
      }
    }
  };

  const removeModalPreview = (index: number) => {
    setModalPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTopic = (topic: string) => {
    if (pubSelectedTopics.includes(topic)) {
      setPubSelectedTopics(pubSelectedTopics.filter((t) => t !== topic));
    } else {
      setPubSelectedTopics([...pubSelectedTopics, topic]);
    }
  };

  const handlePublishMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim()) return;

    if (publisherType === "VIDEO") {
      if (editingVideoItem) {
        setUserVideos((prev) =>
          prev.map((v) =>
            v.id === editingVideoItem.id
              ? {
                  ...v,
                  title: pubTitle,
                  description: pubDescription,
                  thumbnail: modalPreviews[0] || v.thumbnail,
                  monetization: pubMonetization,
                  creditsPrice: pubMonetization === "CREDITS" ? pubCreditsPrice : undefined,
                  category: pubCategory,
                  commentPermission: pubCommentSetting,
                  votingPermission: pubVotingSetting,
                  topics: pubSelectedTopics.length > 0 ? pubSelectedTopics : v.topics,
                }
              : v
          )
        );
      } else {
        const newVideo: UserVideoItem = {
          id: `vid-${Date.now()}`,
          title: pubTitle,
          description: pubDescription || "Verified member video upload.",
          duration: "1:30",
          thumbnail: modalPreviews[0] || profile.avatarUrl,
          videoUrl: modalPreviews[0] || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          monetization: pubMonetization,
          creditsPrice: pubMonetization === "CREDITS" ? pubCreditsPrice : undefined,
          category: pubCategory,
          commentPermission: pubCommentSetting,
          votingPermission: pubVotingSetting,
          topics: pubSelectedTopics.length > 0 ? pubSelectedTopics : ["VIP Lifestyle"],
          views: 1,
          comments: 0,
          likes: 0,
          status: "On web",
          createdAt: "Just now",
        };
        setUserVideos([newVideo, ...userVideos]);
      }
    } else {
      if (editingAlbumItem) {
        setUserPhotoAlbums((prev) =>
          prev.map((a) =>
            a.id === editingAlbumItem.id
              ? {
                  ...a,
                  title: pubTitle,
                  description: pubDescription,
                  coverUrl: modalPreviews[0] || a.coverUrl,
                  photos: modalPreviews.length > 0 ? modalPreviews : a.photos,
                  photoCount: modalPreviews.length > 0 ? modalPreviews.length : a.photoCount,
                  monetization: pubMonetization,
                  creditsPrice: pubMonetization === "CREDITS" ? pubCreditsPrice : undefined,
                  category: pubCategory,
                  topics: pubSelectedTopics.length > 0 ? pubSelectedTopics : a.topics,
                }
              : a
          )
        );
      } else {
        const newAlbum: UserPhotoAlbumItem = {
          id: `alb-${Date.now()}`,
          title: pubTitle,
          description: pubDescription || "Verified member photo album.",
          coverUrl: modalPreviews[0] || profile.avatarUrl,
          photoCount: modalPreviews.length > 0 ? modalPreviews.length : 1,
          photos: modalPreviews.length > 0 ? modalPreviews : [profile.avatarUrl],
          monetization: pubMonetization,
          creditsPrice: pubMonetization === "CREDITS" ? pubCreditsPrice : undefined,
          category: pubCategory,
          topics: pubSelectedTopics.length > 0 ? pubSelectedTopics : ["VIP Lifestyle"],
          views: 1,
          comments: 0,
          likes: 0,
          status: "On web",
          createdAt: "Just now",
        };
        setUserPhotoAlbums([newAlbum, ...userPhotoAlbums]);
      }
    }

    setPubTitle("");
    setPubDescription("");
    setModalPreviews([]);
    setEditingVideoItem(null);
    setEditingAlbumItem(null);
    setPublisherModalOpen(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            const newAlbum: UserPhotoAlbumItem = {
              id: `alb-${Date.now()}`,
              title: file.name.replace(/\.[^/.]+$/, "") || "New Photo Album",
              description: "Uploaded photo collection",
              coverUrl: reader.result as string,
              photoCount: 1,
              monetization: "FREE",
              category: "Man",
              topics: ["VIP Lifestyle"],
              views: 1,
              comments: 0,
              likes: 0,
              status: "On web",
              createdAt: "Just now",
            };
            setUserPhotoAlbums((prev) => [newAlbum, ...prev]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const newVideo: UserVideoItem = {
            id: `vid-${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ""),
            description: "Uploaded video clip",
            duration: "0:30",
            thumbnail: profile.avatarUrl,
            monetization: "FREE",
            category: "Man",
            commentPermission: "ANYONE",
            votingPermission: "ANYONE",
            topics: ["VIP Lifestyle"],
            views: 1,
            comments: 0,
            likes: 0,
            status: "On web",
            createdAt: "Just now",
          };
          setUserVideos((prev) => [newVideo, ...prev]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdTitle.trim() || !newAdDescription.trim()) return;

    const newAd = {
      id: `ad-${Date.now()}`,
      title: newAdTitle,
      category: newAdCategory,
      description: newAdDescription,
      date: "Active • Posted just now",
    };

    setUserDatingAds((prev) => [newAd, ...prev]);
    setNewAdTitle("");
    setNewAdDescription("");
    setNewAdModalOpen(false);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser && currentProfile) {
      const file = e.target.files[0];
      try {
        setUploadingProgress(10);
        setUploadingFileName("Avatar Photo");
        const result = await uploadFileToR2(file, "avatars", (percent) => setUploadingProgress(percent));
        const updatedUser = { ...currentUser, avatarUrl: result.publicUrl };
        const updatedProfile = { ...currentProfile, avatarUrl: result.publicUrl };
        updateUserProfile(updatedUser, updatedProfile);
      } catch (err) {
        console.error("Cloudflare R2 Avatar Upload Error:", err);
      } finally {
        setUploadingProgress(null);
        setUploadingFileName("");
      }
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser && currentProfile) {
      const file = e.target.files[0];
      try {
        setUploadingProgress(10);
        setUploadingFileName("Cover Photo");
        const result = await uploadFileToR2(file, "covers", (percent) => setUploadingProgress(percent));
        const updatedProfile = { ...currentProfile, coverPhotoUrl: result.publicUrl };
        updateUserProfile(currentUser, updatedProfile);
      } catch (err) {
        console.error("Cloudflare R2 Cover Upload Error:", err);
      } finally {
        setUploadingProgress(null);
        setUploadingFileName("");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Hidden File Inputs for Interactive Photo Uploads */}
      <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarSelect} />
      <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={handleCoverSelect} />

      {/* Immersive Cover Header */}
      <Card variant="goldBorder" className="p-0 overflow-hidden text-left relative bg-gold-card">
        <div className="h-80 w-full bg-velora-card relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.coverPhotoUrl || profile.avatarUrl}
            alt={profile.displayName}
            className="w-full h-full object-cover filter contrast-110 saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/60 to-transparent" />

          {isSelf && (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 z-20 px-3.5 py-2 rounded-full bg-black/70 border border-white/20 text-white text-xs font-semibold hover:bg-black/90 transition-all flex items-center gap-2 backdrop-blur-md shadow-2xl hover:scale-105"
              title="Upload New Cover Banner"
            >
              <Camera className="w-4 h-4 text-velora-gold" />
              <span>Change Cover Banner</span>
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6 -mt-24 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-4 border-velora-gold overflow-hidden bg-velora-card shrink-0 shadow-2xl relative group cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />

                {isSelf && (
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 backdrop-blur-xs"
                    title="Upload New Avatar Photo"
                  >
                    <Camera className="w-6 h-6 text-velora-gold animate-bounce" />
                    <span>Change Photo</span>
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-serif font-bold text-white">{profile.displayName}, {profile.age}</h1>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-xs text-velora-gold font-medium flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {profile.location} • Level 3 Biometric Verified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`p-3 rounded-full glass-panel transition-all ${
                  isFavorited ? "text-rose-400 border-rose-500/40 bg-rose-500/10" : "text-velora-textSecondary hover:text-velora-gold"
                }`}
                title="Favorite Profile"
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-rose-400" : ""}`} />
              </button>

              {isSelf ? (
                <div className="flex items-center gap-2">
                  {userVerificationStatus === "PENDING_REVIEW" ? (
                    <span className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" /> Verification In Review ⏳
                    </span>
                  ) : userVerificationStatus === "VERIFIED" ? (
                    <span className="px-3.5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Biometric Verified
                    </span>
                  ) : (
                    <Button
                      variant="gold"
                      size="lg"
                      onClick={() => setGetVerifiedModalOpen(true)}
                      className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> GET VERIFIED
                    </Button>
                  )}

                  <Link href="/settings">
                    <Button variant="glass" size="lg" className="text-xs font-bold uppercase tracking-wider gap-2 border-white/20">
                      <UserCheck className="w-4 h-4" /> Edit Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href="/messages">
                  <Button variant="gold" size="lg" className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow">
                    <MessageSquare className="w-4 h-4" /> Send Private Message
                  </Button>
                </Link>
              )}

              <Button
                variant="glass"
                size="lg"
                className="text-xs font-bold uppercase tracking-wider gap-2 border-white/20 hover:border-red-500/50 hover:text-red-400"
                onClick={() => logout()}
                title="Sign Out of Account"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6 font-mono text-velora-textSecondary">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active Online
              </span>
            </div>

            <button
              onClick={() => setReportModalOpen(true)}
              className="text-[11px] text-velora-textMuted hover:text-red-400 transition-colors"
            >
              Report Profile
            </button>
          </div>
        </div>
      </Card>

      {/* Grid: Main Content (MY MEDIA & DATING SETTINGS in CENTER) & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CENTER / MAIN CONTENT (lg:col-span-2): MY MEDIA & DATING SETTINGS */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="goldBorder" className="p-6 sm:p-8 space-y-6 text-left bg-gold-card shadow-2xl">
            {/* Hidden Inputs for Media Uploads */}
            <input type="file" ref={photoUploadRef} accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            <input type="file" ref={videoUploadRef} accept="video/*" className="hidden" onChange={handleVideoUpload} />

            {/* Header Title & Count */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-velora-gold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-velora-gold" /> MY MEDIA & DATING SETTINGS
              </h3>
              <span className="text-xs text-velora-textMuted font-mono font-bold bg-black/40 px-3 py-1 rounded-full border border-white/10">
                {mediaTab === "PHOTOS" ? `${userPhotoAlbums.length} Albums` : mediaTab === "VIDEOS" ? `${userVideos.length} Videos` : `${userDatingAds.length} Active Ads`}
              </span>
            </div>

            {/* Navigation Menu Tabs */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMediaTab("PHOTOS")}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mediaTab === "PHOTOS" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm font-bold" : "text-velora-textMuted hover:text-white"
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Photos ({userPhotoAlbums.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaTab("VIDEOS")}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mediaTab === "VIDEOS" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm font-bold" : "text-velora-textMuted hover:text-white"
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Videos ({userVideos.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaTab("ADS")}
                className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  mediaTab === "ADS" ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm font-bold" : "text-velora-textMuted hover:text-white"
                }`}
              >
                <Megaphone className="w-4 h-4" />
                <span>Dating Ads ({userDatingAds.length})</span>
              </button>
            </div>

            {/* TAB 1: MY PHOTOS */}
            {mediaTab === "PHOTOS" && (
              <div className="space-y-5">
                {isSelf && (
                  <Button
                    variant="glass"
                    size="lg"
                    onClick={() => {
                      setPublisherType("ALBUM");
                      setPublisherModalOpen(true);
                    }}
                    className="w-full text-xs font-bold uppercase tracking-wider gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-400/10 shadow-gold-glow"
                  >
                    <Plus className="w-4 h-4 text-velora-gold" /> + Create Photo Album & Categories
                  </Button>
                )}

                {/* BIG Photo Album Thumbnails 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {userPhotoAlbums.map((alb) => (
                    <div
                      key={alb.id}
                      onClick={() => openAlbumViewer(alb)}
                      className="rounded-3xl bg-velora-card overflow-hidden border border-white/10 shadow-xl group hover:border-amber-400/60 transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                    >
                      {/* Big Album Thumbnail */}
                      <div className="h-48 sm:h-56 w-full bg-black relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={alb.coverUrl} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-black/30 to-transparent" />

                        {/* Hidden Overlay when status === Disabled */}
                        {alb.status === "Disabled" && (
                          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 z-20">
                            <EyeOff className="w-8 h-8 text-amber-400" />
                            <span className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider">HIDDEN FROM PUBLIC VIEW</span>
                            <p className="text-[10px] text-velora-textMuted">Only visible to you in your manager</p>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md ${
                            alb.status === "On web" ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40" : "bg-red-500/30 text-red-300 border border-red-500/40"
                          }`}>
                            {alb.status === "Disabled" ? "Hidden" : alb.status}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-black/60 text-white border border-white/20 backdrop-blur-md">
                            {alb.category}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3 z-10">
                          {alb.monetization === "CREDITS" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-400/30 text-amber-300 border border-amber-400/40 backdrop-blur-md flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-300" /> {alb.creditsPrice || 10} Credits
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                              Free Album
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-left z-10">
                          <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">{alb.title}</h4>
                          <p className="text-[11px] text-velora-textMuted line-clamp-1">{alb.description}</p>
                        </div>
                      </div>

                      {/* Album Footer Metrics & Topics */}
                      <div className="p-3.5 space-y-2.5 text-xs bg-white/5">
                        <div className="flex items-center justify-between text-[11px] text-velora-textMuted font-mono">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-velora-gold" /> {alb.views} Views</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> {alb.comments} Comments</span>
                          <button
                            type="button"
                            onClick={(e) => openVotersModal(alb.title, alb.votersList, e)}
                            className="flex items-center gap-1 text-emerald-400 font-bold hover:underline hover:text-amber-300 transition-colors"
                            title="Click to see list of people who liked this album"
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${alb.hasUserVoted ? "fill-emerald-400" : ""}`} /> {alb.likes} Likes
                          </button>
                        </div>

                        {/* Searchable Topics & Interactive Thumbs Up Vote Button */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <div className="flex flex-wrap gap-1">
                            {alb.topics.map((topic) => (
                              <span key={topic} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-amber-300 border border-amber-400/20">
                                #{topic}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleToggleAlbumVote(alb.id, e)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 shrink-0 ${
                              alb.hasUserVoted
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                                : "bg-white/5 text-velora-textMuted hover:text-white border border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${alb.hasUserVoted ? "fill-emerald-300" : ""}`} /> {alb.hasUserVoted ? "Liked" : "Like"}
                          </button>
                        </div>
                      </div>

                      {/* Owner Actions Toolbar (Hide/Show, Edit, Delete) */}
                      {isSelf && (
                        <div className="p-2 bg-black/60 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleAlbumVisibility(alb.id, e)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                              alb.status === "Disabled"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : "bg-white/5 text-velora-textMuted hover:text-white border border-white/10"
                            }`}
                            title={alb.status === "Disabled" ? "Make album visible on web" : "Hide album completely from members"}
                          >
                            {alb.status === "Disabled" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{alb.status === "Disabled" ? "Show Album" : "Hide Album"}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => openEditAlbumModal(alb, e)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/5 text-amber-300 hover:bg-amber-400/20 border border-white/10 flex items-center gap-1 transition-colors"
                              title="Edit album title, categories & tags"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteAlbum(alb.id, e)}
                              className="p-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                              title="Delete album"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: MY VIDEOS */}
            {mediaTab === "VIDEOS" && (
              <div className="space-y-5">
                {isSelf && (
                  <Button
                    variant="glass"
                    size="lg"
                    onClick={() => {
                      setPublisherType("VIDEO");
                      setPublisherModalOpen(true);
                    }}
                    className="w-full text-xs font-bold uppercase tracking-wider gap-2 border-amber-500/30 text-amber-300 hover:bg-amber-400/10 shadow-gold-glow"
                  >
                    <Plus className="w-4 h-4 text-velora-gold" /> + Post Video Clip & Categories
                  </Button>
                )}

                {/* BIG Video Thumbnails 2-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {userVideos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => openVideoViewer(vid)}
                      className="rounded-3xl bg-velora-card overflow-hidden border border-white/10 shadow-xl group hover:border-amber-400/60 transition-all cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                    >
                      {/* Big Video Cover Thumbnail */}
                      <div className="h-48 sm:h-56 w-full bg-black relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-black/40 to-transparent" />

                        {/* Hidden Overlay when status === Disabled */}
                        {vid.status === "Disabled" && (
                          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 z-20">
                            <EyeOff className="w-8 h-8 text-amber-400" />
                            <span className="text-xs font-bold text-amber-300 uppercase font-mono tracking-wider">HIDDEN FROM PUBLIC VIEW</span>
                            <p className="text-[10px] text-velora-textMuted">Only visible to you in your manager</p>
                          </div>
                        )}

                        {/* Play Icon Center Button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-amber-400/90 text-black flex items-center justify-center shadow-gold-glow group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 fill-black ml-1" />
                          </div>
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase backdrop-blur-md ${
                            vid.status === "On web" ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40" : "bg-red-500/30 text-red-300 border border-red-500/40"
                          }`}>
                            {vid.status === "Disabled" ? "Hidden" : vid.status}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-black/60 text-white border border-white/20 backdrop-blur-md">
                            {vid.category}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3 z-10">
                          {vid.monetization === "CREDITS" ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-400/30 text-amber-300 border border-amber-400/40 backdrop-blur-md flex items-center gap-1">
                              <Coins className="w-3 h-3 text-amber-300" /> {vid.creditsPrice || 5} Credits
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                              Free Video
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-left z-10">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">{vid.title}</h4>
                            <span className="text-[10px] text-amber-300 font-mono font-bold bg-black/60 px-2 py-0.5 rounded-md border border-white/10">
                              {vid.duration}
                            </span>
                          </div>
                          <p className="text-[11px] text-velora-textMuted line-clamp-1 mt-0.5">{vid.description}</p>
                        </div>
                      </div>

                      {/* Video Footer Metrics & Searchable Topics */}
                      <div className="p-3.5 space-y-2.5 text-xs bg-white/5">
                        <div className="flex items-center justify-between text-[11px] text-velora-textMuted font-mono">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-velora-gold" /> {vid.views} Views</span>
                          <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-blue-400" /> {vid.comments} Comments</span>
                          <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {vid.likes} Likes</span>
                        </div>

                        {/* Searchable Topics */}
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                          {vid.topics.map((topic) => (
                            <span key={topic} className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 text-amber-300 border border-amber-400/20">
                              #{topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Owner Actions Toolbar (Hide/Show, Edit, Delete) */}
                      {isSelf && (
                        <div className="p-2 bg-black/60 border-t border-white/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleToggleVideoVisibility(vid.id, e)}
                            className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                              vid.status === "Disabled"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                                : "bg-white/5 text-velora-textMuted hover:text-white border border-white/10"
                            }`}
                            title={vid.status === "Disabled" ? "Make video visible on web" : "Hide video completely from members"}
                          >
                            {vid.status === "Disabled" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{vid.status === "Disabled" ? "Show Video" : "Hide Video"}</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => openEditVideoModal(vid, e)}
                              className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/5 text-amber-300 hover:bg-amber-400/20 border border-white/10 flex items-center gap-1 transition-colors"
                              title="Edit video title, category & monetization"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleDeleteVideo(vid.id, e)}
                              className="p-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
                              title="Delete video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MY DATING ADS */}
            {mediaTab === "ADS" && (
              <div className="space-y-5">
                {isSelf && (
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => setNewAdModalOpen(true)}
                    className="w-full text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow"
                  >
                    <Plus className="w-4 h-4" /> + Post New Dating Ad
                  </Button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userDatingAds.map((ad) => (
                    <div key={ad.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-left hover:border-amber-400/40 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {ad.category}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">{ad.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{ad.title}</h4>
                      <p className="text-xs text-velora-textSecondary leading-relaxed">{ad.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT SIDEBAR (lg:col-span-1): About Me & Open Desires & Intimate Preferences */}
        <div className="lg:col-span-1 space-y-6">
          <Card variant="glass" className="p-6 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted font-mono">
              Invitation Into {profile.displayName}'s World
            </h3>

            {profile.headline && (
              <h2 className="text-base font-serif font-bold text-velora-gold italic">
                "{profile.headline}"
              </h2>
            )}

            <p className="text-xs text-velora-textSecondary leading-relaxed whitespace-pre-line">
              {profile.bio}
            </p>
          </Card>

          <Card variant="glass" className="p-6 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted font-mono">
              Open Connections & Desires
            </h3>

            <div className="flex flex-wrap gap-2 pt-1">
              {profile.lookingFor.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-velora-textPrimary border border-white/10"
                >
                  {item}
                </span>
              ))}
            </div>
          </Card>

          {/* Intimate Preferences & Sex Hobbies */}
          {(profile.sexHobbies || profile.erogenousZones || profile.favouriteSexPlaces || profile.favouriteSexPositions || profile.pubicHairGrooming) && (
            <Card variant="goldBorder" className="p-6 space-y-4 text-left bg-gold-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" /> Intimate Preferences & Kinks
              </h3>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-center text-xs font-mono">
                <div>
                  <span className="block text-[9px] text-velora-textMuted uppercase">Grooming</span>
                  <span className="font-bold text-amber-300 text-[11px]">{profile.pubicHairGrooming || "Unspecified"}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-velora-textMuted uppercase">Piercing</span>
                  <span className="font-bold text-amber-300 text-[11px]">{profile.piercing || "Unspecified"}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-velora-textMuted uppercase">Tattoo</span>
                  <span className="font-bold text-amber-300 text-[11px]">{profile.tattoo || "Unspecified"}</span>
                </div>
              </div>

              {profile.sexHobbies && profile.sexHobbies.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-velora-textMuted uppercase block">Sex Hobbies & Fetishes</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.sexHobbies.map((hobby) => (
                      <span key={hobby} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        {hobby}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.erogenousZones && profile.erogenousZones.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-velora-textMuted uppercase block">Erogenous Zones</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.erogenousZones.map((zone) => (
                      <span key={zone} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-velora-textPrimary border border-white/10">
                        {zone}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.favouriteSexPlaces && profile.favouriteSexPlaces.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-velora-textMuted uppercase block">Favourite Places</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.favouriteSexPlaces.map((place) => (
                      <span key={place} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-velora-textPrimary border border-white/10">
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.favouriteSexPositions && profile.favouriteSexPositions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-velora-textMuted uppercase block">Favourite Positions</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.favouriteSexPositions.map((pos) => (
                      <span key={pos} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/5 text-velora-textPrimary border border-white/10">
                        {pos}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Amateri-Style Category & Media Publisher Modal */}
      {publisherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
          <Card variant="goldBorder" className="w-full max-w-2xl p-6 sm:p-8 space-y-6 text-left bg-velora-card relative shadow-2xl my-8">
            <button
              onClick={() => setPublisherModalOpen(false)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-velora-gold" />
                <h2 className="text-xl font-serif font-bold text-white">
                  {editingVideoItem
                    ? "Edit Video Clip & Settings"
                    : editingAlbumItem
                    ? "Edit Photo Album & Settings"
                    : `Publish New ${publisherType === "VIDEO" ? "Video Clip" : "Photo Album"}`}
                </h2>
              </div>
              <p className="text-xs text-velora-textMuted">
                Configure monetization, target audience category, comment settings, and searchable topics.
              </p>
            </div>

            <form onSubmit={handlePublishMedia} className="space-y-6">
              {/* Hidden Input for Modal File Selection */}
              <input
                type="file"
                ref={modalFileRef}
                accept={publisherType === "VIDEO" ? "video/*" : "image/*"}
                multiple
                className="hidden"
                onChange={handleModalFilesSelect}
              />

              {/* Interactive Photo/Video Upload Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-velora-textSecondary">
                    {publisherType === "VIDEO" ? "Upload Video File" : "Upload Album Photos"}
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    ⚡ Cloudflare R2 Direct Uploads Active
                  </span>
                </div>

                {/* Live Cloudflare R2 Upload Progress Indicator */}
                {uploadingProgress !== null && (
                  <div className="p-3.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 space-y-2 text-left">
                    <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                        Direct R2 Uploading: {uploadingFileName || "file"}...
                      </span>
                      <span className="font-mono font-bold text-amber-400">{uploadingProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                        style={{ width: `${uploadingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div
                  onClick={() => modalFileRef.current?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-velora-gold/40 bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-center group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Click or drag files to add to album</p>
                    <p className="text-[11px] text-velora-textMuted mt-0.5">Select multiple photos or video clips at once.</p>
                  </div>
                  <Button type="button" variant="gold" size="sm" className="text-xs font-bold gap-1 mt-1">
                    <Plus className="w-3.5 h-3.5" /> Browse Photos & Videos
                  </Button>
                </div>

                {/* Real-time Photo Preview Grid */}
                {modalPreviews.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-amber-300 font-mono">
                      {modalPreviews.length} Photo{modalPreviews.length > 1 ? "s" : ""} Selected:
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-black/40 border border-white/10">
                      {modalPreviews.map((src, idx) => (
                        <div key={idx} className="h-16 rounded-xl bg-velora-card relative overflow-hidden group border border-white/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeModalPreview(idx);
                            }}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/80 text-white hover:bg-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 text-[8px] font-bold bg-amber-400 text-black text-center uppercase">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Type Selector (Free vs For Credits) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-velora-textSecondary">
                  Monetization Model & Access
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPubMonetization("FREE")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      pubMonetization === "FREE" ? "border-emerald-500 bg-emerald-500/10 text-white" : "border-white/10 bg-white/5 text-velora-textMuted hover:text-white"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-400 flex items-center justify-center">
                      {pubMonetization === "FREE" && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{publisherType === "VIDEO" ? "Video - Free" : "Album - Free"}</p>
                      <p className="text-[10px] opacity-75">Public for all verified members</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPubMonetization("CREDITS")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      pubMonetization === "CREDITS" ? "border-amber-400 bg-amber-400/10 text-white" : "border-white/10 bg-white/5 text-velora-textMuted hover:text-white"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
                      {pubMonetization === "CREDITS" && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold flex items-center gap-1">
                        {publisherType === "VIDEO" ? "Video - For Credits" : "Album - For Credits"} <Coins className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      </p>
                      <p className="text-[10px] opacity-75">Requires credit unlock</p>
                    </div>
                  </button>
                </div>
              </div>

              {pubMonetization === "CREDITS" && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-velora-textSecondary">Unlock Credit Price (Coins)</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={pubCreditsPrice}
                    onChange={(e) => setPubCreditsPrice(Number(e.target.value))}
                    className="w-full text-xs font-mono"
                  />
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-velora-textSecondary mb-1">Title</label>
                  <Input
                    type="text"
                    value={pubTitle}
                    onChange={(e) => setPubTitle(e.target.value)}
                    placeholder="e.g. Monaco Yachting & Private Evening"
                    className="w-full text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-velora-textSecondary mb-1">Description</label>
                  <textarea
                    value={pubDescription}
                    onChange={(e) => setPubDescription(e.target.value)}
                    rows={3}
                    placeholder="Detailed description..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-velora-gold resize-none"
                  />
                  <div className="mt-1.5 p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-2 text-[11px] text-amber-300">
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                    <span><strong>Attract up to +25% more visitors:</strong> Interesting title and detailed description increase discoverability across membership search.</span>
                  </div>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-velora-textSecondary mb-1.5">
                  Category (Select who appears in content)
                </label>
                <select
                  value={pubCategory}
                  onChange={(e) => setPubCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-velora-gold font-medium"
                >
                  <option value="Man" className="bg-velora-card">Man</option>
                  <option value="Woman" className="bg-velora-card">Woman</option>
                  <option value="Couple" className="bg-velora-card">Couple</option>
                  <option value="Trans" className="bg-velora-card">Trans</option>
                  <option value="Group" className="bg-velora-card">Group</option>
                </select>
              </div>

              {/* Comment & Voting Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <label className="block text-xs font-bold text-velora-textSecondary mb-2">Comment Settings</label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 text-velora-textMuted cursor-pointer hover:text-white">
                      <input
                        type="radio"
                        name="comments"
                        checked={pubCommentSetting === "ANYONE"}
                        onChange={() => setPubCommentSetting("ANYONE")}
                        className="accent-amber-400"
                      />
                      <span>Anyone can write comments</span>
                    </label>
                    <label className="flex items-center gap-2 text-velora-textMuted cursor-pointer hover:text-white">
                      <input
                        type="radio"
                        name="comments"
                        checked={pubCommentSetting === "VERIFIED"}
                        onChange={() => setPubCommentSetting("VERIFIED")}
                        className="accent-amber-400"
                      />
                      <span>Only verified users can comment</span>
                    </label>
                    <label className="flex items-center gap-2 text-velora-textMuted cursor-pointer hover:text-white">
                      <input
                        type="radio"
                        name="comments"
                        checked={pubCommentSetting === "NOBODY"}
                        onChange={() => setPubCommentSetting("NOBODY")}
                        className="accent-amber-400"
                      />
                      <span>Nobody can comment</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-velora-textSecondary mb-2">Voting Settings</label>
                  <div className="space-y-1.5 text-xs">
                    <label className="flex items-center gap-2 text-velora-textMuted cursor-pointer hover:text-white">
                      <input
                        type="radio"
                        name="voting"
                        checked={pubVotingSetting === "ANYONE"}
                        onChange={() => setPubVotingSetting("ANYONE")}
                        className="accent-amber-400"
                      />
                      <span>Anyone can vote</span>
                    </label>
                    <label className="flex items-center gap-2 text-velora-textMuted cursor-pointer hover:text-white">
                      <input
                        type="radio"
                        name="voting"
                        checked={pubVotingSetting === "DISABLED"}
                        onChange={() => setPubVotingSetting("DISABLED")}
                        className="accent-amber-400"
                      />
                      <span>Voting is disabled</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Searchable Topics Checkboxes Grid */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-velora-gold flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-velora-gold" /> Searchable Topics (Select all topics that match content)
                </label>
                <p className="text-[11px] text-velora-textMuted">These tags allow your media to be searched by members across discovery filters.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-white/5 border border-white/10">
                  {AMATERI_TOPICS.map((topic) => {
                    const selected = pubSelectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`p-2 rounded-lg text-[11px] font-semibold text-left border transition-all flex items-center justify-between ${
                          selected
                            ? "bg-amber-400/20 border-amber-400 text-amber-300 font-bold"
                            : "bg-white/5 border-white/5 text-velora-textMuted hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <span className="truncate">{topic}</span>
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <Button variant="glass" size="lg" type="button" onClick={() => setPublisherModalOpen(false)} className="w-1/3 text-xs">
                  Cancel
                </Button>
                <Button variant="gold" size="lg" type="submit" className="w-2/3 text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                  {editingVideoItem || editingAlbumItem ? "Save Changes" : "Publish Content & Category Tags"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Post Dating Ad Modal */}
      {newAdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-5 text-left bg-velora-card relative shadow-2xl">
            <button
              onClick={() => setNewAdModalOpen(false)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-velora-gold" /> Post Personal Dating Ad
              </h3>
              <p className="text-xs text-velora-textMuted">Publish an intimate announcement or lifestyle connection request.</p>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-velora-textSecondary mb-1.5">Ad Title / Headline</label>
                <Input
                  type="text"
                  value={newAdTitle}
                  onChange={(e) => setNewAdTitle(e.target.value)}
                  placeholder="e.g. Seeking Gala Partner for Monaco Weekend"
                  className="w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-velora-textSecondary mb-1.5">Category</label>
                <select
                  value={newAdCategory}
                  onChange={(e) => setNewAdCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-velora-gold"
                >
                  <option value="VIP Lifestyle" className="bg-velora-card">VIP Lifestyle & Events</option>
                  <option value="VIP Dining & Lounge" className="bg-velora-card">VIP Dining & Lounge</option>
                  <option value="Weekend Getaway" className="bg-velora-card">Weekend Getaway</option>
                  <option value="Discreet Romance" className="bg-velora-card">Discreet Romance</option>
                  <option value="Couples Experience" className="bg-velora-card">Couples Experience</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-velora-textSecondary mb-1.5">Description & Desires</label>
                <textarea
                  value={newAdDescription}
                  onChange={(e) => setNewAdDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your ideal partner, location, expectations, and chemistry..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-velora-gold resize-none"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="glass" size="sm" type="button" onClick={() => setNewAdModalOpen(false)} className="w-1/2 text-xs">
                  Cancel
                </Button>
                <Button variant="gold" size="sm" type="submit" className="w-1/2 text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                  Publish Ad
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Interactive Photo Album Lightbox Viewer Modal */}
      {activeViewerAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
          <div className="w-full max-w-5xl bg-velora-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative my-auto flex flex-col max-h-[90vh]">
            {/* Header Bar */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    {activeViewerAlbum.title}
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {activeViewerAlbum.category}
                    </span>
                  </h3>
                  <p className="text-xs text-velora-textMuted flex items-center gap-2">
                    <span>By {profile.displayName}</span> • <span>{activeViewerAlbum.photos?.length || activeViewerAlbum.photoCount} Photos</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeViewerAlbum.monetization === "CREDITS" ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {activeViewerAlbum.creditsPrice || 10} Credits
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Free Access
                  </span>
                )}
                <button
                  onClick={() => setActiveViewerAlbum(null)}
                  className="p-2 rounded-full text-velora-textMuted hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Stage: Photo Lightbox Preview */}
            <div className="flex-1 bg-black relative flex items-center justify-center min-h-[350px] sm:min-h-[480px] p-4 group">
              {/* Main Photo Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  (activeViewerAlbum.photos && activeViewerAlbum.photos[activePhotoIndex]) ||
                  activeViewerAlbum.coverUrl
                }
                alt={activeViewerAlbum.title}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-300"
              />

              {/* Prev / Next Navigation Arrows */}
              {activeViewerAlbum.photos && activeViewerAlbum.photos.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActivePhotoIndex((prev) =>
                        prev === 0 ? activeViewerAlbum.photos!.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-4 p-3 rounded-full bg-black/60 text-white hover:bg-amber-400 hover:text-black border border-white/20 transition-all shadow-xl"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={() =>
                      setActivePhotoIndex((prev) =>
                        prev === activeViewerAlbum.photos!.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-4 p-3 rounded-full bg-black/60 text-white hover:bg-amber-400 hover:text-black border border-white/20 transition-all shadow-xl"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Counter Badge */}
              <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/80 text-amber-300 font-mono text-xs border border-white/20">
                Photo {activePhotoIndex + 1} of {activeViewerAlbum.photos?.length || 1}
              </div>
            </div>

            {/* Thumbnails Carousel Strip */}
            {activeViewerAlbum.photos && activeViewerAlbum.photos.length > 1 && (
              <div className="p-3 bg-black/60 border-t border-white/10 flex items-center justify-center gap-2 overflow-x-auto">
                {activeViewerAlbum.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      i === activePhotoIndex ? "border-amber-400 scale-105 shadow-gold-glow" : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Footer Metadata & Interactive Comments Section */}
            <div className="p-5 bg-velora-card border-t border-white/10 space-y-4 text-left max-h-[35vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-velora-textMuted font-mono">
                <span className="text-white font-semibold">{activeViewerAlbum.description}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-amber-400" /> {activeViewerAlbum.views} Views</span>
                  <span className="flex items-center gap-1"><MessageSquare className="w-4 h-4 text-blue-400" /> {activeViewerAlbum.comments} Comments</span>
                  <button
                    type="button"
                    onClick={(e) => openVotersModal(activeViewerAlbum.title, activeViewerAlbum.votersList, e)}
                    className="flex items-center gap-1 text-emerald-400 font-bold hover:underline hover:text-amber-300 transition-colors"
                    title="Click to view list of members who liked this album"
                  >
                    <ThumbsUp className={`w-4 h-4 ${activeViewerAlbum.hasUserVoted ? "fill-emerald-400" : ""}`} /> {activeViewerAlbum.likes} Likes
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleToggleAlbumVote(activeViewerAlbum.id, e)}
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                      activeViewerAlbum.hasUserVoted
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                        : "bg-white/5 text-velora-textMuted hover:text-white border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${activeViewerAlbum.hasUserVoted ? "fill-emerald-300" : ""}`} />
                    {activeViewerAlbum.hasUserVoted ? "Liked" : "Thumbs Up"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1 border-b border-white/10 pb-3">
                {activeViewerAlbum.topics.map((t) => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 text-amber-300 border border-amber-400/30">
                    #{t}
                  </span>
                ))}
              </div>

              {/* Interactive Member Comments Header & Form */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-velora-gold flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-velora-gold" /> Member Comments ({activeViewerAlbum.commentsList?.length || activeViewerAlbum.comments})
                </h4>

                {/* Add Comment Input */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentProfile?.avatarUrl || currentUser?.avatarUrl || profile.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      type="text"
                      value={albumCommentInput}
                      onChange={(e) => setAlbumCommentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddAlbumComment();
                        }
                      }}
                      placeholder="Write a comment under this album..."
                      className="text-xs bg-white/5 border-white/10"
                    />
                    <Button variant="gold" size="sm" onClick={handleAddAlbumComment} className="text-xs font-bold shrink-0">
                      Post Comment
                    </Button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-2 pt-2">
                  {(!activeViewerAlbum.commentsList || activeViewerAlbum.commentsList.length === 0) ? (
                    <p className="text-xs text-velora-textMuted italic">No comments yet. Be the first registered member to comment!</p>
                  ) : (
                    activeViewerAlbum.commentsList.map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full border border-amber-400/30 overflow-hidden shrink-0 mt-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300">{c.authorName}</span>
                            <span className="text-[10px] text-velora-textMuted font-mono">{c.createdAt}</span>
                          </div>
                          <p className="text-velora-textSecondary mt-1 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Video Player Viewer Modal */}
      {activeViewerVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
          <div className="w-full max-w-4xl bg-velora-card border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative my-auto flex flex-col">
            {/* Video Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40 text-left">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {activeViewerVideo.title}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {activeViewerVideo.category}
                  </span>
                </h3>
                <p className="text-xs text-velora-textMuted mt-0.5">{activeViewerVideo.description}</p>
              </div>
              <button
                onClick={() => setActiveViewerVideo(null)}
                className="p-2 rounded-full text-velora-textMuted hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* HTML5 Video Player Box */}
            <div className="h-64 sm:h-96 w-full bg-black relative flex items-center justify-center overflow-hidden">
              <video
                src={activeViewerVideo.videoUrl || activeViewerVideo.thumbnail}
                poster={activeViewerVideo.thumbnail}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-md bg-black/80 text-amber-300 font-mono text-xs border border-white/20 z-10 pointer-events-none">
                Duration: {activeViewerVideo.duration}
              </div>
            </div>

            {/* Video Details & Footer */}
            <div className="p-5 space-y-3 text-left">
              <div className="flex items-center justify-between text-xs text-velora-textMuted font-mono">
                <span className="text-emerald-400 font-bold">Status: {activeViewerVideo.status}</span>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-amber-400" /> {activeViewerVideo.views} Views</span>
                  <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4 text-emerald-400" /> {activeViewerVideo.likes} Likes</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeViewerVideo.topics.map((t) => (
                  <span key={t} className="px-2.5 py-0.5 rounded-full text-[11px] bg-white/5 text-amber-300 border border-amber-400/30">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* People Who Liked This Album Voters Modal */}
      {votersModalOpen && votersListTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-md p-6 space-y-5 text-left bg-velora-card relative shadow-2xl">
            <button
              onClick={() => setVotersModalOpen(false)}
              className="absolute top-4 right-4 text-velora-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 border-b border-white/10 pb-3">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-emerald-400 fill-emerald-400" /> People Who Liked This Album
              </h3>
              <p className="text-xs text-amber-300 font-semibold truncate">
                "{votersListTarget.title}" • {votersListTarget.voters.length} {votersListTarget.voters.length === 1 ? "Member" : "Members"}
              </p>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {votersListTarget.voters.length === 0 ? (
                <p className="text-xs text-velora-textMuted italic text-center py-4">No votes yet on this album.</p>
              ) : (
                votersListTarget.voters.map((voter) => (
                  <div
                    key={voter.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:border-amber-400/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-amber-400/40 overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={voter.avatarUrl} alt={voter.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1">
                          {voter.name}
                          {voter.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-velora-gold fill-amber-400/20" />}
                        </p>
                        <p className="text-[10px] text-emerald-400 font-mono">Liked {voter.votedAt}</p>
                      </div>
                    </div>

                    <Link href={`/profile/${voter.id === "me" ? "me" : voter.id}`}>
                      <Button variant="glass" size="sm" className="text-[11px] font-semibold">
                        View Profile
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <Button variant="glass" size="sm" onClick={() => setVotersModalOpen(false)} className="text-xs">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Get Verified Modal */}
      <GetVerifiedModal
        isOpen={getVerifiedModalOpen}
        onClose={() => setGetVerifiedModalOpen(false)}
        userEmail={currentUser?.email || profile.displayName.toLowerCase().replace(/\s+/g, "") + "@intimo.live"}
        userName={currentProfile?.displayName || profile.displayName}
        onVerificationSubmitted={handleVerificationSubmitted}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetUsername={profile.displayName}
      />
    </div>
  );
}
