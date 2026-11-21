"use client";
import { ORIENTATIONS } from "@/lib/identity.mjs";

import { tr } from "@/lib/i18n/translate";
import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, Heart, MoreHorizontal, UserRoundPlus, UsersRound, Bookmark } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Portrait, monogram } from "@/components/media/Portrait";
import { StoryAvatar } from "@/components/stories/StoryAvatar";
import { ReportModal } from "@/components/safety/ReportModal";
import { ProfilePlans } from "@/components/plans/ProfilePlans";
import { FoundingMemberBadge } from "@/components/community/FoundingMemberBadge";
import { LikeButton } from "@/components/media/LikeButton";
import { desireById } from "@/lib/desires.mjs";
import { LOOKING_FOR } from "@/lib/onboardingPolicy.mjs";
import { possessive, statusLine, subject } from "@/lib/peopleCopy.mjs";
import type { BoundarySentence } from "@/lib/approach.mjs";

const LOOKING_FOR_LABELS = new Map(LOOKING_FOR.map((item) => [item.value, item.label]));

type Profile = {
  id: string; displayName: string; age?: number; gender?: string; headline?: string; bio?: string; isCoupleProfile?: boolean; verified?: boolean; foundingMember?: boolean;
  presence?: "ONLINE" | "TODAY" | "WEEK" | null; areaName?: string | null; distance?: string | null; avatarUrl?: string;
  interests?: string[]; hobbies?: string[]; lifestyleTags?: string[]; lookingFor?: string[]; languages?: string[];
  // FM-09: present only when the viewer is in the member's chosen audience (server-side).
  sexualOrientation?: string; orientationNote?: string; genderNote?: string; pronouns?: string;
};
type Approach = { isOwner: boolean; sentences: BoundarySentence[]; canWrite: boolean; line: string | null; established: boolean; boundaries: Record<string, string> };
type Desires = { desires: { desire_id: string; state: string }[]; shared: string[] };
type Media = { id: string; type: "IMAGE" | "VIDEO"; title: string; mediaUrl: string };
type Album = { id: string; title: string; coverUrl?: string | null };

const json = async <T,>(input: string, init?: RequestInit): Promise<T | null> => {
  const response = await fetch(input, { credentials: "same-origin", cache: "no-store", ...init }).catch(() => null);
  return response?.ok ? response.json().catch(() => null) : null;
};
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const listWords = (words: string[]) => words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} ${tr("and")} ${words[words.length - 1]}`;

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="intimo-member-subheading text-velora-ink">{children}</h2>;
}

/**
 * A member's profile as a story (approved v33): photograph, status, name and age, their own
 * words, about, what they're into ("you too" when shared), boundaries as sentences,
 * photographs with the private-photo handshake, then "Begin a conversation".
 * Used by the sheet over People and by the full page on direct load.
 */
export function ProfileStory({ id, variant, onBack }: { id: string; variant: "sheet" | "page"; onBack: () => void }) {
  const { t } = useTranslation();
  const { user, signIn } = useAuth();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState("");
  const [memberView, setMemberView] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [approach, setApproach] = React.useState<Approach | null>(null);
  const [desires, setDesires] = React.useState<Desires | null>(null);
  const [media, setMedia] = React.useState<Media[]>([]);
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [privateAlbums, setPrivateAlbums] = React.useState<Album[]>([]);
  const [interest, setInterest] = React.useState({ interested: false, mutual: false });
  const [favorite, setFavorite] = React.useState(false);
  const [friendStatus, setFriendStatus] = React.useState<"NONE" | "OUTGOING" | "INCOMING" | "FRIENDS" | null>(null);
  const [friendBusy, setFriendBusy] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [notice, setNotice] = React.useState("");

  const loadAccess = React.useCallback(async () => {
    // Album-specific grants only: old global photo approvals do not grant
    // access to arbitrary private media or another hidden album.
    const privateContent = await json<{ media: { id: string; url: string }[]; albums: Album[] }>(
      `/api/private-access/media?ownerId=${encodeURIComponent(id)}`);
    setPrivateAlbums(privateContent?.albums || []);
  }, [id]);

  React.useEffect(() => {
    let cancelled = false;
    setState("loading");
    (async () => {
      const key = encodeURIComponent(id);
      // Everything the story needs, in parallel; member-only calls simply fail when signed out.
      const [profileResponse, approachPayload, desiresPayload, photosPayload, videosPayload, albumsPayload, interestPayload, favoritesPayload, friendsPayload] = await Promise.all([
        fetch(`/api/profiles/${key}`, { credentials: "same-origin", cache: "no-store" }),
        json<Approach>(`/api/profiles/${key}/approach`),
        json<Desires>(`/api/profiles/${key}/desires`),
        json<{ media: Media[] }>(`/api/public/media?ownerId=${key}&type=IMAGE&limit=6`),
        json<{ media: Media[] }>(`/api/public/media?ownerId=${key}&type=VIDEO&limit=8`),
        json<{ albums: Album[] }>(`/api/public/albums?ownerId=${key}&limit=8`),
        json<{ interested: boolean; mutual: boolean }>(`/api/interests?targetProfileId=${key}`),
        json<{ connections: { followed_id: string }[] }>("/api/connections?type=favorite"),
        json<{ status: "NONE" | "OUTGOING" | "INCOMING" | "FRIENDS" }>(`/api/friends?targetProfileId=${key}`),
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
      setFriendStatus(friendsPayload?.status ?? null);
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

  const friendAction = async (action: "REQUEST" | "ACCEPT" | "DECLINE" | "REMOVE") => {
    if (friendBusy) return;
    setFriendBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/friends", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id, action }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setNotice(payload.error || "Connection unavailable"); return; }
      const latest = await json<{ status: "NONE" | "OUTGOING" | "INCOMING" | "FRIENDS" }>(`/api/friends?targetProfileId=${encodeURIComponent(id)}`);
      setFriendStatus(latest?.status ?? (action === "REQUEST" ? "OUTGOING" : action === "ACCEPT" ? "FRIENDS" : "NONE"));
      if (action === "ACCEPT" || action === "REMOVE") {
        const refreshedApproach = await json<Approach>(`/api/profiles/${encodeURIComponent(id)}/approach`);
        if (refreshedApproach) setApproach(refreshedApproach);
      }
      setNotice(action === "REQUEST" ? "Connection request sent." : action === "ACCEPT" ? "You are now connected." : action === "DECLINE" ? "Connection request dismissed." : "Connection removed.");
    } catch { setNotice("Connection unavailable. Try again."); }
    finally { setFriendBusy(false); }
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
    if (!window.confirm(t("Block {value}? You will no longer see or contact each other.", { value: profile?.displayName || "this member" }))) return;
    const response = await fetch("/api/blocks", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: id }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(payload.error || "Block failed");
    window.location.assign("/people");
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
        <span className="sr-only">{t("Loading profile…")}</span>
      </div>
    );
  }
  if (state === "error" || !profile) {
    return (
      <div>
        <TopBar onBack={onBack} backLabel={backLabel} BackIcon={BackIcon} />
        <div className="px-6 py-16">
          <h1 className="font-display text-[44px] leading-none text-velora-ink">{t("Profile unavailable")}</h1>
          <p className="mt-3 text-[16px] text-velora-ink2">{t(error) || t("This profile is private, blocked, or no longer available.")}</p>
          <Link href="/people" className="mt-6 inline-flex min-h-11 items-center text-[16px] font-semibold text-velora-ink underline underline-offset-4">{t("Back to People")}</Link>
        </div>
      </div>
    );
  }

  const her = possessive(profile);
  const she = subject(profile);
  // FM-09 identity details, in the member's own words where given.
  const orientationLabel = profile.sexualOrientation ? ORIENTATIONS.find((item) => item.value === profile.sexualOrientation)?.label : undefined;
  const identityLine = [orientationLabel ? t(orientationLabel) : null, profile.orientationNote || null, profile.genderNote || null].filter((part): part is string => Boolean(part));
  const status = [statusLine({ presence: profile.presence, areaName: profile.areaName }, t), profile.distance, profile.verified ? "photo verified" : null].filter(Boolean).join(" · ");
  const shared = new Set(desires?.shared || []);
  const known = (desires?.desires || []).filter((row) => desireById(row.desire_id));
  const into = [...known.filter((row) => shared.has(row.desire_id)), ...known.filter((row) => !shared.has(row.desire_id) && (row.state === "LOVE" || row.state === "INTO"))];
  const curious = known.filter((row) => row.state === "CURIOUS" && !shared.has(row.desire_id));
  const limits = known.filter((row) => row.state === "HARD_LIMIT");
  const tags = memberView ? [...(profile.interests || []), ...(profile.hobbies || []), ...(profile.lifestyleTags || [])].slice(0, 16) : [];
  const label = (desireId: string) => { const found = desireById(desireId)?.label; return found ? t(found).toLowerCase() : desireId; };
  const name = profile.displayName;

  return (
    <article className="intimo-member-page" aria-label={t("{name}'s profile", { name: name })}>
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

      <div className="space-y-10 px-6 pb-12 pt-9 sm:px-10">
        <header>
          {memberView&&<div className="mb-4"><StoryAvatar ownerId={id} name={name} src={profile.avatarUrl} size={76}/></div>}
          {status && (
            <p className="flex items-center gap-2 text-[14px] text-velora-ink2">
              {profile.presence === "ONLINE" && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-velora-copper" />}{t(status)}
            </p>
          )}
          <h1 className="mt-2 font-serif text-[clamp(3.8rem,15vw,6.5rem)] font-normal leading-[0.92] tracking-tight text-velora-ink">{name}{profile.age && !profile.isCoupleProfile ? `, ${profile.age}` : ""}</h1>
          {(profile.pronouns || identityLine.length > 0) && (
            <p className="mt-3 text-[15px] leading-relaxed text-velora-ink2">
              {profile.pronouns && <span className="mr-2 rounded-full border border-ink/15 px-2.5 py-0.5 text-[13px] text-velora-ink">{profile.pronouns}</span>}
              {identityLine.join(" · ")}
            </p>
          )}
          {profile.foundingMember && <div className="mt-3"><FoundingMemberBadge /></div>}
          {profile.headline && <p className="mt-5 font-serif text-[clamp(1.85rem,6.5vw,2.5rem)] italic font-normal leading-[1.15] text-velora-warm">&ldquo;{profile.headline}&rdquo;</p>}
          {profile.bio && <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.6] text-velora-ink2">{profile.bio}</p>}
          {memberView && (profile.lookingFor?.length || profile.languages?.length) ? (
            <p className="mt-4 text-[15px] leading-relaxed text-velora-muted">
              {profile.lookingFor?.length ? <>{t("Here for")}{" "}{listWords(profile.lookingFor.map((value) => { const found = LOOKING_FOR_LABELS.get(value); return found ? t(found).toLowerCase() : value; }))}. </> : null}
              {profile.languages?.length ? <>{t("Speaks {listWords}.", { listWords: listWords(profile.languages) })}</> : null}
            </p>
          ) : null}
        </header>

        {memberView && (into.length > 0 || curious.length > 0 || tags.length > 0) && (
          <section aria-label={t("What {she}'s into", { she: she })}>
            <H2>{t("What")}{" "}{isOwner ? t("you're") : `${she}${she === "they" ? "'re" : "'s"}`} into</H2>
            {into.length > 0 && (
              <p className="mt-3 text-[17px] leading-[1.7] text-velora-ink2">
                {into.map((row, index) => (
                  <React.Fragment key={row.desire_id}>
                    {index === 0 ? cap(label(row.desire_id)) : label(row.desire_id)}
                    {shared.has(row.desire_id) && <strong className="font-semibold text-velora-ink">{" "}{t("(you too)")}</strong>}
                    {index < into.length - 1 ? ", " : "."}
                  </React.Fragment>
                ))}
              </p>
            )}
            {curious.length > 0 && <p className="mt-2 text-[17px] leading-[1.7] text-velora-ink2">{t("Curious about")}{" "}{listWords(curious.map((row) => label(row.desire_id)))}.</p>}
            {limits.length > 0 && <p className="mt-2 text-[15px] leading-[1.6] text-velora-muted">{t("Not for")}{" "}{isOwner ? t("you") : her === "their" ? "them" : her === "her" ? "her" : "him"}: {listWords(limits.map((row) => label(row.desire_id)))}.</p>}
            {tags.length > 0 && <p className="mt-2 text-[15px] leading-[1.6] text-velora-muted">{t("Also: {join}.", { join: tags.join(", ") })}</p>}
          </section>
        )}
        {memberView && isOwner && known.length === 0 && (
          <section><H2>{t("What you're into")}</H2><p className="mt-3 text-[16px] text-velora-ink2">{t("Tell members what you're into, curious about, and where your limits are.")}{" "}<Link href="/me/desires" className="font-semibold text-velora-ink underline underline-offset-4">{t("Add desires")}</Link></p></section>
        )}

        {memberView && approach && approach.sentences.length > 0 && (
          <section aria-label={t("Boundaries")}>
            <H2>{isOwner ? t("Your") : cap(her)} boundaries</H2>
            <p className="mt-3 text-[17px] leading-[1.7] text-velora-ink2">
              {approach.sentences.map((sentence) => (
                <React.Fragment key={sentence.kind + sentence.text}>
                  {sentence.appliesToViewer ? <strong className="font-semibold text-velora-ink">{t(sentence.text)}</strong> : t(sentence.text)}{" "}
                </React.Fragment>
              ))}
            </p>
            {isOwner && <Link href="/me/boundaries" className="mt-3 inline-flex min-h-11 items-center text-[15px] font-semibold text-velora-ink underline underline-offset-4">{t("Edit boundaries")}</Link>}
          </section>
        )}

        {media.some((item) => item.type === "IMAGE") && (
          <section aria-label={t("Photographs")}>
            <H2>{t("Photographs")}</H2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {media.filter((item) => item.type === "IMAGE").slice(0, 6).map((item, index) => (
                <div key={item.id} className={`relative ${index === 0 && media.length > 1 ? "col-span-2 row-span-2" : ""}`}>
                  <a href={item.mediaUrl} target="_blank" rel="noreferrer" aria-label={t("Open photograph {value} of {name}", { value: index + 1, name: name })} className="block h-full">
                    <Portrait src={item.mediaUrl} name={name} sizes="(min-width: 768px) 440px, 66vw" className="aspect-[4/5] h-full w-full" />
                  </a>
                  {memberView && !isOwner && <LikeButton mediaId={item.id} className="absolute bottom-2 right-2" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {memberView && <ProfilePlans profileId={profile.id} />}

        {(albums.length > 0 || privateAlbums.length > 0) && (
          <section aria-label={t("Albums")}>
            <H2>{t("Albums")}</H2>
            <div className="mt-4 grid grid-cols-2 gap-3">{[...albums, ...privateAlbums].map((album) => <Link key={album.id} href={`/album/${album.id}`} className="overflow-hidden rounded-xl border border-velora-line bg-velora-surface"><div className="aspect-[4/3] bg-velora-sunken">{album.coverUrl && <Portrait src={album.coverUrl} name={album.title} sizes="(min-width: 768px) 220px, 45vw" className="h-full w-full" />}</div><span className="block p-3 font-semibold text-velora-ink">{t(album.title)}</span></Link>)}</div>
          </section>
        )}
        {media.some((item) => item.type === "VIDEO") && <section aria-label={t("Videos")}><H2>{t("Videos")}</H2><div className="mt-4 grid grid-cols-2 gap-3">{media.filter((item) => item.type === "VIDEO").map((item) => <div key={item.id} className="overflow-hidden rounded-xl border border-velora-line bg-velora-surface"><video src={item.mediaUrl} controls preload="none" playsInline className="aspect-video w-full bg-black object-contain" aria-label={t(item.title)} /><p className="p-3 font-semibold text-velora-ink">{t(item.title)}</p></div>)}</div></section>}
        {notice && <p role="status" className="border-l-2 border-velora-copper pl-4 text-[15px] text-velora-ink2">{t(notice)}</p>}
      </div>

      <footer className={`sticky ${variant === "sheet" ? "bottom-0" : "bottom-16 md:bottom-0"} z-30 border-t border-velora-line bg-velora-night/95 px-6 pb-4 pt-4 backdrop-blur md:bottom-0 sm:px-10`}>
        <div className="mx-auto max-w-2xl">
          {isOwner ? (
            <div className="flex items-center gap-6">
              <Link href="/settings" className="intimo-member-primary min-h-14 flex-1 px-5 text-[15px]">{t("Edit profile")}</Link>
              <Link href="/albums/manage" className="min-h-11 text-[16px] text-velora-ink underline underline-offset-4">{t("Albums")}</Link>
              <Link href="/videos/upload" className="min-h-11 text-[16px] text-velora-ink underline underline-offset-4">{t("Add video")}</Link>
            </div>
          ) : !authenticated || !memberView ? (
            <button type="button" onClick={() => signIn()} className="flex min-h-14 w-full items-center justify-center rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper">{t("Sign in to connect")}</button>
          ) : (
            <>
              {approach?.line && <p className="mb-2 text-[14px] text-velora-ink2">{t(approach.line)}</p>}
              <div className="flex items-center gap-3">
                {approach?.canWrite !== false ? (
                  <Link href={`/messages?user=${encodeURIComponent(profile.id)}`} className="intimo-member-primary min-h-14 flex-1 px-5 text-[15px]">
                    {approach?.established ? t("Continue the conversation") : t("Begin a conversation")}
                  </Link>
                ) : (
                  <span aria-disabled="true" className="flex min-h-14 flex-1 items-center justify-center rounded-full border border-velora-line text-[16px] text-velora-muted">{t("Not taking first messages")}</span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => void toggleInterest()} aria-pressed={interest.interested} className={`intimo-member-secondary gap-2 px-3 text-[14px] transition ${interest.interested ? "border-velora-warm text-velora-warm" : "hover:border-velora-accent"}`}><Heart className={`h-4 w-4 ${interest.interested ? "fill-current" : ""}`} aria-hidden />{t(interest.interested ? "Interested" : "I'm interested")}</button>
                {friendStatus === "FRIENDS" ? (
                  <Link href="/connections" className="flex min-h-11 items-center justify-center gap-2 border border-velora-copper px-3 text-[14px] font-semibold text-velora-copperInk"><UsersRound className="h-4 w-4" />{t("Connected")}</Link>
                ) : friendStatus === "OUTGOING" ? (
                  <button type="button" disabled={friendBusy} onClick={() => void friendAction("REMOVE")} className="min-h-11 border border-velora-line px-3 text-[14px] text-velora-ink2 disabled:opacity-50">{t("Request sent · Cancel")}</button>
                ) : friendStatus === "INCOMING" ? (
                  <button type="button" disabled={friendBusy} onClick={() => void friendAction("ACCEPT")} className="intimo-member-primary px-3 text-[14px] disabled:opacity-50">{t("Accept connection")}</button>
                ) : (
                  <button type="button" disabled={friendBusy || friendStatus === null} onClick={() => void friendAction("REQUEST")} className="intimo-member-secondary gap-2 px-3 text-[14px] disabled:opacity-50"><UserRoundPlus className="h-4 w-4" />{t("Connect")}</button>
                )}
              </div>
              <button type="button" onClick={() => void toggleFavorite()} aria-pressed={favorite} className="mt-3 inline-flex min-h-11 items-center gap-2 text-[14px] text-velora-ink2"><Bookmark className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />{t(favorite ? "Saved privately" : "Save privately")}</button>
              {friendStatus === "INCOMING" && <button type="button" disabled={friendBusy} onClick={() => void friendAction("DECLINE")} className="ml-4 min-h-11 text-[14px] text-velora-muted underline disabled:opacity-50">{t("Not now")}</button>}
              {interest.mutual && <p className="mt-2 text-[14px] text-velora-copperInk">{t("You're both interested.")}</p>}
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
  const { t } = useTranslation();
  const tone = overPhoto ? "text-velora-onPhoto" : "text-velora-ink";
  return (
    <div className={`${overPhoto ? "absolute inset-x-0 top-0" : "relative"} z-10 flex items-center justify-between px-4 pt-2 sm:px-8`}>
      <button type="button" onClick={onBack} className={`inline-flex min-h-11 items-center gap-1.5 text-[16px] font-semibold ${tone}`}><BackIcon className="h-4 w-4" aria-hidden />{t(backLabel)}</button>
      {menu && (
        <div className="relative">
          <button type="button" aria-label={t("More")} aria-haspopup="menu" aria-expanded={menu.open} onClick={() => menu.setOpen(!menu.open)} className={`flex h-11 w-11 items-center justify-center ${tone}`}><MoreHorizontal className="h-5 w-5" aria-hidden /></button>
          {menu.open && (
            <div role="menu" className="intimo-member-panel absolute right-0 top-11 z-20 w-56 py-2">
              <button role="menuitem" type="button" onClick={menu.onFavorite} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-ink hover:bg-velora-sunken">{menu.favorite ? t("Remove from saved") : t("Save profile")}</button>
              <button role="menuitem" type="button" onClick={menu.onReport} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-ink hover:bg-velora-sunken">{t("Report")}</button>
              <button role="menuitem" type="button" onClick={menu.onBlock} className="block min-h-11 w-full px-4 text-left text-[15px] text-velora-crimson hover:bg-velora-sunken">{t("Block")}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
