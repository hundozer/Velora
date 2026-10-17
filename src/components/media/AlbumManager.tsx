"use client";

/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ArrowDown, ArrowUp, Check, Images, Plus, ShieldCheck, Star, Trash2, Upload } from "lucide-react";
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
  cover_media_id?: string | null;
  mediaIds: string[];
};
type Media = { id: string; title?: string | null; visibility: string; upload_status: string; processing_status: string; moderation_status: string; url: string };

const field = "min-h-11 w-full rounded-xl border border-white/15 bg-[#0c1018] px-3 text-white outline-none focus:border-amber-300";

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
    setMedia(mediaPayload.media || []);
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
    formElement.reset(); await load(); setSelected(payload.album.id); setNotice("Album created. Add photos when you are ready.");
  }

  async function updateAlbum(album: Album) {
    setBusy(true); setError(""); setNotice("");
    const response = await fetch(`/api/albums/${album.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...album, commentPolicy: album.comment_policy, reactionsEnabled: album.reactions_enabled }) });
    const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(payload.error || "Album update failed"); return; }
    await load(); setNotice("Album settings saved and sent for review.");
  }

  async function removeAlbum(album: Album) {
    if (!window.confirm(`Remove album “${album.title}”? Its photos will remain in your photo library.`)) return;
    setBusy(true); const response = await fetch(`/api/albums/${album.id}`, { method: "DELETE" }); const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(payload.error || "Album removal failed"); return; }
    await load(); setNotice("Album removed.");
  }

  async function savePhotos(album: Album) {
    setBusy(true); setError("");
    const coverMediaId = album.cover_media_id && album.mediaIds.includes(album.cover_media_id) ? album.cover_media_id : album.mediaIds[0] || null;
    const response = await fetch(`/api/albums/${album.id}/media`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaIds: album.mediaIds, coverMediaId }) });
    const payload = await response.json().catch(() => ({})); setBusy(false);
    if (!response.ok) { setError(payload.error || "Album photos could not be saved"); return; }
    await load(); setNotice("Photo order and cover saved.");
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
    <header className="border-b border-white/10 pb-6">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">Your photos</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-white">Photo albums</h1>
      <p className="mt-2 text-slate-400">Create collections and choose who gets to see them.</p>
    </header>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-100">{error}</p>}
    {notice && <p role="status" className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-100"><Check className="h-5 w-5" />{notice}</p>}

    <section className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <form onSubmit={create} className="space-y-3 rounded-2xl border border-white/10 bg-[#11151e] p-5">
          <h2 className="text-xl font-semibold text-white">New album</h2>
          <input name="title" required maxLength={160} placeholder="Album title" className={field} />
          <textarea name="description" maxLength={4000} placeholder="Describe the album" className={`${field} min-h-24 py-3`} />
          <select name="category" defaultValue="" className={field}><option value="">Choose a category</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select>
          <select name="visibility" defaultValue="PRIVATE" className={field}>{VISIBILITY.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select name="commentPolicy" defaultValue="MEMBERS" className={field}>{COMMENT_POLICIES.map(([value, label]) => <option key={value} value={value}>Comments: {label}</option>)}</select>
          <label className="flex min-h-11 items-center gap-3 text-sm text-slate-200"><input type="checkbox" name="reactionsEnabled" defaultChecked /> Allow likes</label>
          <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 font-bold text-slate-950"><Plus className="h-4 w-4" />Create album</button>
        </form>
        <div className="space-y-2">{albums.map((album) => <button key={album.id} onClick={() => setSelected(album.id)} className={`w-full rounded-xl border p-4 text-left ${selected === album.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-[#11151e]"}`}><strong className="block text-white">{album.title}</strong><span className="mt-1 block text-xs text-slate-400">{album.mediaIds.length} photos · {VISIBILITY.find(([value]) => value === album.visibility)?.[1] || album.visibility}</span></button>)}</div>
      </aside>

      <section>{active ? <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#11151e] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">Title<input value={active.title} maxLength={160} onChange={(event) => patchActive({ title: event.target.value })} className={`${field} mt-1`} /></label>
            <label className="text-sm text-slate-300">Category<select value={active.category || ""} onChange={(event) => patchActive({ category: event.target.value })} className={`${field} mt-1`}><option value="">Choose a category</option>{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-sm text-slate-300">Description<textarea value={active.description || ""} maxLength={4000} onChange={(event) => patchActive({ description: event.target.value })} className={`${field} mt-1 min-h-24 py-3`} /></label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-300">Who can see it?<select value={active.visibility} onChange={(event) => patchActive({ visibility: event.target.value })} className={`${field} mt-1`}>{VISIBILITY.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="text-sm text-slate-300">Who can comment?<select value={active.comment_policy || "MEMBERS"} onChange={(event) => patchActive({ comment_policy: event.target.value })} className={`${field} mt-1`}>{COMMENT_POLICIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <fieldset className="mt-5"><legend className="text-sm font-semibold text-white">What appears in this album?</legend><div className="mt-3 flex flex-wrap gap-2">{TOPICS.map((topic) => { const selectedTopic = active.tags.includes(topic); return <button type="button" key={topic} onClick={() => patchActive({ tags: selectedTopic ? active.tags.filter((item) => item !== topic) : [...active.tags, topic].slice(0, 20) })} className={`rounded-full border px-3 py-2 text-sm ${selectedTopic ? "border-amber-300 bg-amber-300 text-slate-950" : "border-white/15 text-slate-300"}`}>{topic}</button>; })}</div></fieldset>
          <label className="mt-5 flex min-h-11 items-center gap-3 text-sm text-slate-200"><input type="checkbox" checked={active.reactions_enabled !== false} onChange={(event) => patchActive({ reactions_enabled: event.target.checked })} /> Allow likes</label>
          <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy} onClick={() => updateAlbum(active)} className="min-h-11 rounded-xl bg-amber-300 px-5 font-bold text-slate-950">Save album settings</button><button disabled={busy} onClick={() => removeAlbum(active)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-400/50 px-5 text-red-200"><Trash2 className="h-4 w-4" />Remove album</button></div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-white">Photos</h2><p className="text-sm text-slate-400">Up to 30 photos. Choose a cover and arrange the order.</p></div><label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 font-semibold ${rightsConfirmed ? "cursor-pointer border-amber-300 text-white" : "cursor-not-allowed border-white/10 text-slate-500"}`}><Upload className="h-4 w-4" />{busy && progress ? `${progress}%` : "Upload photos"}<input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic" className="sr-only" disabled={busy || !rightsConfirmed || active.mediaIds.length >= 30} onChange={(event) => upload(event.target.files?.[0])} /></label></div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{media.map((item) => { const included = active.mediaIds.includes(item.id); const cover = active.cover_media_id === item.id; return <article key={item.id} className={`rounded-xl border p-3 ${included ? "border-amber-300" : "border-white/10"}`}><img src={item.url} alt="" className="aspect-square w-full rounded-lg object-cover" /><label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-white"><input type="checkbox" checked={included} onChange={(event) => patchActive({ mediaIds: event.target.checked ? [...active.mediaIds, item.id].slice(0, 30) : active.mediaIds.filter((id) => id !== item.id), cover_media_id: !event.target.checked && cover ? null : active.cover_media_id })} />Include</label>{included && <><button type="button" onClick={() => patchActive({ cover_media_id: item.id })} className={`mb-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border ${cover ? "border-amber-300 bg-amber-300/10 text-amber-200" : "border-white/15 text-slate-300"}`}><Star className={`h-4 w-4 ${cover ? "fill-current" : ""}`} />{cover ? "Album cover" : "Make cover"}</button><div className="flex gap-2"><button aria-label="Move photo earlier" onClick={() => move(item.id, -1)} className="min-h-10 flex-1 rounded-lg border border-white/15"><ArrowUp className="mx-auto h-4 w-4" /></button><button aria-label="Move photo later" onClick={() => move(item.id, 1)} className="min-h-10 flex-1 rounded-lg border border-white/15"><ArrowDown className="mx-auto h-4 w-4" /></button></div></>}</article>; })}</div>
            {!media.length && <div className="rounded-xl border border-dashed border-white/15 p-10 text-center"><Images className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-3 text-white">Your photo library is empty.</p></div>}
            <button disabled={busy} onClick={() => savePhotos(active)} className="min-h-11 rounded-xl bg-amber-300 px-5 font-bold text-slate-950">Save photos and order</button>
          </div>
          <aside className="h-fit rounded-2xl border border-amber-300/25 bg-amber-300/5 p-5"><ShieldCheck className="h-7 w-7 text-amber-300" /><h3 className="mt-3 text-lg font-semibold text-white">Before uploading</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>Only upload content you own or may lawfully publish.</li><li>Everyone shown must be an adult and must consent.</li><li>No minors, exploitation, hidden recordings, extreme violence, animals, or illegal content.</li><li>No third-party watermarks or personal contact details.</li><li>Public content is reviewed before it appears.</li></ul><label className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 p-3 text-sm text-white"><input type="checkbox" className="mt-1" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />I understand these rules and confirm I have the necessary rights and consent.</label></aside>
        </div>
      </div> : <div className="rounded-xl border border-dashed border-white/15 p-12 text-center"><Images className="mx-auto h-8 w-8 text-slate-500" /><p className="mt-3 text-white">Choose an album or create a new one.</p></div>}</section>
    </section>
  </main>;
}
