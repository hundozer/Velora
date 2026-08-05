"use client";

import React, { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MOCK_CONVERSATIONS } from "@/lib/mockData";
import { Conversation } from "@/types";

import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function MessagesPage() {
  const { user } = useAuth();
  const [activeConv, setActiveConv] = useState<Conversation>(MOCK_CONVERSATIONS[0]);

  if (!user) {
    return <BehindTheDoorLanding />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ChatWindow
        conversations={MOCK_CONVERSATIONS}
        activeConversation={activeConv}
        onSelectConversation={setActiveConv}
      />
    </div>
  );
}
