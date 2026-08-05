"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MOCK_CONVERSATIONS } from "@/lib/mockData";
import { Conversation } from "@/types";

import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("user");

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("intimo_all_conversations");
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch (e) {
          console.error("Failed to parse saved conversations:", e);
        }
      }
    }
    return MOCK_CONVERSATIONS;
  });

  const [activeConv, setActiveConv] = useState<Conversation>(() => conversations[0] || MOCK_CONVERSATIONS[0]);

  const syncConversations = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("intimo_all_conversations");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    syncConversations();
    window.addEventListener("intimo_conversations_updated", syncConversations);
    return () => {
      window.removeEventListener("intimo_conversations_updated", syncConversations);
    };
  }, [syncConversations]);

  // Handle target user query param (e.g. /messages?user=prof-1)
  useEffect(() => {
    if (!targetUserId || conversations.length === 0) return;
    const found = conversations.find(
      (c) => c.participant.id === targetUserId || c.participant.userId === targetUserId
    );
    if (found) {
      setActiveConv(found);
    }
  }, [targetUserId, conversations]);

  if (!user) {
    return <BehindTheDoorLanding />;
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
