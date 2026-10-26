"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type Room = { id: string; title: string; description: string; creator_id: string | null; builtin: boolean; locked: boolean; expires_at: string | null };
export default function RoomsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [lifetime, setLifetime] = React.useState("30");
  React.useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/rooms", { cache: "no-store" }).then(async r => { const p = await r.json(); if (!r.ok) throw Error(p.error); if (active) setRooms(p.rooms || []); }).catch(() => { if (active) setError("Rooms could not be loaded."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);
  async function create(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const r = await fetch("/api/rooms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, lifetime }) });
      const p = await r.json(); if (!r.ok) throw Error(p.error || "Could not create room");
      router.push(`/rooms/${encodeURIComponent(p.id)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create room"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-6xl px-5 pb-28 pt-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-velora-accent">Intimo · 18+</p>
    <h1 className="mt-3 font-display text-5xl">Rooms</h1>
    <p className="mt-4 max-w-2xl text-velora-ink2">Find a conversation, or make a place for your own crowd. Public rooms are open to active adult members. A room creator can make their room members only and choose who gets in.</p>
    {!user ? <Link href="/register" className="mt-6 inline-flex min-h-11 items-center text-velora-accent underline">Join to see rooms</Link> : <>
      {error && <p role="alert" className="mt-5 text-velora-danger">{error}</p>}
      <section className="mt-10"><h2 className="font-display text-3xl">Always open</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rooms.filter(r => r.builtin).map(r => <RoomCard key={r.id} room={r} selfId={profile?.id} />)}</div>{loading && <p className="mt-4">Loading rooms…</p>}</section>
      <section className="mt-12"><h2 className="font-display text-3xl">Made by members</h2><p className="mt-2 text-sm text-velora-muted">Members only rooms show their name here. The conversation is for approved members and Intimo admins.</p><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rooms.filter(r => !r.builtin).map(r => <RoomCard key={r.id} room={r} selfId={profile?.id} />)}</div>{!loading && !rooms.some(r => !r.builtin) && <p className="mt-4 text-velora-muted">No member rooms yet. Start one below.</p>}</section>
      <section className="mt-12 max-w-xl rounded-2xl border border-velora-line bg-velora-surface p-6"><h2 className="font-display text-3xl">Start a room</h2><p className="mt-2 text-sm text-velora-muted">You administer the room you create. Add approved members by username if you make it members only.</p><form onSubmit={create} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Room name<input required minLength={3} maxLength={80} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-xl border border-velora-control bg-velora-paper p-3" /></label><label className="block text-sm font-semibold">What is it for?<textarea required maxLength={500} rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full rounded-xl border border-velora-control bg-velora-paper p-3" /></label><fieldset><legend className="text-sm font-semibold">How long?</legend><div className="mt-2 flex gap-5"><label><input type="radio" name="lifetime" value="30" checked={lifetime === "30"} onChange={e => setLifetime(e.target.value)} /> 30 days</label><label><input type="radio" name="lifetime" value="forever" checked={lifetime === "forever"} onChange={e => setLifetime(e.target.value)} /> Forever</label></div></fieldset><button disabled={busy} className="min-h-11 rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">Create room</button></form></section>
    </>}
  </main>;
}
function RoomCard({ room, selfId }: { room: Room; selfId?: string }) { return <Link href={`/rooms/${encodeURIComponent(room.id)}`} className="block rounded-2xl border border-velora-line bg-velora-surface p-5 hover:border-velora-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent"><div className="flex justify-between gap-2"><h3 className="font-display text-2xl">{room.title}</h3><span className="text-xs text-velora-accent">{room.locked ? "Members only" : "Open"}</span></div><p className="mt-3 text-sm text-velora-ink2">{room.description}</p><p className="mt-4 text-xs text-velora-muted">{room.builtin ? "Always here" : room.expires_at ? `Until ${new Date(room.expires_at).toLocaleDateString("en-GB", { timeZone: "Europe/Prague" })}` : "No expiry"}{room.creator_id === selfId ? " · Your room" : ""}</p></Link>; }
