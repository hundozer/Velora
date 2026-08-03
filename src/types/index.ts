export type UserRole = "MEMBER" | "CREATOR" | "COUPLE" | "ADMIN";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type Gender =
  | "MALE"
  | "FEMALE"
  | "NON_BINARY"
  | "TRANSGENDER"
  | "COUPLE_MF"
  | "COUPLE_FF"
  | "COUPLE_MM"
  | "OTHER";

export type SexualOrientation =
  | "HETEROSEXUAL"
  | "BISEXUAL"
  | "HOMOSEXUAL"
  | "PANSEXUAL"
  | "FLUID"
  | "QUEER";

export type RelationshipStatus =
  | "SINGLE"
  | "ATTACHED"
  | "OPEN_RELATIONSHIP"
  | "COUPLE"
  | "SWINGER"
  | "POLYAMOROUS";

export type VisibilityLevel =
  | "PUBLIC"
  | "PRIVATE_MEMBERS"
  | "FAVORITES_ONLY"
  | "SUBSCRIBERS_ONLY"
  | "PAID_PER_VIEW";

export type NotificationType =
  | "PROFILE_VIEW"
  | "FAVORITED"
  | "NEW_MESSAGE"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "CONTENT_UNLOCKED";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  createdAt: string;
  avatarUrl?: string;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  dateOfBirth?: string;
  age: number;
  gender: Gender;
  sexualOrientation: SexualOrientation;
  country: string;
  city: string;
  location: string;
  languages: string[];
  headline?: string;
  bio: string;
  interests: string[];
  lifestyleTags: string[];
  hobbies: string[];
  relationshipStatus: RelationshipStatus;
  lookingFor: string[];
  isCoupleProfile: boolean;
  partnerDisplayName?: string;
  partnerAge?: number;
  partnerGender?: Gender;
  
  // Privacy Settings
  publicProfileVisibility: boolean;
  photoVisibilityDefault: VisibilityLevel;
  locationPrecision: "CITY" | "EXACT" | "DISTANCE_ONLY";
  showOnlineStatus: boolean;
  showDistance: boolean;
  allowDirectMessages: boolean;
  requireVerificationToMessage: boolean;
  
  // Metrics & Visuals
  verified: boolean;
  isOnline: boolean;
  distanceKm?: number;
  compatibilityScore?: number;
  coverPhotoUrl?: string;
  avatarUrl: string;
  galleryImages: MediaItem[];
}

export interface MediaItem {
  id: string;
  url: string;
  previewUrl?: string;
  type: "IMAGE" | "VIDEO" | "ALBUM";
  visibility: VisibilityLevel;
  price?: number;
  title?: string;
  sortOrder?: number;
  isProfilePhoto?: boolean;
  isCoverPhoto?: boolean;
}

export interface Preferences {
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  preferredGenders: Gender[];
  preferredOrientations: SexualOrientation[];
  preferredProfileTypes: ("INDIVIDUAL" | "COUPLE" | "CREATOR")[];
  preferredLookingFor: string[];
  verifiedOnly: boolean;
  creatorsOnly: boolean;
  photosAvailableOnly: boolean;
  onlineOnly: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actorName?: string;
  actorAvatar?: string;
  targetLink?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreatorStats {
  monthlySubscriptionPrice: number;
  subscribersCount: number;
  followersCount: number;
  totalEarnings: number;
  isLiveNow: boolean;
  nextScheduledLive?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  mediaUrl?: string;
  isLocked?: boolean;
  unlockPrice?: number;
  isUnlocked?: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: Profile;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface VerificationRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
  idDocumentUrl: string;
  selfieWithNoteUrl: string;
  submittedAt: string;
  status: VerificationStatus;
  rejectionReason?: string;
}

export interface ReportItem {
  id: string;
  reporterUsername: string;
  reportedUsername: string;
  reportedUserRole: UserRole;
  reason: string;
  details: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  submittedAt: string;
}
