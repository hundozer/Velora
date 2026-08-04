"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, Profile } from "@/types";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { EmailNotificationService } from "@/lib/notifications/emailService";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAgeVerified: boolean;
  confirmAge: () => void;
  switchRole: (newRole: UserRole) => void;
  login: (email: string, role?: UserRole) => { success: boolean; message?: string };
  loginWithAuth0: (screenHint?: string) => void;
  logoutWithAuth0: () => void;
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

  useEffect(() => {
    // Check local storage for persistent age verification
    const savedAgeCheck = localStorage.getItem("intimo_age_verified") || localStorage.getItem("velora_age_verified");
    if (savedAgeCheck === "true") {
      setIsAgeVerified(true);
    }

    // Restore active session from local storage or session cookie if present
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
      } else if (typeof document !== "undefined" && document.cookie.includes("intimo_user_data=")) {
        const match = document.cookie.match(/intimo_user_data=([^;]+)/);
        if (match) {
          const cookieUserData = JSON.parse(decodeURIComponent(match[1]));
          const savedNickname = localStorage.getItem(`intimo_nickname_${cookieUserData.email.toLowerCase()}`);
          const effectiveName = savedNickname || cookieUserData.username || cookieUserData.email.split("@")[0];

          const cookieUser: User = {
            id: cookieUserData.id,
            email: cookieUserData.email,
            username: effectiveName,
            role: "MEMBER",
            memberTier: "PREMIUM",
            verificationStatus: "VERIFIED",
            verificationLevel: "LEVEL_3_PROFILE_BIOMETRIC",
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
      }
    } catch (err) {
      console.error("Failed to restore session state:", err);
    }
  }, []);

  const confirmAge = () => {
    setIsAgeVerified(true);
    localStorage.setItem("intimo_age_verified", "true");
  };

  const updateUserProfile = (newUser: User, newProfile: Profile) => {
    setUser(newUser);
    setProfile(newProfile);
    if (newUser.role) {
      setRole(newUser.role);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("intimo_active_user", JSON.stringify(newUser));
      localStorage.setItem("intimo_active_profile", JSON.stringify(newProfile));
      if (newUser.email && newProfile.displayName) {
        localStorage.setItem(`intimo_nickname_${newUser.email.toLowerCase()}`, newProfile.displayName);
      }
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user && profile) {
      const updatedUser: User = {
        ...user,
        role: newRole,
      };
      const updatedProfile: Profile = {
        ...profile,
        isCoupleProfile: newRole === "COUPLE",
      };
      updateUserProfile(updatedUser, updatedProfile);
    }
  };

  const login = (email: string, selectedRole: UserRole = "MEMBER") => {
    const isVerified = EmailVerificationService.isEmailVerified(email);

    if (!isVerified) {
      return {
        success: false,
        message: "Email verification required. Please click the confirmation link sent to your email before signing in.",
      };
    }

    const newUser: User = {
      id: "usr-" + Date.now(),
      email,
      username: email.split("@")[0],
      role: selectedRole,
      memberTier: "PREMIUM",
      verificationStatus: "VERIFIED",
      verificationLevel: "LEVEL_3_PROFILE_BIOMETRIC",
      createdAt: new Date().toISOString().split("T")[0],
    };

    const newProfile: Profile = {
      id: "prof-" + Date.now(),
      userId: newUser.id,
      displayName: email.split("@")[0],
      dateOfBirth: "1998-01-01",
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

    updateUserProfile(newUser, newProfile);
    return { success: true };
  };

  const loginWithAuth0 = (screenHint?: string) => {
    if (typeof window !== "undefined") {
      const targetUrl = screenHint ? `/api/auth/login?screen_hint=${screenHint}` : "/api/auth/login";
      window.location.href = targetUrl;
    }
  };

  const logoutWithAuth0 = () => {
    logout();
    if (typeof window !== "undefined") {
      window.location.href = "/api/auth/logout";
    }
  };

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
