"use client";

import React from "react";
import Link from "next/link";
import { Lock, Unlock } from "lucide-react";

type Status = { isOwner: boolean; privateCount: number; status?: string | null; active?: boolean; grantType?: string | null; expiresAt?: string | null; canRequest?: boolean };

/** Private photos on a profile (P1-06): locked until the owner grants access. */
export function ProfilePrivatePhotos({ profileId }: { profileId: string }) {
  const [status, setStatus] = React.useState<Status | null>(null);
  const [media, setMedia] = React.useState<{ id: string; url: string }[]>([]);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const response = await fetch(`/api/private-access?ownerId=${encodeURIComponent(profileId)}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return;
    const next: Status = await response.json();
    setStatus(next);
    if (next.active) {
      const list = await fetch(`/api/private-access/media?ownerId=${encodeURIComponent(profileId)}`, { credentials: "same-origin", cache: "no-store" });
      if (list.ok) setMedia((await list.json()).media || []);
    }
  }, [profileId]);

  React.useEffect(() => { void load(); }, [load]);

  async function request() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/private-access", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ownerId: profileId }) });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(payload.error || "Your request could not be sent.");
    setMessage("Request sent. You'll be notified if they share.");
    void load();
  }

  if (!status) return null;
  if (status.isOwner) {
    return status.privateCount > 0 ? (
      <section className="rounded-3xl border border-white/10 bg-[#111722] p-5">
        <h2 className="flex items-center gap-2 font-bold text-white"><Lock className="h-4 w-4 text-amber-300" aria-hidden />Private photos</h2>
        <p className="mt-2 text-sm text-white/60">Only members you approve can see them.</p>
        <Link href="/me/private-photos" className="mt-3 inline-block text-sm text-amber-300 underline">Manage access</Link>
      </section>
    ) : null;
  }
  if (status.privateCount === 0) return null; // nothing to request; never show an empty lock

  return (
    <section className="space-y-3 rounded-3xl border border-white/10 bg-[#111722] p-5">
      <h2 className="flex items-center gap-2 font-bold text-white">{status.active ? <Unlock className="h-4 w-4 text-emerald-300" aria-hidden /> : <Lock className="h-4 w-4 text-amber-300" aria-hidden />}Private photos</h2>
      {status.active ? (
        <>
          <p className="text-xs text-white/50">{status.grantType === "ONCE" && status.expiresAt ? `Shared with you until ${new Date(status.expiresAt).toLocaleString()}.` : "Shared with you. The owner can stop sharing at any time."} Please don&apos;t save or share them.</p>
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={item.id} src={item.url} alt="" className="aspect-square w-full rounded-xl object-cover" onContextMenu={(event) => event.preventDefault()} draggable={false} />
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-white/60">This member keeps some photos private.</p>
          {status.status === "REQUESTED" ? (
            <p className="text-sm text-amber-200">Request sent. Waiting for an answer.</p>
          ) : status.canRequest ? (
            <button type="button" onClick={request} disabled={busy} className="min-h-10 rounded-full bg-gold-gradient px-5 text-xs font-bold text-velora-bg disabled:opacity-50">Request access</button>
          ) : null}
          {message && <p className="text-xs text-white/60" role="status">{message}</p>}
        </>
      )}
    </section>
  );
}
