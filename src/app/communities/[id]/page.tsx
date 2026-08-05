"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  DEFAULT_COMMUNITY_CHATROOMS,
  CommunityChatroom,
  ChatMessage,
  ChatMember,
} from "@/lib/data/communitiesChatrooms";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  MessageSquare,
  Send,
  ShieldCheck,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Filter,
  Sparkles,
  ArrowLeft,
  Lock,
  User,
  Heart,
  X,
} from "lucide-react";

export default function SingleCommunityChatroomPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = (params?.id as string) || "room-sexpartner-finder";
  const { user, profile } = useAuth();

  // Find target room by id or slug
  const [currentRoom, setCurrentRoom] = useState<CommunityChatroom>(() => {
    const found = DEFAULT_COMMUNITY_CHATROOMS.find(
      (r) => r.id === rawId || r.slug === rawId
    );
    return found || DEFAULT_COMMUNITY_CHATROOMS[0];
  });

  const [messages, setMessages] = useState<ChatMessage[]>(currentRoom.messages);
  const [members, setMembers] = useState<ChatMember[]>(currentRoom.members);
  const [inputMessage, setInputMessage] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [selectedMember, setSelectedMember] = useState<ChatMember | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Update state when room changes and ensure logged in user is included in members count
  useEffect(() => {
    const found = DEFAULT_COMMUNITY_CHATROOMS.find(
      (r) => r.id === rawId || r.slug === rawId
    );
    if (found) {
      setCurrentRoom(found);
      setMessages(found.messages);

      let roomMembers = [...found.members];
      // Automatically include current logged in user in room members if not already listed
      if (
        user &&
        !roomMembers.some(
          (m) =>
            m.id === user.id ||
            m.displayName === (profile?.displayName || user.username)
        )
      ) {
        const userGenderStr = String(
          profile?.gender || (user as any)?.gender || "MALE"
        ).toUpperCase();
        let userGender: "FEMALE" | "MALE" | "COUPLE" | "TRANSGENDER" = "MALE";
        let userSymbol = "♂";

        if (userGenderStr.includes("FEMALE")) {
          userGender = "FEMALE";
          userSymbol = "♀";
        } else if (userGenderStr.includes("COUPLE")) {
          userGender = "COUPLE";
          userSymbol = "👫";
        } else if (userGenderStr.includes("TRANS")) {
          userGender = "TRANSGENDER";
          userSymbol = "⚧";
        }

        roomMembers.unshift({
          id: user.id || "me-" + Date.now(),
          displayName: profile?.displayName || user.username || "You",
          avatarUrl:
            profile?.avatarUrl ||
            user.avatarUrl ||
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
          gender: userGender,
          genderSymbol: userSymbol,
          age: profile?.age || 27,
          location: profile?.city
            ? `${profile.city}, ${profile.country || ""}`
            : "Prague, CZ",
          isVerified: profile?.verified ?? true,
          isOnline: true,
          statusText: "Active in chatroom",
        });
      }
      setMembers(roomMembers);
    }
  }, [rawId, user, profile]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhotoPreview(url);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() && !photoPreview) return;

    const userGenderStr = String(profile?.gender || (user as any)?.gender || "MALE").toUpperCase();
    let userGender: "FEMALE" | "MALE" | "COUPLE" | "TRANSGENDER" = "MALE";
    let userSymbol = "♂";

    if (userGenderStr.includes("FEMALE")) {
      userGender = "FEMALE";
      userSymbol = "♀";
    } else if (userGenderStr.includes("COUPLE")) {
      userGender = "COUPLE";
      userSymbol = "👫";
    } else if (userGenderStr.includes("TRANS")) {
      userGender = "TRANSGENDER";
      userSymbol = "⚧";
    }

    const newMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      senderId: user?.id || "me",
      senderName: profile?.displayName || user?.username || "You",
      senderAvatar: profile?.avatarUrl || user?.avatarUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      senderGender: userGender,
      senderGenderSymbol: userSymbol,
      senderVerified: true,
      text: inputMessage.trim(),
      mediaUrl: photoPreview || undefined,
      createdAt: "Just now",
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setPhotoPreview(null);
  };

  // Gender Color Style Helper
  const getGenderStyle = (gender: string) => {
    const g = String(gender).toUpperCase();
    if (g.includes("FEMALE")) {
      return {
        text: "text-rose-400",
        badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        symbol: "♀",
      };
    } else if (g.includes("COUPLE")) {
      return {
        text: "text-amber-300",
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        symbol: "👫",
      };
    } else if (g.includes("TRANS")) {
      return {
        text: "text-purple-400",
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        symbol: "⚧",
      };
    } else {
      // MALE
      return {
        text: "text-sky-400",
        badge: "bg-sky-500/20 text-sky-300 border-sky-500/40",
        bg: "bg-sky-500/10",
        border: "border-sky-500/30",
        symbol: "♂",
      };
    }
  };

  const filteredMembers = members.filter((m) => {
    if (genderFilter === "ALL") return true;
    return m.gender === genderFilter;
  });

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      {/* Top Bar: Room Selector & Return Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/communities">
            <Button variant="glass" size="sm" className="text-xs font-bold gap-1.5 border-white/10">
              <ArrowLeft className="w-4 h-4" /> Back to All Communities
            </Button>
          </Link>
          <span className="text-xs text-amber-400 font-mono font-bold">• Live Topic Chatrooms</span>
        </div>

        {/* 5 Topic Chatrooms Switcher Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {DEFAULT_COMMUNITY_CHATROOMS.map((room) => {
            const isActive = room.id === currentRoom.id;
            return (
              <Link key={room.id} href={`/communities/${room.slug}`}>
                <button
                  type="button"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-amber-400 text-black shadow-gold-glow border border-amber-400 font-bold"
                      : "bg-white/5 text-velora-textMuted border border-white/10 hover:text-white"
                  }`}
                >
                  <span>{room.icon}</span>
                  <span>{room.name}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MAIN CHATROOM LAYOUT: Left Stream (lg:col-span-8) + Right Active Users Sidebar (lg:col-span-4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT STREAM: Live Messages & Composer (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <Card variant="goldBorder" className="p-0 overflow-hidden bg-velora-card flex flex-col h-[750px] shadow-2xl">
            {/* Chatroom Header Bar */}
            <div className="p-4 bg-black/60 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                  {currentRoom.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-serif font-bold text-white">{currentRoom.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase font-mono">
                      {currentRoom.badge}
                    </span>
                  </div>
                  <p className="text-xs text-velora-textMuted leading-tight mt-0.5 line-clamp-1">
                    {currentRoom.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {members.length} {members.length === 1 ? "Member Online" : "Members Online"}
                </span>
              </div>
            </div>

            {/* Chat Messages Stream Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin bg-black/40">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <Sparkles className="w-10 h-10 text-amber-400" />
                  <h3 className="text-base font-serif font-bold text-white">Welcome to #{currentRoom.name}</h3>
                  <p className="text-xs text-velora-textMuted max-w-sm">
                    Be the first to share a high-discretion thought or invitation in this lounge.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const style = getGenderStyle(msg.senderGender);
                  return (
                    <div key={msg.id} className="flex items-start gap-3 group text-left">
                      <div className={`w-10 h-10 rounded-full border ${style.border} overflow-hidden bg-velora-card shrink-0 mt-0.5`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={msg.senderAvatar} alt={msg.senderName} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Color-Coded Nickname by Gender */}
                          <span className={`text-xs font-bold ${style.text}`}>
                            {msg.senderName}
                          </span>

                          {/* Gender Symbol Badge */}
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold border ${style.badge}`}>
                            {msg.senderGenderSymbol}
                          </span>

                          {msg.senderVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}

                          <span className="text-[10px] text-velora-textMuted font-mono ml-auto">
                            {msg.createdAt}
                          </span>
                        </div>

                        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-velora-textPrimary leading-relaxed whitespace-pre-line max-w-2xl">
                          {msg.text}
                          {msg.mediaUrl && (
                            <div className="mt-2 rounded-xl overflow-hidden max-w-sm border border-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={msg.mediaUrl} alt="Attachment" className="w-full max-h-60 object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Message Composer Area */}
            <form onSubmit={handleSendMessage} className="p-3 bg-black/80 border-t border-white/10 space-y-2 shrink-0">
              {photoPreview && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  <button type="button" onClick={() => setPhotoPreview(null)} className="p-1 text-velora-textMuted hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-velora-textMuted hover:text-white hover:border-amber-400/40 transition-colors"
                  title="Attach Photo"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <Input
                  type="text"
                  placeholder={`Share a message in #${currentRoom.name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 text-xs bg-white/5 border-white/10 text-white placeholder:text-velora-textMuted"
                />

                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  className="text-xs font-bold uppercase tracking-wider gap-1.5 shadow-gold-glow shrink-0 text-black"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* RIGHT SIDEBAR: Active Room Members with Gender Color Distinction & Filter (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <Card variant="goldBorder" className="p-5 space-y-4 bg-gold-card text-left shadow-2xl">
            {/* Header & Filter Controls */}
            <div className="border-b border-white/10 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2 font-mono">
                  <Users className="w-4 h-4 text-amber-400" /> Active Members in Room
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {filteredMembers.length} Members
                </span>
              </div>
              <p className="text-[11px] text-velora-textMuted">
                Nicknames are color-coded by gender profile type.
              </p>

              {/* Gender Distinction Filter Buttons */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                {[
                  { id: "ALL", label: "All" },
                  { id: "FEMALE", label: "♀ Females", color: "text-rose-400" },
                  { id: "MALE", label: "♂ Males", color: "text-sky-400" },
                  { id: "COUPLE", label: "👫 Couples", color: "text-amber-300" },
                  { id: "TRANSGENDER", label: "⚧ Trans", color: "text-purple-400" },
                ].map((btn) => {
                  const isSelected = genderFilter === btn.id;
                  return (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setGenderFilter(btn.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 border ${
                        isSelected
                          ? "bg-amber-400 text-black border-amber-400 shadow-gold-glow"
                          : "bg-white/5 text-velora-textMuted border-white/10 hover:text-white"
                      }`}
                    >
                      {btn.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Members List */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-velora-textMuted">
                  No active members matching gender filter.
                </div>
              ) : (
                filteredMembers.map((m) => {
                  const style = getGenderStyle(m.gender);
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMember(m)}
                      className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with Online Indicator */}
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-full border-2 ${style.border} overflow-hidden bg-velora-card`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" />
                          </div>
                          <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-velora-bg absolute bottom-0 right-0" />
                        </div>

                        <div className="min-w-0 text-left space-y-0.5">
                          {/* Color-Coded Nickname */}
                          <div className="flex items-center gap-1.5">
                            <h4 className={`text-xs font-bold truncate group-hover:underline ${style.text}`}>
                              {m.displayName}
                            </h4>
                            <span className={`text-[10px] font-bold ${style.text}`}>
                              {m.genderSymbol}
                            </span>
                            {m.isVerified && <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />}
                          </div>

                          <div className="text-[10px] text-velora-textMuted font-mono truncate">
                            {m.age} yrs • {m.location}
                          </div>

                          {m.statusText && (
                            <p className="text-[10px] text-amber-200/80 italic truncate">
                              "{m.statusText}"
                            </p>
                          )}
                        </div>
                      </div>

                      <Link href={`/messages?user=${m.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-[10px] font-bold text-amber-400 px-2 shrink-0">
                          Message
                        </Button>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <Card variant="goldBorder" className="w-full max-w-sm p-6 space-y-4 text-left bg-velora-card relative shadow-2xl">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-velora-textMuted hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full border-2 border-amber-400 mx-auto overflow-hidden bg-black shadow-gold-glow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedMember.avatarUrl} alt={selectedMember.displayName} className="w-full h-full object-cover" />
              </div>

              <div>
                <h3 className={`text-base font-serif font-bold ${getGenderStyle(selectedMember.gender).text}`}>
                  {selectedMember.displayName} {selectedMember.genderSymbol}
                </h3>
                <p className="text-xs text-velora-gold font-mono">{selectedMember.age} yrs • {selectedMember.location}</p>
              </div>

              {selectedMember.statusText && (
                <p className="text-xs text-velora-textSecondary italic p-3 rounded-xl bg-white/5 border border-white/10">
                  "{selectedMember.statusText}"
                </p>
              )}

              <div className="pt-2 flex gap-2">
                <Link href={`/profile/${selectedMember.id}`} className="w-1/2">
                  <Button variant="glass" size="sm" className="w-full text-xs font-bold">
                    View Profile
                  </Button>
                </Link>
                <Link href={`/messages?user=${selectedMember.id}`} className="w-1/2">
                  <Button variant="gold" size="sm" className="w-full text-xs font-bold uppercase shadow-gold-glow text-black">
                    Send Message
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
