"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, Flag, Heart, ImageIcon, MapPin, MessageSquare, ShieldCheck, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ReportModal } from "@/components/safety/ReportModal";

type VisibleProfile = {
  id: string; displayName: string; age?: number; location?: string; headline?: string; bio?: string;
  profileType?: "COUPLE" | "INDIVIDUAL"; isCoupleProfile?: boolean; verified?: boolean; recentlyActive?: boolean;
  avatarUrl?: string; coverPhotoUrl?: string; interests?: string[]; lifestyleTags?: string[]; hobbies?: string[];
  lookingFor?: string[]; languages?: string[]; followersCount?: number; totalContentCount?: number;
};
type Media = { id: string; type: "IMAGE" | "VIDEO"; title: string; mediaUrl: string; publishedAt: string };
type Album = { id: string; title: string; description?: string; coverUrl?: string | null; photoCount: number };

export default function CanonicalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile: ownProfile, loginWithAuth0 } = useAuth();
  const [profile, setProfile] = useState<VisibleProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [memberView, setMemberView] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [following, setFollowing] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const authenticated = Boolean(user && ownProfile);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    let response = await fetch(`/api/profiles/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" });
    let membersOnly = response.ok;
    if (response.status === 401) response = await fetch(`/api/public/profiles/${encodeURIComponent(id)}`, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Profile unavailable"); setLoading(false); return; }
    setProfile(payload.profile); setIsOwner(Boolean(payload.ownership?.isOwner)); setMemberView(membersOnly);
    const [mediaResponse, albumResponse] = await Promise.all([
      fetch(`/api/public/media?ownerId=${encodeURIComponent(id)}&limit=12`, { cache: "no-store" }),
      fetch(`/api/public/albums?ownerId=${encodeURIComponent(id)}&limit=8`, { cache: "no-store" }),
    ]);
    if (mediaResponse.ok) setMedia((await mediaResponse.json()).media || []);
    if (albumResponse.ok) setAlbums((await albumResponse.json()).albums || []);
    if (membersOnly && !payload.ownership?.isOwner) {
      const [follows, favorites] = await Promise.all([fetch("/api/connections?type=follow", { credentials: "same-origin", cache: "no-store" }), fetch("/api/connections?type=favorite", { credentials: "same-origin", cache: "no-store" })]);
      if (follows.ok) setFollowing(((await follows.json()).connections || []).some((item: { followed_id: string }) => item.followed_id === id));
      if (favorites.ok) setFavorite(((await favorites.json()).connections || []).some((item: { followed_id: string }) => item.followed_id === id));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const setConnection = async (type: "follow" | "favorite", connected: boolean) => {
    setActionError("");
    const response = await fetch(connected ? `/api/connections?targetProfileId=${encodeURIComponent(id)}&type=${type}` : "/api/connections", connected ? { method: "DELETE", credentials: "same-origin" } : { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id, type }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setActionError(payload.error || "Action unavailable");
    type === "follow" ? setFollowing(!connected) : setFavorite(!connected);
  };

  const block = async () => {
    if (!window.confirm(`Block ${profile?.displayName || "this member"}? You will no longer see or contact each other.`)) return;
    const response = await fetch("/api/blocks", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setActionError(payload.error || "Block failed");
    router.push("/discover");
  };

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16 text-center text-white/70" aria-live="polite">Loading profile…</main>;
  if (error || !profile) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-3xl font-bold text-white">Profile unavailable</h1><p className="mt-3 text-white/60">{error || "This profile is private, blocked, or no longer available."}</p><Link href="/discover" className="mt-6 inline-block text-amber-300 underline">Browse members</Link></main>;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#111722]">
      <div className="relative h-48 bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 sm:h-64">
        {profile.coverPhotoUrl && <Image src={profile.coverPhotoUrl} alt="" fill className="object-cover opacity-70" unoptimized />}
      </div>
      <div className="relative px-5 pb-7 sm:px-9">
        <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-[#111722] bg-slate-800">
            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt={`${profile.displayName}'s profile photo`} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-amber-300">{profile.displayName.slice(0,1).toUpperCase()}</div>}
          </div>
          <div className="min-w-0 flex-1 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold text-white">{profile.displayName}{profile.age ? `, ${profile.age}` : ""}</h1>{profile.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verified</span>}</div>{profile.headline && <p className="mt-2 text-lg text-white/75">{profile.headline}</p>}<div className="mt-2 flex flex-wrap gap-3 text-sm text-white/55">{profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}<span>{profile.isCoupleProfile || profile.profileType === "COUPLE" ? "Couple profile" : "Individual profile"}</span>{profile.recentlyActive && <span className="text-emerald-300">Recently active</span>}</div></div>
          <div className="flex flex-wrap gap-2 pb-1">
            {isOwner ? <><Link href="/settings"><Button variant="outline">Edit profile</Button></Link><Link href="/albums/manage"><Button>Manage albums</Button></Link></> : authenticated ? <><Button variant={following ? "glass" : "gold"} onClick={() => void setConnection("follow", following)}><Heart className="mr-2 h-4 w-4" />{following ? "Following" : "Follow"}</Button><Button variant={favorite ? "glass" : "outline"} onClick={() => void setConnection("favorite", favorite)} aria-label={favorite ? "Remove saved profile" : "Save profile"}><Bookmark className="h-4 w-4" /></Button><Link href={`/messages?user=${encodeURIComponent(id)}`}><Button variant="glass"><MessageSquare className="mr-2 h-4 w-4" />Message</Button></Link></> : <Button onClick={() => loginWithAuth0()}>Sign in to connect</Button>}
          </div>
        </div>
        {actionError && <p className="mt-4 text-sm text-red-300" role="alert">{actionError}</p>}
      </div>
    </section>

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <div className="space-y-6">
        {(profile.bio || (profile.interests?.length || 0) > 0 || (profile.hobbies?.length || 0) > 0) && <section className="rounded-3xl border border-white/10 bg-[#111722] p-6"><h2 className="text-xl font-bold text-white">About</h2>{profile.bio && <p className="mt-3 whitespace-pre-line text-white/70">{profile.bio}</p>}{memberView && <div className="mt-5 flex flex-wrap gap-2">{[...(profile.interests || []), ...(profile.hobbies || []), ...(profile.lifestyleTags || [])].slice(0,24).map((tag) => <span key={tag} className="rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1 text-sm text-amber-200">{tag}</span>)}</div>}</section>}
        {albums.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Public albums</h2><Link href="/albums" className="text-sm text-amber-300">Browse all</Link></div><div className="grid gap-4 sm:grid-cols-2">{albums.map((album) => <Link key={album.id} href={`/album/${album.id}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111722] transition hover:border-amber-300/40">{album.coverUrl ? <div className="relative aspect-[16/10]"><Image src={album.coverUrl} alt="" fill className="object-cover" unoptimized /></div> : <div className="flex aspect-[16/10] items-center justify-center bg-slate-900"><ImageIcon className="h-9 w-9 text-white/30" /></div>}<div className="p-4"><h3 className="font-bold text-white">{album.title}</h3><p className="mt-1 text-sm text-white/55">{album.photoCount} item{album.photoCount === 1 ? "" : "s"}</p></div></Link>)}</div></section>}
        {media.length > 0 && <section><h2 className="mb-3 text-xl font-bold text-white">Public media</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{media.map((item) => <a key={item.id} href={item.mediaUrl} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-slate-900">{item.type === "IMAGE" ? <Image src={item.mediaUrl} alt={item.title} fill className="object-cover transition group-hover:scale-105" unoptimized /> : <video src={item.mediaUrl} className="h-full w-full object-cover" preload="metadata" aria-label={item.title} />}</a>)}</div></section>}
        {albums.length === 0 && media.length === 0 && isOwner && <section className="rounded-3xl border border-dashed border-white/15 p-8 text-center"><ImageIcon className="mx-auto h-8 w-8 text-white/30" /><h2 className="mt-3 font-bold text-white">No public media yet</h2><p className="mt-1 text-sm text-white/55">Create an album and publish approved media when you are ready.</p><Link href="/albums/manage" className="mt-4 inline-block text-amber-300 underline">Manage albums</Link></section>}
      </div>
      <aside className="space-y-4">
        {memberView && (profile.lookingFor?.length || profile.languages?.length) ? <section className="rounded-3xl border border-white/10 bg-[#111722] p-5"><h2 className="font-bold text-white">Profile details</h2>{profile.lookingFor?.length ? <div className="mt-4"><p className="text-xs uppercase tracking-wide text-white/40">Looking for</p><p className="mt-1 text-sm text-white/70">{profile.lookingFor.join(", ")}</p></div> : null}{profile.languages?.length ? <div className="mt-4"><p className="text-xs uppercase tracking-wide text-white/40">Languages</p><p className="mt-1 text-sm text-white/70">{profile.languages.join(", ")}</p></div> : null}</section> : null}
        {!isOwner && authenticated && <section className="rounded-3xl border border-white/10 bg-[#111722] p-5"><h2 className="font-bold text-white">Safety controls</h2><p className="mt-2 text-sm text-white/55">Reports are reviewed by the moderation team. Blocking removes contact between both accounts.</p><div className="mt-4 flex flex-col gap-2"><Button variant="ghost" className="justify-start" onClick={() => setReportOpen(true)}><Flag className="mr-2 h-4 w-4" />Report profile</Button><Button variant="ghost" className="justify-start text-red-300" onClick={() => void block()}><UserMinus className="mr-2 h-4 w-4" />Block member</Button></div></section>}
      </aside>
    </div>
    <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetUsername={profile.displayName} targetProfileId={profile.id} contentType="PROFILE" contentId={profile.id} />
  </main>;
}
