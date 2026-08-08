"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole, Profile } from "@/types";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { EmailNotificationService } from "@/lib/notifications/emailService";
import {
  getProfileByEmail,
  upsertProfile,
  updateProfile as updateProfileInDb,
  dbRowToUser,
  dbRowToProfile,
  profileToDbRow,
  ProfileRow,
} from "@/lib/supabase/profileService";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAgeVerified: boolean;
  confirmAge: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  login: (email: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  loginWithAuth0: (screenHint?: string) => void;
  logoutWithAuth0: (returnTo?: string) => void;
  register: (data: Partial<User> & { displayName: string }) => { success: boolean; pendingVerification: boolean; email: string };
  updateUserProfile: (newUser: User, newProfile: Profile) => void;
  impersonateUser: (targetUser: User, targetProfile: Profile) => void;
  stopImpersonating: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("MEMBER");
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
          localStorage.removeItem("intimo_active_user");
          localStorage.removeItem("intimo_active_profile");
          return;
        }
        if (!response.ok) return;
        const session = await response.json();
        if (!session?.provisioned || !session?.actor?.email) return;

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
        localStorage.setItem("intimo_active_user", JSON.stringify(freshUser));
        localStorage.setItem("intimo_active_profile", JSON.stringify(freshProfile));
      })
      .catch(() => {
        setUser(null);
        setProfile(null);
        setRole("MEMBER");
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

  // ── Update User Profile (State + localStorage cache + Supabase) ──
  const updateUserProfile = useCallback((newUser: User, newProfile: Profile) => {
    setUser(newUser);
    setProfile(newProfile);
    if (newUser.role) {
      setRole(newUser.role);
    }

    // Cache in localStorage for fast session restore
    if (typeof window !== "undefined") {
      localStorage.setItem("intimo_active_user", JSON.stringify(newUser));
      localStorage.setItem("intimo_active_profile", JSON.stringify(newProfile));
    }

    // Persist through the authenticated owner-only server boundary. Identity,
    // role, tier, and verification fields are deliberately not sent.
    fetch("/api/profile/me", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: newProfile }),
    }).catch((err) => console.error("Failed to sync profile:", err));
  }, []);

  // ── Switch Role ────────────────────────────────────────
  const switchRole = (newRole: UserRole) => {
    if (newRole === "ADMIN") {
      console.warn("Administrative roles are server-authorized and cannot be selected in the browser.");
      return;
    }
    setRole(newRole);
    if (user && profile) {
      const updatedUser: User = { ...user, role: newRole };
      const updatedProfile: Profile = { ...profile, isCoupleProfile: newRole === "COUPLE" };
      updateUserProfile(updatedUser, updatedProfile);
    }
  };

  // ── Login ──────────────────────────────────────────────
  const login = async (email: string, selectedRole: UserRole = "MEMBER"): Promise<{ success: boolean; message?: string }> => {
    const isVerified = EmailVerificationService.isEmailVerified(email);

    if (!isVerified) {
      return {
        success: false,
        message: "Email verification required. Please click the confirmation link sent to your email before signing in.",
      };
    }

    // Try to restore from Supabase first
    const { data: existingProfile } = await getProfileByEmail(email);

    if (existingProfile) {
      const restoredUser = dbRowToUser(existingProfile);
      const restoredProfile = dbRowToProfile(existingProfile);
      setUser(restoredUser);
      setProfile(restoredProfile);
      if (restoredUser.role) setRole(restoredUser.role as UserRole);
      localStorage.setItem("intimo_active_user", JSON.stringify(restoredUser));
      localStorage.setItem("intimo_active_profile", JSON.stringify(restoredProfile));
      return { success: true };
    }

    // New user — create profile in Supabase
    const authId = "usr-" + Date.now();
    const displayName = email.split("@")[0];

    const newRow: Partial<ProfileRow> = {
      display_name: displayName,
      username: displayName,
      role: selectedRole,
      member_tier: "FREE",
      verification_status: "VERIFIED",
      verification_level: "LEVEL_3_PROFILE_BIOMETRIC",
    };

    const { data: createdRow } = await upsertProfile(authId, email, newRow);

    if (createdRow) {
      const newUser = dbRowToUser(createdRow);
      const newProfile = dbRowToProfile(createdRow);
      setUser(newUser);
      setProfile(newProfile);
      if (newUser.role) setRole(newUser.role as UserRole);
      localStorage.setItem("intimo_active_user", JSON.stringify(newUser));
      localStorage.setItem("intimo_active_profile", JSON.stringify(newProfile));
    } else {
      // Fallback: set local state even if Supabase fails
      const fallbackUser: User = {
        id: authId,
        email,
        username: displayName,
        role: selectedRole,
        memberTier: "FREE",
        verificationStatus: "VERIFIED",
        verificationLevel: "LEVEL_3_PROFILE_BIOMETRIC",
        createdAt: new Date().toISOString().split("T")[0],
      };
      const fallbackProfile: Profile = {
        id: "prof-" + Date.now(),
        userId: authId,
        displayName,
        age: 28,
        gender: "FEMALE",
        sexualOrientation: "BISEXUAL",
        country: "",
        city: "",
        location: "",
        languages: ["English"],
        headline: "Intimo Member",
        bio: "Private member profile.",
        interests: ["Discreet Encounters", "Fine Dining"],
        lifestyleTags: ["Luxury Lifestyle"],
        hobbies: [],
        relationshipStatus: "SINGLE",
        lookingFor: ["Connections"],
        isCoupleProfile: false,
        publicProfileVisibility: true,
        photoVisibilityDefault: "PUBLIC",
        locationPrecision: "CITY",
        showOnlineStatus: true,
        showDistance: true,
        allowDirectMessages: true,
        requireVerificationToMessage: false,
        verified: true,
        isOnline: true,
        compatibilityScore: 90,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        coverPhotoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        galleryImages: [],
      };
      setUser(fallbackUser);
      setProfile(fallbackProfile);
      localStorage.setItem("intimo_active_user", JSON.stringify(fallbackUser));
      localStorage.setItem("intimo_active_profile", JSON.stringify(fallbackProfile));
    }

    return { success: true };
  };

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

  // ── Register ───────────────────────────────────────────
  const register = (data: Partial<User> & { displayName: string }) => {
    const userEmail = data.email || "user@intimo.live";
    const userId = "usr-" + Date.now();

    const pendingToken = EmailVerificationService.createVerificationToken(userId, userEmail);
    const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    EmailNotificationService.sendVerificationEmail(userEmail, pendingToken.token, originUrl);

    logout();

    return {
      success: true,
      pendingVerification: true,
      email: userEmail,
    };
  };

  const impersonateUser = (targetUser: User, targetProfile: Profile) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("intimo_original_admin_user", JSON.stringify(user));
      localStorage.setItem("intimo_original_admin_profile", JSON.stringify(profile));
      localStorage.setItem("intimo_active_user", JSON.stringify(targetUser));
      localStorage.setItem("intimo_active_profile", JSON.stringify(targetProfile));
    }
    setUser(targetUser);
    setProfile(targetProfile);
    if (targetUser.role) {
      setRole(targetUser.role);
    }
  };

  const stopImpersonating = () => {
    if (typeof window !== "undefined") {
      const originalUserStr = localStorage.getItem("intimo_original_admin_user");
      const originalProfileStr = localStorage.getItem("intimo_original_admin_profile");
      if (originalUserStr && originalProfileStr) {
        const originalUser = JSON.parse(originalUserStr);
        const originalProfile = JSON.parse(originalProfileStr);
        setUser(originalUser);
        setProfile(originalProfile);
        if (originalUser.role) {
          setRole(originalUser.role);
        }
        localStorage.setItem("intimo_active_user", originalUserStr);
        localStorage.setItem("intimo_active_profile", originalProfileStr);
      }
      localStorage.removeItem("intimo_original_admin_user");
      localStorage.removeItem("intimo_original_admin_profile");
    }
  };

  // ── Logout ─────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("intimo_active_user");
      localStorage.removeItem("intimo_active_profile");
      localStorage.removeItem("intimo_original_admin_user");
      localStorage.removeItem("intimo_original_admin_profile");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isAgeVerified,
        confirmAge,
        switchRole,
        login,
        loginWithAuth0,
        logoutWithAuth0,
        register,
        updateUserProfile,
        impersonateUser,
        stopImpersonating,
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
