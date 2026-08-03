export type UserRole = "MEMBER" | "CREATOR" | "COUPLE" | "ADMIN";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type VerificationLevel =
  | "LEVEL_1_EMAIL"
  | "LEVEL_2_PHONE"
  | "LEVEL_3_PROFILE_BIOMETRIC"
  | "LEVEL_4_CREATOR";

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

export type ContentPublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type MessageStatus = "SENT" | "DELIVERED" | "READ";

export type PaymentType =
  | "CREATOR_SUBSCRIPTION"
  | "PREMIUM_ALBUM_UNLOCK"
  | "PRIVATE_VIDEO_UNLOCK"
  | "LIVE_EXPERIENCE_TICKET"
  | "CREATOR_TIP"
  | "WALLET_TOPUP";

export type PaymentStatus = "PENDING" | "COMPLETED" | "REFUNDED" | "FAILED";

export type PayoutStatus = "PENDING" | "APPROVED" | "PROCESSING" | "COMPLETED" | "REJECTED";

export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AttachmentType =
  | "STANDARD_IMAGE"
  | "DISAPPEARING_IMAGE"
  | "PRIVATE_PHOTO_REQUEST"
  | "AUDIO_VOICE";

export type MessagePermissionRules =
  | "EVERYONE"
  | "VERIFIED_ONLY"
  | "FAVORITES_ONLY"
  | "NOBODY";

export type NotificationType =
  | "PROFILE_VIEW"
  | "FAVORITED"
  | "NEW_MESSAGE"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "CONTENT_UNLOCKED"
  | "NEW_FOLLOWER"
  | "NEW_SUBSCRIBER"
  | "PAYMENT_RECEIVED"
  | "PAYOUT_STATUS_UPDATE"
  | "REPORT_STATUS_UPDATE";

export type ModerationActionType =
  | "WARN_USER"
  | "SUSPEND_ACCOUNT_7_DAYS"
  | "SUSPEND_ACCOUNT_30_DAYS"
  | "BAN_USER_PERMANENT"
  | "REMOVE_CONTENT";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  verificationLevel: VerificationLevel;
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

  // Creator Info if Creator
  categories?: string[];
  monthlySubscriptionPrice?: number;
  followersCount?: number;
  subscribersCount?: number;
  totalContentCount?: number;

  // Privacy & Message Permissions Settings
  publicProfileVisibility: boolean;
  photoVisibilityDefault: VisibilityLevel;
  locationPrecision: "CITY" | "EXACT" | "DISTANCE_ONLY";
  showOnlineStatus: boolean;
  showDistance: boolean;
  allowDirectMessages: boolean;
  requireVerificationToMessage: boolean;

  // Metrics & Visuals
  verified: boolean;
  verificationLevel?: VerificationLevel;
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

export interface WalletInfo {
  id: string;
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
}

export interface PaymentTransaction {
  id: string;
  buyerUsername: string;
  sellerUsername?: string;
  productTitle: string;
  grossAmount: number;
  platformCut: number;
  creatorEarnings: number;
  taxAmount: number;
  currency: string;
  type: PaymentType;
  status: PaymentStatus;
  provider: "STRIPE_CONNECT" | "ADYEN" | "VELORA_WALLET";
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  username: string;
  amount: number;
  currency: string;
  payoutMethod: string;
  payoutDetails: string;
  status: PayoutStatus;
  requestedAt: string;
  rejectionReason?: string;
}

export interface RefundItem {
  id: string;
  username: string;
  productTitle: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  requestedAt: string;
}

export interface ContentAlbum {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  category: string;
  previewImages: string[];
  lockedImages: string[];
  price: number;
  visibility: VisibilityLevel;
  publicationStatus: ContentPublicationStatus;
  totalPhotosCount: number;
  createdAt: string;
}

export interface ContentVideo {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  category: string;
  previewThumbnail: string;
  videoUrl: string;
  durationSeconds: number;
  price: number;
  visibility: VisibilityLevel;
  publicationStatus: ContentPublicationStatus;
  createdAt: string;
}

export interface CreatorApplication {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
  categories: string[];
  proposedMonthlyPrice: number;
  bio: string;
  payoutMethod: string;
  payoutDetails: string;
  status: VerificationStatus;
  submittedAt: string;
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

export interface UserSafetySettings {
  whoCanMessageMe: MessagePermissionRules;
  allowPhotoMessages: boolean;
  allowRequestsFromUnknown: boolean;
  enableMessageFiltering: boolean;
  profileVisibilitySetting: "EVERYONE" | "MEMBERS_ONLY" | "VERIFIED_ONLY";
  hideLastActive: boolean;
  appearInSearch: boolean;
  dailyMessageLimit: number;
  messagesSentToday: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  mediaUrl?: string;
  attachmentType?: AttachmentType;
  isDisappearing?: boolean;
  disappearTimerSec?: number;
  isOpened?: boolean;
  status: MessageStatus;
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
  isTyping?: boolean;
}

export interface VerificationRequest {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
  requestedLevel: VerificationLevel;
  idDocumentUrl?: string;
  selfieWithNoteUrl?: string;
  phoneVerificationCode?: string;
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
  evidenceUrl?: string;
  status: "PENDING" | "INVESTIGATING" | "RESOLVED" | "DISMISSED";
  submittedAt: string;
}

export interface ModerationLog {
  id: string;
  adminUsername: string;
  targetUsername: string;
  action: ModerationActionType;
  reason: string;
  timestamp: string;
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
