"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { requestParticipantDeclaration, uploadFileToR2 } from "@/lib/storage/clientUpload";

export default function VideoUploadPage() {
  const { user } = useAuth();
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [rating, setRating] = React.useState<"NON_EXPLICIT" | "EXPLICIT">("EXPLICIT");
  const [progress, setProgress] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy || !title.trim()) return;
    if (file.size > 100 * 1024 * 1024) { setError("Choose a video under 100 MB."); return; }
    setBusy(true); setError("");
    try {
      const declaration = await requestParticipantDeclaration();
      const upload = await uploadFileToR2(file, "videos", setProgress, declaration, "PUBLIC", rating);
      if (upload.isMock) throw new Error("Video storage is unavailable");
      const response = await fetch(`/api/media/${upload.mediaId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), visibility: "PUBLIC" }) });
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Video details could not be saved");
      setDone(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Video upload failed"); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto max-w-xl px-5 pb-28 pt-10"><Link href="/videos" className="text-sm text-velora-accent underline">← Videos</Link><h1 className="mt-6 font-display text-5xl">Share a video</h1>
    {!user ? <Link href="/register" className="mt-6 inline-block text-velora-accent underline">Join to upload</Link> : done ? <p role="status" className="mt-6">Uploaded. Your video will appear on your profile after review.</p> : <form onSubmit={submit} className="mt-7 space-y-5">
      <label className="block font-semibold">Video · MP4 or WebM, up to 100 MB<input required type="file" accept="video/mp4,video/webm" onChange={event => { setFile(event.target.files?.[0] || null); setProgress(0); }} className="mt-2 block w-full rounded-xl border border-velora-line p-3" /></label>
      <label className="block font-semibold">Title<input required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className="mt-2 block w-full rounded-xl border border-velora-control bg-velora-paper p-3" /></label>
      <fieldset><legend className="font-semibold">Content</legend><div className="mt-2 flex gap-5"><label><input type="radio" checked={rating === "EXPLICIT"} onChange={() => setRating("EXPLICIT")} /> Explicit</label><label><input type="radio" checked={rating === "NON_EXPLICIT"} onChange={() => setRating("NON_EXPLICIT")} /> Non-explicit</label></div></fieldset>
      <p className="text-sm text-velora-ink2">Visible to others only after moderation. You must have the consent of everyone identifiable in the video.</p>
      {error && <p role="alert" className="text-velora-danger">{error}</p>}{busy && <p role="status">Uploading {progress}%</p>}
      <button disabled={busy || !file || !title.trim()} className="min-h-11 rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">Upload video</button>
    </form>}</main>;
}
