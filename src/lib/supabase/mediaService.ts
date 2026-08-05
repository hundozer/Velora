import { supabase } from "./client";

// ── Photo Album Row Type ───────────────────────────────────
export interface PhotoAlbumRow {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  photos: string[];
  photo_count: number;
  monetization: string;
  credits_price: number | null;
  category: string | null;
  topics: string[];
  views: number;
  comments: number;
  likes: number;
  status: string;
  created_at: string;
}

// ── Video Row Type ─────────────────────────────────────────
export interface VideoRow {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  monetization: string;
  credits_price: number | null;
  category: string | null;
  comment_permission: string;
  voting_permission: string;
  topics: string[];
  views: number;
  comments: number;
  likes: number;
  status: string;
  created_at: string;
}

// ── Photo Albums ───────────────────────────────────────────

export async function getAlbumsByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from("photo_albums")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: data as PhotoAlbumRow[], error: null };
}

export async function createAlbum(album: Omit<PhotoAlbumRow, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("photo_albums")
    .insert(album)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as PhotoAlbumRow, error: null };
}

export async function updateAlbum(albumId: string, updates: Partial<PhotoAlbumRow>) {
  const { data, error } = await supabase
    .from("photo_albums")
    .update(updates)
    .eq("id", albumId)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as PhotoAlbumRow, error: null };
}

export async function deleteAlbum(albumId: string, ownerId: string) {
  const { error } = await supabase
    .from("photo_albums")
    .delete()
    .eq("id", albumId)
    .eq("owner_id", ownerId);

  return { error };
}

// ── Videos ─────────────────────────────────────────────────

export async function getVideosByOwner(ownerId: string) {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: data as VideoRow[], error: null };
}

export async function createVideo(video: Omit<VideoRow, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("videos")
    .insert(video)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as VideoRow, error: null };
}

export async function updateVideo(videoId: string, updates: Partial<VideoRow>) {
  const { data, error } = await supabase
    .from("videos")
    .update(updates)
    .eq("id", videoId)
    .select()
    .single();

  if (error || !data) return { data: null, error };
  return { data: data as VideoRow, error: null };
}

export async function deleteVideo(videoId: string, ownerId: string) {
  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", videoId)
    .eq("owner_id", ownerId);

  return { error };
}
