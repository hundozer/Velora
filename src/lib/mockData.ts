import {
  Profile,
  Conversation,
  VerificationRequest,
  ReportItem,
  NotificationItem,
  ModerationLog,
  UserSafetySettings,
  ContentAlbum,
  ContentVideo,
  CreatorApplication,
  PaymentTransaction,
  PayoutRequest,
  RefundItem,
  WalletInfo,
  LiveStream,
  LiveChatMessage,
  CommunityItem,
  CommunityPost,
  VeloraEvent,
  ReferralStats,
} from "@/types";

export const CREATOR_CATEGORIES = [
  "Contemporary Art",
  "Classical Music",
  "VIP Lifestyle",
  "High Fashion",
  "Private Aviation",
  "Gourmet & Wine",
  "Luxury Fitness",
  "Couples Lifestyle",
];

export const MOCK_REFERRAL_STATS: ReferralStats = {
  uniqueCode: "VELORA-ELENA-99",
  referralLink: "https://velora.club/ref/VELORA-ELENA-99",
  clicksCount: 142,
  registrationsCount: 18,
  conversionsCount: 6,
  rewardsEarnedDays: 45,
};

export const MOCK_COMMUNITIES: CommunityItem[] = [
  {
    id: "com-1",
    name: "Monte Carlo VIP Salon & Yachting",
    slug: "monte-carlo-vip",
    description: "Private network of verified residents, yacht owners, and high-discretion luxury hosts in Monaco.",
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    type: "LOCATION_CITY",
    location: "Monaco / Monte Carlo",
    rules: ["Verification Required", "High Discretion Mandatory", "No Unsolicited Commercial Spam"],
    isPrivate: true,
    membersCount: 420,
    postsCount: 84,
    isJoined: true,
  },
  {
    id: "com-2",
    name: "Zurich & Alpine Private Dining Club",
    slug: "zurich-dining",
    description: "Exclusive monthly dinners, wine tastings, and private chalet gatherings across Switzerland.",
    coverImageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    type: "LOCATION_CITY",
    location: "Zurich / St. Moritz",
    rules: ["Biometric Verification Only", "Respect Host Privacy"],
    isPrivate: false,
    membersCount: 310,
    postsCount: 52,
    isJoined: false,
  },
  {
    id: "com-3",
    name: "Couples & Lifestyle Enthusiasts",
    slug: "couples-lifestyle",
    description: "Sophisticated bi-curious and open couples networking for elegant social events.",
    coverImageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
    type: "INTEREST_GROUP",
    location: "Global / Europe",
    rules: ["Couples & Verified Members Only", "Zero Harassment Policy"],
    isPrivate: true,
    membersCount: 890,
    postsCount: 142,
    isJoined: true,
  },
];

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    communityId: "com-1",
    authorName: "Elena Vance",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    authorBadge: "Community Host",
    title: "Exclusive Private Lounge Evening in Monte Carlo Next Thursday",
    content: "Hosting a quiet evening preview of contemporary artwork and rare champagne at the private port suite. 10 spots open for verified members.",
    mediaUrls: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"],
    likesCount: 34,
    commentsCount: 8,
    isLiked: true,
    comments: [
      {
        id: "c-1",
        postId: "post-1",
        authorName: "Julian & Sophia",
        authorAvatar: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
        content: "Count us in Elena! We will be arriving from Zurich on Wednesday.",
        createdAt: "2 hours ago",
      },
    ],
    createdAt: "4 hours ago",
  },
];

export const MOCK_EVENTS: VeloraEvent[] = [
  {
    id: "evt-1",
    hostName: "Elena Vance",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    hostBadge: "Velora Ambassador",
    title: "Monte Carlo Harbor Sunset Salon & Champagne Gala",
    description: "An intimate high-discretion gathering on a private 45m motor yacht. Live violin performance, gourmet catering, and networking with verified members.",
    eventType: "NIGHTLIFE_VIP",
    location: "Monaco / Port Hercules",
    venueName: "Superyacht 'Sirenity' - Berth 14",
    scheduledDate: "Friday, August 14 • 8:00 PM CET",
    capacity: 25,
    attendeesCount: 18,
    ticketPrice: 150.00,
    coverImageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    rules: ["Biometric Level 3 Verification Required", "Strict Dress Code: Black Tie / Cocktail", "No Unapproved Media"],
    isAttending: true,
  },
  {
    id: "evt-2",
    hostName: "Julian & Sophia",
    hostAvatar: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
    hostBadge: "Community Host",
    title: "Zurich Lake Private Villa Cocktail Soirée",
    description: "Private villa gathering for verified couples and select individuals. Architectural walkthrough, mixologist station, and acoustic jazz.",
    eventType: "SOCIAL_MEETUP",
    location: "Zurich / Kilchberg",
    venueName: "Private Villa Estate",
    scheduledDate: "Saturday, August 22 • 7:30 PM CET",
    capacity: 30,
    attendeesCount: 22,
    ticketPrice: 80.00,
    coverImageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
    rules: ["Verified Members Only", "Host Approval Required"],
    isAttending: false,
  },
];

export const MOCK_WALLET: WalletInfo = {
  id: "w-demo-1",
  userId: "usr-demo-1",
  availableBalance: 420.50,
  pendingBalance: 150.00,
  currency: "USD",
};

export const MOCK_LIVE_STREAMS: LiveStream[] = [
  {
    id: "ls-1",
    creatorId: "prof-3",
    creatorName: "Aria Thorne",
    creatorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    title: "Geneva Alpine Residence - Private Evening Solo Concert",
    description: "Exclusive live 4K WebRTC stream performing Paganini & Bach from a private chalet in the Swiss Alps.",
    category: "Classical Music",
    thumbnailUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    accessType: "TICKETED_PPV",
    ticketPrice: 20.00,
    status: "LIVE",
    scheduledStartTime: "Live Now",
    durationMinutes: 90,
    currentViewersCount: 242,
    peakViewersCount: 310,
    totalRevenue: 4840.00,
    streamUrl: "https://assets.mixkit.co/videos/preview/mixkit-classical-violinist-performing-41584-large.mp4",
    createdAt: "1 hour ago",
  },
];

export const MOCK_LIVE_CHAT: LiveChatMessage[] = [
  {
    id: "lc-1",
    streamId: "ls-1",
    senderName: "Julian & Sophia",
    senderAvatar: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80",
    content: "Breathtaking acoustics! Enjoying this from Zurich.",
    createdAt: "10:32 AM",
  },
];

export const MOCK_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: "tx-101",
    buyerUsername: "elena_vance",
    sellerUsername: "aria_thorne",
    productTitle: "Violin Solo Performance - Private Salon Concert Ticket",
    grossAmount: 20.00,
    platformCut: 3.00,
    creatorEarnings: 16.00,
    taxAmount: 1.00,
    currency: "USD",
    type: "LIVE_EXPERIENCE_TICKET",
    status: "COMPLETED",
    provider: "VELORA_WALLET",
    createdAt: "10:30 AM",
  },
];

export const MOCK_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: "po-1",
    username: "aria_thorne",
    amount: 1450.00,
    currency: "USD",
    payoutMethod: "SEPA Direct Bank Transfer",
    payoutDetails: "CH93 0000 0000 0000 0000 0",
    status: "PENDING",
    requestedAt: "2026-08-02 18:30",
  },
];

export const MOCK_REFUND_REQUESTS: RefundItem[] = [
  {
    id: "ref-1",
    username: "disappointed_member",
    productTitle: "Private Photo Unlock",
    amount: 25.00,
    reason: "Media file preview did not load due to connection timeout.",
    status: "PENDING",
    requestedAt: "2026-08-03 02:10",
  },
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: "prof-1",
    userId: "user-1",
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
    bio: "Art curator, wine enthusiast & private event hostess. Looking for high-discretion connections and exclusive dining experiences across Europe.",
    interests: ["Contemporary Art", "Fine Wine", "Private Aviation", "Yachting"],
    lifestyleTags: ["Luxury Lifestyle", "Gourmet Dining", "VIP Social Club"],
    hobbies: ["Classical Piano", "Polo", "Vintage Champagne Tasting"],
    relationshipStatus: "SINGLE",
    lookingFor: ["Dating", "Casual Connection", "Social Events", "Travel Partner"],
    isCoupleProfile: false,
    reputationBadge: "Velora Ambassador",

    categories: ["Contemporary Art", "VIP Lifestyle"],
    monthlySubscriptionPrice: 24.99,
    followersCount: 1420,
    subscribersCount: 185,
    totalContentCount: 24,

    publicProfileVisibility: true,
    photoVisibilityDefault: "PUBLIC",
    locationPrecision: "CITY",
    showOnlineStatus: true,
    showDistance: true,
    allowDirectMessages: true,
    requireVerificationToMessage: false,

    verified: true,
    verificationLevel: "LEVEL_4_CREATOR",
    isOnline: true,
    distanceKm: 4,
    compatibilityScore: 95,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    coverPhotoUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    galleryImages: [],
  },
];

export const MOCK_CREATOR_ALBUMS: ContentAlbum[] = [];
export const MOCK_CREATOR_VIDEOS: ContentVideo[] = [];
export const MOCK_CREATOR_APPLICATIONS: CreatorApplication[] = [];
export const MOCK_SAFETY_SETTINGS: UserSafetySettings = {
  whoCanMessageMe: "EVERYONE",
  allowPhotoMessages: true,
  allowRequestsFromUnknown: true,
  enableMessageFiltering: true,
  profileVisibilitySetting: "MEMBERS_ONLY",
  hideLastActive: false,
  appearInSearch: true,
  dailyMessageLimit: 50,
  messagesSentToday: 4,
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    participant: MOCK_PROFILES[0],
    lastMessage: {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "prof-1",
      senderName: "Elena Vance",
      senderAvatar: MOCK_PROFILES[0].avatarUrl,
      content: "I'll be visiting London next Thursday. Shall we meet at the Connaught Bar?",
      status: "READ",
      createdAt: "10:42 AM",
    },
    unreadCount: 1,
    updatedAt: "10:42 AM",
    isTyping: true,
  },
];

export const MOCK_VERIFICATION_REQUESTS: VerificationRequest[] = [];
export const MOCK_REPORTS: ReportItem[] = [];
export const MOCK_MODERATION_LOGS: ModerationLog[] = [];
export const MOCK_NOTIFICATIONS: NotificationItem[] = [];
