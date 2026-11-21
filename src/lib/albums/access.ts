import { grantIsActive } from "@/lib/privateAccess.mjs";
import { getServerSupabase } from "@/lib/supabase/server";

type Db = NonNullable<ReturnType<typeof getServerSupabase>>;
type AlbumAccess = { id: string; owner_id: string; visibility: string; moderation_status: string };

export const CHOOSABLE_ALBUM_VISIBILITIES = ["MEMBERS_ONLY", "PRIVATE_APPROVED", "PRIVATE"] as const;
export const LEGACY_ALBUM_VISIBILITIES = ["FOLLOWERS_ONLY", "FRIENDS_ONLY", "PUBLIC"] as const;

// All queries use the server service-role client. Never export album grants through
// the authenticated Data API; all per-viewer decisions run on each media read.
export async function canViewAlbum(db: Db, album: AlbumAccess, viewerId: string): Promise<boolean> {
  if (viewerId === album.owner_id) return true;
  if (album.moderation_status !== "APPROVED") return false;
  if (album.visibility === "PRIVATE") return false;
  if (album.visibility === "PUBLIC" || album.visibility === "MEMBERS_ONLY") return true;
  if (album.visibility === "PRIVATE_APPROVED") {
    const { data, error } = await db.from("album_viewer_grants")
      .select("viewer_id,expires_at").eq("album_id", album.id).eq("viewer_id", viewerId).maybeSingle();
    return !error && !!data && (!data.expires_at || Date.parse(data.expires_at) > Date.now());
  }
  if (album.visibility === "FOLLOWERS_ONLY") {
    const { data, error } = await db.from("connections").select("id")
      .eq("follower_id", viewerId).eq("followed_id", album.owner_id)
      .eq("connection_type", "follow").maybeSingle();
    return !error && !!data;
  }
  if (album.visibility === "FRIENDS_ONLY") {
    const { data, error } = await db.from("friendships").select("id")
      .eq("status", "ACCEPTED")
      .or(`and(requester_id.eq.${viewerId},addressee_id.eq.${album.owner_id}),and(requester_id.eq.${album.owner_id},addressee_id.eq.${viewerId})`)
      .limit(1).maybeSingle();
    return !error && !!data;
  }
  return false;
}

// A private-photo owner-wide grant is deliberately NOT a per-album grant.
// Revocation takes effect immediately on every image request.
export async function canViewLinkedMedia(db: Db, mediaId: string, ownerId: string, viewerId: string):
  Promise<{ linked: boolean; allowed: boolean }> {
  const { data: links, error } = await db.from("media_album_items")
    .select("album_id").eq("media_id", mediaId).limit(31);
  if (error || !links || links.length > 30) return { linked: true, allowed: false };
  if (!links.length) return { linked: false, allowed: false };
  const { data: albums, error: albumError } = await db.from("media_albums")
    .select("id,owner_id,visibility,moderation_status").in("id", links.map(x => x.album_id));
  if (albumError || !albums || albums.length !== links.length)
    return { linked: true, allowed: false };
  for (const album of albums) {
    if (album.owner_id !== ownerId || !(await canViewAlbum(db, album, viewerId)))
      return { linked: true, allowed: false };
  }
  return { linked: true, allowed: true };
}
