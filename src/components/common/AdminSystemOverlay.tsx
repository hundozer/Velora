"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, LogOut, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminSystemOverlay() {
  const { stopImpersonating } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [originalAdminName, setOriginalAdminName] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState<{ text: string; theme: string } | null>(null);

  const checkStorage = () => {
    if (typeof window !== "undefined") {
      // Impersonation check
      const adminStr = localStorage.getItem("intimo_original_admin_user");
      if (adminStr) {
        try {
          const adminObj = JSON.parse(adminStr);
          setOriginalAdminName(adminObj.username || adminObj.email.split("@")[0]);
        } catch {
          setOriginalAdminName("Administrator");
        }
      } else {
        setOriginalAdminName(null);
      }

      // Broadcast check
      const broadcastStr = localStorage.getItem("intimo_active_broadcast_banner");
      if (broadcastStr) {
        try {
          setBroadcast(JSON.parse(broadcastStr));
        } catch {
          setBroadcast(null);
        }
      } else {
        setBroadcast(null);
      }
    }
  };

  useEffect(() => {
    checkStorage();
    
    // Set up a storage event listener for cross-tab updates
    window.addEventListener("storage", checkStorage);
    
    // Poll periodically to catch updates in same-tab navigation
    const interval = setInterval(checkStorage, 1000);

    return () => {
      window.removeEventListener("storage", checkStorage);
      clearInterval(interval);
    };
  }, [pathname]);

  const handleStopImpersonating = () => {
    stopImpersonating();
    setOriginalAdminName(null);
    router.push("/admin");
  };

  const getBroadcastThemeClasses = (theme: string) => {
    switch (theme) {
      case "amber":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "crimson":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "gold":
      default:
        return "bg-velora-gold/20 text-amber-100 border-velora-gold/30";
    }
  };

  const getBroadcastIconColor = (theme: string) => {
    switch (theme) {
      case "amber":
        return "text-amber-400";
      case "crimson":
        return "text-rose-400";
      case "gold":
      default:
        return "text-velora-gold";
    }
  };

  return (
    <div className="w-full shrink-0 z-[9999] flex flex-col">
      {/* 1. System Broadcast Banner */}
      {broadcast && (
        <div className={`w-full py-2 px-4 border-b text-[11px] font-medium flex items-center justify-between gap-3 transition-colors ${getBroadcastThemeClasses(broadcast.theme)}`}>
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            <Megaphone className={`w-3.5 h-3.5 shrink-0 ${getBroadcastIconColor(broadcast.theme)}`} />
            <div className="whitespace-nowrap overflow-hidden text-ellipsis flex-1">
              <span className="font-mono uppercase font-bold tracking-wider mr-1.5">[System Broadcast]:</span>
              <span className="font-sans leading-none">{broadcast.text}</span>
            </div>
          </div>
          {/* Support closing local view */}
          <button 
            onClick={() => setBroadcast(null)} 
            className="text-white/40 hover:text-white transition-colors p-0.5"
            title="Dismiss local view"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. Admin Impersonation Control Overlay Banner */}
      {originalAdminName && (
        <div className="w-full bg-gradient-to-r from-amber-500/30 via-velora-gold/30 to-amber-500/30 border-b border-velora-gold/40 text-xs py-2.5 px-4 flex items-center justify-between gap-4 shadow-lg shadow-black/30">
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="w-4 h-4 text-velora-gold animate-pulse shrink-0" />
            <span className="font-sans">
              Admin Session Active: Impersonating as <strong className="text-amber-200">{originalAdminName}</strong>
            </span>
          </div>
          <Button
            onClick={handleStopImpersonating}
            variant="gold"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-wider py-1 px-3.5 flex items-center gap-1.5 text-black hover:bg-white transition-all shadow-md shrink-0"
          >
            <LogOut className="w-3 h-3" />
            <span>Exit Impersonation</span>
          </Button>
        </div>
      )}
    </div>
  );
}
