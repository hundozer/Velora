"use client";
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Member = { profile_id: string; username: string };
export default function RoomSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const endpoint = `/api/rooms/${encodeURIComponent(id)}/settings`;
  const [room, setRoom] = React.useState<{ title: string; locked: boolean; builtin: boolean } | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [username, setUsername] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const load = React.useCallback(async () => { const r = await fetch(endpoint, { cache: "no-store" }); const p = await r.json(); if (!r.ok) throw Error(p.error); setRoom(p.room); setMembers(p.members || []); }, [endpoint]);
  React.useEffect(() => { void load().catch(e => setError(e.message)); }, [load]);
  async function change(method: string, body?: unknown, suffix = "") {
    setError(""); setNotice("");
    try { const r = await fetch(endpoint + suffix, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }); const p = await r.json(); if (!r.ok) throw Error(p.error); await load(); setNotice("Room updated."); setUsername(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update room"); }
  }
  return <main className="mx-auto max-w-2xl px-5 pb-28 pt-8"><Link href={`/rooms/${encodeURIComponent(id)}`} className="text-velora-accent underline">← Back to room</Link><h1 className="mt-5 font-display text-4xl">Manage {room?.title || "room"}</h1>{error && <p role="alert" className="mt-4 text-velora-danger">{error}</p>}{notice && <p role="status" className="mt-4">{notice}</p>}{room && !room.builtin && <><section className="mt-8 rounded-2xl border border-velora-line p-5"><h2 className="font-display text-2xl">Who can join?</h2><p className="mt-2 text-sm text-velora-muted">When locked, only members you add and Intimo admins can read or post. People can still see the room title in the directory.</p><button onClick={() => void change("PATCH", { locked: !room.locked })} className="mt-4 min-h-11 rounded-full bg-velora-accent px-5 text-velora-paper">{room.locked ? "Open room to all members" : "Make members only"}</button></section><section className="mt-6 rounded-2xl border border-velora-line p-5"><h2 className="font-display text-2xl">Approved members</h2><form onSubmit={e => { e.preventDefault(); void change("POST", { username }); }} className="mt-4 flex flex-wrap gap-2"><label className="flex-1 text-sm">Exact username<input required value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full rounded-xl border border-velora-control bg-velora-paper p-3" /></label><button className="self-end min-h-11 rounded-full bg-velora-accent px-5 text-velora-paper">Add member</button></form><ul className="mt-5 space-y-3">{members.map(m => <li key={m.profile_id} className="flex items-center justify-between gap-4"><span>{m.username}</span><button className="min-h-11 text-velora-danger underline" onClick={() => void change("DELETE", undefined, `?profileId=${encodeURIComponent(m.profile_id)}`)}>Remove</button></li>)}</ul></section></>}</main>;
}
