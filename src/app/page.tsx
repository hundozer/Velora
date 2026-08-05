"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
          Redirecting to your Intimo live feed...
        </p>
      </div>
    );
  }

  return <BehindTheDoorLanding />;
}
