"use client";

/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ArrowDown, ArrowUp, Check, Images, Plus, Star, Trash2, Upload } from "lucide-react";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";

const CATEGORIES = ["Woman", "Man", "Couple: woman & man", "Couple: two women", "Couple: two men", "Group", "Art and details"];
const TOPICS = ["Soft erotica", "Couples", "Solo", "Bisexual", "Gay", "Lesbian", "BDSM & kink", "Bondage", "Roleplay", "Fetish", "Lingerie", "Mature", "Outdoor", "Exhibitionism", "Toys", "Massage", "Artistic", "Vacation"];
const VISIBILITY = [
  ["PUBLIC", "Everyone"],
  ["MEMBERS_ONLY", "Intimo members"],
  ["FOLLOWERS_ONLY", "Followers"],
  ["FRIENDS_ONLY", "Friends"],
  ["PRIVATE", "Only me"],
] as const;
const COMMENT_POLICIES = [
  ["MEMBERS", "Any member"],
  ["VERIFIED", "Verified members"],
  ["FRIENDS", "Friends only"],
  ["DISABLED", "Comments off"],
] as const;

type Album = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  tags: string[];
  visibility: string;
  comment_policy: string;
  reactions_enabled: boolean;
  moderation_status: string;
  reviewFeedback?: string | null;
  cover_media_id?: string | null;
  mediaIds: string[];
};
type Media = { id: string; title?: string | null; visibility: string; upload_status: string; processing_status: string; moderation_status: string; reviewFeedback?: string | null; url: string };

const field = "min-h-11 w-full rounded-xl border border-ink/15 bg-velora-surface px-3 text-ink outline-none focus:border-velora-accent";

export function AlbumManager() {
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [media, setMedia] = React.useState<Media[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [rightsConfirmed, setRightsConfirmed] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    const [albumResponse, mediaResponse] = await Promise.all([fetch("/api/albums", { cache: "no-store" }), fetch("/api/media?type=IMAGE", { cache: "no-store" })]);
    const albumPayload = await albumResponse.json().catch(() => ({}));
    const mediaPayload = await mediaResponse.json().catch(() => ({}));
    if (!albumResponse.ok) throw new Error(albumPayload.error || "Albums unavailable");
    if (!mediaResponse.ok) throw new Error(mediaPayload.error || "Photos unavailable");
    setAlbums(albumPayload.albums || []);
    // Only finished uploads can go into an album; abandoned or failed uploads stay out of the picker.
    setMedia((mediaPayload.media || []).filter((item: Media & { category?: string | null }) => item.upload_status === "AVAILABLE" && item.category !== "MESSAGE"));
    setSelected((current) => current && albumPayload.albums?.some((album: Album) => album.id === current) ? current : albumPayload.albums?.[0]?.id || null);
  }, []);

  React.useEffect(() => { load().catch((cause) => setError(cause.message)); }, [load]);
  const active = albums.find((album) => album.id === selected) || null;

  function patchActive(patch: Partial<Album>) {
    if (!active) return;
    setAlbums((current) => current.map((album) => album.id === active.id ? { ...album, ...patch } : album));
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setError(""); setNotice("");
    const response = await fetch("/api/albums", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), description: form.get("description"), category: form.get("category"), visibility: form.get("visibility"), commentPolicy: form.get("commentPolicy"), reactionsEnabled: form.get("reactionsEnabled") === "on", tags: [] }) });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setError(payload.error || "Album creation failed"); return; }
    formElement.reset(); await load(); setSelected(payload.album.id); setNotice("Album created. Add photos below.");
  }

  async function updateAlbum(album: Album) {
    setBusy(true); setError(""); setNotice("");
    const response = await fetch(`/api/albums/${album.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...album, commentPolicy: album.comment_policy, reactionsEnabled: album.reactions_enabled }) });
    const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(payload.error || "Album update failed"); return; }
    await load(); setNotice(payload.album?.moderation_status === "APPROVED" ? "Album saved. Still published." : "Album saved. Review pending.");
  }

  async function removeAlbum(album: Album) {
    if (!window.confirm(`Remove album “${album.title}”? Its photos will remain in your photo library.`)) return;
    setBusy(true); const response = await fetch(`/api/albums/${album.id}`, { method: "DELETE" }); const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(payload.error || "Album removal failed"); return; }
    await load(); setNotice("Album removed.");
  }

  async function savePhotos(album: Album) {
    setBusy(true); setError(""); setNotice("");
    const coverMediaId = album.cover_media_id && album.mediaIds.includes(album.cover_media_id) ? album.cover_media_id : album.mediaIds[0] || null;
    const response = await fetch(`/api/albums/${album.id}/media`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaIds: album.mediaIds, coverMediaId }) });
    const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(payload.error || "Album photos could not be saved"); return; }
    await load(); setNotice("Photos saved. Review pending.");
  }

  async function upload(file?: File) {
    if (!file || !active) return;
    if (!rightsConfirmed) { setError("Confirm the upload rules before adding photos."); return; }
    setBusy(true); setError(""); setNotice("");
    try {
      const declaration = await requestParticipantDeclaration();
      const result = await uploadFileToR2(file, "photos", setProgress, declaration, active.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE");
      await load();
      await savePhotos({ ...active, mediaIds: [...active.mediaIds, result.mediaId], cover_media_id: active.cover_media_id || result.mediaId });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Upload failed"); }
    finally { setBusy(false); setProgress(0); if (fileRef.current) fileRef.current.value = ""; }
  }

  function move(id: string, direction: -1 | 1) {
    if (!active) return;
    const ids = [...active.mediaIds]; const index = ids.indexOf(id); const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]]; patchActive({ mediaIds: ids });
  }

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <header className="border-b border-ink/10 pb-6">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-velora-accent">Your photos</p>
      <h1 className="mt-2 font-display font-semibold text-ink text-5xl leading-[1.02] sm:text-6xl">Photo albums</h1>

    </header>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-100">{error}</p>}
    {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-100"><Check className="h-5 w-5" />{notice}</p>}

    <section className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <form onSubmit={create} className="space-y-3 rounded-2xl border border-ink/10 bg-velora-surface p-5">
          <h2 className="text-xl font-semibold text-ink">New album</h2>
          <input name="title" required maxLength={160} placeholder="Album title" className={field} />
          <label className="block text-sm font-semibold text-ink">Who can see it?<select name="visibility" defaultValue="PRIVATE" className={field}>{VISIBILITY.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <details className="space-y-3"><summary className="cursor-pointer text-sm text-velora-textSecondary">More options</summary><textarea name="description" maxLength={4000} placeholder="Description" className={`${field} mt-3 min-h-20 py-3`} /><select name="category" defaultValue="" className={`${field} mt-3`}><option value="">Choose a category</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
          <select name="commentPolicy" defaultValue="MEMBERS" className={field}>{COMMENT_POLICIES.map(([value, label]) => <option key={value} value={value}>Comments: {label}</option>)}</select>
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink"><input type="checkbox" name="reactionsEnabled" defaultChecked /> Allow likes</label></details>
          <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-velora-accent font-bold text-velora-paper"><Plus className="h-4 w-4" />Create album</button>
        </form>
        <div className="space-y-2">{albums.map((album) => <button key={album.id} onClick={() => setSelected(album.id)} className={`w-full rounded-xl border p-4 text-left ${selected === album.id ? "border-velora-accent bg-velora-accent/10" : "border-ink/10 bg-velora-surface"}`}><strong className="block text-ink">{album.title}</strong><span className="mt-1 block text-xs text-velora-textSecondary">{album.mediaIds.length} photos · {VISIBILITY.find(([value]) => value === album.visibility)?.[1] || album.visibility}</span></button>)}</div>
      </aside>

      <section>{active ? <div className="space-y-6">
        <p role="status" className="rounded-xl border border-ink/10 p-4 text-sm text-ink">{active.mediaIds.length} photos · {active.visibility === "PRIVATE" ? "Private · only you can see it" : active.moderation_status === "APPROVED" ? "Published" : "Waiting for review"}</p>
        {active.reviewFeedback && active.moderation_status === "REJECTED" && <p role="status" className="rounded-xl border border-velora-warning/40 bg-velora-warning/10 p-4 text-sm text-ink">Review feedback: {active.reviewFeedback} Edit your album and save it to submit it for another review.</p>}
        <div className="rounded-2xl border border-ink/10 bg-velora-surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-ink">Title<input value={active.title} maxLength={160} onChange={(event) => patchActive({ title: event.target.value })} className={`${field} mt-1`} /></label>
            <label className="text-sm text-ink">Category<select value={active.category || ""} onChange={(event) => patchActive({ category: event.target.value })} className={`${field} mt-1`}><option value="">Choose a category</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-sm text-ink">Description<textarea value={active.description || ""} maxLength={4000} onChange={(event) => patchActive({ description: event.target.value })} className={`${field} mt-1 min-h-24 py-3`} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-ink">Who can see it?<select value={active.visibility} onChange={(event) => patchActive({ visibility: event.target.value })} className={`${field} mt-1`}>{VISIBILITY.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm text-ink">Who can comment?<select value={active.comment_policy || "MEMBERS"} onChange={(event) => patchActive({ comment_policy: event.target.value })} className={`${field} mt-1`}>{COMMENT_POLICIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <fieldset className="mt-5"><legend className="text-sm font-semibold text-ink">What appears in this album?</legend><div className="mt-3 flex flex-wrap gap-2">{TOPICS.map((topic) => { const selectedTopic = active.tags.includes(topic); return <button type="button" key={topic} onClick={() => patchActive({ tags: selectedTopic ? active.tags.filter((item) => item !== topic) : [...active.tags, topic].slice(0, 20) })} className={`rounded-full border px-3 py-2 text-sm ${selectedTopic ? "border-velora-accent bg-velora-accent text-velora-paper" : "border-ink/15 text-ink"}`}>{topic}</button>; })}</div></fieldset>
          <label className="mt-5 flex min-h-11 items-center gap-3 text-sm text-ink"><input type="checkbox" checked={active.reactions_enabled !== false} onChange={(event) => patchActive({ reactions_enabled: event.target.checked })} /> Allow likes</label>
          <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} onClick={() => updateAlbum(active)} className="min-h-11 rounded-xl bg-velora-accent px-5 font-bold text-velora-paper">Save album</button><button disabled={busy} onClick={() => removeAlbum(active)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/50 px-5 text-velora-danger"><Trash2 className="h-4 w-4" />Remove album</button></div>
        </div>

        <div className="space-y-5">
          <div className="space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-velora-accent/25 bg-velora-accent/5 p-4 text-sm text-ink"><input type="checkbox" className="mt-1" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />I own these photos and everyone shown is an adult who agreed to be photographed and shared.</label>
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-ink">Photos</h2><p className="text-sm text-velora-textSecondary">Select photos, then choose a cover.</p></div><label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 font-semibold ${rightsConfirmed ? "cursor-pointer border-velora-accent text-ink" : "cursor-not-allowed border-ink/10 text-velora-textMuted"}`}><Upload className="h-4 w-4" />{busy && progress ? `${progress}%` : "Upload photos"}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic" className="sr-only" disabled={busy || !rightsConfirmed || active.mediaIds.length >= 30} onChange={(event) => upload(event.target.files?.[0])} /></label></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{media.map((item) => { const included = active.mediaIds.includes(item.id); const cover = active.cover_media_id === item.id; return <article key={item.id} className={`rounded-xl border p-3 ${included ? "border-velora-accent" : "border-ink/10"}`}><img src={item.url} alt="" className="aspect-square w-full rounded-lg object-cover" />{item.reviewFeedback && <p className="mt-3 text-xs text-velora-warning">Review feedback: {item.reviewFeedback} Replace this photo or exclude it from the album, then save the photos for another review.</p>}<label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-ink"><input type="checkbox" checked={included} onChange={(event) => patchActive({ mediaIds: event.target.checked ? [...active.mediaIds, item.id].slice(0, 30) : active.mediaIds.filter((id) => id !== item.id), cover_media_id: !event.target.checked && cover ? null : active.cover_media_id })} />Include</label>{included && <><button type="button" onClick={() => patchActive({ cover_media_id: item.id })} className={`mb-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border ${cover ? "border-velora-accent bg-velora-accent/10 text-velora-accent" : "border-ink/15 text-ink"}`}><Star className={`h-4 w-4 ${cover ? "fill-current" : ""}`} />{cover ? "Album cover" : "Make cover"}</button><div className="flex gap-2"><button aria-label="Move photo earlier" onClick={() => move(item.id, -1)} className="min-h-10 flex-1 rounded-lg border border-ink/15"><ArrowUp className="mx-auto h-4 w-4" /></button><button aria-label="Move photo later" onClick={() => move(item.id, 1)} className="min-h-10 flex-1 rounded-lg border border-ink/15"><ArrowDown className="mx-auto h-4 w-4" /></button></div></>}</article>; })}</div>
            {!media.length && <div className="rounded-xl border border-dashed border-ink/15 p-10 text-center"><Images className="mx-auto h-8 w-8 text-velora-textMuted" /><p className="mt-3 text-ink">Your photo library is empty.</p></div>}
            <button disabled={busy} onClick={() => savePhotos(active)} className="min-h-11 rounded-xl bg-velora-accent px-5 font-bold text-velora-paper">Save photos</button>
          </div>
        </div>
      </div> : <div className="rounded-xl border border-dashed border-ink/15 p-12 text-center"><Images className="mx-auto h-8 w-8 text-velora-textMuted" /><p className="mt-3 text-ink">Choose an album or create a new one.</p></div>}</section>
    </section>
  </main>;
}
