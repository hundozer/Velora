"use client";

import React, { useState } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MOCK_CONVERSATIONS } from "@/lib/mockData";
import { Conversation } from "@/types";

export default function MessagesPage() {
  const [activeConv, setActiveConv] = useState<Conversation>(MOCK_CONVERSATIONS[0]);

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
