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
  confirmAge: () => void;
  switchRole: (newRole: UserRole) => void;
  login: (email: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  loginWithAuth0: (screenHint?: string) => void;
  logoutWithAuth0: (returnTo?: string) => void;
  register: (data: Partial<User> & { displayName: string }) => { success: boolean; pendingVerification: boolean; email: string };
  updateUserProfile: (newUser: User, newProfile: Profile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(false);

  // ── Session Restoration ────────────────────────────────
  useEffect(() => {
    const savedAgeCheck = localStorage.getItem("intimo_age_verified") || localStorage.getItem("velora_age_verified");
    if (savedAgeCheck === "true") {
      setIsAgeVerified(true);
    }

    // Restore from localStorage cache first (fast), then validate with Supabase
    try {
      const savedUserStr = localStorage.getItem("intimo_active_user");
      const savedProfileStr = localStorage.getItem("intimo_active_profile");
      if (savedUserStr && savedProfileStr) {
        const parsedUser = JSON.parse(savedUserStr);
        const parsedProfile = JSON.parse(savedProfileStr);
        setUser(parsedUser);
        setProfile(parsedProfile);
        if (parsedUser.role) {
          setRole(parsedUser.role);
        }

        // Background sync: fetch latest profile from Supabase
        if (parsedUser.email) {
          getProfileByEmail(parsedUser.email)
            .then(({ data }) => {
              if (data) {
                const freshUser = dbRowToUser(data);
                const freshProfile = dbRowToProfile(data);
                setUser(freshUser);
                setProfile(freshProfile);
                if (freshUser.role) setRole(freshUser.role as UserRole);
                localStorage.setItem("intimo_active_user", JSON.stringify(freshUser));
                localStorage.setItem("intimo_active_profile", JSON.stringify(freshProfile));
              }
            })
            .catch((err) => console.error("Background profile sync error:", err));
        }
      } else if (typeof document !== "undefined" && document.cookie.includes("intimo_user_data=")) {
        const match = document.cookie.match(/intimo_user_data=([^;]+)/);
        if (match) {
          const cookieUserData = JSON.parse(decodeURIComponent(match[1]));

          // Try to load from Supabase first
          getProfileByEmail(cookieUserData.email)
            .then(({ data }) => {
              if (data) {
                const freshUser = dbRowToUser(data);
                const freshProfile = dbRowToProfile(data);
                setUser(freshUser);
                setProfile(freshProfile);
                localStorage.setItem("intimo_active_user", JSON.stringify(freshUser));
                localStorage.setItem("intimo_active_profile", JSON.stringify(freshProfile));
              } else {
              // Fallback: create from cookie data
              const savedNickname = localStorage.getItem(`intimo_nickname_${cookieUserData.email.toLowerCase()}`);
              const effectiveName = savedNickname || cookieUserData.username || cookieUserData.email.split("@")[0];

              const cookieUser: User = {
                id: cookieUserData.id,
                email: cookieUserData.email,
                username: effectiveName,
                role: "MEMBER",
                memberTier: "PREMIUM",
                verificationStatus: cookieUserData.email_verified ? "PENDING" : "UNVERIFIED",
                verificationLevel: "LEVEL_1_EMAIL",
                createdAt: new Date().toISOString().split("T")[0],
                avatarUrl: cookieUserData.avatarUrl,
              };
              const cookieProfile: Profile = {
                id: `prof_${cookieUserData.id}`,
                userId: cookieUserData.id,
                displayName: effectiveName,
                dateOfBirth: "1998-05-15",
                age: 26,
                gender: "FEMALE",
                sexualOrientation: "BISEXUAL",
                country: "",
                city: "",
                location: "",
                languages: ["English"],
                headline: "Intimo Member",
                bio: "Verified Intimo Member",
                interests: ["Private Connections"],
                lifestyleTags: ["Discreet", "Luxury Lifestyle"],
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
                compatibilityScore: 95,
                avatarUrl: cookieUserData.avatarUrl,
                coverPhotoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                galleryImages: [],
              };
              setUser(cookieUser);
              setProfile(cookieProfile);
            }
          }).catch((err) => console.error("Cookie profile sync error:", err));
        }
      }
    } catch (err) {
      console.error("Failed to restore session state:", err);
    }
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
  const confirmAge = () => {
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

    // Persist to Supabase (async, fire-and-forget)
    if (newUser.email) {
      const dbRow = profileToDbRow(newUser.id, newUser.email, newProfile, newUser);
      upsertProfile(newUser.id, newUser.email, dbRow).catch((err) => {
        console.error("Failed to sync profile to Supabase:", err);
      });
    }
  }, []);

  // ── Switch Role ────────────────────────────────────────
  const switchRole = (newRole: UserRole) => {
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
      member_tier: "PREMIUM",
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
        memberTier: "PREMIUM",
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
      const targetUrl = screenHint ? `/api/auth/login?screen_hint=${screenHint}` : "/api/auth/login";
      window.location.href = targetUrl;
    }
  };

  const logoutWithAuth0 = (returnTo?: string) => {
    logout();
    if (typeof window !== "undefined") {
      const target = returnTo ? `/api/auth/logout?returnTo=${encodeURIComponent(returnTo)}` : "/api/auth/logout";
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

  // ── Logout ─────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    setProfile(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("intimo_active_user");
      localStorage.removeItem("intimo_active_profile");
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
