"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, Heart, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Portrait, monogram } from "@/components/media/Portrait";
import { StoryAvatar } from "@/components/stories/StoryAvatar";
import { ReportModal } from "@/components/safety/ReportModal";
import { ProfilePlans } from "@/components/plans/ProfilePlans";
import { LikeButton } from "@/components/media/LikeButton";
import { desireById } from "@/lib/desires.mjs";
import { LOOKING_FOR } from "@/lib/onboardingPolicy.mjs";
import { possessive, statusLine, subject } from "@/lib/peopleCopy.mjs";
import type { BoundarySentence } from "@/lib/approach.mjs";

const LOOKING_FOR_LABELS = new Map(LOOKING_FOR.map((item) => [item.value, item.label.toLowerCase()]));
const NUMBER_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

type Profile = {
  id: string; displayName: string; age?: number; gender?: string; headline?: string; bio?: string; isCoupleProfile?: boolean; verified?: boolean;
  presence?: "ONLINE" | "TODAY" | "WEEK" | null; areaName?: string | null; distance?: string | null; avatarUrl?: string;
  interests?: string[]; hobbies?: string[]; lifestyleTags?: string[]; lookingFor?: string[]; languages?: string[];
};
type Approach = { isOwner: boolean; sentences: BoundarySentence[]; canWrite: boolean; line: string | null; established: boolean; boundaries: Record<string, string> };
type Desires = { desires: { desire_id: string; state: string }[]; shared: string[] };
type Access = { isOwner: boolean; privateCount: number; status?: string | null; active?: boolean; grantType?: string | null; expiresAt?: string | null; canRequest?: boolean };
type Media = { id: string; type: "IMAGE" | "VIDEO"; title: string; mediaUrl: string };
type Album = { id: string; title: string; coverUrl?: string | null };

const json = async <T,>(input: string, init?: RequestInit): Promise<T | null> => {
  const response = await fetch(input, { credentials: "same-origin", cache: "no-store", ...init }).catch(() => null);
  return response?.ok ? response.json().catch(() => null) : null;
};
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const listWords = (words: string[]) => words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-[34px] leading-tight text-velora-ink">{children}</h2>;
}

/**
 * A member's profile as a story (approved v33): photograph, status, name and age, their own
 * words, about, what they're into ("you too" when shared), boundaries as sentences,
 * photographs with the private-photo handshake, then "Begin a conversation".
 * Used by the sheet over People and by the full page on direct load.
 */
export function ProfileStory({ id, variant, onBack }: { id: string; variant: "sheet" | "page"; onBack: () => void }) {
  const { user, signIn } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState("");
  const [memberView, setMemberView] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [approach, setApproach] = React.useState<Approach | null>(null);
  const [desires, setDesires] = React.useState<Desires | null>(null);
  const [access, setAccess] = React.useState<Access | null>(null);
  const [privateMedia, setPrivateMedia] = React.useState<{ id: string; url: string }[]>([]);
  const [media, setMedia] = React.useState<Media[]>([]);
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [interest, setInterest] = React.useState({ interested: false, mutual: false });
  const [favorite, setFavorite] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [requesting, setRequesting] = React.useState(false);

  const loadAccess = React.useCallback(async () => {
    const next = await json<Access>(`/api/private-access?ownerId=${encodeURIComponent(id)}`);
    setAccess(next);
    if (next?.active) setPrivateMedia((await json<{ media: { id: string; url: string }[] }>(`/api/private-access/media?ownerId=${encodeURIComponent(id)}`))?.media || []);
  }, [id]);

  React.useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      const key = encodeURIComponent(id);
      // Everything the story needs, in parallel; member-only calls simply fail when signed out.
      const [profileResponse, approachPayload, desiresPayload, photosPayload, videosPayload, albumsPayload, interestPayload, favoritesPayload] = await Promise.all([
        fetch(`/api/profiles/${key}`, { credentials: "same-origin", cache: "no-store" }),
        json<Approach>(`/api/profiles/${key}/approach`),
        json<Desires>(`/api/profiles/${key}/desires`),
        json<{ media: Media[] }>(`/api/public/media?ownerId=${key}&type=IMAGE&limit=6`),
        json<{ media: Media[] }>(`/api/public/media?ownerId=${key}&type=VIDEO&limit=8`),
        json<{ albums: Album[] }>(`/api/public/albums?ownerId=${key}&limit=8`),
        json<{ interested: boolean; mutual: boolean }>(`/api/interests?targetProfileId=${key}`),
        json<{ connections: { followed_id: string }[] }>("/api/connections?type=favorite"),
        loadAccess(),
      ]);
      let response = profileResponse;
      const members = response.ok;
      if (response.status === 401) response = await fetch(`/api/public/profiles/${key}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (cancelled) return;
      if (!response.ok) { setError(payload.error || "Profile unavailable"); setState("error"); return; }
      setProfile(payload.profile);
      setIsOwner(Boolean(payload.ownership?.isOwner));
      setMemberView(members);
      setApproach(approachPayload);
      setDesires(desiresPayload);
      setMedia([...(photosPayload?.media || []), ...(videosPayload?.media || [])]);
      setAlbums(albumsPayload?.albums || []);
      if (interestPayload) setInterest(interestPayload);
      setFavorite((favoritesPayload?.connections || []).some((item) => item.followed_id === id));
      setState("ready");
    })();
    return () => { cancelled = true; };
  }, [id, loadAccess]);

  const toggleInterest = async () => {
    setNotice("");
    const response = interest.interested
      ? await fetch(`/api/interests?targetProfileId=${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" })
      : await fetch("/api/interests", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(payload.error || "Interest unavailable");
    setInterest({ interested: Boolean(payload.interested), mutual: Boolean(payload.mutual) });
  };

  const toggleFavorite = async () => {
    setMenuOpen(false);
    const response = await fetch(favorite ? `/api/connections?targetProfileId=${encodeURIComponent(id)}&type=favorite` : "/api/connections", favorite ? { method: "DELETE", credentials: "same-origin" } : { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id, type: "favorite" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(payload.error || "Action unavailable");
    setFavorite(!favorite);
  };

  const block = async () => {
    setMenuOpen(false);
    if (!window.confirm(`Block ${profile?.displayName || "this member"}? You will no longer see or contact each other.`)) return;
    const response = await fetch("/api/blocks", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(payload.error || "Block failed");
    window.location.assign("/people");
  };

  const requestPhotos = async () => {
    setRequesting(true);
    setNotice("");
    const response = await fetch("/api/private-access", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId: id }) });
    const payload = await response.json().catch(() => ({}));
    setRequesting(false);
    if (!response.ok) return setNotice(payload.error || "Your request could not be sent.");
    void loadAccess();
  };

  const backLabel = variant === "sheet" ? "Back to People" : "People";
  const BackIcon = variant === "sheet" ? ArrowDown : ArrowLeft;
  const authenticated = Boolean(user);

  if (state === "loading") {
    return (
      <div aria-live="polite" aria-busy="true">
        <TopBar onBack={onBack} backLabel={backLabel} BackIcon={BackIcon} />
        <div className="aspect-[4/5] max-h-[62svh] w-full animate-pulse bg-velora-sunken motion-reduce:animate-none" />
        <div className="space-y-3 px-6 py-6"><div className="h-4 w-48 bg-velora-sunken" /><div className="h-14 w-56 bg-velora-sunken" /></div>
        <span className="sr-only">Loading profile…</span>
      </div>
    );
  }
  if (state === "error" || !profile) {
    return (
      <div>
        <TopBar onBack={onBack} backLabel={backLabel} BackIcon={BackIcon} />
        <div className="px-6 py-16">
          <h1 className="font-display text-[44px] leading-none text-velora-ink">Profile unavailable</h1>
          <p className="mt-3 text-[16px] text-velora-ink2">{error || "This profile is private, blocked, or no longer available."}</p>
          <Link href="/people" className="mt-6 inline-flex min-h-11 items-center text-[16px] font-semibold text-velora-ink underline underline-offset-4">Back to People</Link>
        </div>
      </div>
    );
  }

  const her = possessive(profile);
  const she = subject(profile);
  const status = [statusLine({ presence: profile.presence, areaName: profile.areaName }), profile.distance, profile.verified ? "photo verified" : null].filter(Boolean).join(" · ");
  const shared = new Set(desires?.shared || []);
  const known = (desires?.desires || []).filter((row) => desireById(row.desire_id));
  const into = [...known.filter((row) => shared.has(row.desire_id)), ...known.filter((row) => !shared.has(row.desire_id) && (row.state === "LOVE" || row.state === "INTO"))];
  const curious = known.filter((row) => row.state === "CURIOUS" && !shared.has(row.desire_id));
  const limits = known.filter((row) => row.state === "HARD_LIMIT");
  const tags = memberView ? [...(profile.interests || []), ...(profile.hobbies || []), ...(profile.lifestyleTags || [])].slice(0, 16) : [];
  const label = (desireId: string) => desireById(desireId)?.label?.toLowerCase() || desireId;
  const name = profile.displayName;
  const requestsPref = approach?.boundaries?.PRIVATE_ALBUM_REQUESTS;

  return (
    <article aria-label={`${name}'s profile`}>
      <div className="relative">
        {profile.avatarUrl ? (
          <>
            <Portrait src={profile.avatarUrl} name={name} priority sizes="(min-width: 768px) 672px, 100vw" dominantColor="#191c20" className="aspect-[4/5] max-h-[62svh] w-full" monogramClassName="text-[8rem]" />
            <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-velora-night/70 to-transparent" />
            <TopBar onBack={onBack} backLabel={backLabel} BackIcon={BackIcon} overPhoto menu={memberView && !isOwner ? { open: menuOpen, setOpen: setMenuOpen, favorite, onFavorite: toggleFavorite, onReport: () => { setMenuOpen(false); setReportOpen(true); }, onBlock: block } : undefined} />
          </>
        ) : (
          <>
            <TopBar onBack={onBack} backLabel={backLabel} BackIcon={BackIcon} menu={memberView && !isOwner ? { open: menuOpen, setOpen: setMenuOpen, favorite, onFavorite: toggleFavorite, onReport: () => { setMenuOpen(false); setReportOpen(true); }, onBlock: block } : undefined} />
            <span aria-hidden className="pointer-events-none absolute right-6 top-14 font-display text-[7rem] italic leading-none text-velora-copper/15">{monogram(name)}</span>
          </>
        )}
      </div>

      <div className="space-y-10 px-6 pb-10 pt-6 sm:px-10">
        <header>
          {memberView&&<div className="mb-4"><StoryAvatar ownerId={id} name={name} src={profile.avatarUrl} size={76}/></div>}
          {status && (
            <p className="flex items-center gap-2 text-[14px] text-velora-ink2">
              {profile.presence === "ONLINE" && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-velora-copper" />}{status}
            </p>
          )}
          <h1 className="mt-1 font-display text-[clamp(3.25rem,15vw,4.75rem)] leading-[0.95] text-velora-ink">{name}{profile.age && !profile.isCoupleProfile ? `, ${profile.age}` : ""}</h1>
          {profile.headline && <p className="mt-4 font-display text-[clamp(1.5rem,6.5vw,1.9rem)] italic leading-[1.2] text-velora-ink">&ldquo;{profile.headline}&rdquo;</p>}
          {profile.bio && <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.6] text-velora-ink2">{profile.bio}</p>}
          {memberView && (profile.lookingFor?.length || profile.languages?.length) ? (
            <p className="mt-4 text-[15px] leading-relaxed text-velora-muted">
              {profile.lookingFor?.length ? <>Here for {listWords(profile.lookingFor.map((value) => LOOKING_FOR_LABELS.get(value) || value))}. </> : null}
              {profile.languages?.length ? <>Speaks {listWords(profile.languages)}.</> : null}
            </p>
          ) : null}
        </header>

        {memberView && (into.length > 0 || curious.length > 0 || tags.length > 0) && (
          <section aria-label={`What ${she}'s into`}>
            <H2>What {isOwner ? "you're" : `${she}${she === "they" ? "'re" : "'s"}`} into</H2>
            {into.length > 0 && (
              <p className="mt-3 text-[17px] leading-[1.7] text-velora-ink2">
                {into.map((row, index) => (
                  <React.Fragment key={row.desire_id}>
                    {index === 0 ? cap(label(row.desire_id)) : label(row.desire_id)}
                    {shared.has(row.desire_id) && <strong className="font-semibold text-velora-ink"> (you too)</strong>}
                    {index < into.length - 1 ? ", " : "."}
                  </React.Fragment>
                ))}
              </p>
            )}
            {curious.length > 0 && <p className="mt-2 text-[17px] leading-[1.7] text-velora-ink2">Curious about {listWords(curious.map((row) => label(row.desire_id)))}.</p>}
            {limits.length > 0 && <p className="mt-2 text-[15px] leading-[1.6] text-velora-muted">Not for {isOwner ? "you" : her === "their" ? "them" : her === "her" ? "her" : "him"}: {listWords(limits.map((row) => label(row.desire_id)))}.</p>}
            {tags.length > 0 && <p className="mt-2 text-[15px] leading-[1.6] text-velora-muted">Also: {tags.join(", ")}.</p>}
          </section>
        )}
        {memberView && isOwner && known.length === 0 && (
          <section><H2>What you&apos;re into</H2><p className="mt-3 text-[16px] text-velora-ink2">Tell members what you&apos;re into, curious about, and where your limits are. <Link href="/me/desires" className="font-semibold text-velora-ink underline underline-offset-4">Add desires</Link></p></section>
        )}

        {memberView && approach && approach.sentences.length > 0 && (
          <section aria-label="Boundaries">
            <H2>{isOwner ? "Your" : cap(her)} boundaries</H2>
            <p className="mt-3 text-[17px] leading-[1.7] text-velora-ink2">
              {approach.sentences.map((sentence) => (
                <React.Fragment key={sentence.kind + sentence.text}>
                  {sentence.appliesToViewer ? <strong className="font-semibold text-velora-ink">{sentence.text}</strong> : sentence.text}{" "}
                </React.Fragment>
              ))}
            </p>
            {isOwner && <Link href="/me/boundaries" className="mt-3 inline-flex min-h-11 items-center text-[15px] font-semibold text-velora-ink underline underline-offset-4">Edit boundaries</Link>}
          </section>
        )}

        {(media.some((item) => item.type === "IMAGE") || (access && access.privateCount > 0)) && (
          <section aria-label="Photographs">
            <H2>Photographs</H2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {media.filter((item) => item.type === "IMAGE").slice(0, 6).map((item, index) => (
                <div key={item.id} className={`relative ${index === 0 && media.length > 1 ? "col-span-2 row-span-2" : ""}`}>
                  <a href={item.mediaUrl} target="_blank" rel="noreferrer" aria-label={`Open photograph ${index + 1} of ${name}`} className="block h-full">
                    <Portrait src={item.mediaUrl} name={name} sizes="(min-width: 768px) 440px, 66vw" className="aspect-[4/5] h-full w-full" />
                  </a>
                  {memberView && !isOwner && <LikeButton mediaId={item.id} className="absolute bottom-2 right-2" />}
                </div>
              ))}
              {access?.active
                ? privateMedia.map((item) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={item.id} src={item.url} alt="" className="aspect-[4/5] w-full object-cover" onContextMenu={(event) => event.preventDefault()} draggable={false} />
                ))
                : access && access.privateCount > 0 && !access.isOwner && Array.from({ length: Math.min(access.privateCount, 2) }, (_, index) => (
                  <div key={index} className="flex aspect-[4/5] items-center justify-center bg-velora-sunken text-[14px] text-velora-ink2">{index === 0 ? "Private" : ""}</div>
                ))}
            </div>
            <PrivatePhotoWords access={access} name={name} she={she} requestsPreference={requestsPref} established={Boolean(approach?.established)} requesting={requesting} onRequest={requestPhotos} />
          </section>
        )}

        {memberView && <ProfilePlans profileId={profile.id} />}

        {albums.length > 0 && (
          <section aria-label="Albums">
            <H2>Albums</H2>
            <div className="mt-4 grid grid-cols-2 gap-3">{albums.map((album) => <Link key={album.id} href={`/album/${album.id}`} className="overflow-hidden rounded-xl border border-velora-line bg-velora-surface"><div className="aspect-[4/3] bg-velora-sunken">{album.coverUrl && <Portrait src={album.coverUrl} name={album.title} sizes="(min-width: 768px) 220px, 45vw" className="h-full w-full" />}</div><span className="block p-3 font-semibold text-velora-ink">{album.title}</span></Link>)}</div>
          </section>
        )}
        {media.some((item) => item.type === "VIDEO") && <section aria-label="Videos"><H2>Videos</H2><div className="mt-4 grid grid-cols-2 gap-3">{media.filter((item) => item.type === "VIDEO").map((item) => <div key={item.id} className="overflow-hidden rounded-xl border border-velora-line bg-velora-surface"><video src={item.mediaUrl} controls preload="none" playsInline className="aspect-video w-full bg-black object-contain" aria-label={item.title} /><p className="p-3 font-semibold text-velora-ink">{item.title}</p></div>)}</div></section>}
        {notice && <p role="status" className="border-l-2 border-velora-copper pl-4 text-[15px] text-velora-ink2">{notice}</p>}
      </div>

      <footer className={`sticky ${variant === "sheet" ? "bottom-0" : "bottom-16 md:bottom-0"} z-30 border-t border-velora-line bg-velora-surface/95 px-6 pb-4 pt-3 backdrop-blur md:bottom-0 sm:px-10`}>
        <div className="mx-auto max-w-2xl">
          {isOwner ? (
            <div className="flex items-center gap-6">
              <Link href="/settings" className="flex min-h-14 flex-1 items-center justify-center rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper">Edit profile</Link>
              <Link href="/albums/manage" className="min-h-11 text-[16px] text-velora-ink underline underline-offset-4">Albums</Link>
              <Link href="/videos/upload" className="min-h-11 text-[16px] text-velora-ink underline underline-offset-4">Add video</Link>
            </div>
          ) : !authenticated || !memberView ? (
            <button type="button" onClick={() => signIn()} className="flex min-h-14 w-full items-center justify-center rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper">Sign in to connect</button>
          ) : (
            <>
              {approach?.line && <p className="mb-2 text-[14px] text-velora-ink2">{approach.line}</p>}
              <div className="flex items-center gap-3">
                {approach?.canWrite !== false ? (
                  <Link href={`/messages?user=${encodeURIComponent(profile.id)}`} className="flex min-h-14 flex-1 items-center justify-center rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper hover:bg-velora-accentHover">
                    {approach?.established ? "Continue the conversation" : "Begin a conversation"}
                  </Link>
                ) : (
                  <span aria-disabled="true" className="flex min-h-14 flex-1 items-center justify-center rounded-full border border-velora-line text-[16px] text-velora-muted">Not taking first messages</span>
                )}
                <button type="button" onClick={() => void toggleInterest()} aria-pressed={interest.interested} aria-label={interest.mutual ? "You're both interested" : interest.interested ? "Interested — tap to undo" : "I'm interested"} title={interest.mutual ? "You're both interested" : "I'm interested"} className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${interest.interested ? "border-velora-copper bg-velora-copper/10 text-velora-copperInk" : "border-velora-line text-velora-copperInk hover:border-velora-copper"}`}>
                  <Heart className={`h-5 w-5 ${interest.interested ? "fill-current" : ""}`} aria-hidden />
                </button>
              </div>
              {interest.mutual && <p className="mt-2 text-[14px] text-velora-copperInk">You&apos;re both interested.</p>}
            </>
          )}
        </div>
      </footer>
      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetUsername={name} targetProfileId={profile.id} contentType="PROFILE" contentId={profile.id} />
    </article>
  );
}

type Menu = { open: boolean; setOpen: (open: boolean) => void; favorite: boolean; onFavorite: () => void; onReport: () => void; onBlock: () => void };

function TopBar({ onBack, backLabel, BackIcon, overPhoto = false, menu }: { onBack: () => void; backLabel: string; BackIcon: typeof ArrowDown; overPhoto?: boolean; menu?: Menu }) {
  const tone = overPhoto ? "text-velora-onPhoto" : "text-velora-ink";
  return (
    <div className={`${overPhoto ? "absolute inset-x-0 top-0" : "relative"} z-10 flex items-center justify-between px-4 pt-2 sm:px-8`}>
      <button type="button" onClick={onBack} className={`inline-flex min-h-11 items-center gap-1.5 text-[16px] font-semibold ${tone}`}><BackIcon className="h-4 w-4" aria-hidden />{backLabel}</button>
      {menu && (
        <div className="relative">
          <button type="button" aria-label="More" aria-haspopup="menu" aria-expanded={menu.open} onClick={() => menu.setOpen(!menu.open)} className={`flex h-11 w-11 items-center justify-center ${tone}`}><MoreHorizontal className="h-5 w-5" aria-hidden /></button>
          {menu.open && (
            <div role="menu" className="absolute right-0 top-11 z-20 w-56 border border-velora-line bg-velora-surface py-2 shadow-card">
              <button role="menuitem" type="button" onClick={menu.onFavorite} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-ink hover:bg-velora-sunken">{menu.favorite ? "Remove from saved" : "Save profile"}</button>
              <button role="menuitem" type="button" onClick={menu.onReport} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-ink hover:bg-velora-sunken">Report</button>
              <button role="menuitem" type="button" onClick={menu.onBlock} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-crimson hover:bg-velora-sunken">Block</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** The words under Photographs: every private-photo state, phrased neutrally. */
function PrivatePhotoWords({ access, name, she, requestsPreference, established, requesting, onRequest }: {
  access: Access | null; name: string; she: string; requestsPreference?: string; established: boolean; requesting: boolean; onRequest: () => void;
}) {
  if (!access || access.privateCount === 0) return null;
  const count = `${NUMBER_WORDS[access.privateCount] ?? "Some"} private photograph${access.privateCount === 1 ? "" : "s"}`;
  const stops = she === "they" ? "they stop" : `${she} stops`;
  const choose = she === "they" ? "they choose" : `${she} chooses`;
  if (access.isOwner) return <p className="mt-3 text-[15px] text-velora-ink2">{count}, seen only by people you approve. <Link href="/me/private-photos" className="font-semibold text-velora-ink underline underline-offset-4">Manage access</Link></p>;
  if (access.active) return <p className="mt-3 text-[15px] text-velora-ink2">{access.grantType === "ONCE" && access.expiresAt ? `Shared with you until ${new Date(access.expiresAt).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}.` : `Shared with you until ${stops}.`} Please don&apos;t save or share them.</p>;
  if (access.status === "REQUESTED") return <p className="mt-3 text-[15px] text-velora-ink2">{count}. You asked to see them — {name} will decide.</p>;
  if (requestsPreference === "NOT_INTERESTED") return <p className="mt-3 text-[15px] text-velora-ink2">{count}, kept private.</p>;
  if (requestsPreference === "ASK_FIRST" && !established) return <p className="mt-3 text-[15px] text-velora-ink2">{count}. {name} takes requests once you&apos;re talking — {choose} 24 hours, until {stops}, or not now.</p>;
  if (!access.canRequest) return <p className="mt-3 text-[15px] text-velora-ink2">{count}. You can ask again in a few days.</p>;
  return (
    <div className="mt-3">
      <p className="text-[15px] text-velora-ink2">{count}. If you ask, {name} chooses: 24 hours, until {stops}, or not now.</p>
      <button type="button" onClick={onRequest} disabled={requesting} className="mt-2 inline-flex min-h-11 items-center text-[16px] font-semibold text-velora-ink underline underline-offset-4 disabled:opacity-50">Ask to see them</button>
    </div>
  );
}
