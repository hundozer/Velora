"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, Clock, Flag, Heart, ImageIcon, MapPin, MessageSquare, ShieldCheck, UserMinus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { ReportModal } from "@/components/safety/ReportModal";
import { ProfileDesires } from "@/components/profile/ProfileDesires";
import { ProfileBoundaries } from "@/components/profile/ProfileBoundaries";
import { ProfilePlans } from "@/components/plans/ProfilePlans";
import { ProfilePrivatePhotos } from "@/components/profile/ProfilePrivatePhotos";
import { LikeButton } from "@/components/media/LikeButton";
import { LOOKING_FOR } from "@/lib/onboardingPolicy.mjs";
import { TRUST_SIGNALS, type TrustSignal } from "@/lib/trust.mjs";

const LOOKING_FOR_LABELS = new Map(LOOKING_FOR.map((item) => [item.value, item.label]));

type VisibleProfile = {
  id: string; displayName: string; age?: number; location?: string; headline?: string; bio?: string;
  profileType?: "COUPLE" | "INDIVIDUAL"; isCoupleProfile?: boolean; verified?: boolean; trustSignals?: TrustSignal[]; recentlyActive?: boolean; presenceLabel?: string | null;
  avatarUrl?: string; coverPhotoUrl?: string; interests?: string[]; lifestyleTags?: string[]; hobbies?: string[];
  lookingFor?: string[]; languages?: string[]; followersCount?: number; totalContentCount?: number;
};
type Media = { id: string; type: "IMAGE" | "VIDEO"; title: string; mediaUrl: string; publishedAt: string };
type Album = { id: string; title: string; description?: string; coverUrl?: string | null; photoCount: number };

export default function CanonicalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile: ownProfile, signIn } = useAuth();
  const [profile, setProfile] = useState<VisibleProfile | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [memberView, setMemberView] = useState(false);
  const [media, setMedia] = useState<Media[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [interest, setInterest] = useState<{ interested: boolean; mutual: boolean }>({ interested: false, mutual: false });
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
      const [favorites] = await Promise.all([fetch("/api/connections?type=favorite", { credentials: "same-origin", cache: "no-store" })]);
      const interestResponse = await fetch(`/api/interests?targetProfileId=${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" });
      if (interestResponse.ok) setInterest(await interestResponse.json());
      if (favorites.ok) setFavorite(((await favorites.json()).connections || []).some((item: { followed_id: string }) => item.followed_id === id));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const setConnection = async (type: "favorite", connected: boolean) => {
    setActionError("");
    const response = await fetch(connected ? `/api/connections?targetProfileId=${encodeURIComponent(id)}&type=${type}` : "/api/connections", connected ? { method: "DELETE", credentials: "same-origin" } : { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id, type }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setActionError(payload.error || "Action unavailable");
    setFavorite(!connected);
  };

  const toggleInterest = async () => {
    setActionError("");
    const response = interest.interested
      ? await fetch(`/api/interests?targetProfileId=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" })
      : await fetch("/api/interests", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setActionError(payload.error || "Interest unavailable");
    setInterest({ interested: Boolean(payload.interested), mutual: Boolean(payload.mutual) });
  };

  const block = async () => {
    if (!window.confirm(`Block ${profile?.displayName || "this member"}? You will no longer see or contact each other.`)) return;
    const response = await fetch("/api/blocks", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setActionError(payload.error || "Block failed");
    router.push("/discover");
  };

  if (loading) return <main className="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70" aria-live="polite">Loading profile…</main>;
  if (error || !profile) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="font-display text-5xl leading-none text-velora-ink">Profile unavailable</h1><p className="mt-3 text-ink/60">{error || "This profile is private, blocked, or no longer available."}</p><Link href="/discover" className="mt-6 inline-block text-velora-accent underline">Browse members</Link></main>;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <section className="overflow-hidden rounded-3xl border border-ink/10 bg-velora-surface">
      <div className="relative h-48 bg-gradient-to-br from-velora-blush to-velora-sunken sm:h-64">
        {profile.coverPhotoUrl && <Image src={profile.coverPhotoUrl} alt="" fill className="object-cover opacity-70" unoptimized />}
      </div>
      <div className="relative px-5 pb-7 sm:px-9">
        <div className="-mt-16 flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full border-4 border-velora-line bg-velora-sunken">
            {profile.avatarUrl ? <Image src={profile.avatarUrl} alt={`${profile.displayName}'s profile photo`} fill className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-4xl font-bold text-velora-accent">{profile.displayName.slice(0,1).toUpperCase()}</div>}
          </div>
          <div className="min-w-0 flex-1 pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-display text-5xl leading-none text-velora-ink">{profile.displayName}{profile.age ? `, ${profile.age}` : ""}</h1>{(profile.trustSignals || (profile.verified ? ["PHOTO_VERIFIED" as const] : [])).map((signal) => <span key={signal} title={TRUST_SIGNALS[signal].description} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${signal === "PHOTO_VERIFIED" ? "bg-emerald-400/10 text-emerald-700" : "bg-velora-accent/10 text-velora-accent"}`}>{signal === "PHOTO_VERIFIED" ? <ShieldCheck className="h-4 w-4" aria-hidden /> : <Clock className="h-4 w-4" aria-hidden />} {TRUST_SIGNALS[signal].label}</span>)}</div>{profile.headline && <p className="mt-2 text-lg text-ink/75">{profile.headline}</p>}<div className="mt-2 flex flex-wrap gap-3 text-sm text-ink/55">{profile.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>}<span>{profile.isCoupleProfile || profile.profileType === "COUPLE" ? "Couple profile" : "Individual profile"}</span>{profile.presenceLabel && <span className="text-emerald-700">{profile.presenceLabel}</span>}</div></div>
          <div className="flex flex-wrap gap-2 pb-1">
            {isOwner ? <><Link href="/settings"><Button variant="outline">Edit profile</Button></Link><Link href="/albums/manage"><Button>Manage albums</Button></Link></> : authenticated ? <><Button variant={interest.interested ? "glass" : "gold"} onClick={() => void toggleInterest()} aria-pressed={interest.interested}><Heart className={`mr-2 h-4 w-4 ${interest.interested ? "fill-current" : ""}`} />{interest.mutual ? "You're both interested" : interest.interested ? "Interested" : "I'm interested"}</Button><Button variant={favorite ? "glass" : "outline"} onClick={() => void setConnection("favorite", favorite)} aria-label={favorite ? "Remove saved profile" : "Save profile"}><Bookmark className="h-4 w-4" /></Button><Link href={`/messages?user=${encodeURIComponent(id)}`}><Button variant="glass"><MessageSquare className="mr-2 h-4 w-4" />Message</Button></Link></> : <Button onClick={() => signIn()}>Sign in to connect</Button>}
          </div>
        </div>
        {actionError && <p className="mt-4 text-sm text-red-700" role="alert">{actionError}</p>}
      </div>
    </section>

    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <div className="space-y-6">
        {(profile.bio || (profile.interests?.length || 0) > 0 || (profile.hobbies?.length || 0) > 0) && <section className="rounded-3xl border border-ink/10 bg-velora-surface p-6"><h2 className="text-xl font-bold text-ink">About</h2>{profile.bio && <p className="mt-3 whitespace-pre-line text-ink/70">{profile.bio}</p>}{memberView && <div className="mt-5 flex flex-wrap gap-2">{[...(profile.interests || []), ...(profile.hobbies || []), ...(profile.lifestyleTags || [])].slice(0,24).map((tag) => <span key={tag} className="rounded-full border border-velora-accent/20 bg-velora-accent/5 px-3 py-1 text-sm text-velora-accent">{tag}</span>)}</div>}</section>}
        {memberView && <ProfilePlans profileId={profile.id} />}
        {memberView && <ProfilePrivatePhotos profileId={profile.id} />}
        {memberView && <ProfileDesires profileId={profile.id} isOwner={isOwner} />}
        {albums.length > 0 && <section><div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-bold text-ink">Public albums</h2><Link href="/albums" className="text-sm text-velora-accent">Browse all</Link></div><div className="grid gap-4 sm:grid-cols-2">{albums.map((album) => <Link key={album.id} href={`/album/${album.id}`} className="overflow-hidden rounded-2xl border border-ink/10 bg-velora-surface transition hover:border-velora-accent/40">{album.coverUrl ? <div className="relative aspect-[16/10]"><Image src={album.coverUrl} alt="" fill className="object-cover" unoptimized /></div> : <div className="flex aspect-[16/10] items-center justify-center bg-velora-sunken"><ImageIcon className="h-9 w-9 text-ink/30" /></div>}<div className="p-4"><h3 className="font-bold text-ink">{album.title}</h3><p className="mt-1 text-sm text-ink/55">{album.photoCount} item{album.photoCount === 1 ? "" : "s"}</p></div></Link>)}</div></section>}
        {media.length > 0 && <section><h2 className="mb-3 text-xl font-bold text-ink">Public media</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{media.map((item) => <div key={item.id} className="relative"><a href={item.mediaUrl} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-2xl border border-ink/10 bg-velora-sunken">{item.type === "IMAGE" ? <Image src={item.mediaUrl} alt={item.title} fill className="object-cover transition group-hover:scale-105" unoptimized /> : <video src={item.mediaUrl} className="h-full w-full object-cover" preload="metadata" aria-label={item.title} />}</a>{memberView && !isOwner && <LikeButton mediaId={item.id} className="absolute bottom-2 right-2" />}</div>)}</div></section>}
        {albums.length === 0 && media.length === 0 && isOwner && <section className="rounded-3xl border border-dashed border-ink/15 p-8 text-center"><ImageIcon className="mx-auto h-8 w-8 text-ink/30" /><h2 className="mt-3 font-bold text-ink">No public media yet</h2><p className="mt-1 text-sm text-ink/55">Create an album and publish approved media when you are ready.</p><Link href="/albums/manage" className="mt-4 inline-block text-velora-accent underline">Manage albums</Link></section>}
      </div>
      <aside className="space-y-4">
        {memberView && <ProfileBoundaries profileId={profile.id} isOwner={isOwner} />}
        {memberView && (profile.lookingFor?.length || profile.languages?.length) ? <section className="rounded-3xl border border-ink/10 bg-velora-surface p-5"><h2 className="font-bold text-ink">Profile details</h2>{profile.lookingFor?.length ? <div className="mt-4"><p className="text-xs uppercase tracking-wide text-ink/40">Looking for</p><p className="mt-1 text-sm text-ink/70">{profile.lookingFor.map((value) => LOOKING_FOR_LABELS.get(value) || value).join(", ")}</p></div> : null}{profile.languages?.length ? <div className="mt-4"><p className="text-xs uppercase tracking-wide text-ink/40">Languages</p><p className="mt-1 text-sm text-ink/70">{profile.languages.join(", ")}</p></div> : null}</section> : null}
        {!isOwner && authenticated && <section className="rounded-3xl border border-ink/10 bg-velora-surface p-5"><h2 className="font-bold text-ink">Safety controls</h2><p className="mt-2 text-sm text-ink/55">Reports are reviewed by the moderation team. Blocking removes contact between both accounts.</p><div className="mt-4 flex flex-col gap-2"><Button variant="ghost" className="justify-start" onClick={() => setReportOpen(true)}><Flag className="mr-2 h-4 w-4" />Report profile</Button><Button variant="ghost" className="justify-start text-red-700" onClick={() => void block()}><UserMinus className="mr-2 h-4 w-4" />Block member</Button></div></section>}
      </aside>
    </div>
    <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetUsername={profile.displayName} targetProfileId={profile.id} contentType="PROFILE" contentId={profile.id} />
  </main>;
}
