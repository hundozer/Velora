"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, ShieldCheck, Lock, ArrowRight, User, Users, Crown } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "COUPLE" | "CREATOR">("MEMBER");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) return;

    register({
      email,
      displayName,
      role: selectedRole,
    });

    router.push("/onboarding");
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 uppercase tracking-widest inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> PRIVATE MEMBERS CLUB
          </span>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">Enter Velora</h1>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Create your private identity to explore adult connections and meet open-minded people.
          </p>
        </div>

        <Card variant="goldBorder" className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choose Identity Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                1. Choose Your Identity
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("MEMBER")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === "MEMBER"
                      ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold"
                      : "glass-panel text-velora-textMuted hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Individual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("COUPLE")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === "COUPLE"
                      ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold"
                      : "glass-panel text-velora-textMuted hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Couple</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("CREATOR")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === "CREATOR"
                      ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold"
                      : "glass-panel text-velora-textMuted hover:text-white"
                  }`}
                >
                  <Crown className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Creator</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Display Name / Persona
              </label>
              <Input
                type="text"
                placeholder="e.g. Elena V."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Private Email
              </label>
              <Input
                type="email"
                placeholder="you@private.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button variant="gold" type="submit" className="w-full text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2">
              <span>Continue to Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-velora-textMuted">
            Already have a private identity?{" "}
            <Link href="/login" className="text-velora-gold font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
