"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole, Profile, VerificationStatus } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isAgeVerified: boolean;
  confirmAge: () => void;
  switchRole: (newRole: UserRole) => void;
  login: (email: string, role?: UserRole) => void;
  register: (data: Partial<User> & { displayName: string }) => void;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: "usr-demo-1",
  email: "demouser@velora.club",
  username: "elena_vance",
  role: "MEMBER",
  verificationStatus: "VERIFIED",
  verificationLevel: "LEVEL_3_PROFILE_BIOMETRIC",
  createdAt: "2026-01-15",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
};

const DEFAULT_PROFILE: Profile = {
  id: "prof-demo-1",
  userId: "usr-demo-1",
  displayName: "Elena Vance",
  dateOfBirth: "2000-04-12",
  age: 26,
  gender: "FEMALE",
  sexualOrientation: "BISEXUAL",
  country: "Monaco",
  city: "Monte Carlo",
  location: "Monaco / London",
  languages: ["English", "French", "Italian"],
  headline: "Art Curator & High-Discretion Private Hostess",
  bio: "Art curator, luxury lifestyle collector & private salon host.",
  interests: ["Contemporary Art", "Fine Wine", "Private Aviation"],
  lifestyleTags: ["Luxury Lifestyle", "Gourmet Dining"],
  hobbies: ["Classical Piano", "Polo"],
  relationshipStatus: "SINGLE",
  lookingFor: ["Discreet Connections", "Fine Dining"],
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
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  coverPhotoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  galleryImages: [],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [profile, setProfile] = useState<Profile | null>(DEFAULT_PROFILE);
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [isAgeVerified, setIsAgeVerified] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage for persistent age verification
    const savedAgeCheck = localStorage.getItem("velora_age_verified");
    if (savedAgeCheck === "true") {
      setIsAgeVerified(true);
    }
  }, []);

  const confirmAge = () => {
    setIsAgeVerified(true);
    localStorage.setItem("velora_age_verified", "true");
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updatedUser: User = {
        ...user,
        role: newRole,
        username:
          newRole === "COUPLE"
            ? "julian_and_sophia"
            : newRole === "CREATOR"
            ? "aria_thorne_creator"
            : newRole === "ADMIN"
            ? "velora_administrator"
            : "elena_vance",
      };
      setUser(updatedUser);

      if (newRole === "COUPLE" && profile) {
        setProfile({
          ...profile,
          displayName: "Julian & Sophia",
          isCoupleProfile: true,
          gender: "COUPLE_MF",
          partnerDisplayName: "Sophia",
          partnerAge: 28,
          partnerGender: "FEMALE",
        });
      } else if (newRole === "CREATOR" && profile) {
        setProfile({
          ...profile,
          displayName: "Aria Thorne",
          isCoupleProfile: false,
          gender: "FEMALE",
        });
      } else if (newRole === "ADMIN" && profile) {
        setProfile({
          ...profile,
          displayName: "Admin Operations",
          isCoupleProfile: false,
        });
      }
    }
  };

  const login = (email: string, selectedRole: UserRole = "MEMBER") => {
    const newUser: User = {
      id: "usr-" + Date.now(),
      email,
      username: email.split("@")[0],
      role: selectedRole,
      verificationStatus: "VERIFIED",
      verificationLevel: "LEVEL_3_PROFILE_BIOMETRIC",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUser(newUser);
    setRole(selectedRole);
  };

  const register = (data: Partial<User> & { displayName: string }) => {
    const newUser: User = {
      id: "usr-" + Date.now(),
      email: data.email || "user@velora.club",
      username: data.username || "new_velora_member",
      role: data.role || "MEMBER",
      verificationStatus: "PENDING",
      verificationLevel: "LEVEL_1_EMAIL",
      createdAt: new Date().toISOString().split("T")[0],
    };
    const newProfile: Profile = {
      ...DEFAULT_PROFILE,
      id: "prof-" + Date.now(),
      userId: newUser.id,
      displayName: data.displayName,
      isCoupleProfile: data.role === "COUPLE",
    };
    setUser(newUser);
    setProfile(newProfile);
    setRole(data.role || "MEMBER");
  };

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
        isAgeVerified,
        confirmAge,
        switchRole,
        login,
        register,
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
