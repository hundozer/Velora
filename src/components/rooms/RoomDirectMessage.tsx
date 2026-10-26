"use client";
import React from "react";

type Peer = { id: string; username: string };
type DirectMessage = { id: string; sender_id: string; content: string; created_at: string };

export function RoomDirectMessage({ peer, selfId, onClose }: { peer: Peer; selfId?: string; onClose: () => void }) {
  const [messages, setMessages] = React.useState<DirectMessage[]>([]);
  const [text, setText] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const busyRef = React.useRef(false);
  const load = React.useCallback(async () => {
    try {
      const r = await fetch(`/api/messages?peerId=${encodeURIComponent(peer.id)}`, { cache: "no-store" });
      const p = await r.json();
      if (!r.ok) throw Error(p.error || "Conversation unavailable");
      setMessages(p.messages || []); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Conversation unavailable"); }
  }, [peer.id]);
  React.useEffect(() => {
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim(); if (!content || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      const r = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: peer.id, content }) });
      const p = await r.json();
      if (!r.ok) throw Error(p.error || "Message could not be sent");
      setText(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Message could not be sent"); }
    finally { busyRef.current = false; setBusy(false); }
  }
  return <section role="dialog" aria-label={`Message ${peer.username}`} className="fixed inset-x-3 bottom-20 z-50 flex max-h-[70vh] flex-col rounded-2xl border border-velora-line bg-velora-paper shadow-2xl md:bottom-5 md:left-auto md:right-5 md:w-96">
    <header className="flex items-center justify-between border-b border-velora-line p-4"><h2 className="font-semibold text-velora-ink">{peer.username}</h2><button type="button" onClick={onClose} aria-label="Close private chat" className="min-h-11 px-3 text-velora-ink underline">Close</button></header>
    <div className="min-h-24 flex-1 space-y-3 overflow-y-auto p-4" aria-label="Private messages">{messages.length === 0 && <p className="text-sm text-velora-muted">Start a private conversation.</p>}{messages.map(m => <div key={m.id} className={`max-w-[88%] rounded-xl p-3 text-sm ${m.sender_id === selfId ? "ml-auto bg-velora-accent text-velora-paper" : "bg-velora-surface text-velora-ink"}`}><p className="whitespace-pre-wrap break-words">{m.content}</p><time dateTime={m.created_at} className="text-xs opacity-70">{new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</time></div>)}</div>
    {error && <p role="alert" className="px-4 text-sm text-velora-accent">{error}</p>}
    <form onSubmit={send} className="flex gap-2 border-t border-velora-line p-3"><label className="sr-only" htmlFor="room-private-message">Private message</label><input id="room-private-message" value={text} onChange={e => setText(e.target.value)} maxLength={4000} className="min-w-0 flex-1 rounded-xl border border-velora-control bg-velora-surface p-3 text-velora-ink" placeholder="Write privately…" /><button disabled={busy || !text.trim()} className="rounded-full bg-velora-accent px-4 text-velora-paper disabled:opacity-40">Send</button></form>
  </section>;
}
