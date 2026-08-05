import { supabase } from "./client";

// ── Database Row Type ──────────────────────────────────────
export interface DatingAdRow {
  id: string;
  author_id: string | null;
  author_name: string;
  author_avatar: string | null;
  is_verified: boolean;
  category: string;
  title: string;
  text: string;
  photo_url: string | null;
  validity_days: number;
  country: string | null;
  region: string | null;
  allowed_reply_genders: string[];
  transgender_option: string;
  min_age: number;
  max_age: number;
  require_vip: boolean;
  require_media: boolean;
  require_verified: boolean;
  status: string;
  created_at: string;
}

// ── App-side type (matches dating/page.tsx DatingAdItem) ──
export interface DatingAdItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isVerified: boolean;
  category: string;
  title: string;
  text: string;
  photoUrl?: string;
  validityDays: number;
  country: string;
  region: string;
  allowedReplyGenders: string[];
  transgenderOption: "Including trans" | "Excluding trans" | "Only trans";
  minAge: number;
  maxAge: number;
  requireVip: boolean;
  requireMedia: boolean;
  requireVerified: boolean;
  createdAt: string;
  status: "active" | "expired";
  daysLeft: number;
  saved: boolean;
}

// ── Converter ──────────────────────────────────────────────

export function dbRowToDatingAd(row: DatingAdRow): DatingAdItem {
  const createdDate = new Date(row.created_at);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, row.validity_days - diffDays);

  return {
    id: row.id,
    authorId: row.author_id || "",
    authorName: row.author_name,
    authorAvatar: row.author_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    isVerified: row.is_verified,
    category: row.category,
    title: row.title,
    text: row.text,
    photoUrl: row.photo_url || undefined,
    validityDays: row.validity_days,
    country: row.country || "",
    region: row.region || "",
    allowedReplyGenders: row.allowed_reply_genders || ["♀"],
    transgenderOption: row.transgender_option as any,
    minAge: row.min_age,
    maxAge: row.max_age,
    requireVip: row.require_vip,
    requireMedia: row.require_media,
    requireVerified: row.require_verified,
    createdAt: formatTimeAgo(createdDate),
    status: daysLeft > 0 ? "active" : "expired",
    daysLeft,
    saved: false,
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Service Functions ──────────────────────────────────────

export async function getAllActiveAds() {
  const { data, error } = await supabase
    .from("dating_ads")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: (data as DatingAdRow[]).map(dbRowToDatingAd), error: null };
}

export async function getAdsByAuthor(authorId: string) {
  const { data, error } = await supabase
    .from("dating_ads")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: (data as DatingAdRow[]).map(dbRowToDatingAd), error: null };
}

export async function createAd(ad: Omit<DatingAdRow, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("dating_ads")
    .insert(ad)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: dbRowToDatingAd(data as DatingAdRow), error: null };
}

export async function deleteAd(adId: string, authorId: string) {
  const { error } = await supabase
    .from("dating_ads")
    .delete()
    .eq("id", adId)
    .eq("author_id", authorId);

  return { error };
}

export async function updateAdStatus(adId: string, status: string) {
  const { data, error } = await supabase
    .from("dating_ads")
    .update({ status })
    .eq("id", adId)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: dbRowToDatingAd(data as DatingAdRow), error: null };
}
