"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_COMMUNITIES, MOCK_COMMUNITY_POSTS } from "@/lib/mockData";
import { CommunityPost } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  Send,
  ShieldCheck,
  Lock,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

export default function SingleCommunityPage() {
  const params = useParams();
  const communityId = (params?.id as string) || "com-1";

  const community = MOCK_COMMUNITIES.find((c) => c.id === communityId) || MOCK_COMMUNITIES[0];

  const [posts, setPosts] = useState<CommunityPost[]>(MOCK_COMMUNITY_POSTS);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});

  const handleCreatePost = () => {
    if (!postContent.trim()) return;

    const newPost: CommunityPost = {
      id: "post-" + Date.now(),
      communityId: community.id,
      authorName: "You",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      authorBadge: "Verified Member",
      title: postTitle.trim() || undefined,
      content: postContent,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      comments: [],
      createdAt: "Just now",
    };

    setPosts([newPost, ...posts]);
    setPostTitle("");
    setPostContent("");
  };

  const handleToggleLike = (postId: string) => {
    setPosts(
      posts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );
  };

  const handleAddComment = (postId: string) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    setPosts(
      posts.map((p) => {
        if (p.id === postId) {
          const newComm = {
            id: "c-" + Date.now(),
            postId,
            authorName: "You",
            authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
            content: text,
            createdAt: "Just now",
          };
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), newComm],
          };
        }
        return p;
      })
    );

    setCommentInput({ ...commentInput, [postId]: "" });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Community Header Banner */}
      <Card variant="glass" className="p-0 overflow-hidden text-left relative">
        <div className="h-56 w-full bg-velora-card relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={community.coverImageUrl} alt={community.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/50 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 space-y-4 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 uppercase">
                  {community.location || "Global Community"}
                </span>
                {community.isPrivate && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private Invite-Only
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">{community.name}</h1>
              <p className="text-xs text-velora-textMuted max-w-2xl mt-1 leading-relaxed">{community.description}</p>
            </div>

            <Button variant="gold" size="sm" className="text-xs font-bold uppercase tracking-wider shrink-0 shadow-gold-glow">
              {community.isJoined ? "Joined ✓" : "Join Club"}
            </Button>
          </div>

          <div className="flex items-center gap-6 pt-3 border-t border-white/10 text-xs font-mono text-velora-textSecondary">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-velora-gold" /> {community.membersCount} Members
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-amber-400" /> {community.postsCount} Discussions
            </span>
          </div>
        </div>
      </Card>

      {/* Main Grid: Create Post + Social Feed & Rules Side Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post Box */}
          <Card variant="glass" className="p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted flex items-center gap-2">
              <Plus className="w-4 h-4 text-velora-gold" />
              Share Announcement or Discussion
            </h3>

            <input
              type="text"
              placeholder="Post title (optional)..."
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />

            <textarea
              rows={3}
              placeholder="What's on your mind? High-discretion discussion..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <button className="flex items-center gap-1.5 text-xs text-velora-textMuted hover:text-velora-gold transition-colors">
                <ImageIcon className="w-4 h-4" /> Add Photo
              </button>

              <Button
                variant="gold"
                size="sm"
                className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow"
                onClick={handleCreatePost}
              >
                <Send className="w-3.5 h-3.5" /> Publish Post
              </Button>
            </div>
          </Card>

          {/* Social Posts Thread */}
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} variant="glass" className="p-6 space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-velora-gold/40 overflow-hidden bg-velora-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-velora-textPrimary">{post.authorName}</h4>
                        {post.authorBadge && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            {post.authorBadge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-velora-textMuted">{post.createdAt}</span>
                    </div>
                  </div>
                </div>

                {post.title && <h3 className="text-sm font-bold text-velora-textPrimary">{post.title}</h3>}
                <p className="text-xs text-velora-textSecondary leading-relaxed whitespace-pre-line">{post.content}</p>

                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <div className="rounded-2xl overflow-hidden border border-white/10 max-h-80">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.mediaUrls[0]} alt="Post image" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Actions & Reactions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                      post.isLiked ? "text-rose-400" : "text-velora-textMuted hover:text-rose-400"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? "fill-rose-400" : ""}`} />
                    {post.likesCount} Likes
                  </button>

                  <span className="text-xs text-velora-textMuted flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> {post.commentsCount} Comments
                  </span>
                </div>

                {/* Comments List */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    {post.comments.map((c) => (
                      <div key={c.id} className="p-2.5 glass-panel rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-velora-textPrimary">{c.authorName}</span>
                          <span className="text-[10px] text-velora-textMuted">{c.createdAt}</span>
                        </div>
                        <p className="text-velora-textSecondary leading-relaxed">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={commentInput[post.id] || ""}
                    onChange={(e) => setCommentInput({ ...commentInput, [post.id]: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-2 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
                  />
                  <Button variant="gold" size="sm" className="p-2 rounded-full" onClick={() => handleAddComment(post.id)}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Col: Community Rules & Info */}
        <div className="space-y-6">
          <Card variant="glass" className="p-6 space-y-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-velora-textMuted flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Community Rules & Discretion Code
            </h3>

            <ul className="space-y-2.5 text-xs text-velora-textSecondary">
              {community.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-velora-gold shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
