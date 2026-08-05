"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Minus,
  Maximize2,
  Minimize2,
  X,
  Video,
  CheckCircle2,
  Image,
  Smile,
  Mic,
  Plus,
  Send,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export interface FloatingChatUser {
  id: string;
  displayName: string;
  avatarUrl: string;
  genderSymbol?: string;
  verified?: boolean;
  location?: string;
  followersCount?: number;
  photoCount?: number;
  videoCount?: number;
  isOnline?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  status?: "SENT" | "DELIVERED" | "READ";
  readAt?: string;
}

interface FloatingChatWidgetProps {
  chatUser: FloatingChatUser | null;
  onClose: () => void;
}

export function FloatingChatWidget({ chatUser, onClose }: FloatingChatWidgetProps) {
  const { user: currentUser, profile: currentProfile } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversation when chatUser changes
  useEffect(() => {
    if (!chatUser) return;

    // Load or set initial mock messages
    const storageKey = `intimo_chat_${chatUser.id}`;
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    } else {
      // Default initial welcome messages
      const initial: ChatMessage[] = [
        {
          id: "m-1",
          senderId: chatUser.id,
          text: `Ahoj! Thanks for stopping by my profile. Feel free to send me a message! 😊`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSelf: false,
          status: "READ",
        },
      ];
      setMessages(initial);
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    }
  }, [chatUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isMinimized]);

  if (!chatUser) return null;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const msgId = `msg-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: currentProfile?.id || currentUser?.id || "me",
      text: inputText.trim(),
      timestamp: nowTime,
      isSelf: true,
      status: "DELIVERED",
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInputText("");

    const storageKey = `intimo_chat_${chatUser.id}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }

    // Trigger "Seen / Read" status update after 2.5 seconds (when chat partner views message)
    setTimeout(() => {
      setMessages((prev) => {
        const readTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const updatedRead = prev.map((m) =>
          m.id === msgId ? { ...m, status: "READ" as const, readAt: readTime } : m
        );
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(updatedRead));
        }
        return updatedRead;
      });
    }, 2500);
  };

  const isOnline = chatUser.isOnline ?? false;

  // Minimized Floating Pill Render matching Amateri reference
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 bg-velora-card/95 backdrop-blur-2xl border border-velora-gold/40 px-4 py-2.5 rounded-full shadow-2xl hover:border-amber-400 transition-all animate-in fade-in slide-in-from-bottom-4">
        <div className="relative cursor-pointer" onClick={() => setIsMinimized(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={chatUser.avatarUrl}
            alt={chatUser.displayName}
            className="w-8 h-8 rounded-full object-cover border border-white/20"
          />
          {isOnline ? (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" title="Online" />
          ) : (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-black" title="Offline" />
          )}
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setIsMinimized(false)}>
          <span className="text-xs font-bold text-white">{chatUser.displayName}</span>
          <span className="text-[11px] text-pink-400 font-bold">{chatUser.genderSymbol || "♀"}</span>
          {chatUser.verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />}
        </div>
        <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-velora-textMuted hover:text-white transition-colors"
            title="Expand Chat Window"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-velora-textMuted hover:text-red-400 transition-colors"
            title="Close Chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded Window Render matching Amateri screenshot design
  return (
    <div
      className={`fixed right-4 z-[9999] bg-velora-card/95 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl flex flex-col transition-all duration-300 overflow-hidden ${
        isMaximized
          ? "bottom-4 top-20 left-4 md:left-auto md:w-[500px]"
          : "bottom-4 w-[360px] sm:w-[380px] h-[520px]"
      }`}
    >
      {/* 1. Header Bar matching Amateri reference */}
      <div className="p-3 bg-black/80 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={chatUser.avatarUrl}
              alt={chatUser.displayName}
              className="w-9 h-9 rounded-full object-cover border border-white/20"
            />
            {isOnline ? (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" title="Online" />
            ) : (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-gray-500 rounded-full border-2 border-black" title="Offline" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white leading-tight">{chatUser.displayName}</span>
              {chatUser.genderSymbol && (
                <span className="text-xs text-pink-400 font-bold">{chatUser.genderSymbol}</span>
              )}
              {chatUser.verified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
              )}
            </div>
            {isOnline ? (
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active now
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Offline
              </p>
            )}
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 text-velora-textMuted">
          <button
            className="p-1.5 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Start Video Call"
          >
            <Video className="w-4 h-4 text-blue-400" />
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title="Minimize Chat"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            title={isMaximized ? "Restore Size" : "Maximize Window"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
        <div className="text-center my-1">
          <span className="text-[10px] font-mono uppercase bg-white/10 px-2.5 py-0.5 rounded-full text-velora-textMuted">
            Today
          </span>
        </div>

        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                msg.isSelf
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md"
                  : "bg-white/10 text-gray-200 border border-white/10 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Timestamp & Read Receipt Checkmarks */}
              <div
                className={`flex items-center gap-1 text-[9px] font-mono mt-1 ${
                  msg.isSelf ? "text-blue-200 justify-end" : "text-gray-400"
                }`}
              >
                <span>{msg.timestamp}</span>

                {/* Seen status for sent messages */}
                {msg.isSelf && (
                  <span
                    className="flex items-center gap-0.5"
                    title={msg.status === "READ" ? `Seen at ${msg.readAt || msg.timestamp}` : "Delivered"}
                  >
                    {msg.status === "READ" ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-sky-300 inline" />
                        <span className="text-[9px] font-semibold text-sky-300 ml-0.5">Seen</span>
                      </>
                    ) : msg.status === "DELIVERED" ? (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-200/70 inline" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-blue-200/70 inline" />
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Input Composer Footer matching reference */}
      <form onSubmit={handleSend} className="p-2.5 bg-black/80 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 text-velora-textMuted hover:text-amber-400 hover:bg-white/10 rounded-full transition-colors"
            title="Attach File / Media"
          >
            <Plus className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Write something nice..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-velora-textMuted focus:outline-none focus:border-amber-400/60 transition-colors"
          />
          <div className="flex items-center gap-1 text-velora-textMuted">
            <button
              type="button"
              className="p-1 text-velora-textMuted hover:text-amber-300 transition-colors"
              title="Insert Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 text-velora-textMuted hover:text-blue-400 transition-colors"
              title="Upload Image"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1 text-velora-textMuted hover:text-red-400 transition-colors"
              title="Record Voice Note"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-gold-glow"
          >
            <Send className="w-3.5 h-3.5 fill-black" />
          </button>
        </div>
      </form>
    </div>
  );
}

/** Global Manager Component to listen for window event "intimo_open_chat" */
export function GlobalFloatingChatManager() {
  const [activeChatUser, setActiveChatUser] = useState<FloatingChatUser | null>(null);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent<FloatingChatUser>;
      if (customEvent.detail) {
        setActiveChatUser(customEvent.detail);
      }
    };

    window.addEventListener("intimo_open_chat", handleOpenChat);
    return () => {
      window.removeEventListener("intimo_open_chat", handleOpenChat);
    };
  }, []);

  if (!activeChatUser) return null;

  return (
    <FloatingChatWidget
      chatUser={activeChatUser}
      onClose={() => setActiveChatUser(null)}
    />
  );
}
