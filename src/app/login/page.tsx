"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import {
  ArrowRight,
  ShieldCheck,
  User,
  Users,
  Crown,
  KeyRound,
  Lock,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hoveredDemo, setHoveredDemo] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickDemoLogin = (demoRole: UserRole, demoEmail: string) => {
    login(demoEmail, demoRole);
    window.location.href = "/discovery";
  };

  const demoAccounts = [
    {
      id: "member",
      role: "MEMBER" as UserRole,
      email: "single.member@velora.club",
      label: "Member",
      name: "Elena Vance",
      icon: User,
      accent: "from-amber-400 to-yellow-600",
      glow: "group-hover:shadow-amber-500/20",
    },
    {
      id: "couple",
      role: "COUPLE" as UserRole,
      email: "couple.berlin@velora.club",
      label: "Couple",
      name: "Marcus & Sarah",
      icon: Users,
      accent: "from-rose-400 to-pink-600",
      glow: "group-hover:shadow-rose-500/20",
    },
    {
      id: "creator",
      role: "CREATOR" as UserRole,
      email: "creator.valerie@velora.club",
      label: "Creator",
      name: "Valerie Night",
      icon: Crown,
      accent: "from-violet-400 to-purple-600",
      glow: "group-hover:shadow-violet-500/20",
    },
    {
      id: "admin",
      role: "ADMIN" as UserRole,
      email: "admin@velora.club",
      label: "Admin",
      name: "System Admin",
      icon: KeyRound,
      accent: "from-emerald-400 to-teal-600",
      glow: "group-hover:shadow-emerald-500/20",
    },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 w-full max-w-[440px] mx-auto px-5 py-16 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Velora Brand Identity */}
        <div className="text-center mb-10 space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-velora-gold/10 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-velora-gold via-velora-amber to-velora-goldHover p-[2px] shadow-gold-glow">
              <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
                <span className="font-serif font-bold text-[28px] gold-gradient-text select-none">
                  V
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[32px] font-serif font-bold tracking-tight text-velora-textPrimary leading-none">
              Welcome Back
            </h1>
            <p className="text-sm text-velora-textMuted font-light">
              Private Members Club After Dark
            </p>
          </div>
        </div>

        {/* Demo Role Accounts */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            {demoAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(account.role, account.email)}
                  onMouseEnter={() => setHoveredDemo(account.id)}
                  onMouseLeave={() => setHoveredDemo(null)}
                  className={`group relative p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm
                    transition-all duration-300 text-left
                    hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-lg ${account.glow}
                    active:scale-[0.97]`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${account.accent} p-[1px] mb-3
                      transition-transform duration-300 group-hover:scale-110`}
                  >
                    <div className="w-full h-full rounded-[11px] bg-velora-bg/90 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white/80" />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="block text-[13px] font-semibold text-velora-textPrimary group-hover:text-white transition-colors">
                      {account.label}
                    </span>
                    <span className="block text-[11px] text-velora-textMuted font-normal">
                      {account.name}
                    </span>
                  </div>

                  <div
                    className={`absolute top-4 right-4 transition-all duration-300 ${
                      hoveredDemo === account.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-white/40" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center space-y-3">
          <p className="text-[12px] text-velora-textMuted">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-velora-gold hover:text-velora-amber font-medium transition-colors"
            >
              Create Account
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 text-velora-textMuted/50">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] tracking-wide">
              256-bit encryption • GDPR compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
