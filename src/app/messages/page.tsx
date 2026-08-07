"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Conversation } from "@/types";

import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);

  const syncConversations = useCallback(() => {
    fetch("/api/messages", { credentials: "same-origin" }).then(async (response) => response.ok ? response.json() : Promise.reject()).then((payload) => {
      const next = Array.isArray(payload.conversations) ? payload.conversations : [];
      setConversations(next);
      setActiveConv((current) => next.find((item: Conversation) => item.id === current?.id) || next[0] || null);
    }).catch(() => setConversations([]));
  }, []);

  useEffect(() => {
    syncConversations();
    const timer = window.setInterval(syncConversations, 15_000);
    return () => window.clearInterval(timer);
  }, [syncConversations]);

  // Handle target user query param (e.g. /messages?user=prof-1)
  useEffect(() => {
    if (!targetUserId) return;
    const found = conversations.find(
      (c) => c.participant.id === targetUserId || c.participant.userId === targetUserId
    );
    if (found) {
      setActiveConv(found);
      return;
    }
    fetch(`/api/profiles/${encodeURIComponent(targetUserId)}`, { credentials: "same-origin" })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((payload) => {
        const profile = payload.profile;
        const started = {
          id: [profile.id, "current"].sort().join(":"),
          participant: profile,
          lastMessage: {
            id: `new-${profile.id}`,
            conversationId: `new-${profile.id}`,
            senderId: profile.id,
            senderName: profile.displayName,
            senderAvatar: profile.avatarUrl || "",
            content: "Start a conversation",
            status: "READ",
            createdAt: new Date().toISOString(),
          },
          unreadCount: 0,
          updatedAt: new Date().toISOString(),
        } as Conversation;
        setConversations((current) => current.some((item) => item.participant.id === profile.id) ? current : [started, ...current]);
        setActiveConv(started);
      }).catch(() => undefined);
  }, [targetUserId, conversations]);

  if (!user) {
    return <BehindTheDoorLanding />;
  }

  if (!activeConv) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-velora-textMuted">No conversations yet. Open a member profile and choose Message to start one.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ChatWindow
        conversations={conversations}
        activeConversation={activeConv}
        onSelectConversation={setActiveConv}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[60vh] text-velora-textMuted text-sm">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
