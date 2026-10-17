"use client";

import React from "react";
import { SCENE_KINDS } from "@/lib/scene.mjs";

type Row = { id: string; title: string; kind: string; starts_at: string; organiser: string; url: string; status: string; venue_name: string | null };

/** Admin curation for Prague Scene (P1-21): add listings, review member suggestions. */
export function AdminSceneConsole() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({ title: "", kind: "MUNCH", startsAt: "", organiser: "", venueName: "", url: "", description: "" });

  const load = React.useCallback(async () => {
    const response = await fetch("/api/admin/scene", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Scene could not be loaded");
    setRows(payload.events || []);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/admin/scene", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Listing could not be saved");
    setForm({ title: "", kind: "MUNCH", startsAt: "", organiser: "", venueName: "", url: "", description: "" });
    void load();
  }

  async function decide(id: string, status: "PUBLISHED" | "REJECTED") {
    const response = await fetch("/api/admin/scene", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!response.ok) setError("Decision could not be saved");
    void load();
  }

  const input = "rounded-lg border border-slate-300 px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <form onSubmit={add} className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Add a listing (published immediately)</h2>
        <input className={input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className={input} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>{SCENE_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select>
        <input className={input} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} aria-label="Starts" />
        <input className={input} placeholder="Organiser" value={form.organiser} onChange={(e) => setForm({ ...form, organiser: e.target.value })} />
        <input className={input} placeholder="Venue" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
        <input className={input} placeholder="https:// link" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <textarea className={`${input} sm:col-span-2`} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white sm:col-span-2">Publish listing</button>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100"><tr>{["When", "Title", "Organiser", "Status", "Actions"].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{rows.map((row) => (
            <tr key={row.id}>
              <td className="p-3 whitespace-nowrap">{new Date(row.starts_at).toLocaleString()}</td>
              <td className="p-3"><a href={row.url} target="_blank" rel="noopener noreferrer" className="underline">{row.title}</a><p className="text-xs text-slate-500">{row.kind}{row.venue_name ? ` · ${row.venue_name}` : ""}</p></td>
              <td className="p-3">{row.organiser}</td>
              <td className="p-3">{row.status}</td>
              <td className="p-3"><div className="flex gap-1">
                {row.status !== "PUBLISHED" && <button onClick={() => decide(row.id, "PUBLISHED")} className="rounded border px-2 py-1 text-xs">Publish</button>}
                {row.status !== "REJECTED" && <button onClick={() => decide(row.id, "REJECTED")} className="rounded border px-2 py-1 text-xs">{row.status === "PUBLISHED" ? "Unpublish" : "Reject"}</button>}
              </div></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
