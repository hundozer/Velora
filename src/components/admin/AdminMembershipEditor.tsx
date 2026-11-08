"use client";

import React from "react";

const levels = [
  { value: "MEMBER", label: "Member" },
  { value: "FOUNDING_MEMBER", label: "Founding Member" },
  { value: "VIP", label: "Lifetime VIP" },
] as const;

export function AdminMembershipEditor({ member, onClose, onSaved }: {
  member: { id: string; username?: string | null; display_name?: string | null; membership_level?: string | null };
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [level, setLevel] = React.useState(member.membership_level || "MEMBER");
  const [reason, setReason] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [error, setError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/users/membership", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: member.id, level, reason, confirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Membership update failed");
      onSaved(result.unchanged ? "Membership already up to date." : "Membership level updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Membership update failed");
    } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="space-y-3 rounded-xl border border-velora-accent/40 bg-velora-surface p-4">
    <h2 className="text-lg font-bold">Membership for {member.display_name || member.username || member.id}</h2>
    <p className="text-sm text-velora-ink2">Recognition only. This does not grant moderation rights or verify identity.</p>
    <label className="block text-sm font-semibold">Membership level
      <select className="mt-1 block min-h-11 w-full rounded-lg border border-velora-control bg-velora-surface px-3"
        value={level} onChange={event => { setLevel(event.target.value); setConfirmation(""); }}>
        {levels.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
    <label className="block text-sm font-semibold">Reason for the change
      <textarea required minLength={5} maxLength={500} value={reason} onChange={event => setReason(event.target.value)}
        className="mt-1 block min-h-20 w-full rounded-lg border border-velora-control bg-velora-surface p-3" />
    </label>
    <label className="block text-sm font-semibold">Type CONFIRM {level}
      <input autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)}
        className="mt-1 block min-h-11 w-full rounded-lg border border-velora-control bg-velora-surface px-3" />
    </label>
    {error && <p role="alert" className="text-sm text-velora-danger">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="submit" disabled={saving || reason.trim().length < 5 || confirmation !== `CONFIRM ${level}`}
        className="min-h-11 rounded-lg bg-velora-accent px-4 text-sm font-semibold text-velora-paper disabled:opacity-40">
        {saving ? "Saving…" : "Save membership"}
      </button>
      <button type="button" onClick={onClose} disabled={saving} className="min-h-11 rounded-lg border border-velora-control px-4 text-sm">Cancel</button>
    </div>
  </form>;
}
