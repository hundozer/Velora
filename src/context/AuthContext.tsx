"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole, Profile } from "@/types";
import {
  dbRowToUser,
  dbRowToProfile,
  ProfileRow,
} from "@/lib/supabase/profileService";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAuthLoading: boolean;
  isAgeVerified: boolean;
  confirmAge: () => Promise<void>;
  loginWithAuth0: (screenHint?: string) => void;
  logoutWithAuth0: (returnTo?: string) => void;
  updateUserProfile: (newUser: User, newProfile: Profile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(false);

  // Age declaration is only a low-assurance visitor gate. Identity and roles
  // are restored exclusively by the verified server-session effect below.
  useEffect(() => {
    const savedAgeCheck = localStorage.getItem("intimo_age_verified") || localStorage.getItem("velora_age_verified");
    setIsAgeVerified(savedAgeCheck === "true");
  }, []);

  // Reconcile all cached display state against the verified server session.
  // localStorage and legacy cookies never grant identity or privileged roles.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 401) {
          setUser(null);
          setProfile(null);
          setRole("MEMBER");
          return;
        }
        if (!response.ok) return;
        const session = await response.json();
        if (!session?.provisioned) {
          if (window.location.pathname !== "/onboarding") window.location.replace("/onboarding");
          return;
        }
        if (!session?.actor?.email) return;

        const profileResponse = await fetch("/api/profile/me", { cache: "no-store", credentials: "same-origin" });
        if (!profileResponse.ok) return;
        const payload = await profileResponse.json();
        const data = payload.profile as ProfileRow;
        if (cancelled || !data) return;
        const freshUser = { ...dbRowToUser(data), id: session.actor.id, role: session.actor.role as UserRole };
        const freshProfile = { ...dbRowToProfile(data), userId: session.actor.id };
        setUser(freshUser);
        setProfile(freshProfile);
        setRole(session.actor.role as UserRole);
      })
      .catch(() => {
        setUser(null);
        setProfile(null);
        setRole("MEMBER");
      })
      .finally(() => {
        if (!cancelled) setIsAuthLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const pathname = usePathname();
  const router = useRouter();

  // Route Guard: Kick unverified users to verify-email page
  useEffect(() => {
    if (user && user.verificationStatus === "UNVERIFIED") {
      const allowedPaths = ["/verify-email", "/login", "/register", "/"];
      if (!allowedPaths.includes(pathname)) {
        console.log(`Redirecting unverified user to /verify-email from ${pathname}`);
        router.replace("/verify-email");
      }
    }
  }, [user, pathname, router]);

  // ── Age Verification ───────────────────────────────────
  const confirmAge = async () => {
    const response = await fetch("/api/access/age-declaration", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adult: true }),
    });
    if (!response.ok) throw new Error("Age declaration could not be recorded");
    setIsAgeVerified(true);
    localStorage.setItem("intimo_age_verified", "true");
  };

  // Update display state optimistically; the server filters all writable fields.
  const updateUserProfile = useCallback((newUser: User, newProfile: Profile) => {
    setUser(newUser);
    setProfile(newProfile);
    // Persist through the authenticated owner-only server boundary. Identity,
    // role, tier, and verification fields are deliberately not sent.
    fetch("/api/profile/me", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: newProfile }),
    }).catch((err) => console.error("Failed to sync profile:", err));
  }, []);

  // ── Auth0 Login/Logout ─────────────────────────────────
  const loginWithAuth0 = (screenHint?: string) => {
    if (typeof window !== "undefined") {
      const targetUrl = screenHint ? `/auth/login?screen_hint=${screenHint}` : "/auth/login";
      window.location.href = targetUrl;
    }
  };

  const logoutWithAuth0 = (returnTo?: string) => {
    logout();
    if (typeof window !== "undefined") {
      const target = returnTo ? `/auth/logout?returnTo=${encodeURIComponent(returnTo)}` : "/auth/logout";
      window.location.href = target;
    }
  };

  // ── Logout ─────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAuthLoading,
        isAgeVerified,
        confirmAge,
        loginWithAuth0,
        logoutWithAuth0,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
