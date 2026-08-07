export interface ChatMember {
  id: string;
  displayName: string;
  avatarUrl: string;
  gender: "FEMALE" | "MALE" | "COUPLE" | "TRANSGENDER";
  genderSymbol: string;
  age: number;
  location: string;
  isVerified: boolean;
  isOnline: boolean;
  statusText?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderGender: "FEMALE" | "MALE" | "COUPLE" | "TRANSGENDER";
  senderGenderSymbol: string;
  senderVerified: boolean;
  text: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface CommunityChatroom {
  id: string;
  name: string;
  slug: string;
  icon: string;
  badge: string;
  description: string;
  activeOnlineCount: number;
  members: ChatMember[];
  messages: ChatMessage[];
}

export const DEFAULT_COMMUNITY_CHATROOMS: CommunityChatroom[] = [
  {
    id: "room-sexpartner-finder",
    name: "SexPartner Finder",
    slug: "sexpartner-finder",
    icon: "🔥",
    badge: "Discreet Hookups & Encounters",
    description: "Real-time adult lounge for verified singles & couples seeking discreet local adult encounters, chemistry, and casual meetings.",
    activeOnlineCount: 0,
    members: [],
    messages: [],
  },
  {
    id: "room-chatting",
    name: "Chatting",
    slug: "chatting",
    icon: "💬",
    badge: "Open Lounge & Casual Talk",
    description: "Relaxed, adult open lounge to socialize, chat, share lifestyle stories, and meet members from around Europe.",
    activeOnlineCount: 0,
    members: [],
    messages: [],
  },
  {
    id: "room-bdsm",
    name: "BDSM",
    slug: "bdsm",
    icon: "⛓️",
    badge: "Kink, Fetish & Leather",
    description: "Dedicated safe space for BDSM, Dominance, Submission, Shibari, bondage, and adult kink discussions.",
    activeOnlineCount: 0,
    members: [],
    messages: [],
  },
  {
    id: "room-wet-dreams",
    name: "Wet dreams",
    slug: "wet-dreams",
    icon: "🌙",
    badge: "Erotic Fantasies & Confessions",
    description: "Share intimate night dreams, erotic fantasies, sensory desires, and passionate adult secrets in confidence.",
    activeOnlineCount: 0,
    members: [],
    messages: [],
  },
  {
    id: "room-gay-lesbi-bi",
    name: "Gay/Lesbi/Bi",
    slug: "gay-lesbi-bi",
    icon: "🌈",
    badge: "LGBTQ+ Intimate Circle",
    description: "Vibrant, inclusive chatroom for Gay, Lesbian, Bisexual, Transgender, and Queer adult connections across Europe.",
    activeOnlineCount: 0,
    members: [],
    messages: [],
  },
];
